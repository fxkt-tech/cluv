/**
 * Protocol types matching the Rust CutProtocol structure
 */

export interface CutProtocol {
  stage: StageConfig;
  materials: Materials;
  tracks: ProtocolTrack[];
}

export interface StageConfig {
  width: number;
  height: number;
}

export interface Materials {
  videos: VideoMaterialProto[];
  images: ImageMaterialProto[];
  audios: AudioMaterialProto[];
}

export interface VideoMaterialProto {
  id: string;
  name: string;
  src: string;
  dimension: DimensionProto;
  duration?: number;
  fps?: number;
  codec?: string;
  bitrate?: number;
}

export interface ImageMaterialProto {
  id: string;
  name: string;
  src: string;
  dimension: DimensionProto;
  format?: string;
}

export interface AudioMaterialProto {
  id: string;
  name: string;
  src: string;
  duration?: number;
  sample_rate?: number;
  channels?: number;
  codec?: string;
  bitrate?: number;
}

export interface DimensionProto {
  width: number;
  height: number;
}

export interface ProtocolTrack {
  id: string;
  type: string;
  segments: ProtocolSegment[];
}

export interface ProtocolSegment {
  id: string;
  type: string;
  material_id: string;
  target_timerange: TimeRangeProto;
  source_timerange: TimeRangeProto;
  scale?: ScaleProto;
  position?: PositionProto;
  rotation?: number;
  opacity?: number;
}

export interface TimeRangeProto {
  start: number;
  duration: number;
}

export interface ScaleProto {
  width: number;
  height: number;
}

export interface PositionProto {
  x: number;
  y: number;
}

export interface ExportConfig {
  type: ExportType;
  output_file: string;

  // TODO: any报错，等做导出的时候再修复
  // options?: Record<string, any>;
}

export enum ExportType {
  Video = "video",
  Audio = "audio",
}
