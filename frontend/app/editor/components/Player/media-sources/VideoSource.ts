/**
 * 视频媒体源实现
 */

import { IMediaSource, TextureResult, MediaType } from "./types";

export class VideoSource implements IMediaSource {
  readonly type: MediaType = "video";
  private video: HTMLVideoElement | null = null;
  private _isLoaded = false;
  private _duration = 0;
  private _width = 0;
  private _height = 0;

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
   * 加载视频
   */
  async load(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.video = document.createElement("video");
      this.video.crossOrigin = "anonymous";
      this.video.preload = "auto";
      this.video.muted = true; // 静音以支持自动播放

      this.video.onloadedmetadata = () => {
        if (this.video) {
          this._duration = this.video.duration;
          this._width = this.video.videoWidth;
          this._height = this.video.videoHeight;
        }
      };

      this.video.oncanplay = () => {
        this._isLoaded = true;
        resolve();
      };

      this.video.onerror = () => {
        reject(new Error(`Failed to load video: ${url}`));
      };

      this.video.src = url;
      this.video.load();
    });
  }

  /**
   * 获取视频纹理
   */
  getTexture(device: GPUDevice, _time: number): TextureResult | null {
    if (!this.video || !this._isLoaded) {
      return null;
    }

    // 检查视频是否准备好
    if (this.video.readyState < 2 || this.video.seeking) {
      return null;
    }

    try {
      const texture = device.importExternalTexture({
        source: this.video,
      });

      return {
        type: "external",
        texture,
      };
    } catch (error) {
      console.error("Failed to import video texture:", error);
      return null;
    }
  }

  /**
   * 播放视频
   */
  play(): void {
    if (this.video && !this.video.ended) {
      this.video.play().catch((err) => {
        console.warn("Video play failed:", err);
      });
    }
  }

  /**
   * 暂停视频
   */
  pause(): void {
    if (this.video && !this.video.paused) {
      this.video.pause();
    }
  }

  /**
   * 跳转到指定时间
   */
  seek(time: number): void {
    if (this.video) {
      this.video.currentTime = Math.max(0, Math.min(time, this._duration));
    }
  }

  /**
   * 释放资源
   */
  dispose(): void {
    if (this.video) {
      this.video.pause();
      this.video.src = "";
      this.video.load();
      this.video = null;
    }
    this._isLoaded = false;
  }

  /**
   * 获取底层 video 元素（用于兼容现有代码）
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.video;
  }
}
