/**
 * PropertiesPanel Component
 * Right sidebar for editing selected clip properties
 */

import { PROPERTY_TABS } from "../../constants/data";
import { PropertySlider } from "./PropertySlider";
import { Properties } from "../../types/editor";
import {
  VideoMaterialProto,
  AudioMaterialProto,
  ImageMaterialProto,
} from "../../types/protocol";

interface PropertiesPanelProps {
  activeTab: "video" | "audio" | "speed";
  onTabChange: (tab: "video" | "audio" | "speed") => void;
  properties: Properties;
  onPropertyChange: (prop: keyof Properties, value: number) => void;
  selectedResource?: {
    id: string;
    type: string;
    data: VideoMaterialProto | AudioMaterialProto | ImageMaterialProto;
  } | null;
}

export function PropertiesPanel({
  activeTab,
  onTabChange,
  properties,
  onPropertyChange,
  selectedResource,
}: PropertiesPanelProps) {
  return (
    <aside className="w-properties-panel border-l border-editor-border flex flex-col bg-editor-bg">
      {/* Tab Headers */}
      <div className="flex border-b border-editor-border">
        {(PROPERTY_TABS as readonly string[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab as "video" | "audio" | "speed")}
            className={`flex-1 py-2 text-sm transition-colors ${
              activeTab === tab
                ? "text-accent-blue bg-editor-panel border-b-2 border-accent-blue"
                : "text-text-secondary hover:text-text-fg"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Media Info Section - Show when resource is selected */}
        {selectedResource && (
          <div className="pb-4 border-b border-editor-border">
            <div className="text-sm font-medium text-text-fg mb-3">
              Media Info
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Name:</span>
                <span className="text-text-fg">
                  {selectedResource.data.name}
                </span>
              </div>

              {selectedResource.type === "video" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Dimensions:</span>
                    <span className="text-text-fg">
                      {
                        (selectedResource.data as VideoMaterialProto).dimension
                          .width
                      }{" "}
                      x{" "}
                      {
                        (selectedResource.data as VideoMaterialProto).dimension
                          .height
                      }
                    </span>
                  </div>
                  {(selectedResource.data as VideoMaterialProto).duration && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Duration:</span>
                      <span className="text-text-fg">
                        {(
                          (selectedResource.data as VideoMaterialProto)
                            .duration! / 1000
                        ).toFixed(2)}
                        s
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as VideoMaterialProto).fps && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">FPS:</span>
                      <span className="text-text-fg">
                        {(
                          selectedResource.data as VideoMaterialProto
                        ).fps!.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as VideoMaterialProto).codec && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Codec:</span>
                      <span className="text-text-fg">
                        {(selectedResource.data as VideoMaterialProto).codec}
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as VideoMaterialProto).bitrate && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Bitrate:</span>
                      <span className="text-text-fg">
                        {(selectedResource.data as VideoMaterialProto).bitrate}{" "}
                        kbps
                      </span>
                    </div>
                  )}
                </>
              )}

              {selectedResource.type === "audio" && (
                <>
                  {(selectedResource.data as AudioMaterialProto).duration && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Duration:</span>
                      <span className="text-text-fg">
                        {(
                          (selectedResource.data as AudioMaterialProto)
                            .duration! / 1000
                        ).toFixed(2)}
                        s
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as AudioMaterialProto)
                    .sample_rate && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Sample Rate:</span>
                      <span className="text-text-fg">
                        {
                          (selectedResource.data as AudioMaterialProto)
                            .sample_rate
                        }{" "}
                        Hz
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as AudioMaterialProto).channels && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Channels:</span>
                      <span className="text-text-fg">
                        {(selectedResource.data as AudioMaterialProto).channels}
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as AudioMaterialProto).codec && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Codec:</span>
                      <span className="text-text-fg">
                        {(selectedResource.data as AudioMaterialProto).codec}
                      </span>
                    </div>
                  )}
                  {(selectedResource.data as AudioMaterialProto).bitrate && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Bitrate:</span>
                      <span className="text-text-fg">
                        {(selectedResource.data as AudioMaterialProto).bitrate}{" "}
                        kbps
                      </span>
                    </div>
                  )}
                </>
              )}

              {selectedResource.type === "image" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Dimensions:</span>
                    <span className="text-text-fg">
                      {
                        (selectedResource.data as ImageMaterialProto).dimension
                          .width
                      }{" "}
                      x{" "}
                      {
                        (selectedResource.data as ImageMaterialProto).dimension
                          .height
                      }
                    </span>
                  </div>
                  {(selectedResource.data as ImageMaterialProto).format && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Format:</span>
                      <span className="text-text-fg">
                        {(selectedResource.data as ImageMaterialProto).format}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "video" && (
          <>
            <PropertySlider
              label="Scale"
              value={properties.scale}
              min={10}
              max={200}
              unit="%"
              onChange={(value) => onPropertyChange("scale", value)}
            />

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Position</span>
              </div>
              <div className="flex gap-2">
                <div className="rounded px-2 py-1 text-xs flex justify-between flex-1 bg-editor-panel">
                  <span className="text-text-muted">X</span>
                  <input
                    type="number"
                    value={properties.posX.toFixed(1)}
                    onChange={(e) =>
                      onPropertyChange("posX", Number(e.target.value))
                    }
                    className="w-12 bg-transparent text-right text-text-fg"
                  />
                </div>
                <div className="rounded px-2 py-1 text-xs flex justify-between flex-1 bg-editor-panel">
                  <span className="text-text-muted">Y</span>
                  <input
                    type="number"
                    value={properties.posY.toFixed(1)}
                    onChange={(e) =>
                      onPropertyChange("posY", Number(e.target.value))
                    }
                    className="w-12 bg-transparent text-right text-text-fg"
                  />
                </div>
              </div>
            </div>

            <PropertySlider
              label="Rotation"
              value={properties.rotation}
              min={0}
              max={360}
              unit="°"
              onChange={(value) => onPropertyChange("rotation", value)}
            />

            <PropertySlider
              label="Opacity"
              value={properties.opacity}
              min={0}
              max={100}
              unit="%"
              onChange={(value) => onPropertyChange("opacity", value)}
            />
          </>
        )}

        {activeTab === "audio" && (
          <div className="text-center py-8 text-text-muted">
            Audio properties coming soon...
          </div>
        )}

        {activeTab === "speed" && (
          <div className="text-center py-8 text-text-muted">
            Speed properties coming soon...
          </div>
        )}
      </div>
    </aside>
  );
}
