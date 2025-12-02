/**
 * PlayerArea Component
 * Central preview window with playback controls
 */

import { PLAYBACK_BUTTONS } from "../constants/data";

interface PlayerAreaProps {
  playbackTime: string;
  onPlayPause?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function PlayerArea({
  playbackTime,
  onPlayPause,
  onPrevious,
  onNext,
}: PlayerAreaProps) {
  return (
    <main className="flex-1 flex flex-col relative min-w-0 bg-editor-dark">
      <div className="flex-1 flex items-center justify-center p-8">
        {/* Video Placeholder */}
        <div className="aspect-video w-full max-h-full shadow-lg border border-editor-border flex items-center justify-center rounded bg-black text-text-muted">
          Preview Window
        </div>
      </div>

      {/* Player Controls */}
      <div className="h-12 flex items-center justify-center gap-4 shrink-0 border-t border-editor-border bg-editor-bg">
        {PLAYBACK_BUTTONS.map((btn) => (
          <button
            key={btn.action}
            onClick={
              btn.action === "play"
                ? onPlayPause
                : btn.action === "previous"
                  ? onPrevious
                  : onNext
            }
            className="transition-colors text-lg text-text-secondary hover:text-text-fg"
            aria-label={btn.label}
          >
            {btn.symbol}
          </button>
        ))}
        <div className="text-xs font-mono ml-4 text-accent-cyan">
          {playbackTime}
        </div>
      </div>
    </main>
  );
}
