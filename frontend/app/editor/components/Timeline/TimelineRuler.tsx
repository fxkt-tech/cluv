/**
 * TimelineRuler Component
 * Time ruler/scale for timeline
 */

import { TIMELINE_MARKS } from "../../constants/data";

export function TimelineRuler() {
  return (
    <div className="h-8 border-b border-editor-border flex items-end pb-1 sticky top-0 bg-editor-bg">
      <div className="flex text-[10px] w-[2000px] justify-between px-2">
        {TIMELINE_MARKS.map((mark) => (
          <span key={mark} className="text-text-muted">
            {mark}
          </span>
        ))}
      </div>
    </div>
  );
}
