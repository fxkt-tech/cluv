/**
 * index.ts
 *
 * WebGL Player 模块导出入口
 */

// 核心管理器
export { WebGLPlayerManager } from "./WebGLPlayerManager";
export type { WebGLPlayerOptions } from "./WebGLPlayerManager";

// 渲染器和渲染循环（步骤2）
export type { RenderStats } from "../renderer/WebGLRenderer";
export type { RenderLoopStats } from "../renderer/RenderLoop";

// 资源加载器（步骤3）
export { ResourceLoader } from "./ResourceLoader";
export type {
  ResourceInfo,
  ResourceLoadOptions,
  ResourceLoadResult,
  ResourceLoaderStats,
} from "./ResourceLoader";
export { ResourceLoadState } from "./ResourceLoader";

// 场景构建器（步骤4）
export { SceneBuilder } from "./SceneBuilder";
export type { SceneBuildConfig, SceneBuildResult } from "./SceneBuilder";

// 类型定义
export type {
  VideoTrimInfo,
  PlayerStats,
  PlayerEvent,
  PlayerCallbacks,
  SceneNodeConfig,
  RenderConfig,
  BatchRenderConfig,
} from "./types";

export { PlayerState, PlayerEventType } from "./types";
