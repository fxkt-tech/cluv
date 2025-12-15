/**
 * EffectManager.test.ts
 * Unit tests for EffectManager
 */

import { describe, it, expect, beforeEach } from "vitest";
import { EffectManager } from "../EffectManager";
import {
  EffectType,
  ColorAdjustmentEffect,
  ChromaKeyEffect,
  BlurEffect,
  VignetteEffect,
  CustomEffect,
  ColorAdjustmentConfig,
  ChromaKeyConfig,
} from "../Effect";

describe("EffectManager", () => {
  let manager: EffectManager;

  beforeEach(() => {
    manager = new EffectManager();
  });

  describe("Effect Management", () => {
    it("should start with no effects", () => {
      expect(manager.getAllEffects()).toHaveLength(0);
      expect(manager.hasEnabledEffects()).toBe(false);
    });

    it("should add an effect", () => {
      const effect = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
        brightness: 0.2,
      });

      const id = manager.addEffect(effect);
      expect(id).toBeDefined();
      expect(manager.getAllEffects()).toHaveLength(1);
      expect(manager.hasEffect(id)).toBe(true);
    });

    it("should add effect with custom ID", () => {
      const effect = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
        brightness: 0.2,
      });

      const id = manager.addEffect(effect, "my_effect");
      expect(id).toBe("my_effect");
      expect(manager.getEffect("my_effect")).toBe(effect);
    });

    it("should generate unique IDs for same effect type", () => {
      const effect1 = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
        brightness: 0.2,
      });
      const effect2 = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
        brightness: 0.3,
      });

      const id1 = manager.addEffect(effect1);
      const id2 = manager.addEffect(effect2);

      expect(id1).not.toBe(id2);
      expect(manager.getAllEffects()).toHaveLength(2);
    });

    it("should remove an effect", () => {
      const effect = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
      });

      const id = manager.addEffect(effect);
      expect(manager.hasEffect(id)).toBe(true);

      const removed = manager.removeEffect(id);
      expect(removed).toBe(true);
      expect(manager.hasEffect(id)).toBe(false);
      expect(manager.getAllEffects()).toHaveLength(0);
    });

    it("should return false when removing non-existent effect", () => {
      const removed = manager.removeEffect("non_existent");
      expect(removed).toBe(false);
    });

    it("should get effect by ID", () => {
      const effect = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
      });

      const id = manager.addEffect(effect);
      const retrieved = manager.getEffect(id);
      expect(retrieved).toBe(effect);
    });

    it("should return undefined for non-existent effect", () => {
      const effect = manager.getEffect("non_existent");
      expect(effect).toBeUndefined();
    });

    it("should clear all effects", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
      );

      expect(manager.getAllEffects()).toHaveLength(2);

      manager.clear();
      expect(manager.getAllEffects()).toHaveLength(0);
    });
  });

  describe("Effect Filtering", () => {
    it("should get effects by type", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
      );
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
      );

      const colorEffects = manager.getEffectsByType(
        EffectType.COLOR_ADJUSTMENT,
      );
      expect(colorEffects).toHaveLength(2);

      const chromaEffects = manager.getEffectsByType(EffectType.CHROMA_KEY);
      expect(chromaEffects).toHaveLength(1);

      const blurEffects = manager.getEffectsByType(EffectType.BLUR);
      expect(blurEffects).toHaveLength(0);
    });

    it("should check if has enabled effects", () => {
      const effect = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
        enabled: false,
      });

      manager.addEffect(effect);
      expect(manager.hasEnabledEffects()).toBe(false);

      effect.setEnabled(true);
      expect(manager.hasEnabledEffects()).toBe(true);
    });
  });

  describe("Uniform Generation", () => {
    it("should return empty uniforms with no effects", () => {
      const uniforms = manager.getAllUniforms();
      expect(Object.keys(uniforms).length).toBe(0);
    });

    it("should merge uniforms from single effect", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
          brightness: 0.3,
          contrast: 1.2,
        }),
      );

      const uniforms = manager.getAllUniforms();
      expect(uniforms.u_brightness).toBe(0.3);
      expect(uniforms.u_contrast).toBe(1.2);
    });

    it("should merge uniforms from multiple effects", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
          brightness: 0.2,
        }),
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0.0, g: 1.0, b: 0.0 },
        }),
      );

      const uniforms = manager.getAllUniforms();
      expect(uniforms.u_brightness).toBeDefined();
      expect(uniforms.u_useChromaKey).toBe(true);
      expect(uniforms.u_chromaKeyColor).toEqual([0.0, 1.0, 0.0]);
    });

    it("should only include enabled effects in uniforms", () => {
      const effect1 = new ColorAdjustmentEffect({
        type: EffectType.COLOR_ADJUSTMENT,
        brightness: 0.2,
      });
      const effect2 = new ChromaKeyEffect({
        type: EffectType.CHROMA_KEY,
        keyColor: { r: 0.0, g: 1.0, b: 0.0 },
        enabled: false,
      });

      manager.addEffect(effect1);
      manager.addEffect(effect2);

      const uniforms = manager.getAllUniforms();
      expect(uniforms.u_brightness).toBeDefined();
      expect(uniforms.u_useChromaKey).toBe(false);
    });

    it("should apply effects in order", () => {
      manager.addEffect(
        new CustomEffect({
          type: EffectType.CUSTOM,
          uniforms: { u_value: 1.0 },
        }),
        "first",
      );
      manager.addEffect(
        new CustomEffect({
          type: EffectType.CUSTOM,
          uniforms: { u_value: 2.0 },
        }),
        "second",
      );

      const uniforms = manager.getAllUniforms();
      // Second effect should overwrite first
      expect(uniforms.u_value).toBe(2.0);
    });
  });

  describe("Shader Selection", () => {
    it("should return null with no effects", () => {
      const shader = manager.getRequiredShader();
      expect(shader).toBeNull();
    });

    it("should return null when effects use default shader", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
          brightness: 0.2,
        }),
      );

      const shader = manager.getRequiredShader();
      expect(shader).toBeNull();
    });

    it("should return shader name from first effect requiring custom shader", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
        }),
      );
      manager.addEffect(
        new BlurEffect({
          type: EffectType.BLUR,
          radius: 5.0,
        }),
      );

      const shader = manager.getRequiredShader();
      expect(shader).toBe("blur");
    });

    it("should skip disabled effects when selecting shader", () => {
      manager.addEffect(
        new BlurEffect({
          type: EffectType.BLUR,
          radius: 5.0,
          enabled: false,
        }),
      );

      const shader = manager.getRequiredShader();
      expect(shader).toBeNull();
    });
  });

  describe("Effect Ordering", () => {
    it("should maintain effect order", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
        "first",
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
        "second",
      );
      manager.addEffect(
        new VignetteEffect({ type: EffectType.VIGNETTE }),
        "third",
      );

      const effects = manager.getAllEffects();
      expect(effects[0].getType()).toBe(EffectType.COLOR_ADJUSTMENT);
      expect(effects[1].getType()).toBe(EffectType.CHROMA_KEY);
      expect(effects[2].getType()).toBe(EffectType.VIGNETTE);
    });

    it("should reorder effects", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
        "first",
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
        "second",
      );
      manager.addEffect(
        new VignetteEffect({ type: EffectType.VIGNETTE }),
        "third",
      );

      manager.reorder(["third", "first", "second"]);

      const effects = manager.getAllEffects();
      expect(effects[0].getType()).toBe(EffectType.VIGNETTE);
      expect(effects[1].getType()).toBe(EffectType.COLOR_ADJUSTMENT);
      expect(effects[2].getType()).toBe(EffectType.CHROMA_KEY);
    });

    it("should throw error for invalid reorder", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
        "first",
      );

      expect(() => manager.reorder(["invalid"])).toThrow();
    });

    it("should move effect to new position", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
        "first",
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
        "second",
      );
      manager.addEffect(
        new VignetteEffect({ type: EffectType.VIGNETTE }),
        "third",
      );

      manager.moveEffect("first", 2);

      const effects = manager.getAllEffects();
      expect(effects[0].getType()).toBe(EffectType.CHROMA_KEY);
      expect(effects[1].getType()).toBe(EffectType.VIGNETTE);
      expect(effects[2].getType()).toBe(EffectType.COLOR_ADJUSTMENT);
    });
  });

  describe("Enable/Disable All", () => {
    it("should enable all effects", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
          enabled: false,
        }),
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
          enabled: false,
        }),
      );

      manager.setAllEnabled(true);

      const effects = manager.getAllEffects();
      expect(effects.every((e) => e.isEnabled())).toBe(true);
    });

    it("should disable all effects", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
      );

      manager.setAllEnabled(false);

      const effects = manager.getAllEffects();
      expect(effects.every((e) => !e.isEnabled())).toBe(true);
    });
  });

  describe("Cloning", () => {
    it("should clone manager with all effects", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
          brightness: 0.2,
        }),
        "color",
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0.0, g: 1.0, b: 0.0 },
        }),
        "chroma",
      );

      const cloned = manager.clone();

      expect(cloned).not.toBe(manager);
      expect(cloned.getAllEffects()).toHaveLength(2);
      expect(cloned.getEffect("color")).toBeDefined();
      expect(cloned.getEffect("chroma")).toBeDefined();

      // Cloned effects should be different instances
      expect(cloned.getEffect("color")).not.toBe(manager.getEffect("color"));
    });
  });

  describe("Serialization", () => {
    it("should serialize to JSON", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({
          type: EffectType.COLOR_ADJUSTMENT,
          brightness: 0.2,
          contrast: 1.1,
        }),
        "effect1",
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0.0, g: 1.0, b: 0.0 },
        }),
        "effect2",
      );

      const json = manager.toJSON();

      expect(json.effects).toHaveLength(2);
      expect(json.effects[0].id).toBe("effect1");
      expect(json.effects[0].config.type).toBe(EffectType.COLOR_ADJUSTMENT);
      expect(json.effects[1].id).toBe("effect2");
      expect(json.effects[1].config.type).toBe(EffectType.CHROMA_KEY);
    });

    it("should deserialize from JSON", () => {
      const json = {
        effects: [
          {
            id: "effect1",
            config: {
              type: EffectType.COLOR_ADJUSTMENT,
              brightness: 0.3,
              enabled: true,
              intensity: 1.0,
            } as ColorAdjustmentConfig,
          },
          {
            id: "effect2",
            config: {
              type: EffectType.CHROMA_KEY,
              keyColor: { r: 0.0, g: 1.0, b: 0.0 },
              enabled: true,
              intensity: 1.0,
            } as ChromaKeyConfig,
          },
        ],
      };

      const manager = EffectManager.fromJSON(json);

      expect(manager.getAllEffects()).toHaveLength(2);
      expect(manager.getEffect("effect1")).toBeDefined();
      expect(manager.getEffect("effect2")).toBeDefined();
      expect(manager.getEffect("effect1")?.getType()).toBe(
        EffectType.COLOR_ADJUSTMENT,
      );
    });

    it("should preserve order in serialization round-trip", () => {
      manager.addEffect(
        new ColorAdjustmentEffect({ type: EffectType.COLOR_ADJUSTMENT }),
        "first",
      );
      manager.addEffect(
        new ChromaKeyEffect({
          type: EffectType.CHROMA_KEY,
          keyColor: { r: 0, g: 1, b: 0 },
        }),
        "second",
      );

      const json = manager.toJSON();
      const restored = EffectManager.fromJSON(json);

      const effects = restored.getAllEffects();
      expect(effects[0].getType()).toBe(EffectType.COLOR_ADJUSTMENT);
      expect(effects[1].getType()).toBe(EffectType.CHROMA_KEY);
    });
  });

  describe("Presets", () => {
    it("should create vibrant preset", () => {
      const preset = EffectManager.createPreset("vibrant");
      expect(preset.getAllEffects().length).toBeGreaterThan(0);
      expect(preset.hasEnabledEffects()).toBe(true);
    });

    it("should create cool preset", () => {
      const preset = EffectManager.createPreset("cool");
      expect(preset.getAllEffects().length).toBeGreaterThan(0);
    });

    it("should create warm preset", () => {
      const preset = EffectManager.createPreset("warm");
      expect(preset.getAllEffects().length).toBeGreaterThan(0);
    });

    it("should create vintage preset", () => {
      const preset = EffectManager.createPreset("vintage");
      expect(preset.getAllEffects().length).toBeGreaterThan(0);
      // Vintage should have vignette
      const vignetteEffects = preset.getEffectsByType(EffectType.VIGNETTE);
      expect(vignetteEffects.length).toBeGreaterThan(0);
    });

    it("should create black and white preset", () => {
      const preset = EffectManager.createPreset("blackwhite");
      expect(preset.getAllEffects().length).toBeGreaterThan(0);
      // Should have color adjustment with zero saturation
      const uniforms = preset.getAllUniforms();
      expect(uniforms.u_saturation).toBe(0.0);
    });
  });
});
