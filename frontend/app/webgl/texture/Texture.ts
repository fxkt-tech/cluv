/**
 * Texture.ts
 *
 * Base texture class for WebGL texture management
 * Handles texture creation, updates, and disposal
 */

import type { WebGLContextManager } from "../core/WebGLContext";

/**
 * Texture filtering modes
 */
export enum TextureFilter {
  NEAREST = "NEAREST",
  LINEAR = "LINEAR",
  NEAREST_MIPMAP_NEAREST = "NEAREST_MIPMAP_NEAREST",
  LINEAR_MIPMAP_NEAREST = "LINEAR_MIPMAP_NEAREST",
  NEAREST_MIPMAP_LINEAR = "NEAREST_MIPMAP_LINEAR",
  LINEAR_MIPMAP_LINEAR = "LINEAR_MIPMAP_LINEAR",
}

/**
 * Texture wrapping modes
 */
export enum TextureWrap {
  REPEAT = "REPEAT",
  CLAMP_TO_EDGE = "CLAMP_TO_EDGE",
  MIRRORED_REPEAT = "MIRRORED_REPEAT",
}

/**
 * Texture format
 */
export enum TextureFormat {
  RGB = "RGB",
  RGBA = "RGBA",
  LUMINANCE = "LUMINANCE",
  LUMINANCE_ALPHA = "LUMINANCE_ALPHA",
  ALPHA = "ALPHA",
}

/**
 * Texture data type
 */
export enum TextureDataType {
  UNSIGNED_BYTE = "UNSIGNED_BYTE",
  UNSIGNED_SHORT_5_6_5 = "UNSIGNED_SHORT_5_6_5",
  UNSIGNED_SHORT_4_4_4_4 = "UNSIGNED_SHORT_4_4_4_4",
  UNSIGNED_SHORT_5_5_5_1 = "UNSIGNED_SHORT_5_5_5_1",
  FLOAT = "FLOAT",
  HALF_FLOAT = "HALF_FLOAT",
}

/**
 * Texture configuration
 */
export interface TextureConfig {
  width?: number;
  height?: number;
  format?: TextureFormat;
  type?: TextureDataType;
  minFilter?: TextureFilter;
  magFilter?: TextureFilter;
  wrapS?: TextureWrap;
  wrapT?: TextureWrap;
  generateMipmaps?: boolean;
  flipY?: boolean;
  premultiplyAlpha?: boolean;
  anisotropy?: number;
}

/**
 * Default texture configuration
 */
const DEFAULT_CONFIG: Required<
  Omit<TextureConfig, "width" | "height" | "anisotropy">
> = {
  format: TextureFormat.RGBA,
  type: TextureDataType.UNSIGNED_BYTE,
  minFilter: TextureFilter.LINEAR,
  magFilter: TextureFilter.LINEAR,
  wrapS: TextureWrap.CLAMP_TO_EDGE,
  wrapT: TextureWrap.CLAMP_TO_EDGE,
  generateMipmaps: false,
  flipY: false,
  premultiplyAlpha: false,
};

/**
 * Base texture class
 */
export abstract class Texture {
  protected gl: WebGLRenderingContext | WebGL2RenderingContext;
  protected texture: WebGLTexture | null = null;
  protected config: Required<Omit<TextureConfig, "anisotropy">> & {
    anisotropy?: number;
  };

  protected _width = 0;
  protected _height = 0;
  protected _isReady = false;
  protected _needsUpdate = false;

  constructor(
    protected contextWrapper: WebGLContextManager,
    config: TextureConfig = {},
  ) {
    const context = contextWrapper.getContext();
    if (!context) {
      throw new Error("Texture: WebGL context is not available");
    }
    this.gl = context;
    this.config = {
      ...DEFAULT_CONFIG,
      width: config.width || 1,
      height: config.height || 1,
      ...config,
    };

    this._width = this.config.width;
    this._height = this.config.height;
  }

  /**
   * Initialize the texture
   */
  protected createTexture(): boolean {
    if (this.texture) {
      return true;
    }

    this.texture = this.gl.createTexture();
    if (!this.texture) {
      console.error("Texture: Failed to create WebGL texture");
      return false;
    }

    return true;
  }

  /**
   * Bind the texture to a texture unit
   */
  bind(unit = 0): void {
    if (!this.texture) {
      console.warn("Texture: Cannot bind null texture");
      return;
    }

    this.gl.activeTexture(this.gl.TEXTURE0 + unit);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
  }

  /**
   * Unbind the texture
   */
  unbind(): void {
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /**
   * Apply texture parameters
   */
  protected applyParameters(): void {
    if (!this.texture) {
      return;
    }

    const gl = this.gl;

    // Set filtering
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      this.getGLFilter(this.config.minFilter),
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MAG_FILTER,
      this.getGLFilter(this.config.magFilter),
    );

    // Set wrapping
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_S,
      this.getGLWrap(this.config.wrapS),
    );
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_WRAP_T,
      this.getGLWrap(this.config.wrapT),
    );

    // Set anisotropic filtering if available
    if (this.config.anisotropy && this.config.anisotropy > 1) {
      const ext =
        this.contextWrapper.getExtension<EXT_texture_filter_anisotropic>(
          "EXT_texture_filter_anisotropic",
        );
      if (ext) {
        const maxAnisotropy = this.contextWrapper.getMaxAnisotropy();
        const anisotropy = Math.min(this.config.anisotropy, maxAnisotropy);
        gl.texParameterf(
          gl.TEXTURE_2D,
          ext.TEXTURE_MAX_ANISOTROPY_EXT,
          anisotropy,
        );
      }
    }
  }

  /**
   * Generate mipmaps for the texture
   */
  protected generateMipmaps(): void {
    if (!this.texture || !this.config.generateMipmaps) {
      return;
    }

    // Check if dimensions are power of 2
    if (this.isPowerOf2(this._width) && this.isPowerOf2(this._height)) {
      this.gl.generateMipmap(this.gl.TEXTURE_2D);
    } else {
      // For non-power-of-2 textures, we need to use CLAMP_TO_EDGE and LINEAR filtering
      console.warn(
        "Texture: Cannot generate mipmaps for non-power-of-2 texture",
      );
    }
  }

  /**
   * Update texture data (to be implemented by subclasses)
   */
  abstract update(): void;

  /**
   * Get texture width
   */
  get width(): number {
    return this._width;
  }

  /**
   * Get texture height
   */
  get height(): number {
    return this._height;
  }

  /**
   * Check if texture is ready for use
   */
  get isReady(): boolean {
    return this._isReady;
  }

  /**
   * Get the underlying WebGL texture
   */
  getTexture(): WebGLTexture | null {
    return this.texture;
  }

  /**
   * Mark texture as needing update
   */
  setNeedsUpdate(value = true): void {
    this._needsUpdate = value;
  }

  /**
   * Check if texture needs update
   */
  needsUpdate(): boolean {
    return this._needsUpdate;
  }

  /**
   * Dispose of texture resources
   */
  dispose(): void {
    if (this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
    this._isReady = false;
    this._needsUpdate = false;
  }

  /**
   * Convert TextureFilter enum to WebGL constant
   */
  protected getGLFilter(filter: TextureFilter): number {
    const gl = this.gl;
    switch (filter) {
      case TextureFilter.NEAREST:
        return gl.NEAREST;
      case TextureFilter.LINEAR:
        return gl.LINEAR;
      case TextureFilter.NEAREST_MIPMAP_NEAREST:
        return gl.NEAREST_MIPMAP_NEAREST;
      case TextureFilter.LINEAR_MIPMAP_NEAREST:
        return gl.LINEAR_MIPMAP_NEAREST;
      case TextureFilter.NEAREST_MIPMAP_LINEAR:
        return gl.NEAREST_MIPMAP_LINEAR;
      case TextureFilter.LINEAR_MIPMAP_LINEAR:
        return gl.LINEAR_MIPMAP_LINEAR;
      default:
        return gl.LINEAR;
    }
  }

  /**
   * Convert TextureWrap enum to WebGL constant
   */
  protected getGLWrap(wrap: TextureWrap): number {
    const gl = this.gl;
    switch (wrap) {
      case TextureWrap.REPEAT:
        return gl.REPEAT;
      case TextureWrap.CLAMP_TO_EDGE:
        return gl.CLAMP_TO_EDGE;
      case TextureWrap.MIRRORED_REPEAT:
        return gl.MIRRORED_REPEAT;
      default:
        return gl.CLAMP_TO_EDGE;
    }
  }

  /**
   * Convert TextureFormat enum to WebGL constant
   */
  protected getGLFormat(format: TextureFormat): number {
    const gl = this.gl;
    switch (format) {
      case TextureFormat.RGB:
        return gl.RGB;
      case TextureFormat.RGBA:
        return gl.RGBA;
      case TextureFormat.LUMINANCE:
        return gl.LUMINANCE;
      case TextureFormat.LUMINANCE_ALPHA:
        return gl.LUMINANCE_ALPHA;
      case TextureFormat.ALPHA:
        return gl.ALPHA;
      default:
        return gl.RGBA;
    }
  }

  /**
   * Convert TextureDataType enum to WebGL constant
   */
  protected getGLType(type: TextureDataType): number {
    const gl = this.gl;
    switch (type) {
      case TextureDataType.UNSIGNED_BYTE:
        return gl.UNSIGNED_BYTE;
      case TextureDataType.UNSIGNED_SHORT_5_6_5:
        return gl.UNSIGNED_SHORT_5_6_5;
      case TextureDataType.UNSIGNED_SHORT_4_4_4_4:
        return gl.UNSIGNED_SHORT_4_4_4_4;
      case TextureDataType.UNSIGNED_SHORT_5_5_5_1:
        return gl.UNSIGNED_SHORT_5_5_5_1;
      case TextureDataType.FLOAT: {
        const ext =
          this.contextWrapper.getExtension<OES_texture_float>(
            "OES_texture_float",
          );
        return ext ? gl.FLOAT : gl.UNSIGNED_BYTE;
      }
      case TextureDataType.HALF_FLOAT: {
        if (this.contextWrapper.isWebGL2()) {
          return (gl as WebGL2RenderingContext).HALF_FLOAT;
        }
        const ext = this.contextWrapper.getExtension<OES_texture_half_float>(
          "OES_texture_half_float",
        );
        return ext ? ext.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
      }
      default:
        return gl.UNSIGNED_BYTE;
    }
  }

  /**
   * Check if a number is a power of 2
   */
  protected isPowerOf2(value: number): boolean {
    return (value & (value - 1)) === 0;
  }
}
