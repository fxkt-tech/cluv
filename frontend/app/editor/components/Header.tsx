/**
 * Header Component
 * Top navigation bar with menu and export button
 */

import { COLORS, SIZES } from "../constants/theme";

interface HeaderProps {
  projectId: string;
  projectName: string;
  onExport?: () => void;
  onBack?: () => void;
}

export function Header({
  projectId,
  projectName,
  onExport,
  onBack,
}: HeaderProps) {
  return (
    <header
      className={`${SIZES.header} flex items-center justify-between px-4 bg-[${COLORS.editor.bg}] border-b border-[${COLORS.editor.border}] shrink-0`}
      style={{
        backgroundColor: COLORS.editor.bg,
        borderBottomColor: COLORS.editor.border,
      }}
    >
      <div
        className="flex items-center font-bold text-lg italic cursor-pointer"
        onClick={onBack}
      >
        <span style={{ color: COLORS.accent.cyan }}>K</span>
        <span style={{ color: COLORS.text.fgDark }}>iva</span>
        <span style={{ color: COLORS.accent.green }}>C</span>
        <span style={{ color: COLORS.text.fgDark }}>ut</span>
      </div>
      <div className="text-sm" style={{ color: COLORS.text.muted }}>
        {`${projectName}（${projectId}）`}
      </div>
      <button
        onClick={onExport}
        className="font-medium px-3 py-0.5 rounded text-xs transition-colors"
        style={{
          backgroundColor: COLORS.accent.blue,
          color: "#ffffff",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.accent.cyan;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.accent.blue;
        }}
        aria-label="Export project"
      >
        导出
      </button>
    </header>
  );
}
