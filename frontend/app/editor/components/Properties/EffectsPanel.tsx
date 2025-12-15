/**
 * EffectsPanel Component
 * Controls for visual effects on selected clips
 */

import { useState, useCallback, useEffect } from "react";
import {
  ColorAdjustmentEffect,
  ChromaKeyEffect,
  BlurEffect,
  SharpenEffect,
  VignetteEffect,
  EffectManager,
  EffectType,
} from "../../../webgl/effects";

interface EffectsPanelProps {
  effectManager?: EffectManager | null;
  onEffectChange?: (manager: EffectManager) => void;
}

interface EffectControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const EffectControl = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
}: EffectControlProps) => {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-text-secondary">{label}</label>
        <span className="text-xs text-text-muted font-mono">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-1 bg-editor-border rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-blue
          [&::-webkit-slider-thumb]:hover:bg-accent-cyan [&::-webkit-slider-thumb]:transition-colors
          [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-accent-blue [&::-moz-range-thumb]:hover:bg-accent-cyan
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:transition-colors"
      />
    </div>
  );
};

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ColorPicker = ({
  label,
  value,
  onChange,
  disabled = false,
}: ColorPickerProps) => {
  return (
    <div className="mb-3">
      <label className="text-xs text-text-secondary mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-12 h-8 rounded border border-editor-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs font-mono bg-editor-panel border border-editor-border rounded focus:outline-none focus:border-accent-blue disabled:opacity-50"
        />
      </div>
    </div>
  );
};

export const EffectsPanel = ({
  effectManager,
  onEffectChange,
}: EffectsPanelProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(
    "colorAdjustment",
  );

  // Local state for effect parameters
  const [colorAdjustment, setColorAdjustment] = useState({
    enabled: false,
    brightness: 0,
    contrast: 1,
    saturation: 1,
    hue: 0,
  });

  const [chromaKey, setChromaKey] = useState({
    enabled: false,
    keyColor: "#00ff00",
    threshold: 0.4,
    smoothness: 0.1,
  });

  const [blur, setBlur] = useState({
    enabled: false,
    radius: 5,
    passes: 1,
  });

  const [sharpen, setSharpen] = useState({
    enabled: false,
    amount: 1.0,
  });

  const [vignette, setVignette] = useState({
    enabled: false,
    amount: 0.5,
    radius: 0.75,
    smoothness: 0.5,
  });

  // Load effect state from manager
  useEffect(() => {
    if (!effectManager) return;

    const effects = effectManager.getAllEffects();

    effects.forEach((effect) => {
      if (effect instanceof ColorAdjustmentEffect) {
        const config = effect.toJSON() as any;
        setColorAdjustment({
          enabled: effect.isEnabled(),
          brightness: config.brightness ?? 0,
          contrast: config.contrast ?? 1,
          saturation: config.saturation ?? 1,
          hue: config.hue ?? 0,
        });
      } else if (effect instanceof ChromaKeyEffect) {
        const config = effect.toJSON() as any;
        const keyColor = config.keyColor;
        const hexColor = `#${Math.round(keyColor.r * 255)
          .toString(16)
          .padStart(2, "0")}${Math.round(keyColor.g * 255)
          .toString(16)
          .padStart(2, "0")}${Math.round(keyColor.b * 255)
          .toString(16)
          .padStart(2, "0")}`;
        setChromaKey({
          enabled: effect.isEnabled(),
          keyColor: hexColor,
          threshold: config.threshold ?? 0.4,
          smoothness: config.smoothness ?? 0.1,
        });
      } else if (effect instanceof BlurEffect) {
        const config = effect.toJSON() as any;
        setBlur({
          enabled: effect.isEnabled(),
          radius: config.radius ?? 5,
          passes: config.passes ?? 1,
        });
      } else if (effect instanceof SharpenEffect) {
        const config = effect.toJSON() as any;
        setSharpen({
          enabled: effect.isEnabled(),
          amount: config.amount ?? 1.0,
        });
      } else if (effect instanceof VignetteEffect) {
        const config = effect.toJSON() as any;
        setVignette({
          enabled: effect.isEnabled(),
          amount: config.amount ?? 0.5,
          radius: config.radius ?? 0.75,
          smoothness: config.smoothness ?? 0.5,
        });
      }
    });
  }, [effectManager]);

  const notifyChange = useCallback(() => {
    if (effectManager && onEffectChange) {
      onEffectChange(effectManager);
    }
  }, [effectManager, onEffectChange]);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const applyPreset = useCallback(
    (presetName: "vibrant" | "cool" | "warm" | "vintage" | "blackwhite") => {
      if (!effectManager) return;

      const presetManager = EffectManager.createPreset(presetName);
      const presetEffects = presetManager.getAllEffects();

      // Clear existing effects and apply preset
      effectManager.clear();
      presetEffects.forEach((effect) => {
        effectManager.addEffect(effect);
      });

      notifyChange();

      // Update local state to reflect preset
      const effects = effectManager.getAllEffects();
      effects.forEach((effect) => {
        if (effect instanceof ColorAdjustmentEffect) {
          const config = effect.toJSON() as any;
          setColorAdjustment({
            enabled: effect.isEnabled(),
            brightness: config.brightness ?? 0,
            contrast: config.contrast ?? 1,
            saturation: config.saturation ?? 1,
            hue: config.hue ?? 0,
          });
        } else if (effect instanceof VignetteEffect) {
          const config = effect.toJSON() as any;
          setVignette({
            enabled: effect.isEnabled(),
            amount: config.amount ?? 0.5,
            radius: config.radius ?? 0.75,
            smoothness: config.smoothness ?? 0.5,
          });
        }
      });
    },
    [effectManager, notifyChange],
  );

  const updateColorAdjustment = useCallback(
    (updates: Partial<typeof colorAdjustment>) => {
      const newState = { ...colorAdjustment, ...updates };
      setColorAdjustment(newState);

      if (effectManager) {
        const effects = effectManager.getAllEffects();
        let effect = effects.find((e) => e instanceof ColorAdjustmentEffect) as
          | ColorAdjustmentEffect
          | undefined;

        if (!effect) {
          effect = new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            brightness: newState.brightness,
            contrast: newState.contrast,
            saturation: newState.saturation,
            hue: newState.hue,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        } else {
          // Remove and re-add with new config
          effectManager.removeEffect(
            effectManager.getAllEffects().indexOf(effect).toString(),
          );
          effect = new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            brightness: newState.brightness,
            contrast: newState.contrast,
            saturation: newState.saturation,
            hue: newState.hue,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        }

        notifyChange();
      }
    },
    [colorAdjustment, effectManager, notifyChange],
  );

  const updateChromaKey = useCallback(
    (updates: Partial<typeof chromaKey>) => {
      const newState = { ...chromaKey, ...updates };
      setChromaKey(newState);

      if (effectManager) {
        const effects = effectManager.getAllEffects();
        let effect = effects.find((e) => e instanceof ChromaKeyEffect) as
          | ChromaKeyEffect
          | undefined;

        // Parse hex color to RGB
        const hex = newState.keyColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;

        if (!effect) {
          effect = new ChromaKeyEffect({
            type: EffectType.CHROMA_KEY,
            keyColor: { r, g, b },
            threshold: newState.threshold,
            smoothness: newState.smoothness,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        } else {
          // Remove and re-add with new config
          effectManager.removeEffect(
            effectManager.getAllEffects().indexOf(effect).toString(),
          );
          effect = new ChromaKeyEffect({
            type: EffectType.CHROMA_KEY,
            keyColor: { r, g, b },
            threshold: newState.threshold,
            smoothness: newState.smoothness,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        }

        notifyChange();
      }
    },
    [chromaKey, effectManager, notifyChange],
  );

  const updateBlur = useCallback(
    (updates: Partial<typeof blur>) => {
      const newState = { ...blur, ...updates };
      setBlur(newState);

      if (effectManager) {
        const effects = effectManager.getAllEffects();
        let effect = effects.find((e) => e instanceof BlurEffect) as
          | BlurEffect
          | undefined;

        if (!effect) {
          effect = new BlurEffect({
            type: EffectType.BLUR,
            radius: newState.radius,
            passes: newState.passes,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        } else {
          // Remove and re-add with new config
          effectManager.removeEffect(
            effectManager.getAllEffects().indexOf(effect).toString(),
          );
          effect = new BlurEffect({
            type: EffectType.BLUR,
            radius: newState.radius,
            passes: newState.passes,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        }

        notifyChange();
      }
    },
    [blur, effectManager, notifyChange],
  );

  const updateSharpen = useCallback(
    (updates: Partial<typeof sharpen>) => {
      const newState = { ...sharpen, ...updates };
      setSharpen(newState);

      if (effectManager) {
        const effects = effectManager.getAllEffects();
        let effect = effects.find((e) => e instanceof SharpenEffect) as
          | SharpenEffect
          | undefined;

        if (!effect) {
          effect = new SharpenEffect({
            type: EffectType.SHARPEN,
            amount: newState.amount,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        } else {
          // Remove and re-add with new config
          effectManager.removeEffect(
            effectManager.getAllEffects().indexOf(effect).toString(),
          );
          effect = new SharpenEffect({
            type: EffectType.SHARPEN,
            amount: newState.amount,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        }

        notifyChange();
      }
    },
    [sharpen, effectManager, notifyChange],
  );

  const updateVignette = useCallback(
    (updates: Partial<typeof vignette>) => {
      const newState = { ...vignette, ...updates };
      setVignette(newState);

      if (effectManager) {
        const effects = effectManager.getAllEffects();
        let effect = effects.find((e) => e instanceof VignetteEffect) as
          | VignetteEffect
          | undefined;

        if (!effect) {
          effect = new VignetteEffect({
            type: EffectType.VIGNETTE,
            amount: newState.amount,
            radius: newState.radius,
            smoothness: newState.smoothness,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        } else {
          // Remove and re-add with new config
          effectManager.removeEffect(
            effectManager.getAllEffects().indexOf(effect).toString(),
          );
          effect = new VignetteEffect({
            type: EffectType.VIGNETTE,
            amount: newState.amount,
            radius: newState.radius,
            smoothness: newState.smoothness,
            enabled: newState.enabled,
          });
          effectManager.addEffect(effect);
        }

        notifyChange();
      }
    },
    [vignette, effectManager, notifyChange],
  );

  const clearAllEffects = useCallback(() => {
    if (effectManager) {
      effectManager.clear();
      setColorAdjustment({
        enabled: false,
        brightness: 0,
        contrast: 1,
        saturation: 1,
        hue: 0,
      });
      setChromaKey({
        enabled: false,
        keyColor: "#00ff00",
        threshold: 0.4,
        smoothness: 0.1,
      });
      setBlur({ enabled: false, radius: 5, passes: 1 });
      setSharpen({ enabled: false, amount: 1.0 });
      setVignette({
        enabled: false,
        amount: 0.5,
        radius: 0.75,
        smoothness: 0.5,
      });
      notifyChange();
    }
  }, [effectManager, notifyChange]);

  const hasEffectManager = !!effectManager;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-text-primary mb-2">
          Visual Effects
        </h3>
        {!hasEffectManager && (
          <p className="text-xs text-text-muted mb-4">
            Select a clip to apply effects
          </p>
        )}
      </div>

      {/* Presets */}
      <div className="mb-6">
        <h4 className="text-xs font-medium text-text-secondary mb-2">
          Presets
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => applyPreset("vibrant")}
            disabled={!hasEffectManager}
            className="px-3 py-2 text-xs bg-editor-panel border border-editor-border rounded hover:bg-editor-hover hover:border-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vibrant
          </button>
          <button
            onClick={() => applyPreset("cool")}
            disabled={!hasEffectManager}
            className="px-3 py-2 text-xs bg-editor-panel border border-editor-border rounded hover:bg-editor-hover hover:border-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cool
          </button>
          <button
            onClick={() => applyPreset("warm")}
            disabled={!hasEffectManager}
            className="px-3 py-2 text-xs bg-editor-panel border border-editor-border rounded hover:bg-editor-hover hover:border-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Warm
          </button>
          <button
            onClick={() => applyPreset("vintage")}
            disabled={!hasEffectManager}
            className="px-3 py-2 text-xs bg-editor-panel border border-editor-border rounded hover:bg-editor-hover hover:border-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Vintage
          </button>
          <button
            onClick={() => applyPreset("blackwhite")}
            disabled={!hasEffectManager}
            className="px-3 py-2 text-xs bg-editor-panel border border-editor-border rounded hover:bg-editor-hover hover:border-accent-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            B&W
          </button>
          <button
            onClick={clearAllEffects}
            disabled={!hasEffectManager}
            className="px-3 py-2 text-xs bg-editor-panel border border-editor-border rounded hover:bg-editor-hover hover:border-accent-red transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Color Adjustment */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("colorAdjustment")}
          className="w-full flex items-center justify-between p-2 bg-editor-panel border border-editor-border rounded hover:bg-editor-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={colorAdjustment.enabled}
              onChange={(e) =>
                updateColorAdjustment({ enabled: e.target.checked })
              }
              disabled={!hasEffectManager}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-editor-border disabled:opacity-50"
            />
            <span className="text-xs font-medium">Color Adjustment</span>
          </div>
          <span className="text-text-muted">
            {activeSection === "colorAdjustment" ? "−" : "+"}
          </span>
        </button>
        {activeSection === "colorAdjustment" && (
          <div className="p-3 bg-editor-bg border border-editor-border border-t-0 rounded-b">
            <EffectControl
              label="Brightness"
              value={colorAdjustment.brightness}
              min={-1}
              max={1}
              step={0.01}
              onChange={(value) => updateColorAdjustment({ brightness: value })}
              disabled={!hasEffectManager || !colorAdjustment.enabled}
            />
            <EffectControl
              label="Contrast"
              value={colorAdjustment.contrast}
              min={0}
              max={2}
              step={0.01}
              onChange={(value) => updateColorAdjustment({ contrast: value })}
              disabled={!hasEffectManager || !colorAdjustment.enabled}
            />
            <EffectControl
              label="Saturation"
              value={colorAdjustment.saturation}
              min={0}
              max={2}
              step={0.01}
              onChange={(value) => updateColorAdjustment({ saturation: value })}
              disabled={!hasEffectManager || !colorAdjustment.enabled}
            />
            <EffectControl
              label="Hue"
              value={colorAdjustment.hue}
              min={-180}
              max={180}
              step={1}
              onChange={(value) => updateColorAdjustment({ hue: value })}
              disabled={!hasEffectManager || !colorAdjustment.enabled}
            />
          </div>
        )}
      </div>

      {/* Chroma Key */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("chromaKey")}
          className="w-full flex items-center justify-between p-2 bg-editor-panel border border-editor-border rounded hover:bg-editor-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={chromaKey.enabled}
              onChange={(e) => updateChromaKey({ enabled: e.target.checked })}
              disabled={!hasEffectManager}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-editor-border disabled:opacity-50"
            />
            <span className="text-xs font-medium">Chroma Key</span>
          </div>
          <span className="text-text-muted">
            {activeSection === "chromaKey" ? "−" : "+"}
          </span>
        </button>
        {activeSection === "chromaKey" && (
          <div className="p-3 bg-editor-bg border border-editor-border border-t-0 rounded-b">
            <ColorPicker
              label="Key Color"
              value={chromaKey.keyColor}
              onChange={(value) => updateChromaKey({ keyColor: value })}
              disabled={!hasEffectManager || !chromaKey.enabled}
            />
            <EffectControl
              label="Threshold"
              value={chromaKey.threshold}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateChromaKey({ threshold: value })}
              disabled={!hasEffectManager || !chromaKey.enabled}
            />
            <EffectControl
              label="Smoothness"
              value={chromaKey.smoothness}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateChromaKey({ smoothness: value })}
              disabled={!hasEffectManager || !chromaKey.enabled}
            />
          </div>
        )}
      </div>

      {/* Blur */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("blur")}
          className="w-full flex items-center justify-between p-2 bg-editor-panel border border-editor-border rounded hover:bg-editor-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={blur.enabled}
              onChange={(e) => updateBlur({ enabled: e.target.checked })}
              disabled={!hasEffectManager}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-editor-border disabled:opacity-50"
            />
            <span className="text-xs font-medium">Blur</span>
          </div>
          <span className="text-text-muted">
            {activeSection === "blur" ? "−" : "+"}
          </span>
        </button>
        {activeSection === "blur" && (
          <div className="p-3 bg-editor-bg border border-editor-border border-t-0 rounded-b">
            <EffectControl
              label="Radius"
              value={blur.radius}
              min={0}
              max={20}
              step={0.5}
              onChange={(value) => updateBlur({ radius: value })}
              disabled={!hasEffectManager || !blur.enabled}
            />
            <EffectControl
              label="Passes"
              value={blur.passes}
              min={1}
              max={4}
              step={1}
              onChange={(value) => updateBlur({ passes: Math.round(value) })}
              disabled={!hasEffectManager || !blur.enabled}
            />
          </div>
        )}
      </div>

      {/* Sharpen */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("sharpen")}
          className="w-full flex items-center justify-between p-2 bg-editor-panel border border-editor-border rounded hover:bg-editor-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={sharpen.enabled}
              onChange={(e) => updateSharpen({ enabled: e.target.checked })}
              disabled={!hasEffectManager}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-editor-border disabled:opacity-50"
            />
            <span className="text-xs font-medium">Sharpen</span>
          </div>
          <span className="text-text-muted">
            {activeSection === "sharpen" ? "−" : "+"}
          </span>
        </button>
        {activeSection === "sharpen" && (
          <div className="p-3 bg-editor-bg border border-editor-border border-t-0 rounded-b">
            <EffectControl
              label="Amount"
              value={sharpen.amount}
              min={0}
              max={3}
              step={0.1}
              onChange={(value) => updateSharpen({ amount: value })}
              disabled={!hasEffectManager || !sharpen.enabled}
            />
          </div>
        )}
      </div>

      {/* Vignette */}
      <div className="mb-4">
        <button
          onClick={() => toggleSection("vignette")}
          className="w-full flex items-center justify-between p-2 bg-editor-panel border border-editor-border rounded hover:bg-editor-hover transition-colors"
        >
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={vignette.enabled}
              onChange={(e) => updateVignette({ enabled: e.target.checked })}
              disabled={!hasEffectManager}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-editor-border disabled:opacity-50"
            />
            <span className="text-xs font-medium">Vignette</span>
          </div>
          <span className="text-text-muted">
            {activeSection === "vignette" ? "−" : "+"}
          </span>
        </button>
        {activeSection === "vignette" && (
          <div className="p-3 bg-editor-bg border border-editor-border border-t-0 rounded-b">
            <EffectControl
              label="Amount"
              value={vignette.amount}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateVignette({ amount: value })}
              disabled={!hasEffectManager || !vignette.enabled}
            />
            <EffectControl
              label="Radius"
              value={vignette.radius}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateVignette({ radius: value })}
              disabled={!hasEffectManager || !vignette.enabled}
            />
            <EffectControl
              label="Smoothness"
              value={vignette.smoothness}
              min={0}
              max={1}
              step={0.01}
              onChange={(value) => updateVignette({ smoothness: value })}
              disabled={!hasEffectManager || !vignette.enabled}
            />
          </div>
        )}
      </div>
    </div>
  );
};
