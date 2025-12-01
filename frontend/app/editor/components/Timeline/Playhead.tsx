/**
 * Playhead Component
 * Current playback position indicator
 */

import { COLORS } from "../../constants/theme";

interface PlayheadProps {
  position?: number;
}

export function Playhead({ position = 100 }: PlayheadProps) {
  return (
    <div
      className="absolute top-0 bottom-0 w-px z-20 pointer-events-none"
      style={{ left: `${position}px`, backgroundColor: COLORS.accent.cyan }}
    >
      <div
        className="absolute -top-0 -left-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px]"
        style={{ borderTopColor: COLORS.accent.cyan }}
      ></div>
    </div>
  );
}
