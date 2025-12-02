/**
 * Timeline Component
 * Main timeline container with toolbar and content
 */

import { Track } from "../../types/editor";
import { TimelineToolbar } from "./TimelineToolbar";
import { TimelineContent } from "./TimelineContent";

interface TimelineProps {
  tracks: Track[];
  selectedClipId?: string | null;
  zoomLevel?: number;
  onClipSelect?: (clipId: string) => void;
  onZoomChange?: (zoom: number) => void;
}

export function Timeline({
  tracks,
  selectedClipId,
  zoomLevel = 1,
  onClipSelect,
  onZoomChange,
}: TimelineProps) {
  return (
    <div className="h-timeline border-t border-editor-border flex flex-col shrink-0 bg-editor-bg">
      <TimelineToolbar zoomLevel={zoomLevel} onZoomChange={onZoomChange} />
      <TimelineContent
        tracks={tracks}
        selectedClipId={selectedClipId}
        onClipSelect={onClipSelect}
      />
    </div>
  );
}
