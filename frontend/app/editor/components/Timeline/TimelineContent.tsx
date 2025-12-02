/**
 * TimelineContent Component
 * Timeline tracks and clips display
 */

import { Track } from "../../types/editor";
import { TimelineRuler } from "./TimelineRuler";
import { TimelineClip } from "./TimelineClip";
import { Playhead } from "./Playhead";

interface TimelineContentProps {
  tracks: Track[];
  selectedClipId?: string | null;
  onClipSelect?: (clipId: string) => void;
}

export function TimelineContent({
  tracks,
  selectedClipId,
  onClipSelect,
}: TimelineContentProps) {
  return (
    <div className="flex-1 flex relative overflow-hidden">
      {/* Track Headers */}
      <div className="w-track-header border-r border-editor-border z-10 flex flex-col pt-8 bg-editor-bg">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="h-8 px-2 flex items-center text-xs bg-editor-panel text-text-secondary"
          >
            {track.name}
          </div>
        ))}
      </div>

      {/* Tracks Area */}
      <div className="flex-1 relative overflow-x-auto bg-editor-dark">
        {/* Ruler */}
        <TimelineRuler />

        {/* Playhead */}
        <Playhead position={100} />

        {/* Clips */}
        <div className="mt-1 relative w-[2000px]">
          {tracks.map((track, trackIndex) =>
            track.clips.map((clip) => (
              <TimelineClip
                key={clip.id}
                clip={{
                  ...clip,
                  position: { x: clip.position.x, y: trackIndex * 36 + 36 },
                }}
                isSelected={selectedClipId === clip.id}
                onSelect={onClipSelect}
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}
