/**
 * PropertiesPanel Component
 * Right sidebar for editing selected clip properties
 */

import { getPropertyTabsForClipType } from "../../constants/data";
import { Clip } from "../../types/timeline";
import {
  VideoMaterialProto,
  AudioMaterialProto,
  ImageMaterialProto,
} from "../../types/protocol";
import { EmptyModule } from "./Module/Empty";
import { ResourceModule } from "./Module/Resource";
import { ClipModule } from "./Module/Clip";

interface PropertiesPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedResource?: {
    id: string;
    type: string;
    data: VideoMaterialProto | AudioMaterialProto | ImageMaterialProto;
  } | null;
  selectedClip?: Clip | null;
  onClipTransformChange?: (
    clipId: string,
    transform: {
      position?: { x: number; y: number };
      scale?: number;
      rotation?: number;
      opacity?: number;
    },
  ) => void;
}

export function PropertiesPanel({
  activeTab,
  onTabChange,
  selectedResource,
  selectedClip,
  onClipTransformChange,
}: PropertiesPanelProps) {
  const mode = selectedClip ? "clip" : selectedResource ? "resource" : "none";
  const propertyTabs = selectedClip
    ? getPropertyTabsForClipType(selectedClip.type)
    : [];

  return (
    <aside className="w-properties-panel border-l border-editor-border flex flex-col bg-editor-bg">
      {/* Tab Headers - Only show in clip mode */}
      {mode === "clip" && (
        <div className="flex border-b border-editor-border">
          {propertyTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`flex-1 py-2 text-sm transition-colors ${
                activeTab === tab.key
                  ? "text-accent-blue bg-editor-panel border-b-2 border-accent-blue"
                  : "text-text-secondary hover:text-text-fg"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      )}

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Mode: None - No selection */}
        {mode === "none" && <EmptyModule />}

        {/* Mode: Resource - Media Info Section */}
        {mode === "resource" && selectedResource && (
          <ResourceModule selectedResource={selectedResource} />
        )}

        {/* Mode: Clip - Clip Transform Editor */}
        {mode === "clip" && selectedClip && (
          <ClipModule
            selectedClip={selectedClip}
            activeTab={activeTab}
            onClipTransformChange={onClipTransformChange}
          />
        )}
      </div>
    </aside>
  );
}
