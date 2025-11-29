/**
 * TimelineRuler Component
 * Time ruler/scale for timeline
 */

import { TIMELINE_MARKS } from "../../constants/data";
import { COLORS } from "../../constants/theme";

export function TimelineRuler() {
  return (
    <div
      className="h-8 border-b flex items-end pb-1 sticky top-0"
      style={{
        backgroundColor: COLORS.editor.bg,
        borderBottomColor: COLORS.editor.border,
      }}
    >
      <div className="flex text-[10px] w-[2000px] justify-between px-2">
        {TIMELINE_MARKS.map((mark) => (
          <span key={mark} style={{ color: COLORS.editor.border }}>
            {mark}
          </span>
        ))}
      </div>
    </div>
  );
}
