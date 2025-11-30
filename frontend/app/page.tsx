"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/projects");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-8 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600 mb-2">
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
  );
}
