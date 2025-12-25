/**
 * 静态图片媒体源实现
 */

import { IMediaSource, TextureResult, MediaType } from "./types";

export class StaticImageSource implements IMediaSource {
  readonly type: MediaType = "image";
  readonly duration = Infinity; // 静态图片无固有时长
  private _isLoaded = false;
  private _width = 0;
  private _height = 0;
  private texture: GPUTexture | null = null;
  private imageBitmap: ImageBitmap | null = null;

  constructor(public readonly id: string) {}

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  /**
   * 加载静态图片
   */
  async load(url: string): Promise<void> {
    try {
      // 加载图片
      const response = await fetch(url);
      const blob = await response.blob();

      // 创建 ImageBitmap
      this.imageBitmap = await createImageBitmap(blob, {
        colorSpaceConversion: "none",
        premultiplyAlpha: "premultiply",
      });

      this._width = this.imageBitmap.width;
      this._height = this.imageBitmap.height;
      this._isLoaded = true;
    } catch (error) {
      throw new Error(`Failed to load static image: ${url}, ${error}`);
    }
  }

  /**
   * 获取图片纹理
   * 静态图片使用 GPUTexture，首次创建后缓存
   */
  getTexture(device: GPUDevice, _time: number): TextureResult | null {
    if (!this._isLoaded || !this.imageBitmap) {
      return null;
    }

    // 如果纹理已创建，直接返回
    if (this.texture) {
      return {
        type: "2d",
        texture: this.texture,
      };
    }

    try {
      // 创建 GPUTexture
      this.texture = device.createTexture({
        size: [this._width, this._height],
        format: "rgba8unorm",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });

      // 将 ImageBitmap 数据复制到纹理
      device.queue.copyExternalImageToTexture(
        { source: this.imageBitmap, flipY: false },
        { texture: this.texture },
        [this._width, this._height],
      );

      return {
        type: "2d",
        texture: this.texture,
      };
    } catch (error) {
      console.error("Failed to create static image texture:", error);
      return null;
    }
  }

  /**
   * 释放资源
   */
  dispose(): void {
    if (this.texture) {
      this.texture.destroy();
      this.texture = null;
    }

    if (this.imageBitmap) {
      this.imageBitmap.close();
      this.imageBitmap = null;
    }

    this._isLoaded = false;
  }
}
