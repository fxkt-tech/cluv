/**
 * Scene Types
 *
 * 场景管理相关的类型定义
 */

/**
 * 图层数据
 */
export interface LayerData {
  /** 图层 ID */
  id: string;
  /** 关联的轨道 ID */
  trackId: string;
  /** 图层顺序（z-index） */
  order: number;
  /** 是否可见 */
  visible: boolean;
  /** 不透明度 (0-1) */
  opacity: number;
  /** 图层名称 */
  name?: string;
  /** 是否锁定 */
  locked?: boolean;
}

/**
 * 渲染节点数据
 */
export interface RenderNodeData {
  /** 片段 ID */
  clipId: string;
  /** 节点类型 */
  type: "video" | "image" | "text" | "shape";
  /** 开始时间 (ms) */
  startTime: number;
  /** 持续时间 (ms) */
  duration: number;
  /** 裁剪开始时间 (ms) */
  trimStart: number;
  /** 裁剪结束时间 (ms) */
  trimEnd: number;
  /** 位置 */
  position: {
    x: number;
    y: number;
  };
  /** 缩放 */
  scale: number;
  /** 旋转角度 (度) */
  rotation: number;
  /** 不透明度 (0-1) */
  opacity: number;
  /** 资源路径 */
  resourceSrc: string;
  /** 锚点 */
  anchor?: {
    x: number;
    y: number;
  };
  /** 尺寸（可选，用于覆盖原始尺寸） */
  size?: {
    width: number;
    height: number;
  };
  /** 混合模式 */
  blendMode?: "normal" | "add" | "multiply" | "screen" | "overlay";
}

/**
 * 场景配置
 */
export interface SceneConfig {
  /** 场景宽度 */
  width: number;
  /** 场景高度 */
  height: number;
  /** 背景颜色 */
  backgroundColor?: string;
  /** 帧率 */
  frameRate?: number;
}

/**
 * 相机配置
 */
export interface CameraConfig {
  /** 相机位置 */
  position: {
    x: number;
    y: number;
    z: number;
  };
  /** 相机目标 */
  target?: {
    x: number;
    y: number;
    z: number;
  };
  /** 视场角 (度) */
  fov?: number;
  /** 近裁剪面 */
  near?: number;
  /** 远裁剪面 */
  far?: number;
  /** 正交投影 */
  orthographic?: boolean;
}

/**
 * 变换矩阵
 */
export interface Transform {
  /** 位置 */
  position: {
    x: number;
    y: number;
    z?: number;
  };
  /** 旋转 (欧拉角，度) */
  rotation: {
    x?: number;
    y?: number;
    z: number;
  };
  /** 缩放 */
  scale: {
    x: number;
    y: number;
    z?: number;
  };
}

/**
 * 包围盒
 */
export interface BoundingBox {
  /** 最小 X */
  minX: number;
  /** 最小 Y */
  minY: number;
  /** 最大 X */
  maxX: number;
  /** 最大 Y */
  maxY: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 场景节点类型
 */
export type SceneNodeType = "layer" | "group" | "renderNode" | "camera";

/**
 * 场景节点基础接口
 */
export interface SceneNodeBase {
  /** 节点 ID */
  id: string;
  /** 节点类型 */
  type: SceneNodeType;
  /** 父节点 ID */
  parentId?: string;
  /** 子节点 ID 列表 */
  children?: string[];
  /** 是否可见 */
  visible: boolean;
  /** 变换 */
  transform?: Transform;
}

/**
 * 场景事件类型
 */
export type SceneEventType =
  | "nodeAdded"
  | "nodeRemoved"
  | "nodeUpdated"
  | "layerAdded"
  | "layerRemoved"
  | "layerReordered"
  | "visibilityChanged"
  | "transformChanged";

/**
 * 场景事件
 */
export interface SceneEvent {
  /** 事件类型 */
  type: SceneEventType;
  /** 节点 ID */
  nodeId?: string;
  /** 图层 ID */
  layerId?: string;
  /** 事件数据 */
  data?: unknown;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 场景统计信息
 */
export interface SceneStats {
  /** 图层数量 */
  layerCount: number;
  /** 渲染节点数量 */
  nodeCount: number;
  /** 可见节点数量 */
  visibleNodeCount: number;
  /** 纹理数量 */
  textureCount: number;
  /** 活动纹理数量 */
  activeTextureCount: number;
}

/**
 * 拾取结果
 */
export interface PickResult {
  /** 是否命中 */
  hit: boolean;
  /** 节点 ID */
  nodeId?: string;
  /** 图层 ID */
  layerId?: string;
  /** 命中点 (场景坐标) */
  point?: {
    x: number;
    y: number;
  };
  /** 距离 */
  distance?: number;
}

/**
 * 场景序列化数据
 */
export interface SceneSerializedData {
  /** 场景配置 */
  config: SceneConfig;
  /** 图层列表 */
  layers: LayerData[];
  /** 节点列表 */
  nodes: RenderNodeData[];
  /** 相机配置 */
  camera?: CameraConfig;
  /** 版本号 */
  version: string;
}
