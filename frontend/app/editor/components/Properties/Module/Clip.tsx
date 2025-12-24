/**
 * Clip Module
 * Component for editing clip properties with tab-based content
 */

import { Clip } from "../../../types/timeline";
import { PropertySlider } from "../PropertySlider";
import { PROPERTY_TABS } from "../../../constants/data";
import { useTimelineStore } from "../../../stores/timelineStore";

interface ClipModuleProps {
  selectedClip: Clip;
  activeTab: string;
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

export function ClipModule({
  selectedClip,
  activeTab,
  onClipTransformChange,
}: ClipModuleProps) {
  const stage = useTimelineStore((state) => state.stage);

  // Render Frame Tab (画面)
  if (activeTab === PROPERTY_TABS.FRAME.key) {
    return (
      <>
        {/* Scale Slider */}
        <PropertySlider
          label="缩放"
          value={Math.round(selectedClip.scale * 100)}
          min={1}
          max={500}
          unit="%"
          step={1}
          onChange={(value) =>
            onClipTransformChange?.(selectedClip.id, {
              scale: value / 100,
            })
          }
        />

        {/* Position X Slider */}
        <PropertySlider
          label="位置 X"
          value={selectedClip.position.x}
          min={-stage.width}
          max={stage.width}
          unit="px"
          step={1}
          onChange={(value) =>
            onClipTransformChange?.(selectedClip.id, {
              position: {
                x: value,
                y: selectedClip.position.y,
              },
            })
          }
        />

        {/* Position Y Slider */}
        <PropertySlider
          label="位置 Y"
          value={selectedClip.position.y}
          min={-stage.height}
          max={stage.height}
          unit="px"
          step={1}
          onChange={(value) =>
            onClipTransformChange?.(selectedClip.id, {
              position: {
                x: selectedClip.position.x,
                y: value,
              },
            })
          }
        />

        {/* Rotation Slider */}
        <PropertySlider
          disabled
          label="旋转"
          value={selectedClip.rotation}
          step={1}
          min={0}
          max={360}
          unit="°"
          onChange={(value) =>
            onClipTransformChange?.(selectedClip.id, {
              rotation: value,
            })
          }
        />

        {/* Opacity Slider */}
        <PropertySlider
          disabled
          label="不透明度"
          value={selectedClip.opacity * 100}
          step={1}
          min={0}
          max={100}
          unit="%"
          onChange={(value) =>
            onClipTransformChange?.(selectedClip.id, {
              opacity: value / 100,
            })
          }
        />
      </>
    );
  }

  // Render Audio Tab (音频)
  if (activeTab === PROPERTY_TABS.AUDIO.key) {
    return (
      <div className="text-center py-8 text-text-muted">
        Audio properties coming soon...
      </div>
    );
  }

  // Render Speed Tab (变速)
  if (activeTab === PROPERTY_TABS.SPEED.key) {
    return (
      <div className="text-center py-8 text-text-muted">
        Speed properties coming soon...
      </div>
    );
  }

  // Render Effect Tab (效果)
  if (activeTab === PROPERTY_TABS.EFFECT.key) {
    return (
      <div className="text-center py-8 text-text-muted">
        Effects properties coming soon...
      </div>
    );
  }

  // Render Text Tab (文本)
  if (activeTab === PROPERTY_TABS.TEXT.key) {
    return (
      <div className="text-center py-8 text-text-muted">
        Text properties coming soon...
      </div>
    );
  }

  // Default fallback
  return null;
}
