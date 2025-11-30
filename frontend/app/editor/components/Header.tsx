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
        <span style={{ color: "#00CCFF" }}>K</span>
        <span className="text-white">iva</span>
        <span style={{ color: "#39FF14" }}>C</span>
        <span className="text-white">ut</span>
      </div>
      <div className="text-sm text-neutral-500">
        {`${projectName}（${projectId}）`}
      </div>
      <button
        onClick={onExport}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-3 py-0.5 rounded text-xs transition-colors"
        aria-label="Export project"
      >
        导出
      </button>
    </header>
  );
}
