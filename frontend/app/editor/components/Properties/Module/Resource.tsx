/**
 * Resource Module
 * Displays material information for selected resource
 */

import {
  VideoMaterialProto,
  AudioMaterialProto,
  ImageMaterialProto,
} from "../../../types/protocol";

interface ResourceModuleProps {
  selectedResource: {
    id: string;
    type: string;
    data: VideoMaterialProto | AudioMaterialProto | ImageMaterialProto;
  };
}

export function ResourceModule({ selectedResource }: ResourceModuleProps) {
  return (
    <div className="pb-4 border-b border-editor-border">
      <div className="text-sm font-medium text-text-fg mb-3">Media Info</div>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-text-muted">Name:</span>
          <span className="text-text-fg">{selectedResource.data.name}</span>
        </div>

        {selectedResource.type === "video" && (
          <>
            <div className="flex justify-between">
              <span className="text-text-muted">Dimensions:</span>
              <span className="text-text-fg">
                {(selectedResource.data as VideoMaterialProto).dimension.width}{" "}
                x{" "}
                {(selectedResource.data as VideoMaterialProto).dimension.height}
              </span>
            </div>
            {(selectedResource.data as VideoMaterialProto).duration && (
              <div className="flex justify-between">
                <span className="text-text-muted">Duration:</span>
                <span className="text-text-fg">
                  {(
                    (selectedResource.data as VideoMaterialProto).duration! /
                    1000
                  ).toFixed(2)}
                  s
                </span>
              </div>
            )}
            {(selectedResource.data as VideoMaterialProto).fps && (
              <div className="flex justify-between">
                <span className="text-text-muted">FPS:</span>
                <span className="text-text-fg">
                  {(
                    selectedResource.data as VideoMaterialProto
                  ).fps!.toFixed(2)}
                </span>
              </div>
            )}
            {(selectedResource.data as VideoMaterialProto).codec && (
              <div className="flex justify-between">
                <span className="text-text-muted">Codec:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as VideoMaterialProto).codec}
                </span>
              </div>
            )}
            {(selectedResource.data as VideoMaterialProto).bitrate && (
              <div className="flex justify-between">
                <span className="text-text-muted">Bitrate:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as VideoMaterialProto).bitrate} kbps
                </span>
              </div>
            )}
          </>
        )}

        {selectedResource.type === "audio" && (
          <>
            {(selectedResource.data as AudioMaterialProto).duration && (
              <div className="flex justify-between">
                <span className="text-text-muted">Duration:</span>
                <span className="text-text-fg">
                  {(
                    (selectedResource.data as AudioMaterialProto).duration! /
                    1000
                  ).toFixed(2)}
                  s
                </span>
              </div>
            )}
            {(selectedResource.data as AudioMaterialProto).sample_rate && (
              <div className="flex justify-between">
                <span className="text-text-muted">Sample Rate:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as AudioMaterialProto).sample_rate} Hz
                </span>
              </div>
            )}
            {(selectedResource.data as AudioMaterialProto).channels && (
              <div className="flex justify-between">
                <span className="text-text-muted">Channels:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as AudioMaterialProto).channels}
                </span>
              </div>
            )}
            {(selectedResource.data as AudioMaterialProto).codec && (
              <div className="flex justify-between">
                <span className="text-text-muted">Codec:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as AudioMaterialProto).codec}
                </span>
              </div>
            )}
            {(selectedResource.data as AudioMaterialProto).bitrate && (
              <div className="flex justify-between">
                <span className="text-text-muted">Bitrate:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as AudioMaterialProto).bitrate} kbps
                </span>
              </div>
            )}
          </>
        )}

        {selectedResource.type === "image" && (
          <>
            <div className="flex justify-between">
              <span className="text-text-muted">Dimensions:</span>
              <span className="text-text-fg">
                {(selectedResource.data as ImageMaterialProto).dimension.width}{" "}
                x{" "}
                {
                  (selectedResource.data as ImageMaterialProto).dimension
                    .height
                }
              </span>
            </div>
            {(selectedResource.data as ImageMaterialProto).format && (
              <div className="flex justify-between">
                <span className="text-text-muted">Format:</span>
                <span className="text-text-fg">
                  {(selectedResource.data as ImageMaterialProto).format}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
