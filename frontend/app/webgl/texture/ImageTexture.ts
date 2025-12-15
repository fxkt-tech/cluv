/**
 * ImageTexture.ts
 *
 * Texture class for static images (HTMLImageElement, ImageBitmap, etc.)
 * Supports loading from URLs, Image elements, and ImageBitmap
 */

import { Texture, type TextureConfig } from "./Texture";
import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Image source types
 */
export type ImageSource =
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap
  | ImageData;

/**
 * Image texture loading states
 */
export enum ImageTextureState {
  IDLE = "IDLE",
  LOADING = "LOADING",
  LOADED = "LOADED",
  ERROR = "ERROR",
}

/**
 * Image texture configuration
 */
export interface ImageTextureConfig extends TextureConfig {
  crossOrigin?: string;
  placeholder?: boolean; // Create placeholder texture while loading
  onLoad?: (texture: ImageTexture) => void;
  onError?: (error: Error) => void;
}

/**
 * ImageTexture class for static image textures
 */
export class ImageTexture extends Texture {
  private imageSource: ImageSource | null = null;
  private state: ImageTextureState = ImageTextureState.IDLE;
  private error: Error | null = null;
  private imageConfig: ImageTextureConfig;

  constructor(
    contextWrapper: WebGLContextManager,
    config: ImageTextureConfig = {},
  ) {
    super(contextWrapper, config);
    this.imageConfig = config;

    // Create placeholder texture if requested
    if (config.placeholder) {
      this.createPlaceholderTexture();
    }
  }

  /**
   * Load texture from a URL
   */
  loadFromURL(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.state === ImageTextureState.LOADING) {
        reject(new Error("ImageTexture: Already loading"));
        return;
      }

      this.state = ImageTextureState.LOADING;
      this.error = null;

      const image = new Image();

      // Set crossOrigin if specified
      if (this.imageConfig.crossOrigin) {
        image.crossOrigin = this.imageConfig.crossOrigin;
      }

      image.onload = () => {
        try {
          this.setImage(image);
          this.state = ImageTextureState.LOADED;
          this._isReady = true;

          if (this.imageConfig.onLoad) {
            this.imageConfig.onLoad(this);
          }

          resolve();
        } catch (error) {
          const err =
            error instanceof Error ? error : new Error("Unknown error");
          this.handleError(err);
          reject(err);
        }
      };

      image.onerror = () => {
        const error = new Error(`Failed to load image: ${url}`);
        this.handleError(error);
        reject(error);
      };

      image.src = url;
    });
  }

  /**
   * Set texture from an image source
   */
  setImage(source: ImageSource): void {
    if (!this.createTexture()) {
      throw new Error("ImageTexture: Failed to create texture");
    }

    this.imageSource = source;

    // Get dimensions from source
    if ("width" in source && "height" in source) {
      this._width = source.width;
      this._height = source.height;
    }

    // Bind and upload texture
    this.bind();

    // Set pixel store parameters
    this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, this.config.flipY);
    this.gl.pixelStorei(
      this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,
      this.config.premultiplyAlpha,
    );

    // Upload texture data
    const format = this.getGLFormat(this.config.format);
    const type = this.getGLType(this.config.type);

    try {
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        format,
        format,
        type,
        source as TexImageSource,
      );
    } catch (error) {
      console.error("ImageTexture: Failed to upload texture data:", error);
      throw error;
    }

    // Apply texture parameters
    this.applyParameters();

    // Generate mipmaps if needed
    this.generateMipmaps();

    this.unbind();

    this._isReady = true;
    this._needsUpdate = false;
    this.state = ImageTextureState.LOADED;
  }

  /**
   * Create a placeholder texture (1x1 pixel)
   */
  private createPlaceholderTexture(): void {
    if (!this.createTexture()) {
      console.error("ImageTexture: Failed to create placeholder texture");
      return;
    }

    this.bind();

    // Create a 1x1 pixel texture with a default color (white)
    const pixel = new Uint8Array([255, 255, 255, 255]);
    const format = this.getGLFormat(this.config.format);
    const type = this.getGLType(this.config.type);

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      format,
      1,
      1,
      0,
      format,
      type,
      pixel,
    );

    this.applyParameters();
    this.unbind();

    this._width = 1;
    this._height = 1;
    this._isReady = true;
  }

  /**
   * Update texture (re-upload if needed)
   */
  update(): void {
    if (!this._needsUpdate || !this.imageSource) {
      return;
    }

    this.bind();

    const format = this.getGLFormat(this.config.format);
    const type = this.getGLType(this.config.type);

    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      format,
      format,
      type,
      this.imageSource as TexImageSource,
    );

    this.generateMipmaps();
    this.unbind();

    this._needsUpdate = false;
  }

  /**
   * Get current loading state
   */
  getState(): ImageTextureState {
    return this.state;
  }

  /**
   * Check if texture is currently loading
   */
  isLoading(): boolean {
    return this.state === ImageTextureState.LOADING;
  }

  /**
   * Get error if load failed
   */
  getError(): Error | null {
    return this.error;
  }

  /**
   * Get the image source
   */
  getImageSource(): ImageSource | null {
    return this.imageSource;
  }

  /**
   * Handle loading error
   */
  private handleError(error: Error): void {
    this.state = ImageTextureState.ERROR;
    this.error = error;
    this._isReady = false;

    console.error("ImageTexture: Load error:", error);

    if (this.imageConfig.onError) {
      this.imageConfig.onError(error);
    }
  }

  /**
   * Dispose of texture resources
   */
  dispose(): void {
    super.dispose();
    this.imageSource = null;
    this.state = ImageTextureState.IDLE;
    this.error = null;
  }
}
