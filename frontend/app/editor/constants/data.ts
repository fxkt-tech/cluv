/**
 * Data Constants
 * Static data and configurations
 */

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
  // media: "Media",
  // audio: "Audio",
  // text: "Text",
  // sticker: "Sticker",
  // effects: "Effects",
  // trans: "Trans",
  // filters: "Filters",
  media: "媒体",
  audio: "音频",
  text: "文本",
  sticker: "贴纸",
  effects: "特效",
  trans: "转场",
  filters: "滤镜",
};

export const PROPERTY_TABS = ["Video", "Audio", "Speed"] as const;

export const TIMELINE_MARKS = [
  "00:00",
  "00:15",
  "00:30",
  "00:45",
  "01:00",
] as const;

export const TIMELINE_TOOLS = [
  { label: "Select", icon: "cursor" },
  { label: "Split", icon: "scissors" },
  { label: "Delete", icon: "trash" },
] as const;

export const PLAYBACK_BUTTONS = [
  { symbol: "⏮", label: "Previous frame", action: "previous" },
  { symbol: "▶", label: "Play/Pause", action: "play" },
  { symbol: "⏭", label: "Next frame", action: "next" },
] as const;

export const MOCK_RESOURCES = Array.from({ length: 6 }, (_, i) => ({
  id: `resource-${i + 1}`,
  name: `Media ${i + 1}`,
  type: "media" as const,
}));

export const MOCK_TRACKS = [
  {
    id: "track-1",
    name: "Main Track",
    type: "video" as const,
    visible: true,
    locked: false,
    clips: [
      {
        id: "clip-1",
        name: "Video_Clip_01.mp4",
        type: "video" as const,
        startTime: 0,
        duration: 5,
        position: { x: 50, y: 0 },
      },
    ],
  },
  {
    id: "track-2",
    name: "Audio 1",
    type: "audio" as const,
    visible: true,
    locked: false,
    clips: [
      {
        id: "clip-2",
        name: "Audio_Track_01.mp3",
        type: "audio" as const,
        startTime: 0,
        duration: 5,
        position: { x: 50, y: 36 },
      },
    ],
  },
];
