import { ResourceTab } from "../types/editor";

/**
 * Canvas dimensions for video player
 * These define the coordinate system for clip positioning
 */
export const CANVAS_DIMENSIONS = {
  WIDTH: 1920,
  HEIGHT: 1080,
} as const;

export const RESOURCE_TABS: ResourceTab[] = [
  "media",
  "audio",
  "text",
  "sticker",
  "effects",
  "trans",
  "filters",
];

export const RESOURCE_TAB_LABELS: Record<ResourceTab, string> = {
  media: "媒体",
  audio: "音频",
  text: "文本",
  sticker: "贴纸",
  effects: "特效",
  trans: "转场",
  filters: "滤镜",
};

/**
 * Property Tab 接口
 */
export interface PropertyTab {
  key: string;
  name: string;
}

/**
 * Property Tabs 定义
 */
export const PROPERTY_TABS = {
  FRAME: { key: "frame", name: "画面" },
  AUDIO: { key: "audio", name: "音频" },
  SPEED: { key: "speed", name: "变速" },
  EFFECT: { key: "effect", name: "效果" },
  TEXT: { key: "text", name: "文本" },
} as const;

/**
 * 根据 Clip 类型获取对应的 Property Tabs
 */
export function getPropertyTabsForClipType(
  clipType: "video" | "audio" | "image" | "text",
): PropertyTab[] {
  switch (clipType) {
    case "video":
      return [
        PROPERTY_TABS.FRAME,
        PROPERTY_TABS.AUDIO,
        PROPERTY_TABS.SPEED,
        PROPERTY_TABS.EFFECT,
      ];
    case "audio":
      return [PROPERTY_TABS.AUDIO, PROPERTY_TABS.SPEED, PROPERTY_TABS.EFFECT];
    case "image":
      return [PROPERTY_TABS.FRAME, PROPERTY_TABS.EFFECT];
    case "text":
      return [PROPERTY_TABS.TEXT, PROPERTY_TABS.FRAME];
    default:
      return [];
  }
}
