# WebGL Effects System

A comprehensive visual effects system for the WebGL player, providing GPU-accelerated color adjustments, chroma keying, filters, and more.

## Overview

The effects system allows you to apply real-time visual effects to video clips, images, and other render nodes. Effects are composable, serializable, and integrate seamlessly with the WebGL rendering pipeline.

## Features

- **Color Adjustments** - Brightness, contrast, saturation, hue, tint
- **Chroma Key** - Green screen removal with configurable threshold and smoothness
- **Blur** - Gaussian blur with adjustable radius
- **Sharpen** - Convolution kernel sharpening
- **Vignette** - Edge darkening effect
- **Custom Effects** - Extensible system for user-defined effects
- **Effect Manager** - Compose and manage multiple effects
- **Presets** - Built-in presets for common looks (vibrant, cool, warm, vintage, B&W)
- **GPU-Accelerated** - All effects run on GPU via shaders

## Quick Start

```typescript
import {
  ColorAdjustmentEffect,
  EffectType,
  EffectManager
} from '@/app/webgl/effects';

// Create an effect
const colorEffect = new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.2,
  contrast: 1.2,
  saturation: 1.3,
});

// Add to a render node
const manager = node.getEffectManager();
manager.addEffect(colorEffect);
node.applyEffects();
```

## Effect Types

### ColorAdjustmentEffect

Adjust color properties of the rendered content.

```typescript
new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.2,      // -1.0 to 1.0
  contrast: 1.2,        // 0.0 to 2.0 (1.0 = normal)
  saturation: 1.3,      // 0.0 to 2.0 (1.0 = normal, 0 = grayscale)
  hue: 30,              // -180 to 180 degrees
  tint: {               // RGB tint color
    r: 1.0,
    g: 0.9,
    b: 0.8,
    a: 1.0
  }
});
```

### ChromaKeyEffect

Remove a specific color (e.g., green screen).

```typescript
new ChromaKeyEffect({
  type: EffectType.CHROMA_KEY,
  keyColor: { r: 0.0, g: 1.0, b: 0.0 },  // Green
  threshold: 0.4,       // 0.0 to 1.0
  smoothness: 0.1,      // Edge feathering
});
```

### BlurEffect

Apply Gaussian blur.

```typescript
new BlurEffect({
  type: EffectType.BLUR,
  radius: 5.0,          // Blur radius in pixels
  passes: 1,            // Number of blur passes
});
```

### SharpenEffect

Sharpen the image using a convolution kernel.

```typescript
new SharpenEffect({
  type: EffectType.SHARPEN,
  amount: 1.0,          // 0.0 to 2.0
});
```

### VignetteEffect

Darken the edges of the frame.

```typescript
new VignetteEffect({
  type: EffectType.VIGNETTE,
  amount: 0.5,          // 0.0 to 1.0
  radius: 0.75,         // 0.0 to 1.0
  smoothness: 0.45,     // Edge softness
});
```

### CustomEffect

Create effects with arbitrary shader uniforms.

```typescript
new CustomEffect({
  type: EffectType.CUSTOM,
  shaderName: 'myCustomShader',
  uniforms: {
    u_customParam: 1.5,
    u_customColor: [1.0, 0.0, 0.0],
  },
});
```

## Effect Manager

Manage multiple effects on a single node.

```typescript
const manager = new EffectManager();

// Add effects
manager.addEffect(colorEffect, 'color');
manager.addEffect(chromaKey, 'chroma');
manager.addEffect(vignette, 'vignette');

// Get merged uniforms
const uniforms = manager.getAllUniforms();

// Apply to node
manager.applyToNode(node);
```

### Effect Ordering

Effects are applied in the order they were added.

```typescript
// Reorder effects
manager.reorder(['chroma', 'color', 'vignette']);

// Move an effect
manager.moveEffect('color', 2);  // Move to position 2
```

### Enable/Disable

```typescript
// Disable an effect
effect.setEnabled(false);

// Disable all effects
manager.setAllEnabled(false);

// Check if any effects are enabled
if (manager.hasEnabledEffects()) {
  // ...
}
```

## Effect Presets

Quick setup for common looks:

```typescript
// Vibrant
const vibrant = EffectManager.createPreset('vibrant');

// Cool tone
const cool = EffectManager.createPreset('cool');

// Warm tone
const warm = EffectManager.createPreset('warm');

// Vintage look
const vintage = EffectManager.createPreset('vintage');

// Black & white
const bw = EffectManager.createPreset('blackwhite');

// Apply preset
vibrant.applyToNode(node);
```

## Intensity Control

All effects have a global intensity multiplier (0.0 to 1.0):

```typescript
// Set intensity
effect.setIntensity(0.5);  // 50% strength

// Animate effect
function fadeIn(progress) {
  effect.setIntensity(progress);  // 0.0 to 1.0
  node.applyEffects();
}
```

## Serialization

Save and load effect configurations:

```typescript
// Save
const json = manager.toJSON();
localStorage.setItem('effects', JSON.stringify(json));

// Load
const saved = JSON.parse(localStorage.getItem('effects'));
const restored = EffectManager.fromJSON(saved);
restored.applyToNode(node);
```

## Integration with RenderNode

Effects are built into `RenderNode`:

```typescript
const node = new RenderNode();

// Access effect manager
const manager = node.getEffectManager();

// Add effects
manager.addEffect(colorEffect);

// Apply effects (merges uniforms and selects shader)
node.applyEffects();
```

## Shader Integration

### Default Shader (video.frag.glsl)

Color adjustment, chroma key, and vignette effects work with the default video shader:

```glsl
uniform float u_brightness;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_hue;
uniform vec4 u_tintColor;
uniform bool u_useChromaKey;
uniform vec3 u_chromaKeyColor;
uniform float u_chromaKeyThreshold;
uniform float u_chromaKeySmoothness;
uniform float u_vignetteIntensity;
uniform float u_vignetteRadius;
uniform float u_vignetteSmoothness;
```

### Custom Shaders

Blur and sharpen require custom shaders:

- `blur.frag.glsl` - Gaussian blur shader
- `sharpen.frag.glsl` - Sharpening shader

The EffectManager automatically selects the required shader:

```typescript
const shader = manager.getRequiredShader();
// Returns: "blur", "sharpen", or null
```

## Performance

- **GPU-Accelerated:** All effects run on the GPU
- **Single Pass:** Most effects applied in one shader pass
- **Conditional:** Effects skipped if disabled or at default values
- **Efficient:** Uniforms cached and only updated when changed

### Performance Tips

1. Disable unused effects: `effect.setEnabled(false)`
2. Limit blur radius: Higher radius = more GPU work
3. Use intensity for animation: Smooth fade-in/fade-out
4. Combine compatible effects: Color + chroma + vignette in one shader

## API Reference

### Effect Base Class

```typescript
abstract class Effect {
  getType(): EffectType
  isEnabled(): boolean
  setEnabled(enabled: boolean): void
  getIntensity(): number
  setIntensity(intensity: number): void
  updateConfig(config: Partial<EffectConfig>): void
  getConfig(): EffectConfig
  abstract getUniforms(): Record<string, any>
  getShaderName(): string | null
  abstract clone(): Effect
  toJSON(): AnyEffectConfig
  static fromConfig(config: AnyEffectConfig): Effect
}
```

### EffectManager

```typescript
class EffectManager {
  addEffect(effect: Effect, id?: string): string
  removeEffect(id: string): boolean
  getEffect(id: string): Effect | undefined
  hasEffect(id: string): boolean
  getAllEffects(): Effect[]
  getEffectsByType(type: EffectType): Effect[]
  clear(): void
  getCount(): number
  hasEnabledEffects(): boolean
  setAllEnabled(enabled: boolean): void
  getAllUniforms(): Record<string, any>
  getRequiredShader(): string | null
  reorder(newOrder: string[]): void
  moveEffect(id: string, newIndex: number): void
  clone(): EffectManager
  toJSON(): { effects: Array<{ id: string; config: AnyEffectConfig }> }
  static fromJSON(data: ...): EffectManager
  static createPreset(preset: string): EffectManager
  applyToNode(node: any): void
}
```

## Examples

### Color Grading

```typescript
const manager = node.getEffectManager();

manager.addEffect(new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.1,
  contrast: 1.2,
  saturation: 1.1,
  tint: { r: 1.0, g: 0.95, b: 0.85 }
}));

manager.addEffect(new VignetteEffect({
  type: EffectType.VIGNETTE,
  amount: 0.4,
}));

node.applyEffects();
```

### Green Screen Removal

```typescript
const chromaKey = new ChromaKeyEffect({
  type: EffectType.CHROMA_KEY,
  keyColor: { r: 0.0, g: 1.0, b: 0.0 },
  threshold: 0.4,
  smoothness: 0.1,
});

node.getEffectManager().addEffect(chromaKey);
node.applyEffects();
```

### Animated Effect

```typescript
const effect = new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.3,
});

node.getEffectManager().addEffect(effect);

// Animate intensity
function animate(time) {
  const intensity = (Math.sin(time) + 1) / 2;  // 0 to 1
  effect.setIntensity(intensity);
  node.applyEffects();
  requestAnimationFrame(animate);
}
```

## Testing

The effects system has comprehensive test coverage:

- **47 tests** for Effect classes
- **35 tests** for EffectManager
- **82 tests total** - 100% passing

Run tests:

```bash
npm test effects/__tests__
```

## Documentation

- [STEP8_COMPLETION.md](../../../docs/player-webgl/STEP8_COMPLETION.md) - Full completion documentation
- [STEP8_QUICK_REFERENCE.md](../../../docs/player-webgl/STEP8_QUICK_REFERENCE.md) - API quick reference
- [STEP8_SESSION_SUMMARY.md](../../../docs/player-webgl/STEP8_SESSION_SUMMARY.md) - Implementation summary

## License

Part of the CLUV WebGL Player system.