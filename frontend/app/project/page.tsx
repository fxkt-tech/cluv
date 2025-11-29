"use client";

import { useState } from "react";
import { useProjectForm } from "./hooks/useProjectForm";
import { useRouter } from "next/navigation";

export default function ProjectPage() {
  const router = useRouter();
  const { formData, status, error, updateField, handleSubmit, reset } =
    useProjectForm();
  const [createdProjectPath, setCreatedProjectPath] = useState<string | null>(
    null
  );

  const onSubmit = async (e: React.FormEvent) => {
    const path = await handleSubmit(e);
    if (path) {
      setCreatedProjectPath(path);
      setTimeout(() => {
        router.push(`/projects`);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-2xl border border-slate-700 p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">KivaCut</h1>
            <p className="text-slate-400">Create a New Project</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Project Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => updateField("projectName", e.target.value)}
                placeholder="e.g., My Video Project"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                disabled={status === "creating"}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {status === "success" && createdProjectPath && (
              <div className="p-3 bg-green-900/20 border border-green-800 rounded-lg">
                <p className="text-sm text-green-400">
                  ✓ Project created successfully!
                </p>
                <p className="text-xs text-green-500 mt-1">
                  {createdProjectPath}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={reset}
                disabled={status === "creating"}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={status === "creating"}
                className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
              >
                {status === "creating" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 text-center">
              KivaCut will create the project structure with resources and
              protocol files
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
