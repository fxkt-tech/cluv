/**
 * VideoTexture.ts
 *
 * Texture class for video elements (HTMLVideoElement)
 * Supports automatic updates when video is playing
 */

import { Texture, type TextureConfig } from "./Texture";
import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Video texture configuration
 */
export interface VideoTextureConfig extends TextureConfig {
  autoUpdate?: boolean; // Automatically update texture when video is playing
  loop?: boolean; // Loop video playback
  muted?: boolean; // Mute video
  playbackRate?: number; // Video playback speed
  onVideoReady?: (texture: VideoTexture) => void;
  onVideoEnded?: (texture: VideoTexture) => void;
  onVideoError?: (error: Error) => void;
}

/**
 * Video playback state
 */
export enum VideoPlaybackState {
  IDLE = "IDLE",
  LOADING = "LOADING",
  READY = "READY",
  PLAYING = "PLAYING",
  PAUSED = "PAUSED",
  ENDED = "ENDED",
  ERROR = "ERROR",
}

/**
 * VideoTexture class for video element textures
 */
export class VideoTexture extends Texture {
  private video: HTMLVideoElement | null = null;
  private videoConfig: VideoTextureConfig;
  private playbackState: VideoPlaybackState = VideoPlaybackState.IDLE;
  private error: Error | null = null;
  private isFirstFrame = true;
  private lastUpdateTime = 0;

  constructor(
    contextWrapper: WebGLContextManager,
    config: VideoTextureConfig = {},
  ) {
    super(contextWrapper, {
      ...config,
      // Video textures should not generate mipmaps by default (performance)
      generateMipmaps: config.generateMipmaps ?? false,
    });

    this.videoConfig = {
      autoUpdate: true,
      loop: false,
      muted: true,
      playbackRate: 1.0,
      ...config,
    };
  }

  /**
   * Load video from URL
   */
  loadFromURL(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.playbackState === VideoPlaybackState.LOADING) {
        reject(new Error("VideoTexture: Already loading"));
        return;
      }

      this.playbackState = VideoPlaybackState.LOADING;
      this.error = null;

      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.loop = this.videoConfig.loop ?? false;
      video.muted = this.videoConfig.muted ?? true;
      video.playbackRate = this.videoConfig.playbackRate ?? 1.0;
      video.preload = "auto";

      // Event handlers
      const onLoadedData = () => {
        try {
          this.setVideo(video);
          this.playbackState = VideoPlaybackState.READY;
          this._isReady = true;

          if (this.videoConfig.onVideoReady) {
            this.videoConfig.onVideoReady(this);
          }

          resolve();
        } catch (error) {
          const err =
            error instanceof Error ? error : new Error("Unknown error");
          this.handleError(err);
          reject(err);
        }
      };

      const onError = () => {
        const error = new Error(`Failed to load video: ${url}`);
        this.handleError(error);
        reject(error);
      };

      const onEnded = () => {
        this.playbackState = VideoPlaybackState.ENDED;
        if (this.videoConfig.onVideoEnded) {
          this.videoConfig.onVideoEnded(this);
        }
      };

      video.addEventListener("loadeddata", onLoadedData, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.addEventListener("ended", onEnded);

      video.src = url;
      video.load();
    });
  }

  /**
   * Set video element as texture source
   */
  setVideo(video: HTMLVideoElement): void {
    if (!this.createTexture()) {
      throw new Error("VideoTexture: Failed to create texture");
    }

    this.video = video;
    this._width = video.videoWidth;
    this._height = video.videoHeight;

    // Create initial texture with video dimensions
    this.bind();

    // Set pixel store parameters
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.config.flipY);
    this.gl.pixelStorei(
      this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      this.config.premultiplyAlpha,
    );

    // Upload initial frame
    const format = this.getGLFormat(this.config.format);
    const type = this.getGLType(this.config.type);

    try {
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, format, type, video);
    } catch (error) {
      console.error("VideoTexture: Failed to upload initial frame:", error);
      throw error;
    }

    // Apply texture parameters
    this.applyParameters();

    this.unbind();

    this._isReady = true;
    this.isFirstFrame = false;
    this.lastUpdateTime = performance.now();
  }

  /**
   * Update texture with current video frame
   */
  update(): void {
    if (!this.video || !this.texture || !this._isReady) {
      return;
    }

    // Check if video is playing and needs update
    if (
      this.videoConfig.autoUpdate &&
      this.playbackState === VideoPlaybackState.PLAYING
    ) {
      // Only update if video has advanced
      const currentTime = this.video.currentTime;
      if (currentTime === this.lastUpdateTime && !this.isFirstFrame) {
        return;
      }
      this.lastUpdateTime = currentTime;
    } else if (!this._needsUpdate) {
      return;
    }

    // Check if video has data
    if (this.video.readyState < this.video.HAVE_CURRENT_DATA) {
      return;
    }

    this.bind();

    const format = this.getGLFormat(this.config.format);
    const type = this.getGLType(this.config.type);

    try {
      this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,
        0,
        0,
        format,
        type,
        this.video,
      );
    } catch (error) {
      console.error("VideoTexture: Failed to update frame:", error);
    }

    this.unbind();
    this._needsUpdate = false;
  }

  /**
   * Play video
   */
  async play(): Promise<void> {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    try {
      await this.video.play();
      this.playbackState = VideoPlaybackState.PLAYING;
    } catch (error) {
      const err =
        error instanceof Error ? error : new Error("Failed to play video");
      this.handleError(err);
      throw err;
    }
  }

  /**
   * Pause video
   */
  pause(): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.pause();
    this.playbackState = VideoPlaybackState.PAUSED;
  }

  /**
   * Stop video (pause and reset to beginning)
   */
  stop(): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.pause();
    this.video.currentTime = 0;
    this.playbackState = VideoPlaybackState.PAUSED;
  }

  /**
   * Seek to specific time
   */
  seek(time: number): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.currentTime = Math.max(0, Math.min(time, this.video.duration));
    this._needsUpdate = true;
  }

  /**
   * Set playback rate
   */
  setPlaybackRate(rate: number): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.playbackRate = rate;
  }

  /**
   * Set volume
   */
  setVolume(volume: number): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.muted = muted;
  }

  /**
   * Set loop state
   */
  setLoop(loop: boolean): void {
    if (!this.video) {
      throw new Error("VideoTexture: No video loaded");
    }

    this.video.loop = loop;
  }

  /**
   * Get video element
   */
  getVideo(): HTMLVideoElement | null {
    return this.video;
  }

  /**
   * Get current playback time
   */
  getCurrentTime(): number {
    return this.video?.currentTime ?? 0;
  }

  /**
   * Get video duration
   */
  getDuration(): number {
    return this.video?.duration ?? 0;
  }

  /**
   * Get playback state
   */
  getPlaybackState(): VideoPlaybackState {
    return this.playbackState;
  }

  /**
   * Check if video is playing
   */
  isPlaying(): boolean {
    return this.playbackState === VideoPlaybackState.PLAYING;
  }

  /**
   * Check if video is paused
   */
  isPaused(): boolean {
    return this.playbackState === VideoPlaybackState.PAUSED;
  }

  /**
   * Get error if load failed
   */
  getError(): Error | null {
    return this.error;
  }

  /**
   * Handle error
   */
  private handleError(error: Error): void {
    this.playbackState = VideoPlaybackState.ERROR;
    this.error = error;
    this._isReady = false;

    console.error("VideoTexture: Error:", error);

    if (this.videoConfig.onVideoError) {
      this.videoConfig.onVideoError(error);
    }
  }

  /**
   * Dispose of texture resources
   */
  dispose(): void {
    if (this.video) {
      this.video.pause();
      this.video.src = "";
      this.video.load();
      this.video = null;
    }

    super.dispose();
    this.playbackState = VideoPlaybackState.IDLE;
    this.error = null;
    this.isFirstFrame = true;
  }
}
