/**
 * PropertiesPanel Component
 * Right sidebar for editing selected clip properties
 */

import { PROPERTY_TABS } from "../constants/data";
import { COLORS, SIZES } from "../constants/theme";
import { PropertySlider } from "./PropertySlider";
import { Properties } from "../types/editor";

interface PropertiesPanelProps {
  activeTab: "video" | "audio" | "speed";
  onTabChange: (tab: "video" | "audio" | "speed") => void;
  properties: Properties;
  onPropertyChange: (prop: keyof Properties, value: number) => void;
}

export function PropertiesPanel({
  activeTab,
  onTabChange,
  properties,
  onPropertyChange,
}: PropertiesPanelProps) {
  return (
    <aside
      className={`${SIZES.propertiesPanel} border-l flex flex-col`}
      style={{
        borderLeftColor: COLORS.editor.border,
        backgroundColor: COLORS.editor.bg,
      }}
    >
      {/* Tab Headers */}
      <div
        className="flex border-b"
        style={{ borderBottomColor: COLORS.editor.border }}
      >
        {(PROPERTY_TABS as readonly string[]).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab as "video" | "audio" | "speed")}
            className="flex-1 py-2 text-sm transition-colors"
            style={{
              color: activeTab === tab ? COLORS.accent.blue : COLORS.text.secondary,
              backgroundColor: activeTab === tab ? COLORS.editor.panel : "transparent",
              borderBottom: activeTab === tab ? `2px solid ${COLORS.accent.blue}` : "none",
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = COLORS.text.fg;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = COLORS.text.secondary;
              }
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Properties Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
              <div className="flex justify-between text-xs" style={{ color: COLORS.text.secondary }}>
                <span>Position</span>
              </div>
              <div className="flex gap-2">
                <div
                  className="rounded px-2 py-1 text-xs flex justify-between flex-1"
                  style={{ backgroundColor: COLORS.editor.panel }}
                >
                  <span style={{ color: COLORS.text.muted }}>X</span>
                  <input
                    type="number"
                    value={properties.posX.toFixed(1)}
                    onChange={(e) =>
                      onPropertyChange("posX", Number(e.target.value))
                    }
                    className="w-12 bg-transparent text-right"
                    style={{ color: COLORS.text.fg }}
                  />
                </div>
                <div
                  className="rounded px-2 py-1 text-xs flex justify-between flex-1"
                  style={{ backgroundColor: COLORS.editor.panel }}
                >
                  <span style={{ color: COLORS.text.muted }}>Y</span>
                  <input
                    type="number"
                    value={properties.posY.toFixed(1)}
                    onChange={(e) =>
                      onPropertyChange("posY", Number(e.target.value))
                    }
                    className="w-12 bg-transparent text-right"
                    style={{ color: COLORS.text.fg }}
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
          <div className="text-center py-8" style={{ color: COLORS.text.muted }}>
            Audio properties coming soon...
          </div>
        )}

        {activeTab === "speed" && (
          <div className="text-center py-8" style={{ color: COLORS.text.muted }}>
            Speed properties coming soon...
          </div>
        )}
      </div>
    </aside>
  );
}
