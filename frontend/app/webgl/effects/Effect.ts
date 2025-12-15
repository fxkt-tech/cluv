/**
 * Effect.ts
 * Base class for visual effects applied to render nodes
 */

/**
 * Effect types enum
 */
export enum EffectType {
  COLOR_ADJUSTMENT = "color_adjustment",
  CHROMA_KEY = "chroma_key",
  BLUR = "blur",
  SHARPEN = "sharpen",
  VIGNETTE = "vignette",
  CUSTOM = "custom",
}

/**
 * Base configuration for all effects
 */
export interface EffectConfig {
  type: EffectType;
  enabled?: boolean;
  intensity?: number; // 0.0 to 1.0, global intensity multiplier
}

/**
 * Color adjustment effect configuration
 */
export interface ColorAdjustmentConfig extends EffectConfig {
  type: EffectType.COLOR_ADJUSTMENT;
  brightness?: number; // -1.0 to 1.0
  contrast?: number; // 0.0 to 2.0 (1.0 = normal)
  saturation?: number; // 0.0 to 2.0 (1.0 = normal)
  hue?: number; // -180.0 to 180.0 degrees
  tint?: { r: number; g: number; b: number; a?: number }; // 0.0 to 1.0
}

/**
 * Chroma key (green screen) effect configuration
 */
export interface ChromaKeyConfig extends EffectConfig {
  type: EffectType.CHROMA_KEY;
  keyColor: { r: number; g: number; b: number }; // Color to key out (0.0 to 1.0)
  threshold?: number; // 0.0 to 1.0, how close color must be to key color
  smoothness?: number; // 0.0 to 1.0, edge feathering
}

/**
 * Blur effect configuration
 */
export interface BlurConfig extends EffectConfig {
  type: EffectType.BLUR;
  radius?: number; // Blur radius in pixels
  passes?: number; // Number of blur passes
}

/**
 * Sharpen effect configuration
 */
export interface SharpenConfig extends EffectConfig {
  type: EffectType.SHARPEN;
  amount?: number; // 0.0 to 2.0
}

/**
 * Vignette effect configuration
 */
export interface VignetteConfig extends EffectConfig {
  type: EffectType.VIGNETTE;
  amount?: number; // 0.0 to 1.0, vignette darkness
  radius?: number; // 0.0 to 1.0
  smoothness?: number; // 0.0 to 1.0
}

/**
 * Custom effect configuration with arbitrary uniforms
 */
export interface CustomEffectConfig extends EffectConfig {
  type: EffectType.CUSTOM;
  shaderName?: string; // Name of custom shader program
  uniforms?: Record<string, any>; // Custom uniform values
}

/**
 * Union type for all effect configurations
 */
export type AnyEffectConfig =
  | ColorAdjustmentConfig
  | ChromaKeyConfig
  | BlurConfig
  | SharpenConfig
  | VignetteConfig
  | CustomEffectConfig;

/**
 * Base class for visual effects
 *
 * Effects generate shader uniforms that are applied to render nodes.
 * They encapsulate effect logic and provide a clean API for effect management.
 *
 * @example
 * ```typescript
 * const colorEffect = new ColorAdjustmentEffect({
 *   type: EffectType.COLOR_ADJUSTMENT,
 *   brightness: 0.2,
 *   contrast: 1.1,
 *   saturation: 1.3
 * });
 *
 * const uniforms = colorEffect.getUniforms();
 * renderNode.setCustomUniforms(uniforms);
 * ```
 */
export abstract class Effect {
  protected config: EffectConfig;
  protected enabled: boolean;
  protected intensity: number;

  constructor(config: EffectConfig) {
    this.config = config;
    this.enabled = config.enabled !== false;
    this.intensity = config.intensity ?? 1.0;
  }

  /**
   * Get the effect type
   */
  getType(): EffectType {
    return this.config.type;
  }

  /**
   * Check if the effect is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable or disable the effect
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Get the global intensity multiplier
   */
  getIntensity(): number {
    return this.intensity;
  }

  /**
   * Set the global intensity multiplier (0.0 to 1.0)
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Update effect configuration
   */
  updateConfig(config: Partial<EffectConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.enabled !== undefined) {
      this.enabled = config.enabled;
    }
    if (config.intensity !== undefined) {
      this.intensity = config.intensity;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): EffectConfig {
    return {
      ...this.config,
      enabled: this.enabled,
      intensity: this.intensity,
    };
  }

  /**
   * Get shader uniforms for this effect
   * Subclasses must implement this to return effect-specific uniforms
   */
  abstract getUniforms(): Record<string, any>;

  /**
   * Get the shader name required for this effect
   * Returns null if the effect uses the default shader
   */
  getShaderName(): string | null {
    return null;
  }

  /**
   * Clone this effect
   */
  abstract clone(): Effect;

  /**
   * Serialize effect to JSON
   */
  toJSON(): AnyEffectConfig {
    return {
      ...this.config,
      enabled: this.enabled,
      intensity: this.intensity,
    } as AnyEffectConfig;
  }

  /**
   * Create an effect from configuration
   */
  static fromConfig(config: AnyEffectConfig): Effect {
    switch (config.type) {
      case EffectType.COLOR_ADJUSTMENT:
        return new ColorAdjustmentEffect(config as ColorAdjustmentConfig);
      case EffectType.CHROMA_KEY:
        return new ChromaKeyEffect(config as ChromaKeyConfig);
      case EffectType.BLUR:
        return new BlurEffect(config as BlurConfig);
      case EffectType.SHARPEN:
        return new SharpenEffect(config as SharpenConfig);
      case EffectType.VIGNETTE:
        return new VignetteEffect(config as VignetteConfig);
      case EffectType.CUSTOM:
        return new CustomEffect(config as CustomEffectConfig);
      default:
        throw new Error(`Unknown effect type: ${(config as any).type}`);
    }
  }
}

/**
 * Color adjustment effect
 */
export class ColorAdjustmentEffect extends Effect {
  private brightness: number;
  private contrast: number;
  private saturation: number;
  private hue: number;
  private tint: { r: number; g: number; b: number; a: number };

  constructor(config: ColorAdjustmentConfig) {
    super(config);
    this.brightness = config.brightness ?? 0.0;
    this.contrast = config.contrast ?? 1.0;
    this.saturation = config.saturation ?? 1.0;
    this.hue = config.hue ?? 0.0;
    this.tint = config.tint
      ? {
          r: config.tint.r,
          g: config.tint.g,
          b: config.tint.b,
          a: config.tint.a ?? 1.0,
        }
      : { r: 1.0, g: 1.0, b: 1.0, a: 1.0 };
  }

  setBrightness(value: number): void {
    this.brightness = Math.max(-1, Math.min(1, value));
  }

  setContrast(value: number): void {
    this.contrast = Math.max(0, Math.min(2, value));
  }

  setSaturation(value: number): void {
    this.saturation = Math.max(0, Math.min(2, value));
  }

  setHue(value: number): void {
    this.hue = value;
    // Normalize to -180 to 180
    while (this.hue > 180) this.hue -= 360;
    while (this.hue < -180) this.hue += 360;
  }

  setTint(tint: { r: number; g: number; b: number; a?: number }): void {
    this.tint = {
      r: Math.max(0, Math.min(1, tint.r)),
      g: Math.max(0, Math.min(1, tint.g)),
      b: Math.max(0, Math.min(1, tint.b)),
      a: tint.a !== undefined ? Math.max(0, Math.min(1, tint.a)) : 1.0,
    };
  }

  getUniforms(): Record<string, any> {
    if (!this.enabled) {
      return {
        u_brightness: 0.0,
        u_contrast: 1.0,
        u_saturation: 1.0,
        u_hue: 0.0,
        u_tintColor: [1.0, 1.0, 1.0, 1.0],
      };
    }

    return {
      u_brightness: this.brightness * this.intensity,
      u_contrast: 1.0 + (this.contrast - 1.0) * this.intensity,
      u_saturation: 1.0 + (this.saturation - 1.0) * this.intensity,
      u_hue: this.hue * this.intensity,
      u_tintColor: [this.tint.r, this.tint.g, this.tint.b, this.tint.a],
    };
  }

  clone(): ColorAdjustmentEffect {
    return new ColorAdjustmentEffect({
      type: EffectType.COLOR_ADJUSTMENT,
      enabled: this.enabled,
      intensity: this.intensity,
      brightness: this.brightness,
      contrast: this.contrast,
      saturation: this.saturation,
      hue: this.hue,
      tint: { ...this.tint },
    });
  }
}

/**
 * Chroma key (green screen) effect
 */
export class ChromaKeyEffect extends Effect {
  private keyColor: { r: number; g: number; b: number };
  private threshold: number;
  private smoothness: number;

  constructor(config: ChromaKeyConfig) {
    super(config);
    this.keyColor = config.keyColor;
    this.threshold = config.threshold ?? 0.4;
    this.smoothness = config.smoothness ?? 0.1;
  }

  setKeyColor(color: { r: number; g: number; b: number }): void {
    this.keyColor = {
      r: Math.max(0, Math.min(1, color.r)),
      g: Math.max(0, Math.min(1, color.g)),
      b: Math.max(0, Math.min(1, color.b)),
    };
  }

  setThreshold(value: number): void {
    this.threshold = Math.max(0, Math.min(1, value));
  }

  setSmoothness(value: number): void {
    this.smoothness = Math.max(0, Math.min(1, value));
  }

  getUniforms(): Record<string, any> {
    if (!this.enabled) {
      return {
        u_useChromaKey: false,
        u_chromaKeyColor: [0.0, 0.0, 0.0],
        u_chromaKeyThreshold: 0.0,
        u_chromaKeySmoothness: 0.0,
      };
    }

    return {
      u_useChromaKey: true,
      u_chromaKeyColor: [this.keyColor.r, this.keyColor.g, this.keyColor.b],
      u_chromaKeyThreshold: this.threshold * this.intensity,
      u_chromaKeySmoothness: this.smoothness,
    };
  }

  clone(): ChromaKeyEffect {
    return new ChromaKeyEffect({
      type: EffectType.CHROMA_KEY,
      enabled: this.enabled,
      intensity: this.intensity,
      keyColor: { ...this.keyColor },
      threshold: this.threshold,
      smoothness: this.smoothness,
    });
  }
}

/**
 * Blur effect
 */
export class BlurEffect extends Effect {
  private radius: number;
  private passes: number;

  constructor(config: BlurConfig) {
    super(config);
    this.radius = config.radius ?? 5.0;
    this.passes = config.passes ?? 1;
  }

  setRadius(value: number): void {
    this.radius = Math.max(0, value);
  }

  setPasses(value: number): void {
    this.passes = Math.max(1, Math.floor(value));
  }

  getUniforms(): Record<string, any> {
    return {
      u_blurRadius: this.enabled ? this.radius * this.intensity : 0.0,
      u_blurPasses: this.passes,
    };
  }

  getShaderName(): string | null {
    return this.enabled ? "blur" : null;
  }

  clone(): BlurEffect {
    return new BlurEffect({
      type: EffectType.BLUR,
      enabled: this.enabled,
      intensity: this.intensity,
      radius: this.radius,
      passes: this.passes,
    });
  }
}

/**
 * Sharpen effect
 */
export class SharpenEffect extends Effect {
  private amount: number;

  constructor(config: SharpenConfig) {
    super(config);
    this.amount = config.amount ?? 1.0;
  }

  setAmount(value: number): void {
    this.amount = Math.max(0, Math.min(2, value));
  }

  getUniforms(): Record<string, any> {
    return {
      u_sharpenAmount: this.enabled ? this.amount * this.intensity : 0.0,
    };
  }

  getShaderName(): string | null {
    return this.enabled ? "sharpen" : null;
  }

  clone(): SharpenEffect {
    return new SharpenEffect({
      type: EffectType.SHARPEN,
      enabled: this.enabled,
      intensity: this.intensity,
      amount: this.amount,
    });
  }
}

/**
 * Vignette effect
 */
export class VignetteEffect extends Effect {
  private vignetteIntensity: number;
  private radius: number;
  private smoothness: number;

  constructor(config: VignetteConfig) {
    super(config);
    this.vignetteIntensity = config.amount ?? 0.5;
    this.radius = config.radius ?? 0.75;
    this.smoothness = config.smoothness ?? 0.45;
  }

  setVignetteIntensity(value: number): void {
    this.vignetteIntensity = Math.max(0, Math.min(1, value));
  }

  setRadius(value: number): void {
    this.radius = Math.max(0, Math.min(1, value));
  }

  setSmoothness(value: number): void {
    this.smoothness = Math.max(0, Math.min(1, value));
  }

  getUniforms(): Record<string, any> {
    return {
      u_vignetteIntensity: this.enabled
        ? this.vignetteIntensity * this.intensity
        : 0.0,
      u_vignetteRadius: this.radius,
      u_vignetteSmoothness: this.smoothness,
    };
  }

  clone(): VignetteEffect {
    const cloned = new VignetteEffect({
      type: EffectType.VIGNETTE,
      enabled: this.enabled,
      intensity: this.intensity,
      amount: this.vignetteIntensity,
      radius: this.radius,
      smoothness: this.smoothness,
    });
    return cloned;
  }
}

/**
 * Custom effect with arbitrary uniforms
 */
export class CustomEffect extends Effect {
  private shaderName: string | null;
  private uniforms: Record<string, any>;

  constructor(config: CustomEffectConfig) {
    super(config);
    this.shaderName = config.shaderName ?? null;
    this.uniforms = config.uniforms ?? {};
  }

  setShader(name: string): void {
    this.shaderName = name;
  }

  setUniform(name: string, value: any): void {
    this.uniforms[name] = value;
  }

  getUniforms(): Record<string, any> {
    if (!this.enabled) {
      return {};
    }
    return { ...this.uniforms };
  }

  getShaderName(): string | null {
    return this.enabled ? this.shaderName : null;
  }

  clone(): CustomEffect {
    return new CustomEffect({
      type: EffectType.CUSTOM,
      enabled: this.enabled,
      intensity: this.intensity,
      shaderName: this.shaderName ?? undefined,
      uniforms: { ...this.uniforms },
    });
  }
}
