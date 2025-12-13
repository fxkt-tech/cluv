"use client";

import React, { useState } from "react";
import { CutProtocol } from "../../types/protocol";

interface ProtocolViewerProps {
  protocol: CutProtocol | null;
}

export const ProtocolViewer: React.FC<ProtocolViewerProps> = ({ protocol }) => {
  const [isOpen, setIsOpen] = useState(false);

  const prettyJson = protocol
    ? JSON.stringify(protocol, null, 2)
    : "Protocol not loaded";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prettyJson);
      alert("已复制到剪贴板");
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="font-medium px-3 py-0.5 rounded text-xs bg-editor-panel text-text-fg hover:bg-editor-hover transition-colors border border-editor-border"
        title="查看 Protocol JSON"
      >
        合成协议
      </button>

      {/* 模态窗口 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-editor-panel rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-editor-border">
              <h2 className="text-xl font-bold text-editor-dark">
                Protocol JSON
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1 text-sm bg-accent-blue text-white rounded hover:bg-accent-cyan transition-colors"
                >
                  复制
                </button>
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
            </div>

            {/* JSON 内容 */}
            <div className="overflow-y-auto p-6 flex-1">
              <pre className="bg-editor-bg text-text-fg text-sm font-mono p-4 rounded border border-editor-border overflow-x-auto">
                {prettyJson}
              </pre>
            </div>

            {/* 底部提示 */}
            <div className="px-6 py-4 bg-editor-bg border-t border-editor-border">
              <p className="text-sm text-text-muted text-center">
                💡 提示: 点击复制按钮可以将 JSON 复制到剪贴板
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
