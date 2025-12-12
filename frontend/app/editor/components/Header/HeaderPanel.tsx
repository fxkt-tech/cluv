/**
 * Header Component
 * Top navigation bar with menu and export button
 */

import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";

interface HeaderProps {
  projectId: string;
  projectName: string;
  onExport?: () => void;
  onBack?: () => void;
  onSave?: () => void;
}

export function Header({
  projectId,
  projectName,
  onExport,
  onBack,
  onSave,
}: HeaderProps) {
  return (
    <header className="h-8 flex items-center justify-between px-4 bg-editor-bg border-b border-editor-border shrink-0">
      <div
        className="flex items-center font-bold text-lg cursor-pointer"
        onClick={onBack}
      >
        <span className="text-accent-cyan">K</span>
        <span className="text-text-fgDark">iva</span>
        <span className="text-accent-green">C</span>
        <span className="text-text-fgDark">ut</span>
      </div>
      <div className="text-sm text-text-muted">
        {`${projectName}（${projectId}）`}
      </div>
      <div className="flex items-center gap-2">
        {/* 快捷键帮助 */}
        <KeyboardShortcutsHelp />
        <button
          onClick={onSave}
          className="font-medium px-3 py-0.5 rounded text-xs bg-accent-green text-white hover:bg-accent-green/80 transition-colors"
          aria-label="Save project"
        >
          保存
        </button>
        <button
          onClick={onExport}
          className="font-medium px-3 py-0.5 rounded text-xs bg-accent-blue text-white hover:bg-accent-cyan transition-colors"
          aria-label="Export project"
        >
          导出
        </button>
      </div>
    </header>
  );
}
