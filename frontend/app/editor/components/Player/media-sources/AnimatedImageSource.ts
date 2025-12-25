/**
 * 动态图片（GIF/APNG）媒体源实现
 * 支持循环播放动图
 */

import {
  IMediaSource,
  TextureResult,
  MediaType,
  AnimatedFrameInfo,
} from "./types";

export class AnimatedImageSource implements IMediaSource {
  readonly type: MediaType = "animated-image";
  private _duration = 0; // 一个循环的总时长
  private _isLoaded = false;
  private _width = 0;
  private _height = 0;
  private frames: AnimatedFrameInfo[] = [];
  private textureCache: Map<number, GPUTexture> = new Map();
  private currentFrameIndex = -1;

  constructor(public readonly id: string) {}

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get duration(): number {
    return this._duration;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /**
   * 加载动图
   */
  async load(url: string): Promise<void> {
    try {
      // 检查浏览器是否支持 ImageDecoder API
      if (typeof ImageDecoder === "undefined") {
        // 降级处理：作为静态图片加载第一帧
        await this.loadAsStaticImage(url);
        return;
      }

      const response = await fetch(url);
      const blob = await response.blob();

      // 使用 ImageDecoder 解码动图
      const decoder = new ImageDecoder({
        data: blob.stream(),
        type: blob.type,
      });

      // 获取轨道信息
      const track = decoder.tracks.selectedTrack;
      if (!track) {
        throw new Error("No track found in animated image");
      }

      const frameCount = track.frameCount;
      this.frames = [];
      let totalDuration = 0;

      // 解码所有帧
      for (let i = 0; i < frameCount; i++) {
        const result = await decoder.decode({ frameIndex: i });
        const frameDuration = (result.image.duration || 100000) / 1000000; // 微秒转秒

        // 将 VideoFrame 转换为 ImageBitmap
        const bitmap = await createImageBitmap(result.image);

        this.frames.push({
          bitmap: bitmap,
          duration: frameDuration,
        });

        totalDuration += frameDuration;

        // 获取尺寸（从第一帧）
        if (i === 0) {
          this._width = bitmap.width;
          this._height = bitmap.height;
        }

        // 关闭 VideoFrame 释放资源
        result.image.close();
      }

      this._duration = totalDuration;
      this._isLoaded = true;

      decoder.close();
    } catch (error) {
      console.warn(
        "Failed to decode animated image, falling back to static image:",
        error,
      );
      // 降级：尝试作为静态图片加载
      await this.loadAsStaticImage(url);
    }
  }

  /**
   * 降级方案：作为静态图片加载
   */
  private async loadAsStaticImage(url: string): Promise<void> {
    const response = await fetch(url);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob, {
      colorSpaceConversion: "none",
      premultiplyAlpha: "premultiply",
    });

    this._width = bitmap.width;
    this._height = bitmap.height;
    this._duration = 0.1; // 设置一个很短的时长
    this.frames = [{ bitmap, duration: 0.1 }];
    this._isLoaded = true;
  }

  /**
   * 根据时间计算当前帧索引
   */
  private calculateFrameIndex(time: number): number {
    if (this.frames.length === 0) {
      return -1;
    }

    if (this.frames.length === 1) {
      return 0;
    }

    // 循环播放：取模获取循环内时间
    const loopTime = time % this._duration;
    let accumulated = 0;

    for (let i = 0; i < this.frames.length; i++) {
      accumulated += this.frames[i].duration;
      if (loopTime < accumulated) {
        return i;
      }
    }

    // 默认返回最后一帧
    return this.frames.length - 1;
  }

  /**
   * 获取动图纹理
   * 根据时间计算当前帧，并创建/缓存纹理
   */
  getTexture(device: GPUDevice, time: number): TextureResult | null {
    if (!this._isLoaded || this.frames.length === 0) {
      return null;
    }

    const frameIndex = this.calculateFrameIndex(time);
    if (frameIndex < 0) {
      return null;
    }

    // 如果是同一帧且已缓存，直接返回
    if (
      this.currentFrameIndex === frameIndex &&
      this.textureCache.has(frameIndex)
    ) {
      const texture = this.textureCache.get(frameIndex);
      if (texture) {
        return {
          type: "2d",
          texture,
        };
      }
    }

    // 更新当前帧索引
    this.currentFrameIndex = frameIndex;

    // 检查缓存
    if (this.textureCache.has(frameIndex)) {
      const texture = this.textureCache.get(frameIndex);
      if (texture) {
        return {
          type: "2d",
          texture,
        };
      }
    }

    try {
      const frame = this.frames[frameIndex];

      // 创建新纹理
      const texture = device.createTexture({
        size: [this._width, this._height],
        format: "rgba8unorm",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });

      // 将 ImageBitmap 复制到纹理
      device.queue.copyExternalImageToTexture(
        { source: frame.bitmap, flipY: false },
        { texture },
        [this._width, this._height],
      );

      // 缓存纹理（限制缓存大小，避免内存溢出）
      if (this.textureCache.size >= 20) {
        // 删除最旧的缓存（简单策略）
        const firstKey = this.textureCache.keys().next().value;
        if (firstKey !== undefined) {
          const oldTexture = this.textureCache.get(firstKey);
          if (oldTexture) {
            oldTexture.destroy();
          }
          this.textureCache.delete(firstKey);
        }
      }

      this.textureCache.set(frameIndex, texture);

      return {
        type: "2d",
        texture,
      };
    } catch (error) {
      console.error("Failed to create animated image texture:", error);
      return null;
    }
  }

  /**
   * 释放资源
   */
  dispose(): void {
    // 销毁所有缓存的纹理
    for (const texture of this.textureCache.values()) {
      texture.destroy();
    }
    this.textureCache.clear();

    // 关闭所有 ImageBitmap
    for (const frame of this.frames) {
      frame.bitmap.close();
    }
    this.frames = [];

    this._isLoaded = false;
    this.currentFrameIndex = -1;
  }
}
