/**
 * PlayerArea Component
 * Central preview window with playback controls
 */

import { COLORS, SIZES } from "../constants/theme";
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
    <main
      className="flex-1 flex flex-col relative min-w-0"
      style={{ backgroundColor: COLORS.editor.dark }}
    >
      <div className="flex-1 flex items-center justify-center p-8">
        {/* Video Placeholder */}
        <div
          className="aspect-video w-full max-h-full shadow-lg border flex items-center justify-center rounded"
          style={{
            backgroundColor: "black",
            borderColor: COLORS.editor.border,
            color: COLORS.text.muted,
          }}
        >
          Preview Window
        </div>
      </div>

      {/* Player Controls */}
      <div
        className={`${SIZES.playerControls} flex items-center justify-center gap-4 shrink-0 border-t`}
        style={{
          backgroundColor: COLORS.editor.bg,
          borderTopColor: COLORS.editor.border,
        }}
      >
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
            className="transition-colors text-lg"
            style={{ color: COLORS.text.secondary }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.text.fg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.text.secondary;
            }}
            aria-label={btn.label}
          >
            {btn.symbol}
          </button>
        ))}
        <div className="text-xs font-mono ml-4" style={{ color: COLORS.accent.cyan }}>
          {playbackTime}
        </div>
      </div>
    </main>
  );
}
