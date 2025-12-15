/**
 * Effect.test.ts
 * Unit tests for Effect classes
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  Effect,
  EffectType,
  ColorAdjustmentEffect,
  ChromaKeyEffect,
  BlurEffect,
  SharpenEffect,
  VignetteEffect,
  CustomEffect,
  ColorAdjustmentConfig,
  ChromaKeyConfig,
} from "../Effect";

describe("ColorAdjustmentEffect", () => {
  it("should create with default values", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
    });

    expect(effect.getType()).toBe(EffectType.COLOR_ADJUSTMENT);
    expect(effect.isEnabled()).toBe(true);
    expect(effect.getIntensity()).toBe(1.0);
  });

  it("should apply brightness adjustment", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.5,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_brightness).toBe(0.5);
    expect(uniforms.u_contrast).toBe(1.0);
    expect(uniforms.u_saturation).toBe(1.0);
    expect(uniforms.u_hue).toBe(0.0);
  });

  it("should apply contrast adjustment", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      contrast: 1.5,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_contrast).toBe(1.5);
  });

  it("should apply saturation adjustment", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      saturation: 1.3,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_saturation).toBe(1.3);
  });

  it("should apply hue adjustment", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      hue: 45,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_hue).toBe(45);
  });

  it("should apply tint color", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      tint: { r: 1.0, g: 0.8, b: 0.6, a: 0.9 },
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_tintColor).toEqual([1.0, 0.8, 0.6, 0.9]);
  });

  it("should apply multiple adjustments", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.2,
      contrast: 1.1,
      saturation: 1.2,
      hue: 30,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_brightness).toBe(0.2);
    expect(uniforms.u_contrast).toBe(1.1);
    expect(uniforms.u_saturation).toBe(1.2);
    expect(uniforms.u_hue).toBe(30);
  });

  it("should respect intensity multiplier", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 1.0,
      intensity: 0.5,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_brightness).toBe(0.5); // 1.0 * 0.5
  });

  it("should clamp brightness to valid range", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
    });

    effect.setBrightness(2.0);
    let uniforms = effect.getUniforms();
    expect(uniforms.u_brightness).toBe(1.0);

    effect.setBrightness(-2.0);
    uniforms = effect.getUniforms();
    expect(uniforms.u_brightness).toBe(-1.0);
  });

  it("should clamp contrast to valid range", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
    });

    effect.setContrast(5.0);
    let uniforms = effect.getUniforms();
    expect(uniforms.u_contrast).toBe(2.0);

    effect.setContrast(-1.0);
    uniforms = effect.getUniforms();
    expect(uniforms.u_contrast).toBe(0.0);
  });

  it("should normalize hue to -180 to 180 range", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
    });

    effect.setHue(270);
    let uniforms = effect.getUniforms();
    expect(uniforms.u_hue).toBe(-90);

    effect.setHue(-270);
    uniforms = effect.getUniforms();
    expect(uniforms.u_hue).toBe(90);
  });

  it("should return default values when disabled", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.5,
      enabled: false,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_brightness).toBe(0.0);
    expect(uniforms.u_contrast).toBe(1.0);
    expect(uniforms.u_saturation).toBe(1.0);
    expect(uniforms.u_hue).toBe(0.0);
  });

  it("should clone correctly", () => {
    const original = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.3,
      contrast: 1.2,
      saturation: 1.1,
      hue: 15,
    });

    const cloned = original.clone();
    expect(cloned).not.toBe(original);
    expect(cloned.getUniforms()).toEqual(original.getUniforms());
  });

  it("should serialize to JSON", () => {
    const effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.2,
      contrast: 1.1,
    });

    const json = effect.toJSON();
    expect(json.type).toBe(EffectType.COLOR_ADJUSTMENT);
    expect((json as ColorAdjustmentConfig).brightness).toBe(0.2);
    expect((json as ColorAdjustmentConfig).contrast).toBe(1.1);
  });
});

describe("ChromaKeyEffect", () => {
  it("should create with key color", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
    });

    expect(effect.getType()).toBe(EffectType.CHROMA_KEY);
    expect(effect.isEnabled()).toBe(true);
  });

  it("should generate correct uniforms", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
      threshold: 0.3,
      smoothness: 0.15,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_useChromaKey).toBe(true);
    expect(uniforms.u_chromaKeyColor).toEqual([0.0, 1.0, 0.0]);
    expect(uniforms.u_chromaKeyThreshold).toBe(0.3);
    expect(uniforms.u_chromaKeySmoothness).toBe(0.15);
  });

  it("should use default threshold and smoothness", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_chromaKeyThreshold).toBe(0.4);
    expect(uniforms.u_chromaKeySmoothness).toBe(0.1);
  });

  it("should update key color", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
    });

    effect.setKeyColor({ r: 0.0, g: 0.0, b: 1.0 });
    const uniforms = effect.getUniforms();
    expect(uniforms.u_chromaKeyColor).toEqual([0.0, 0.0, 1.0]);
  });

  it("should clamp key color values", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
    });

    effect.setKeyColor({ r: 2.0, g: -1.0, b: 0.5 });
    const uniforms = effect.getUniforms();
    expect(uniforms.u_chromaKeyColor).toEqual([1.0, 0.0, 0.5]);
  });

  it("should respect intensity multiplier", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
      threshold: 0.4,
      intensity: 0.5,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_chromaKeyThreshold).toBe(0.2); // 0.4 * 0.5
  });

  it("should disable when effect is disabled", () => {
    const effect = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
      enabled: false,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_useChromaKey).toBe(false);
  });

  it("should clone correctly", () => {
    const original = new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
      threshold: 0.35,
      smoothness: 0.12,
    });

    const cloned = original.clone();
    expect(cloned).not.toBe(original);
    expect(cloned.getUniforms()).toEqual(original.getUniforms());
  });
});

describe("BlurEffect", () => {
  it("should create with default values", () => {
    const effect = new BlurEffect({
      type: EffectType.BLUR,
    });

    expect(effect.getType()).toBe(EffectType.BLUR);
    expect(effect.isEnabled()).toBe(true);
  });

  it("should generate correct uniforms", () => {
    const effect = new BlurEffect({
      type: EffectType.BLUR,
      radius: 8.0,
      passes: 2,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_blurRadius).toBe(8.0);
    expect(uniforms.u_blurPasses).toBe(2);
  });

  it("should return zero radius when disabled", () => {
    const effect = new BlurEffect({
      type: EffectType.BLUR,
      radius: 10.0,
      enabled: false,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_blurRadius).toBe(0.0);
  });

  it("should require blur shader when enabled", () => {
    const effect = new BlurEffect({
      type: EffectType.BLUR,
      radius: 5.0,
    });

    expect(effect.getShaderName()).toBe("blur");
  });

  it("should not require shader when disabled", () => {
    const effect = new BlurEffect({
      type: EffectType.BLUR,
      radius: 5.0,
      enabled: false,
    });

    expect(effect.getShaderName()).toBeNull();
  });

  it("should respect intensity multiplier", () => {
    const effect = new BlurEffect({
      type: EffectType.BLUR,
      radius: 10.0,
      intensity: 0.5,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_blurRadius).toBe(5.0);
  });
});

describe("SharpenEffect", () => {
  it("should create with default values", () => {
    const effect = new SharpenEffect({
      type: EffectType.SHARPEN,
    });

    expect(effect.getType()).toBe(EffectType.SHARPEN);
    expect(effect.getUniforms().u_sharpenAmount).toBe(1.0);
  });

  it("should generate correct uniforms", () => {
    const effect = new SharpenEffect({
      type: EffectType.SHARPEN,
      amount: 1.5,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_sharpenAmount).toBe(1.5);
  });

  it("should require sharpen shader when enabled", () => {
    const effect = new SharpenEffect({
      type: EffectType.SHARPEN,
    });

    expect(effect.getShaderName()).toBe("sharpen");
  });

  it("should clamp amount to valid range", () => {
    const effect = new SharpenEffect({
      type: EffectType.SHARPEN,
    });

    effect.setAmount(3.0);
    let uniforms = effect.getUniforms();
    expect(uniforms.u_sharpenAmount).toBe(2.0);

    effect.setAmount(-1.0);
    uniforms = effect.getUniforms();
    expect(uniforms.u_sharpenAmount).toBe(0.0);
  });
});

describe("VignetteEffect", () => {
  it("should create with default values", () => {
    const effect = new VignetteEffect({
      type: EffectType.VIGNETTE,
    });

    expect(effect.getType()).toBe(EffectType.VIGNETTE);
    const uniforms = effect.getUniforms();
    expect(uniforms.u_vignetteIntensity).toBe(0.5);
    expect(uniforms.u_vignetteRadius).toBe(0.75);
    expect(uniforms.u_vignetteSmoothness).toBe(0.45);
  });

  it("should generate correct uniforms", () => {
    const effect = new VignetteEffect({
      type: EffectType.VIGNETTE,
      amount: 0.7,
      radius: 0.6,
      smoothness: 0.3,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_vignetteIntensity).toBe(0.7);
    expect(uniforms.u_vignetteRadius).toBe(0.6);
    expect(uniforms.u_vignetteSmoothness).toBe(0.3);
  });

  it("should return zero intensity when disabled", () => {
    const effect = new VignetteEffect({
      type: EffectType.VIGNETTE,
      amount: 0.8,
      enabled: false,
    });

    const uniforms = effect.getUniforms();
    expect(uniforms.u_vignetteIntensity).toBe(0.0);
  });

  it("should respect intensity multiplier", () => {
    const effect = new VignetteEffect({
      type: EffectType.VIGNETTE,
      amount: 0.8,
    });

    effect.setIntensity(0.5);
    const uniforms = effect.getUniforms();
    expect(uniforms.u_vignetteIntensity).toBe(0.4); // 0.8 * 0.5
  });
});

describe("CustomEffect", () => {
  it("should create with custom shader and uniforms", () => {
    const effect = new CustomEffect({
      type: EffectType.CUSTOM,
      shaderName: "myCustomShader",
      uniforms: {
        u_customParam: 1.5,
        u_customColor: [1.0, 0.0, 0.0],
      },
    });

    expect(effect.getType()).toBe(EffectType.CUSTOM);
    expect(effect.getShaderName()).toBe("myCustomShader");
    const uniforms = effect.getUniforms();
    expect(uniforms.u_customParam).toBe(1.5);
    expect(uniforms.u_customColor).toEqual([1.0, 0.0, 0.0]);
  });

  it("should return empty uniforms when disabled", () => {
    const effect = new CustomEffect({
      type: EffectType.CUSTOM,
      uniforms: { u_customParam: 1.5 },
      enabled: false,
    });

    const uniforms = effect.getUniforms();
    expect(Object.keys(uniforms).length).toBe(0);
  });

  it("should update uniforms dynamically", () => {
    const effect = new CustomEffect({
      type: EffectType.CUSTOM,
      uniforms: {},
    });

    effect.setUniform("u_newParam", 2.5);
    const uniforms = effect.getUniforms();
    expect(uniforms.u_newParam).toBe(2.5);
  });
});

describe("Effect.fromConfig", () => {
  it("should create ColorAdjustmentEffect from config", () => {
    const config: ColorAdjustmentConfig = {
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.3,
    };

    const effect = Effect.fromConfig(config);
    expect(effect).toBeInstanceOf(ColorAdjustmentEffect);
    expect(effect.getType()).toBe(EffectType.COLOR_ADJUSTMENT);
  });

  it("should create ChromaKeyEffect from config", () => {
    const config: ChromaKeyConfig = {
      type: EffectType.CHROMA_KEY,
      keyColor: { r: 0.0, g: 1.0, b: 0.0 },
    };

    const effect = Effect.fromConfig(config);
    expect(effect).toBeInstanceOf(ChromaKeyEffect);
    expect(effect.getType()).toBe(EffectType.CHROMA_KEY);
  });

  it("should throw error for unknown effect type", () => {
    const config = {
      type: "unknown",
    } as any;

    expect(() => Effect.fromConfig(config)).toThrow();
  });
});

describe("Effect base class", () => {
  let effect: ColorAdjustmentEffect;

  beforeEach(() => {
    effect = new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      brightness: 0.2,
    });
  });

  it("should enable and disable", () => {
    expect(effect.isEnabled()).toBe(true);

    effect.setEnabled(false);
    expect(effect.isEnabled()).toBe(false);

    effect.setEnabled(true);
    expect(effect.isEnabled()).toBe(true);
  });

  it("should get and set intensity", () => {
    expect(effect.getIntensity()).toBe(1.0);

    effect.setIntensity(0.5);
    expect(effect.getIntensity()).toBe(0.5);
  });

  it("should clamp intensity to 0-1 range", () => {
    effect.setIntensity(2.0);
    expect(effect.getIntensity()).toBe(1.0);

    effect.setIntensity(-0.5);
    expect(effect.getIntensity()).toBe(0.0);
  });

  it("should update config", () => {
    effect.updateConfig({ intensity: 0.8, enabled: false });
    expect(effect.getIntensity()).toBe(0.8);
    expect(effect.isEnabled()).toBe(false);
  });

  it("should get config", () => {
    const config = effect.getConfig();
    expect(config.type).toBe(EffectType.COLOR_ADJUSTMENT);
    expect(config.intensity).toBe(1.0);
    expect(config.enabled).toBe(true);
  });
});
