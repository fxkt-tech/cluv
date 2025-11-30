/**
 * ResourcePanel Component
 * Left sidebar for managing resources and media
 */

import { RESOURCE_TABS, RESOURCE_TAB_LABELS } from "../constants/data";
import { COLORS, SIZES } from "../constants/theme";
import { ResourceGrid } from "./ResourceGrid";
import { Resource as EditorResource, ResourceTab } from "../types/editor";
import { useState, useRef } from "react";
import { useTauriCommands } from "@/app/hooks/useTauriCommands";

interface BackendResource {
  id: string;
  name: string;
  path: string;
  resource_type: string;
}

interface ResourcePanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  resources?: BackendResource[];
  isLoading?: boolean;
  onResourceSelect?: (resource: EditorResource) => void;
  projectPath?: string | null;
  loadResources?: () => Promise<void>;
}

export function ResourcePanel({
  activeTab,
  onTabChange,
  resources = [],
  isLoading = false,
  onResourceSelect,
  projectPath = null,
  loadResources,
}: ResourcePanelProps) {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importResourceFile } = useTauriCommands();
  // Filter resources by active tab type
  const filteredResources = resources.filter(
    (r) => r.resource_type === activeTab || activeTab === "media"
  );

  // Convert BackendResource to EditorResource for callbacks
  const handleResourceSelect = (backendResource: BackendResource) => {
    if (onResourceSelect) {
      // Map backend resource type to editor ResourceTab type
      let resourceType: EditorResource["type"] = "media";
      if (backendResource.resource_type === "video") {
        resourceType = "media";
      } else if (backendResource.resource_type === "audio") {
        resourceType = "audio";
      }

      const editorResource: EditorResource = {
        id: backendResource.id,
        name: backendResource.name,
        type: resourceType,
      };
      onResourceSelect(editorResource);
    }
  };

  return (
    <aside
      className={`${SIZES.sidebar} flex flex-col border-r`}
      style={{
        borderRightColor: COLORS.editor.border,
        backgroundColor: COLORS.editor.bg,
      }}
    >
      {/* Resource Tabs */}
      <div className="flex items-center justify-between px-2 pt-2 pb-2 overflow-x-auto">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {RESOURCE_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                activeTab === tab
                  ? "text-cyan-400"
                  : "text-gray-300 hover:text-white"
              }`}
              style={{
                backgroundColor:
                  activeTab === tab ? COLORS.editor.hover : "transparent",
              }}
            >
              {RESOURCE_TAB_LABELS[tab as ResourceTab]}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={async (e) => {
              const file = e.currentTarget.files?.[0];
              if (!file || !projectPath) return;
              setIsImporting(true);
              try {
                const buffer = await file.arrayBuffer();
                const uint8Array = new Uint8Array(buffer);
                const base64 = Array.from(uint8Array)
                  .map((b) => String.fromCharCode(b))
                  .join("");
                const base64Data = btoa(base64);
                const fileName = file.name;

                await importResourceFile(projectPath, fileName, base64Data);

                if (loadResources) await loadResources();
              } catch (err) {
                console.error("Import failed", err);
              } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
            }}
          />
          <button
            onClick={() => {
              if (projectPath && !isImporting) {
                fileInputRef.current?.click();
              }
            }}
            disabled={!projectPath || isImporting}
            className="w-full py-2 rounded text-sm mb-4 transition-colors flex items-center justify-center gap-2 hover:opacity-80"
            style={{
              backgroundColor: COLORS.editor.hover,
              opacity: !projectPath ? 0.6 : 1,
            }}
            aria-label="Import resources"
            title={
              !projectPath
                ? "Open a project to import resources"
                : "Import resources"
            }
          >
            <span>+</span>
            {isImporting ? "导入中..." : "导入"}
          </button>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && filteredResources.length === 0 && (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No resources found
            </div>
          )}

          {!isLoading && filteredResources.length > 0 && (
            <ResourceGrid
              resources={filteredResources}
              onSelect={handleResourceSelect}
            />
          )}
        </div>
      </div>
    </aside>
  );
}
