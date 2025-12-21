"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { WindowControls } from "@/app/components/WindowControls";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-900 to-slate-800">
      {/* Custom Header with Window Controls */}
      <header className="h-8 flex items-center justify-between bg-slate-900/50 border-b border-slate-700 shrink-0">
        {/* macOS 窗口控制按钮 - 左侧 */}
        <div className="flex items-center h-full">
          <div className="mac-only">
            <WindowControls />
          </div>
          <div
            data-tauri-drag-region
            className="flex items-center gap-2 font-bold text-lg px-4 select-none"
          >
            <span className="text-cyan-400">KivaCut</span>
          </div>
        </div>

        {/* 中间拖拽区域 */}
        <div
          data-tauri-drag-region
          className="flex-1 flex items-center justify-center select-none"
        ></div>

        {/* 右侧 - Windows 窗口控制 */}
        <div className="flex items-center h-full">
          <div className="windows-only">
            <WindowControls />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-8 text-center">
            {/* Logo */}
            <div className="mb-8">
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-cyan-600 mb-2">
                KivaCut
              </div>
              <p className="text-slate-400">Professional Video Editor</p>
            </div>

            {/* Description */}
            <div className="mb-8 text-left">
              <p className="text-slate-300 text-sm leading-relaxed">
                Create and edit videos with ease. Organize your assets, compose
                tracks, and produce professional-quality video content.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/project"
                className="block w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors text-center"
              >
                Create New Project
              </Link>
              <Link
                href="/projects"
                className="block w-full px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors text-center"
              >
                Open Existing Project
              </Link>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-xs text-slate-500">
                Version 0.1.0 • © 2025 KivaCut
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
