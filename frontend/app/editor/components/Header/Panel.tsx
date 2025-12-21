/**
 * Header Component
 * Top navigation bar with menu and export button
 */

"use client";

import { KeyboardShortcutsHelp } from "./KeyboardShortcutsHelp";
import { ProtocolViewer } from "./Protocol";
import { CutProtocol } from "../../types/protocol";
import { KivaCutLogo } from "../../icons/UIIcons";
import { ThemeToggle } from "./ThemeToggle";
import { WindowControls } from "@/app/components/WindowControls";

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
    <header className="h-8 flex items-center justify-between bg-editor-bg border-b border-editor-border shrink-0">
      {/* macOS 窗口控制按钮 - 左侧 */}
      <div className="flex items-center h-full">
        <div className="mac-only">
          <WindowControls />
        </div>
        <div
          data-tauri-drag-region
          className="flex items-center gap-2 font-bold text-lg cursor-pointer px-4"
        >
          <KivaCutLogo size={28} className="text-accent-blue" />
          <div className="flex items-center">
            <span className="text-accent-blue">KivaCut</span>
          </div>
        </div>
      </div>

      {/* 中间拖拽区域 */}
      <div
        data-tauri-drag-region
        className="flex-1 flex items-center justify-center text-sm text-text-muted select-none"
      >
        {`${projectName}（${projectId}）`}
      </div>

      {/* 右侧按钮组 */}
      <div className="flex items-center h-full">
        <div className="flex items-center gap-2 px-4">
          {/* 快捷键帮助 */}
          <KeyboardShortcutsHelp />
          {/* 主题切换 */}
          <ThemeToggle />
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
        {/* Windows 窗口控制按钮 - 右侧 */}
        <div className="windows-only">
          <WindowControls />
        </div>
      </div>
    </header>
  );
}
