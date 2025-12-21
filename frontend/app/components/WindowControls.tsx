"use client";

import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform } from "@tauri-apps/plugin-os";

export function WindowControls() {
  const [platformType, setPlatformType] = useState<"windows" | "macos" | null>(
    null,
  );
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // 检测平台
    const checkPlatform = async () => {
      try {
        const currentPlatform = platform();
        const detectedPlatform =
          currentPlatform === "macos" ? "macos" : "windows";
        setPlatformType(detectedPlatform);

        // 将平台信息添加到 body 元素
        if (typeof document !== "undefined") {
          document.body.setAttribute("data-platform", detectedPlatform);
        }
      } catch (error) {
        console.error("Platform detection failed:", error);
        setPlatformType("windows");
        if (typeof document !== "undefined") {
          document.body.setAttribute("data-platform", "windows");
        }
      }
    };

    checkPlatform();

    // 监听窗口最大化状态变化
    const appWindow = getCurrentWindow();
    const unlistenResize = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    // 初始化最大化状态
    appWindow.isMaximized().then(setIsMaximized);

    return () => {
      unlistenResize.then((unlisten) => unlisten());
    };
  }, []);

  // 等待平台检测完成
  if (platformType === null) {
    return null;
  }

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  if (platformType === "macos") {
    return (
      <div className="flex items-center gap-2 pl-3 h-full py-1.5">
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-full bg-[#ff5f57] hover:bg-[#ff453a] transition-colors group relative flex items-center justify-center"
          aria-label="Close"
          title="关闭"
        >
          <svg
            className="w-2 h-2 opacity-0 group-hover:opacity-100"
            viewBox="0 0 8 8"
          >
            <path
              d="M1 1 L7 7 M7 1 L1 7"
              stroke="#4d0000"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-full bg-[#ffbd2e] hover:bg-[#ffa600] transition-colors group relative flex items-center justify-center"
          aria-label="Minimize"
          title="最小化"
        >
          <svg
            className="w-2 h-2 opacity-0 group-hover:opacity-100"
            viewBox="0 0 8 2"
          >
            <rect x="1" y="0" width="6" height="1.5" fill="#995700" rx="0.5" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#30d158] transition-colors group relative flex items-center justify-center"
          aria-label="Maximize"
          title={isMaximized ? "还原" : "最大化"}
        >
          <svg
            className="w-2 h-2 opacity-0 group-hover:opacity-100"
            viewBox="0 0 8 8"
          >
            {isMaximized ? (
              <g>
                <rect
                  x="1"
                  y="2.5"
                  width="4.5"
                  height="4.5"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                />
                <rect
                  x="2.5"
                  y="1"
                  width="4.5"
                  height="4.5"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                />
              </g>
            ) : (
              <path
                d="M1 3 L3 1 L7 5 M5 7 L7 5 M3 1 L3 3 L1 3"
                stroke="#006500"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </svg>
        </button>
      </div>
    );
  }

  // Windows 风格
  return (
    <div className="flex items-center h-full text-white">
      <button
        onClick={handleMinimize}
        className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center"
        aria-label="Minimize"
        title="最小化"
      >
        <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
          <rect width="10" height="1" />
        </svg>
      </button>
      <button
        onClick={handleMaximize}
        className="h-full px-4 hover:bg-white/10 transition-colors flex items-center justify-center"
        aria-label="Maximize"
        title={isMaximized ? "还原" : "最大化"}
      >
        {isMaximized ? (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
          >
            <rect x="0" y="2" width="7" height="7" strokeWidth="1" />
            <rect x="2" y="0" width="7" height="7" strokeWidth="1" />
          </svg>
        ) : (
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <rect x="0" y="0" width="9" height="9" />
          </svg>
        )}
      </button>
      <button
        onClick={handleClose}
        className="h-full px-4 hover:bg-red-600 transition-colors flex items-center justify-center"
        aria-label="Close"
        title="关闭"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M1 1 L9 9 M9 1 L1 9" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
