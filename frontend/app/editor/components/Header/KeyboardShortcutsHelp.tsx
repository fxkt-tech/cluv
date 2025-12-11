// KeyboardShortcutsHelp 组件 - 键盘快捷键帮助面板

"use client";

import React, { useState } from "react";
import { KeyboardIcon } from "../../icons";

interface ShortcutItem {
  key: string;
  description: string;
  category: string;
}

const shortcuts: ShortcutItem[] = [
  // 播放控制
  { key: "Space", description: "播放/暂停", category: "播放控制" },
  { key: "←", description: "后退一帧 (1/30秒)", category: "播放控制" },
  { key: "→", description: "前进一帧 (1/30秒)", category: "播放控制" },
  { key: "Shift + ←", description: "后退 1 秒", category: "播放控制" },
  { key: "Shift + →", description: "前进 1 秒", category: "播放控制" },
  { key: "Ctrl/Cmd + ←", description: "跳到开始", category: "播放控制" },
  { key: "Ctrl/Cmd + →", description: "跳到结束", category: "播放控制" },

  // 编辑操作
  {
    key: "Delete / Backspace",
    description: "删除选中片段",
    category: "编辑操作",
  },
  { key: "Ctrl/Cmd + C", description: "复制片段", category: "编辑操作" },
  { key: "Ctrl/Cmd + V", description: "粘贴片段", category: "编辑操作" },
  { key: "Ctrl/Cmd + D", description: "复制片段", category: "编辑操作" },
  { key: "Ctrl/Cmd + A", description: "全选片段", category: "编辑操作" },
  { key: "Escape", description: "取消选择", category: "编辑操作" },

  // 撤销/重做
  { key: "Ctrl/Cmd + Z", description: "撤销", category: "撤销/重做" },
  { key: "Ctrl/Cmd + Shift + Z", description: "重做", category: "撤销/重做" },

  // 视图控制
  { key: "Ctrl/Cmd + +", description: "放大时间轴", category: "视图控制" },
  { key: "Ctrl/Cmd + -", description: "缩小时间轴", category: "视图控制" },
];

export const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  // 按类别分组
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, ShortcutItem[]>,
  );

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-1 hover:bg-editor-hover text-text-muted hover:text-(--color-editor-dark) rounded transition-colors"
        title="键盘快捷键"
      >
        <KeyboardIcon size={20} />
      </button>

      {/* 帮助面板 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-editor-panel rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-editor-border">
              <h2 className="text-xl font-bold text-editor-dark">键盘快捷键</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-editor-hover text-text-muted hover:text-editor-dark rounded transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* 快捷键列表 */}
            <div className="overflow-y-auto p-6 space-y-6">
              {Object.entries(groupedShortcuts).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-accent-blue mb-3">
                    {category}
                  </h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-3 bg-editor-bg rounded hover:bg-editor-hover transition-colors"
                      >
                        <span className="text-text-fg text-sm">
                          {item.description}
                        </span>
                        <kbd className="px-3 py-1 bg-editor-panel text-text-fg text-xs font-mono rounded border border-editor-border">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-4 bg-editor-bg border-t border-editor-border">
              <p className="text-sm text-text-muted text-center">
                💡 提示: 在 macOS 上使用 Cmd，在 Windows/Linux 上使用 Ctrl
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
