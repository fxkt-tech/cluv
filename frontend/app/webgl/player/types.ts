/**
 * types.ts
 *
 * WebGL Player 模块的类型定义
 */

import type { ResourceInfo } from "./ResourceLoader";

/**
 * 播放器状态
 */
export enum PlayerState {
  /** 未初始化 */
  UNINITIALIZED = "uninitialized",
  /** 初始化中 */
  INITIALIZING = "initializing",
  /** 已就绪 */
  READY = "ready",
  /** 播放中 */
  PLAYING = "playing",
  /** 已暂停 */
  PAUSED = "paused",
  /** 加载中 */
  LOADING = "loading",
  /** 错误 */
  ERROR = "error",
}

/**
 * 视频 Trim 信息
 */
export interface VideoTrimInfo {
  /** Trim 开始时间（秒） */
  trimStart: number;
  /** Trim 结束时间（秒） */
  trimEnd: number;
  /** 视频总时长（秒） */
  videoDuration: number;
}

/**
 * 播放器性能统计
 */
export interface PlayerStats {
  /** 帧率 */
  fps: number;
  /** 渲染时间（毫秒） */
  renderTime: number;
  /** 绘制调用次数 */
  drawCalls: number;
  /** 渲染的节点数 */
  nodesRendered: number;
  /** 剔除的节点数 */
  nodesCulled: number;
  /** 已加载的资源数 */
  loadedResources: number;
  /** 活跃的纹理数 */
  activeTextures: number;
}

/**
 * 播放器事件类型
 */
export enum PlayerEventType {
  /** 初始化完成 */
  INITIALIZED = "initialized",
  /** 播放开始 */
  PLAY = "play",
  /** 播放暂停 */
  PAUSE = "pause",
  /** 时间更新 */
  TIME_UPDATE = "timeupdate",
  /** 跳转完成 */
  SEEKED = "seeked",
  /** 资源加载完成 */
  RESOURCE_LOADED = "resourceloaded",
  /** 资源加载失败 */
  RESOURCE_ERROR = "resourceerror",
  /** 渲染错误 */
  RENDER_ERROR = "rendererror",
  /** 尺寸变化 */
  RESIZE = "resize",
}

/**
 * 播放器事件
 */
export interface PlayerEvent {
  /** 事件类型 */
  type: PlayerEventType;
  /** 时间戳 */
  timestamp: number;
  /** 事件数据 */
  data?: unknown;
}

/**
 * 场景节点配置
 */
export interface SceneNodeConfig {
  /** 节点 ID */
  id: string;
  /** 资源 ID */
  resourceId: string;
  /** 图层索引 */
  layerIndex: number;
  /** 位置 */
  position: { x: number; y: number };
  /** 缩放 */
  scale: { x: number; y: number };
  /** 旋转（弧度） */
  rotation: number;
  /** 透明度 */
  opacity: number;
  /** 开始时间（秒） */
  startTime: number;
  /** 结束时间（秒） */
  endTime: number;
  /** Trim 信息（可选） */
  trim?: VideoTrimInfo;
  /** 混合模式 */
  blendMode?: string;
}

/**
 * 播放器回调函数
 */
export interface PlayerCallbacks {
  /** 播放状态变化回调 */
  onPlayStateChange?: (isPlaying: boolean) => void;
  /** 时间更新回调 */
  onTimeUpdate?: (currentTime: number) => void;
  /** 时长变化回调 */
  onDurationChange?: (duration: number) => void;
  /** 资源加载完成回调 */
  onResourceLoaded?: (resourceId: string, info: ResourceInfo) => void;
  /** 资源加载失败回调 */
  onResourceError?: (resourceId: string, error: string) => void;
  /** 错误回调 */
  onError?: (error: Error) => void;
}

/**
 * 渲染配置
 */
export interface RenderConfig {
  /** 是否启用混合 */
  enableBlending: boolean;
  /** 是否启用深度测试 */
  enableDepthTest: boolean;
  /** 是否启用面剔除 */
  enableCullFace: boolean;
  /** 是否自动清除 */
  autoClear: boolean;
  /** 清除颜色 */
  clearColor: [number, number, number, number];
}

/**
 * 批次渲染配置
 */
export interface BatchRenderConfig {
  /** 是否启用批次渲染 */
  enabled: boolean;
  /** 批次大小 */
  batchSize: number;
  /** 是否按 shader 分组 */
  groupByShader: boolean;
  /** 是否按纹理分组 */
  groupByTexture: boolean;
}
