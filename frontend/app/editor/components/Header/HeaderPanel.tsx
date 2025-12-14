/**
 * Header Component
 * Top navigation bar with menu and export button
 */

import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { ProtocolViewer } from "./Protocol";
import { CutProtocol } from "../../types/protocol";
import { KivaCutLogo } from "../../icons/UIIcons";

interface HeaderProps {
  projectId: string;
  projectName: string;
  protocol?: CutProtocol | null;
  onExport?: () => void;
  onBack?: () => void;
  onSave?: () => void;
}

export function Header({
  projectId,
  projectName,
  protocol,
  onExport,
  onBack,
}: HeaderProps) {
  return (
    <header className="h-8 flex items-center justify-between px-4 bg-editor-bg border-b border-editor-border shrink-0">
      <div
        className="flex items-center gap-2 font-bold text-lg cursor-pointer"
        // onClick={onBack}
      >
        <KivaCutLogo size={28} className="text-accent-blue" />
        <div className="flex items-center">
          <span className="text-accent-blue">KivaCut</span>
        </div>
      </div>
      <div className="text-sm text-text-muted">
        {`${projectName}（${projectId}）`}
      </div>
      <div className="flex items-center gap-2">
        {/* 快捷键帮助 */}
        <KeyboardShortcutsHelp />
        {/* Protocol 查看器 */}
        <ProtocolViewer protocol={protocol || null} />
        <button
          onClick={onBack}
          className="font-medium px-3 py-0.5 rounded text-xs bg-editor-panel text-text-fg hover:bg-editor-hover transition-colors"
          aria-label="Back to Project List"
        >
          项目列表
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
