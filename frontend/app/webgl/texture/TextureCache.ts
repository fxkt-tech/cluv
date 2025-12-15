/**
 * TextureCache.ts
 *
 * Texture caching system for efficient texture reuse
 * Manages texture lifecycle and memory
 */

import { Texture } from "./Texture";

/**
 * Cache entry metadata
 */
interface CacheEntry {
  texture: Texture;
  key: string;
  referenceCount: number;
  lastAccessed: number;
  size: number; // Estimated memory size in bytes
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalReferences: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
}

/**
 * Cache configuration
 */
export interface TextureCacheConfig {
  maxSize?: number; // Maximum cache size in bytes
  maxEntries?: number; // Maximum number of cached textures
  ttl?: number; // Time to live in milliseconds (0 = infinite)
}

/**
 * Default cache configuration
 */
const DEFAULT_CONFIG: Required<TextureCacheConfig> = {
  maxSize: 512 * 1024 * 1024, // 512 MB
  maxEntries: 100,
  ttl: 0, // No expiration by default
};

/**
 * TextureCache class for managing texture resources
 */
export class TextureCache {
  private cache = new Map<string, CacheEntry>();
  private config: Required<TextureCacheConfig>;
  private stats: CacheStats = {
    totalEntries: 0,
    totalReferences: 0,
    totalSize: 0,
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
  };

  constructor(config: TextureCacheConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get a texture from cache
   */
  get(key: string): Texture | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.missCount++;
      return null;
    }

    // Check if entry has expired
    if (this.config.ttl > 0) {
      const age = Date.now() - entry.lastAccessed;
      if (age > this.config.ttl) {
        this.remove(key);
        this.stats.missCount++;
        return null;
      }
    }

    // Update access time and reference count
    entry.lastAccessed = Date.now();
    entry.referenceCount++;
    this.stats.totalReferences++;
    this.stats.hitCount++;

    return entry.texture;
  }

  /**
   * Add a texture to cache
   */
  set(key: string, texture: Texture): void {
    // Check if already cached
    if (this.cache.has(key)) {
      console.warn(`TextureCache: Key "${key}" already exists, updating`);
      this.remove(key);
    }

    const size = this.estimateTextureSize(texture);

    // Check if we need to evict entries
    while (
      (this.cache.size >= this.config.maxEntries ||
        this.stats.totalSize + size > this.config.maxSize) &&
      this.cache.size > 0
    ) {
      this.evictLRU();
    }

    // Add entry
    const entry: CacheEntry = {
      texture,
      key,
      referenceCount: 0,
      lastAccessed: Date.now(),
      size,
    };

    this.cache.set(key, entry);
    this.stats.totalEntries++;
    this.stats.totalSize += size;
  }

  /**
   * Check if a texture is cached
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove a texture from cache
   */
  remove(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    // Dispose texture
    entry.texture.dispose();

    // Update stats
    this.stats.totalEntries--;
    this.stats.totalSize -= entry.size;

    this.cache.delete(key);
    return true;
  }

  /**
   * Release a reference to a texture
   */
  release(key: string): void {
    const entry = this.cache.get(key);
    if (entry && entry.referenceCount > 0) {
      entry.referenceCount--;
      this.stats.totalReferences--;
    }
  }

  /**
   * Clear all cached textures
   */
  clear(): void {
    for (const entry of Array.from(this.cache.values())) {
      entry.texture.dispose();
    }

    this.cache.clear();
    this.stats.totalEntries = 0;
    this.stats.totalSize = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): Readonly<CacheStats> {
    return { ...this.stats };
  }

  /**
   * Get all cached keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size in bytes
   */
  getSize(): number {
    return this.stats.totalSize;
  }

  /**
   * Get number of cached entries
   */
  getEntryCount(): number {
    return this.cache.size;
  }

  /**
   * Prune expired entries
   */
  prune(): number {
    if (this.config.ttl === 0) {
      return 0;
    }

    const now = Date.now();
    let prunedCount = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      const age = now - entry.lastAccessed;
      if (age > this.config.ttl) {
        this.remove(key);
        prunedCount++;
      }
    }

    return prunedCount;
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // Find least recently used entry with no references
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.referenceCount === 0 && entry.lastAccessed < oldestTime) {
        oldestKey = key;
        oldestTime = entry.lastAccessed;
      }
    }

    // If no unreferenced entry found, evict the oldest regardless
    if (!oldestKey) {
      for (const [key, entry] of Array.from(this.cache.entries())) {
        if (entry.lastAccessed < oldestTime) {
          oldestKey = key;
          oldestTime = entry.lastAccessed;
        }
      }
    }

    if (oldestKey) {
      this.remove(oldestKey);
      this.stats.evictionCount++;
    }
  }

  /**
   * Estimate texture memory size
   */
  private estimateTextureSize(texture: Texture): number {
    const width = texture.width;
    const height = texture.height;
    const bytesPerPixel = 4; // RGBA

    // Base size: width * height * bytesPerPixel
    const size = width * height * bytesPerPixel;

    // Add mipmap overhead (approximately 1/3 additional)
    // if (texture has mipmaps) size *= 1.33;

    return size;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hitCount = 0;
    this.stats.missCount = 0;
    this.stats.evictionCount = 0;
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.hitCount + this.stats.missCount;
    return total > 0 ? this.stats.hitCount / total : 0;
  }
}
