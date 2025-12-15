/**
 * TextureManager.ts
 *
 * Centralized texture management system:
 * - Create and manage textures
 * - Texture caching and reuse
 * - Resource lifecycle management
 */

import type { WebGLContextManager } from "../core/WebGLContext";
import { TextureCache, type TextureCacheConfig } from "./TextureCache";
import { ImageTexture, type ImageTextureConfig } from "./ImageTexture";
import { VideoTexture, type VideoTextureConfig } from "./VideoTexture";
import type { Texture, TextureConfig } from "./Texture";

/**
 * Texture type enumeration
 */
export enum TextureType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  CANVAS = "CANVAS",
  DATA = "DATA",
}

/**
 * Texture creation options
 */
export interface TextureOptions {
  type: TextureType;
  config?: TextureConfig | ImageTextureConfig | VideoTextureConfig;
  cache?: boolean;
  cacheKey?: string;
}

/**
 * Texture loading result
 */
export interface TextureLoadResult {
  texture: Texture;
  cached: boolean;
  key?: string;
}

/**
 * TextureManager class for centralized texture management
 */
export class TextureManager {
  private cache: TextureCache;
  private textures = new Map<string, Texture>();
  private videoTextures = new Map<string, VideoTexture>();
  private textureIdCounter = 0;

  constructor(
    private contextWrapper: WebGLContextManager,
    cacheConfig?: TextureCacheConfig,
  ) {
    this.cache = new TextureCache(cacheConfig);
  }

  /**
   * Create an image texture from URL
   */
  async createImageFromURL(
    url: string,
    config?: ImageTextureConfig,
    useCache = true,
  ): Promise<TextureLoadResult> {
    const cacheKey = `image:${url}`;

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          texture: cached,
          cached: true,
          key: cacheKey,
        };
      }
    }

    // Create new texture
    const texture = new ImageTexture(this.contextWrapper, config);
    await texture.loadFromURL(url);

    // Add to cache if requested
    if (useCache) {
      this.cache.set(cacheKey, texture);
    }

    // Track texture
    const id = this.generateTextureId();
    this.textures.set(id, texture);

    return {
      texture,
      cached: false,
      key: useCache ? cacheKey : id,
    };
  }

  /**
   * Create an image texture from an image source
   */
  createImageFromSource(
    source: HTMLImageElement | HTMLCanvasElement | ImageBitmap | ImageData,
    config?: ImageTextureConfig,
    cacheKey?: string,
  ): TextureLoadResult {
    // Check cache if key provided
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          texture: cached,
          cached: true,
          key: cacheKey,
        };
      }
    }

    // Create new texture
    const texture = new ImageTexture(this.contextWrapper, config);
    texture.setImage(source);

    // Add to cache if key provided
    if (cacheKey) {
      this.cache.set(cacheKey, texture);
    }

    // Track texture
    const id = this.generateTextureId();
    this.textures.set(id, texture);

    return {
      texture,
      cached: false,
      key: cacheKey || id,
    };
  }

  /**
   * Create a video texture from URL
   */
  async createVideoFromURL(
    url: string,
    config?: VideoTextureConfig,
    useCache = true,
  ): Promise<TextureLoadResult> {
    const cacheKey = `video:${url}`;

    // Check cache first
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          texture: cached,
          cached: true,
          key: cacheKey,
        };
      }
    }

    // Create new texture
    const texture = new VideoTexture(this.contextWrapper, config);
    await texture.loadFromURL(url);

    // Add to cache if requested
    if (useCache) {
      this.cache.set(cacheKey, texture);
    }

    // Track texture
    const id = this.generateTextureId();
    this.textures.set(id, texture);

    return {
      texture,
      cached: false,
      key: useCache ? cacheKey : id,
    };
  }

  /**
   * Create a video texture from a video element
   */
  createVideoFromElement(
    video: HTMLVideoElement,
    config?: VideoTextureConfig,
    cacheKey?: string,
  ): TextureLoadResult {
    // Check cache if key provided
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return {
          texture: cached,
          cached: true,
          key: cacheKey,
        };
      }
    }

    // Create new texture
    const texture = new VideoTexture(this.contextWrapper, config);
    texture.setVideo(video);

    // Add to cache if key provided
    if (cacheKey) {
      this.cache.set(cacheKey, texture);
    }

    // Track texture
    const id = this.generateTextureId();
    this.textures.set(id, texture);

    return {
      texture,
      cached: false,
      key: cacheKey || id,
    };
  }

  /**
   * Get a texture by key
   */
  get(key: string): Texture | null {
    // Check managed textures first
    if (this.textures.has(key)) {
      return this.textures.get(key)!;
    }

    // Check cache
    return this.cache.get(key);
  }

  /**
   * Check if a texture exists
   */
  has(key: string): boolean {
    return this.textures.has(key) || this.cache.has(key);
  }

  /**
   * Remove a texture
   */
  remove(key: string): boolean {
    // Remove from managed textures
    const texture = this.textures.get(key);
    if (texture) {
      texture.dispose();
      this.textures.delete(key);
      return true;
    }

    // Remove from cache
    return this.cache.remove(key);
  }

  /**
   * Release a texture reference (for cached textures)
   */
  release(key: string): void {
    this.cache.release(key);
  }

  /**
   * Update all video textures
   */
  updateVideoTextures(): void {
    for (const texture of this.textures.values()) {
      if (texture instanceof VideoTexture && texture.isPlaying()) {
        texture.update();
      }
    }

    // Also update cached video textures
    for (const key of this.cache.getKeys()) {
      const texture = this.cache.get(key);
      if (texture instanceof VideoTexture && texture.isPlaying()) {
        texture.update();
      }
    }
  }

  /**
   * Update a specific texture
   */
  updateTexture(key: string): void {
    const texture = this.get(key);
    if (texture) {
      texture.update();
    }
  }

  /**
   * Get all managed texture keys
   */
  getTextureKeys(): string[] {
    return Array.from(this.textures.keys());
  }

  /**
   * Get all cached texture keys
   */
  getCachedTextureKeys(): string[] {
    return this.cache.getKeys();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Clear the texture cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Prune expired cache entries
   */
  pruneCache(): number {
    return this.cache.prune();
  }

  /**
   * Dispose of a specific texture
   */
  dispose(key: string): void {
    this.remove(key);
  }

  /**
   * Dispose of all textures
   */
  disposeAll(): void {
    // Dispose managed textures
    for (const texture of this.textures.values()) {
      texture.dispose();
    }
    this.textures.clear();

    // Clear cache
    this.cache.clear();
  }

  /**
   * Get texture count
   */
  getTextureCount(): number {
    return this.textures.size + this.cache.getEntryCount();
  }

  /**
   * Get total memory usage estimate (in bytes)
   */
  getMemoryUsage(): number {
    let total = this.cache.getSize();

    for (const texture of this.textures.values()) {
      const width = texture.width;
      const height = texture.height;
      total += width * height * 4; // RGBA bytes
    }

    return total;
  }

  /**
   * Generate a unique texture ID
   */
  private generateTextureId(): string {
    return `texture_${this.textureIdCounter++}`;
  }

  /**
   * Get the cache instance
   */
  getCache(): TextureCache {
    return this.cache;
  }

  /**
   * Get the WebGL context wrapper
   */
  getContextWrapper(): WebGLContextManager {
    return this.contextWrapper;
  }
}
