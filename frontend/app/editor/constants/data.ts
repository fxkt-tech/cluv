import { ResourceTab } from "../types/editor";

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

export const PROPERTY_TABS = ["画面", "音频", "变速"] as const;
