/**
 * EffectManager.ts
 * Manages multiple effects applied to a render node
 */

import {
  Effect,
  EffectType,
  AnyEffectConfig,
  ColorAdjustmentEffect,
  VignetteEffect,
} from "./Effect";

/**
 * EffectManager manages a collection of effects for a render node
 *
 * Effects are applied in order and their uniforms are merged.
 * The manager handles effect lifecycle, uniform generation, and shader selection.
 *
 * @example
 * ```typescript
 * const manager = new EffectManager();
 *
 * // Add color adjustment
 * manager.addEffect(new ColorAdjustmentEffect({
 *   type: EffectType.COLOR_ADJUSTMENT,
 *   brightness: 0.2,
 *   saturation: 1.3
 * }));
 *
 * // Add chroma key
 * manager.addEffect(new ChromaKeyEffect({
 *   type: EffectType.CHROMA_KEY,
 *   keyColor: { r: 0.0, g: 1.0, b: 0.0 }
 * }));
 *
 * // Get uniforms and apply to node
 * const uniforms = manager.getAllUniforms();
 * renderNode.setCustomUniforms(uniforms);
 * ```
 */
export class EffectManager {
  private effects: Map<string, Effect>;
  private effectOrder: string[]; // Track order of effects

  constructor() {
    this.effects = new Map();
    this.effectOrder = [];
  }

  /**
   * Add an effect with an optional ID
   * If no ID is provided, a unique ID is generated based on effect type
   */
  addEffect(effect: Effect, id?: string): string {
    const effectId = id ?? this.generateEffectId(effect);
    this.effects.set(effectId, effect);
    if (!this.effectOrder.includes(effectId)) {
      this.effectOrder.push(effectId);
    }
    return effectId;
  }

  /**
   * Remove an effect by ID
   */
  removeEffect(id: string): boolean {
    const removed = this.effects.delete(id);
    if (removed) {
      const index = this.effectOrder.indexOf(id);
      if (index !== -1) {
        this.effectOrder.splice(index, 1);
      }
    }
    return removed;
  }

  /**
   * Get an effect by ID
   */
  getEffect(id: string): Effect | undefined {
    return this.effects.get(id);
  }

  /**
   * Check if an effect exists
   */
  hasEffect(id: string): boolean {
    return this.effects.has(id);
  }

  /**
   * Get all effects
   */
  getAllEffects(): Effect[] {
    return this.effectOrder
      .map((id) => this.effects.get(id))
      .filter((e) => e !== undefined) as Effect[];
  }

  /**
   * Get effects by type
   */
  getEffectsByType(type: EffectType): Effect[] {
    return this.getAllEffects().filter((effect) => effect.getType() === type);
  }

  /**
   * Clear all effects
   */
  clear(): void {
    this.effects.clear();
    this.effectOrder = [];
  }

  /**
   * Get the number of effects
   */
  getCount(): number {
    return this.effects.size;
  }

  /**
   * Check if there are any enabled effects
   */
  hasEnabledEffects(): boolean {
    return this.getAllEffects().some((effect) => effect.isEnabled());
  }

  /**
   * Enable or disable all effects
   */
  setAllEnabled(enabled: boolean): void {
    this.effects.forEach((effect) => effect.setEnabled(enabled));
  }

  /**
   * Get merged uniforms from all effects (enabled and disabled)
   * Effects are applied in the order they were added
   * Disabled effects still provide uniforms with default/disabled values
   */
  getAllUniforms(): Record<string, any> {
    const uniforms: Record<string, any> = {};

    // Apply effects in order (both enabled and disabled)
    for (const id of this.effectOrder) {
      const effect = this.effects.get(id);
      if (effect) {
        const effectUniforms = effect.getUniforms();
        Object.assign(uniforms, effectUniforms);
      }
    }

    return uniforms;
  }

  /**
   * Get the shader name required for the current effect stack
   * Returns the shader name from the first enabled effect that requires a custom shader,
   * or null if all effects use the default shader
   */
  getRequiredShader(): string | null {
    for (const id of this.effectOrder) {
      const effect = this.effects.get(id);
      if (effect && effect.isEnabled()) {
        const shaderName = effect.getShaderName();
        if (shaderName) {
          return shaderName;
        }
      }
    }
    return null;
  }

  /**
   * Reorder effects
   * @param newOrder Array of effect IDs in desired order
   */
  reorder(newOrder: string[]): void {
    // Validate that all IDs exist
    const valid = newOrder.every((id) => this.effects.has(id));
    if (!valid) {
      throw new Error("Invalid effect IDs in new order");
    }

    // Ensure all effects are included
    if (newOrder.length !== this.effectOrder.length) {
      throw new Error("New order must include all effects");
    }

    this.effectOrder = [...newOrder];
  }

  /**
   * Move an effect to a new position
   */
  moveEffect(id: string, newIndex: number): void {
    const currentIndex = this.effectOrder.indexOf(id);
    if (currentIndex === -1) {
      throw new Error(`Effect ${id} not found`);
    }

    // Remove from current position
    this.effectOrder.splice(currentIndex, 1);

    // Insert at new position
    const clampedIndex = Math.max(
      0,
      Math.min(newIndex, this.effectOrder.length),
    );
    this.effectOrder.splice(clampedIndex, 0, id);
  }

  /**
   * Clone this effect manager
   */
  clone(): EffectManager {
    const manager = new EffectManager();
    for (const id of this.effectOrder) {
      const effect = this.effects.get(id);
      if (effect) {
        manager.addEffect(effect.clone(), id);
      }
    }
    return manager;
  }

  /**
   * Serialize all effects to JSON
   */
  toJSON(): { effects: Array<{ id: string; config: AnyEffectConfig }> } {
    const effects = this.effectOrder
      .map((id) => {
        const effect = this.effects.get(id);
        if (effect) {
          return {
            id,
            config: effect.toJSON(),
          };
        }
        return null;
      })
      .filter((e) => e !== null) as Array<{
      id: string;
      config: AnyEffectConfig;
    }>;

    return { effects };
  }

  /**
   * Load effects from JSON
   */
  static fromJSON(data: {
    effects: Array<{ id: string; config: AnyEffectConfig }>;
  }): EffectManager {
    const manager = new EffectManager();
    for (const item of data.effects) {
      const effect = Effect.fromConfig(item.config);
      manager.addEffect(effect, item.id);
    }
    return manager;
  }

  /**
   * Generate a unique effect ID based on type
   */
  private generateEffectId(effect: Effect): string {
    const type = effect.getType();
    let counter = 1;
    let id = `${type}_${counter}`;

    while (this.effects.has(id)) {
      counter++;
      id = `${type}_${counter}`;
    }

    return id;
  }

  /**
   * Apply all effects to a render node
   * This is a convenience method that sets uniforms and shader on the node
   */
  applyToNode(node: any): void {
    // Get merged uniforms
    const uniforms = this.getAllUniforms();

    // Set uniforms on node
    node.setCustomUniforms(uniforms);

    // Set shader if needed
    const requiredShader = this.getRequiredShader();
    if (requiredShader) {
      node.setShaderName(requiredShader);
    }
  }

  /**
   * Create a preset effect manager with common effects
   */
  static createPreset(
    preset: "vibrant" | "cool" | "warm" | "vintage" | "blackwhite",
  ): EffectManager {
    const manager = new EffectManager();

    switch (preset) {
      case "vibrant":
        manager.addEffect(
          new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            brightness: 0.1,
            contrast: 1.2,
            saturation: 1.5,
          }),
        );
        break;

      case "cool":
        manager.addEffect(
          new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            tint: { r: 0.8, g: 0.9, b: 1.0 },
            saturation: 0.9,
          }),
        );
        break;

      case "warm":
        manager.addEffect(
          new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            tint: { r: 1.0, g: 0.9, b: 0.8 },
            saturation: 1.1,
          }),
        );
        break;

      case "vintage":
        manager.addEffect(
          new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            contrast: 1.1,
            saturation: 0.7,
            brightness: -0.05,
            tint: { r: 1.0, g: 0.95, b: 0.85 },
          }),
        );
        manager.addEffect(
          new VignetteEffect({
            type: EffectType.VIGNETTE,
            amount: 0.6,
            radius: 0.7,
          }),
        );
        break;

      case "blackwhite":
        manager.addEffect(
          new ColorAdjustmentEffect({
            type: EffectType.COLOR_ADJUSTMENT,
            saturation: 0.0,
            contrast: 1.2,
          }),
        );
        break;
    }

    return manager;
  }
}
