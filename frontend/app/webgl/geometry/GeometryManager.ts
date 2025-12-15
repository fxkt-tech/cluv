/**
 * GeometryManager.ts
 *
 * Centralized geometry management system:
 * - Create and manage geometries
 * - Geometry caching and reuse
 * - Resource lifecycle management
 */

import type { WebGLContextManager } from "../core/WebGLContext";
import { QuadGeometry, type QuadGeometryConfig } from "./QuadGeometry";

/**
 * Geometry type enumeration
 */
export enum GeometryType {
  QUAD = "QUAD",
  CUSTOM = "CUSTOM",
}

/**
 * Geometry cache entry
 */
interface GeometryEntry {
  geometry: QuadGeometry;
  key: string;
  referenceCount: number;
  createdAt: number;
}

/**
 * Geometry manager statistics
 */
export interface GeometryStats {
  totalGeometries: number;
  totalReferences: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * GeometryManager class for centralized geometry management
 */
export class GeometryManager {
  private contextWrapper: WebGLContextManager;
  private geometries = new Map<string, GeometryEntry>();
  private geometryIdCounter = 0;
  private stats: GeometryStats = {
    totalGeometries: 0,
    totalReferences: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  // Shared geometries
  private unitQuad: QuadGeometry | null = null;

  constructor(contextWrapper: WebGLContextManager) {
    this.contextWrapper = contextWrapper;
  }

  /**
   * Get or create a unit quad (1x1, centered)
   */
  getUnitQuad(): QuadGeometry {
    if (!this.unitQuad) {
      this.unitQuad = new QuadGeometry(this.contextWrapper, {
        width: 1.0,
        height: 1.0,
        centered: true,
        flipY: false,
      });
    }
    return this.unitQuad;
  }

  /**
   * Create a quad geometry
   */
  createQuad(config?: QuadGeometryConfig, cacheKey?: string): QuadGeometry {
    // Check cache if key provided
    if (cacheKey && this.geometries.has(cacheKey)) {
      const entry = this.geometries.get(cacheKey)!;
      entry.referenceCount++;
      this.stats.totalReferences++;
      this.stats.cacheHits++;
      return entry.geometry;
    }

    this.stats.cacheMisses++;

    // Create new geometry
    const geometry = new QuadGeometry(this.contextWrapper, config);

    // Cache if key provided
    if (cacheKey) {
      const entry: GeometryEntry = {
        geometry,
        key: cacheKey,
        referenceCount: 1,
        createdAt: Date.now(),
      };
      this.geometries.set(cacheKey, entry);
      this.stats.totalGeometries++;
    }

    return geometry;
  }

  /**
   * Create a custom quad with specific dimensions
   */
  createCustomQuad(
    width: number,
    height: number,
    centered = true,
    flipY = false,
  ): QuadGeometry {
    const cacheKey = `quad:${width}x${height}:${centered}:${flipY}`;
    return this.createQuad({ width, height, centered, flipY }, cacheKey);
  }

  /**
   * Get a geometry by key
   */
  get(key: string): QuadGeometry | null {
    const entry = this.geometries.get(key);
    if (entry) {
      entry.referenceCount++;
      this.stats.totalReferences++;
      return entry.geometry;
    }
    return null;
  }

  /**
   * Check if a geometry is cached
   */
  has(key: string): boolean {
    return this.geometries.has(key);
  }

  /**
   * Release a geometry reference
   */
  release(key: string): void {
    const entry = this.geometries.get(key);
    if (entry && entry.referenceCount > 0) {
      entry.referenceCount--;
      this.stats.totalReferences--;
    }
  }

  /**
   * Remove a geometry from cache
   */
  remove(key: string): boolean {
    const entry = this.geometries.get(key);
    if (!entry) {
      return false;
    }

    // Dispose geometry
    entry.geometry.dispose();

    // Remove from cache
    this.geometries.delete(key);
    this.stats.totalGeometries--;

    return true;
  }

  /**
   * Get all cached geometry keys
   */
  getKeys(): string[] {
    return Array.from(this.geometries.keys());
  }

  /**
   * Get geometry count
   */
  getGeometryCount(): number {
    return this.geometries.size;
  }

  /**
   * Get statistics
   */
  getStats(): Readonly<GeometryStats> {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total > 0 ? this.stats.cacheHits / total : 0;
  }

  /**
   * Prune unused geometries (zero references)
   */
  pruneUnused(): number {
    let prunedCount = 0;

    for (const [key, entry] of this.geometries.entries()) {
      if (entry.referenceCount === 0) {
        this.remove(key);
        prunedCount++;
      }
    }

    return prunedCount;
  }

  /**
   * Dispose of a specific geometry
   */
  dispose(key: string): void {
    this.remove(key);
  }

  /**
   * Dispose of all geometries
   */
  disposeAll(): void {
    // Dispose unit quad
    if (this.unitQuad) {
      this.unitQuad.dispose();
      this.unitQuad = null;
    }

    // Dispose cached geometries
    for (const entry of this.geometries.values()) {
      entry.geometry.dispose();
    }

    this.geometries.clear();
    this.stats.totalGeometries = 0;
    this.stats.totalReferences = 0;
  }

  /**
   * Clear all cached geometries
   */
  clear(): void {
    this.disposeAll();
  }

  /**
   * Get the WebGL context wrapper
   */
  getContext(): WebGLContextManager {
    return this.contextWrapper;
  }
}
