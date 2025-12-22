"use client";

import { useEffect, useState, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface WindowControlsProps {
  platform?: "windows" | "macos" | null;
}

export function WindowControls({ platform = "windows" }: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const appWindow = getCurrentWindow();
    let resizeUnlisten: (() => void) | null = null;
    let isUnmounted = false;
    let debounceTimer: NodeJS.Timeout | null = null;

    // 防抖的窗口状态检查函数
    const checkWindowState = () => {
      // 如果正在检查中，跳过
      if (isCheckingRef.current) {
        return;
      }

      // 清除之前的定时器
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      // 设置新的防抖定时器
      debounceTimer = setTimeout(async () => {
        if (!isUnmounted && !isCheckingRef.current) {
          isCheckingRef.current = true;
          try {
            // 检查最大化状态（用于 Windows）
            const maximized = await appWindow.isMaximized();
            if (!isUnmounted) {
              setIsMaximized(maximized);
            }

            // 检查全屏状态（用于 macOS）
            if (platform === "macos") {
              const fullscreen = await appWindow.isFullscreen();
              if (!isUnmounted) {
                setIsFullscreen(fullscreen);
              }
            }
          } catch (error) {
            console.error("Failed to check window state:", error);
          } finally {
            isCheckingRef.current = false;
          }
        }
      }, 100); // 100ms 防抖延迟
    };

    // 初始化窗口状态（只在组件挂载时调用一次）
    checkWindowState();

    // 监听窗口大小变化事件
    appWindow
      .onResized(() => {
        if (!isUnmounted) {
          checkWindowState();
        }
      })
      .then((fn) => {
        resizeUnlisten = fn;
      });

    return () => {
      isUnmounted = true;
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      if (resizeUnlisten) {
        resizeUnlisten();
      }
    };
  }, [platform]);

  const handleMinimize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.minimize();
  };

  const handleMaximize = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.toggleMaximize();
    // toggleMaximize 后乐观更新状态
    setIsMaximized((prev) => !prev);
  };

  const handleFullscreen = async () => {
    const appWindow = getCurrentWindow();
    // 切换全屏状态
    await appWindow.setFullscreen(!isFullscreen);
    // 乐观更新状态
    setIsFullscreen((prev) => !prev);
  };

  const handleClose = async () => {
    const appWindow = getCurrentWindow();
    await appWindow.close();
  };

  // Don't render platform-specific controls until platform is detected to avoid hydration mismatch
  if (!platform) {
    return null;
  }

  if (platform === "macos") {
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
          onClick={handleFullscreen}
          className="w-3 h-3 rounded-full bg-[#28c840] hover:bg-[#30d158] transition-colors group relative flex items-center justify-center"
          aria-label="Fullscreen"
          title={isFullscreen ? "退出全屏" : "全屏"}
        >
          <svg
            className="w-2 h-2 opacity-0 group-hover:opacity-100"
            viewBox="0 0 8 8"
          >
            {isFullscreen ? (
              // 退出全屏图标：两个向内的箭头
              <g>
                <path
                  d="M1 1 L1 3 L3 3"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 1 L7 3 L5 3"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 7 L1 5 L3 5"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 7 L7 5 L5 5"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : (
              // 进入全屏图标：两个向外的箭头
              <g>
                <path
                  d="M1 3 L1 1 L3 1"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 3 L7 1 L5 1"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M1 5 L1 7 L3 7"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 5 L7 7 L5 7"
                  stroke="#006500"
                  strokeWidth="1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
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
