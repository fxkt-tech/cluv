/**
 * ResourceLoader.ts
 *
 * 视频资源加载器
 * - 加载和缓存视频纹理资源
 * - 管理资源生命周期
 * - 提供预加载功能
 * - 跟踪资源加载状态
 */

import type { TextureManager } from "../texture/TextureManager";
import type { VideoTexture } from "../texture/VideoTexture";
import type { Clip } from "../../editor/types/timeline";

/**
 * 资源加载状态
 */
export enum ResourceLoadState {
  /** 未加载 */
  IDLE = "idle",
  /** 加载中 */
  LOADING = "loading",
  /** 已加载 */
  LOADED = "loaded",
  /** 加载失败 */
  ERROR = "error",
}

/**
 * 资源信息
 */
export interface ResourceInfo {
  /** 资源 ID */
  id: string;
  /** 资源 URL */
  url: string;
  /** 加载状态 */
  state: ResourceLoadState;
  /** 视频纹理（加载成功后） */
  texture?: VideoTexture;
  /** 视频时长（秒） */
  duration?: number;
  /** 视频宽度 */
  width?: number;
  /** 视频高度 */
  height?: number;
  /** 错误信息 */
  error?: string;
  /** 加载开始时间 */
  loadStartTime?: number;
  /** 加载完成时间 */
  loadEndTime?: number;
  /** 引用计数 */
  refCount: number;
}

/**
 * 资源加载选项
 */
export interface ResourceLoadOptions {
  /** 是否自动更新纹理 */
  autoUpdate?: boolean;
  /** 是否循环播放 */
  loop?: boolean;
  /** 是否预加载 */
  preload?: boolean;
  /** 加载超时时间（毫秒） */
  timeout?: number;
}

/**
 * 资源加载结果
 */
export interface ResourceLoadResult {
  /** 是否成功 */
  success: boolean;
  /** 资源信息 */
  resource?: ResourceInfo;
  /** 错误信息 */
  error?: string;
}

/**
 * 资源加载统计
 */
export interface ResourceLoaderStats {
  /** 总资源数 */
  totalResources: number;
  /** 已加载资源数 */
  loadedResources: number;
  /** 加载中资源数 */
  loadingResources: number;
  /** 加载失败资源数 */
  errorResources: number;
  /** 缓存命中次数 */
  cacheHits: number;
  /** 缓存未命中次数 */
  cacheMisses: number;
  /** 平均加载时间（毫秒） */
  avgLoadTime: number;
}

/**
 * 资源加载器类
 *
 * 功能：
 * - 加载和缓存视频纹理
 * - 管理资源引用计数
 * - 自动释放未使用资源
 * - 提供预加载功能
 * - 跟踪加载状态和统计
 */
export class ResourceLoader {
  // 纹理管理器
  private textureManager: TextureManager;

  // 资源缓存 Map<resourceId, ResourceInfo>
  private resources = new Map<string, ResourceInfo>();

  // URL 到资源 ID 的映射（用于去重）
  private urlToIdMap = new Map<string, string>();

  // 统计信息
  private stats: ResourceLoaderStats = {
    totalResources: 0,
    loadedResources: 0,
    loadingResources: 0,
    errorResources: 0,
    cacheHits: 0,
    cacheMisses: 0,
    avgLoadTime: 0,
  };

  // 加载时间累计（用于计算平均值）
  private totalLoadTime = 0;
  private loadCompletedCount = 0;

  // 调试模式
  private debug: boolean;

  /**
   * 创建资源加载器
   * @param textureManager - 纹理管理器
   * @param debug - 是否启用调试模式
   */
  constructor(textureManager: TextureManager, debug = false) {
    this.textureManager = textureManager;
    this.debug = debug;

    if (this.debug) {
      console.log("[ResourceLoader] Created");
    }
  }

  // ==================== 资源加载 ====================

  /**
   * 加载视频纹理
   * @param resourceId - 资源 ID
   * @param url - 视频 URL
   * @param options - 加载选项
   */
  async loadVideoTexture(
    resourceId: string,
    url: string,
    options: ResourceLoadOptions = {},
  ): Promise<ResourceLoadResult> {
    // 检查是否已加载
    if (this.resources.has(resourceId)) {
      const resource = this.resources.get(resourceId)!;

      // 如果已加载成功，增加引用计数并返回
      if (resource.state === ResourceLoadState.LOADED && resource.texture) {
        resource.refCount++;
        this.stats.cacheHits++;

        if (this.debug) {
          console.log(`[ResourceLoader] Cache hit for resource: ${resourceId}`);
        }

        return {
          success: true,
          resource,
        };
      }

      // 如果正在加载，返回错误（避免重复加载）
      if (resource.state === ResourceLoadState.LOADING) {
        if (this.debug) {
          console.warn(
            `[ResourceLoader] Resource already loading: ${resourceId}`,
          );
        }
        return {
          success: false,
          error: "Resource is already loading",
        };
      }
    }

    // 检查 URL 是否已被其他 ID 加载
    const existingId = this.urlToIdMap.get(url);
    if (existingId && existingId !== resourceId) {
      const existingResource = this.resources.get(existingId)!;
      if (
        existingResource.state === ResourceLoadState.LOADED &&
        existingResource.texture
      ) {
        // 复用已加载的资源
        const aliasResource: ResourceInfo = {
          ...existingResource,
          id: resourceId,
          refCount: 1,
        };
        this.resources.set(resourceId, aliasResource);
        this.stats.cacheHits++;

        if (this.debug) {
          console.log(
            `[ResourceLoader] Reusing resource from ${existingId} for ${resourceId}`,
          );
        }

        return {
          success: true,
          resource: aliasResource,
        };
      }
    }

    // 创建资源信息
    const resource: ResourceInfo = {
      id: resourceId,
      url,
      state: ResourceLoadState.LOADING,
      refCount: 1,
      loadStartTime: performance.now(),
    };

    this.resources.set(resourceId, resource);
    this.urlToIdMap.set(url, resourceId);
    this.stats.cacheMisses++;
    this.stats.totalResources++;
    this.stats.loadingResources++;

    if (this.debug) {
      console.log(
        `[ResourceLoader] Loading resource: ${resourceId} from ${url}`,
      );
    }

    try {
      // 加载视频纹理
      const result = await this.textureManager.createVideoFromURL(url, {
        autoUpdate: options.autoUpdate ?? true,
        loop: options.loop ?? false,
      });

      if (!result.texture) {
        throw new Error("Failed to load video texture");
      }

      const texture = result.texture as VideoTexture;

      // 更新资源信息
      resource.state = ResourceLoadState.LOADED;
      resource.texture = texture;
      resource.duration = texture.getDuration();
      resource.width = texture.width;
      resource.height = texture.height;
      resource.loadEndTime = performance.now();

      // 更新统计
      this.stats.loadedResources++;
      this.stats.loadingResources--;

      const loadTime = resource.loadEndTime - resource.loadStartTime!;
      this.totalLoadTime += loadTime;
      this.loadCompletedCount++;
      this.stats.avgLoadTime = this.totalLoadTime / this.loadCompletedCount;

      if (this.debug) {
        console.log(
          `[ResourceLoader] Resource loaded: ${resourceId} in ${loadTime.toFixed(2)}ms`,
        );
        console.log(`  Duration: ${resource.duration?.toFixed(2)}s`);
        console.log(`  Size: ${resource.width}x${resource.height}`);
      }

      return {
        success: true,
        resource,
      };
    } catch (error) {
      // 加载失败
      resource.state = ResourceLoadState.ERROR;
      resource.error = error instanceof Error ? error.message : String(error);
      resource.loadEndTime = performance.now();

      this.stats.errorResources++;
      this.stats.loadingResources--;

      if (this.debug) {
        console.error(
          `[ResourceLoader] Failed to load resource: ${resourceId}`,
          error,
        );
      }

      return {
        success: false,
        error: resource.error,
      };
    }
  }

  /**
   * 预加载多个视频资源
   * @param clips - Clip 列表
   * @param options - 加载选项
   */
  async preloadResources(
    clips: Clip[],
    options: ResourceLoadOptions = {},
  ): Promise<ResourceLoadResult[]> {
    if (this.debug) {
      console.log(`[ResourceLoader] Preloading ${clips.length} resources`);
    }

    // 提取所有视频资源
    const videoClips = clips.filter(
      (clip) => clip.type === "video" && clip.resourceSrc,
    );

    // 并行加载所有资源
    const loadPromises = videoClips.map((clip) =>
      this.loadVideoTexture(clip.resourceId!, clip.resourceSrc!, options),
    );

    const results = await Promise.all(loadPromises);

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    if (this.debug) {
      console.log(
        `[ResourceLoader] Preload completed: ${successCount} success, ${failureCount} failed`,
      );
    }

    return results;
  }

  // ==================== 资源访问 ====================

  /**
   * 获取资源
   * @param resourceId - 资源 ID
   */
  getResource(resourceId: string): ResourceInfo | undefined {
    return this.resources.get(resourceId);
  }

  /**
   * 获取视频纹理
   * @param resourceId - 资源 ID
   */
  getTexture(resourceId: string): VideoTexture | undefined {
    const resource = this.resources.get(resourceId);
    return resource?.texture;
  }

  /**
   * 检查资源是否已加载
   * @param resourceId - 资源 ID
   */
  isLoaded(resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    return resource?.state === ResourceLoadState.LOADED;
  }

  /**
   * 检查资源是否正在加载
   * @param resourceId - 资源 ID
   */
  isLoading(resourceId: string): boolean {
    const resource = this.resources.get(resourceId);
    return resource?.state === ResourceLoadState.LOADING;
  }

  /**
   * 获取所有资源 ID
   */
  getResourceIds(): string[] {
    return Array.from(this.resources.keys());
  }

  /**
   * 获取所有已加载的资源
   */
  getLoadedResources(): ResourceInfo[] {
    return Array.from(this.resources.values()).filter(
      (r) => r.state === ResourceLoadState.LOADED,
    );
  }

  // ==================== 资源释放 ====================

  /**
   * 释放资源引用
   * @param resourceId - 资源 ID
   */
  releaseResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return;
    }

    // 减少引用计数
    resource.refCount = Math.max(0, resource.refCount - 1);

    if (this.debug) {
      console.log(
        `[ResourceLoader] Released resource: ${resourceId}, refCount: ${resource.refCount}`,
      );
    }

    // 如果引用计数为 0，可以卸载资源
    if (resource.refCount === 0) {
      this.unloadResource(resourceId);
    }
  }

  /**
   * 卸载资源
   * @param resourceId - 资源 ID
   */
  unloadResource(resourceId: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      return;
    }

    // 释放纹理
    if (resource.texture) {
      // 注意：texture 可能需要通过 textureManager 删除
      // 这里假设 texture 有 dispose 方法
      if (typeof (resource.texture as any).dispose === "function") {
        (resource.texture as any).dispose();
      }
    }

    // 从缓存中移除
    this.resources.delete(resourceId);
    this.urlToIdMap.delete(resource.url);

    // 更新统计
    this.stats.totalResources--;
    if (resource.state === ResourceLoadState.LOADED) {
      this.stats.loadedResources--;
    } else if (resource.state === ResourceLoadState.ERROR) {
      this.stats.errorResources--;
    }

    if (this.debug) {
      console.log(`[ResourceLoader] Unloaded resource: ${resourceId}`);
    }
  }

  /**
   * 清理未使用的资源（引用计数为 0）
   */
  pruneUnusedResources(): number {
    const unusedResources = Array.from(this.resources.entries()).filter(
      ([, resource]) => resource.refCount === 0,
    );

    if (this.debug && unusedResources.length > 0) {
      console.log(
        `[ResourceLoader] Pruning ${unusedResources.length} unused resources`,
      );
    }

    unusedResources.forEach(([id]) => {
      this.unloadResource(id);
    });

    return unusedResources.length;
  }

  /**
   * 释放所有资源
   */
  dispose(): void {
    if (this.debug) {
      console.log(
        `[ResourceLoader] Disposing all resources (${this.resources.size})`,
      );
    }

    // 卸载所有资源
    Array.from(this.resources.keys()).forEach((id) => {
      this.unloadResource(id);
    });

    // 清空映射
    this.resources.clear();
    this.urlToIdMap.clear();

    // 重置统计
    this.stats = {
      totalResources: 0,
      loadedResources: 0,
      loadingResources: 0,
      errorResources: 0,
      cacheHits: 0,
      cacheMisses: 0,
      avgLoadTime: 0,
    };

    this.totalLoadTime = 0;
    this.loadCompletedCount = 0;

    if (this.debug) {
      console.log("[ResourceLoader] Disposed");
    }
  }

  // ==================== 统计信息 ====================

  /**
   * 获取统计信息
   */
  getStats(): Readonly<ResourceLoaderStats> {
    return { ...this.stats };
  }

  /**
   * 重置统计信息（保留已加载资源）
   */
  resetStats(): void {
    this.stats.cacheHits = 0;
    this.stats.cacheMisses = 0;
    this.stats.avgLoadTime = 0;
    this.totalLoadTime = 0;
    this.loadCompletedCount = 0;

    if (this.debug) {
      console.log("[ResourceLoader] Stats reset");
    }
  }

  /**
   * 获取缓存命中率
   */
  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total > 0 ? this.stats.cacheHits / total : 0;
  }

  /**
   * 获取资源数量
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * 打印调试信息
   */
  printDebugInfo(): void {
    console.log("[ResourceLoader] Debug Info:");
    console.log("  Resources:", this.resources.size);
    console.log("  Loaded:", this.stats.loadedResources);
    console.log("  Loading:", this.stats.loadingResources);
    console.log("  Error:", this.stats.errorResources);
    console.log(
      "  Cache Hit Rate:",
      (this.getCacheHitRate() * 100).toFixed(2) + "%",
    );
    console.log("  Avg Load Time:", this.stats.avgLoadTime.toFixed(2) + "ms");

    console.log("\n  Resource Details:");
    this.resources.forEach((resource) => {
      console.log(`    ${resource.id}:`);
      console.log(`      State: ${resource.state}`);
      console.log(`      URL: ${resource.url}`);
      console.log(`      Ref Count: ${resource.refCount}`);
      if (resource.duration) {
        console.log(`      Duration: ${resource.duration.toFixed(2)}s`);
      }
      if (resource.error) {
        console.log(`      Error: ${resource.error}`);
      }
    });
  }
}
