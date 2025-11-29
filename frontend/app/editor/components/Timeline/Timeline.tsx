/**
 * Timeline Component
 * Main timeline container with toolbar and content
 */

import { Track } from "../../types/editor";
import { COLORS, SIZES } from "../../constants/theme";
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
    <div
      className={`${SIZES.timeline} border-t flex flex-col shrink-0`}
      style={{
        borderTopColor: COLORS.editor.border,
        backgroundColor: COLORS.editor.bg,
      }}
    >
      <TimelineToolbar zoomLevel={zoomLevel} onZoomChange={onZoomChange} />
      <TimelineContent
        tracks={tracks}
        selectedClipId={selectedClipId}
        onClipSelect={onClipSelect}
        zoomLevel={zoomLevel}
      />
    </div>
  );
}
