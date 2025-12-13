/**
 * Editor Types Definition
 * Centralized TypeScript interfaces for the video editor
 */

export interface Clip {
  id: string;
  name: string;
  type: "video" | "audio" | "text";
  startTime: number;
  duration: number;
  position: { x: number; y: number };
}

export interface Track {
  id: string;
  name: string;
  clips: Clip[];
  type: "video" | "audio";
  visible: boolean;
  locked: boolean;
}

export interface Properties {
  scale: number;
  posX: number;
  posY: number;
  rotation: number;
  opacity: number;
}

export interface EditorState {
  tracks: Track[];
  selectedClipId: string | null;
  selectedTrackId: string | null;
  currentTime: number;
  playbackTime: string;
  zoomLevel: number;
  activeTab: string;
  activePropertyTab: "video" | "audio" | "speed";
  properties: Properties;
  isPlaying: boolean;
}

export type ResourceTab =
  | "media"
  | "audio"
  | "text"
  | "sticker"
  | "effects"
  | "trans"
  | "filters";

export interface EditorResource {
  id: string;
  name: string;
  type: ResourceTab;
  thumbnailUrl?: string;
  src?: string;
}

export interface BackendResource {
  id: string;
  name: string;
  src: string;
  resource_type: string;
}
