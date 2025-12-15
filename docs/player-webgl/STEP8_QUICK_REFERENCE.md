# Step 8: Effects & Filters - Quick Reference

**Status:** ✅ COMPLETE  
**Last Updated:** 2024

---

## 📚 Quick Links

- [Full Documentation](./STEP8_COMPLETION.md)
- [Effect Class Tests](../../frontend/app/webgl/effects/__tests__/Effect.test.ts)
- [EffectManager Tests](../../frontend/app/webgl/effects/__tests__/EffectManager.test.ts)

---

## 🎯 Core Concepts

### Effect
Base class for all visual effects. Effects generate shader uniforms.

### EffectManager
Manages multiple effects on a single node. Handles ordering, merging uniforms, and shader selection.

### Effect Types
- `COLOR_ADJUSTMENT` - Brightness, contrast, saturation, hue, tint
- `CHROMA_KEY` - Green screen removal
- `BLUR` - Gaussian blur
- `SHARPEN` - Image sharpening
- `VIGNETTE` - Edge darkening
- `CUSTOM` - User-defined effects

---

## 🚀 Quick Start

### Basic Setup

```typescript
import {
  EffectManager,
  ColorAdjustmentEffect,
  EffectType,
} from '@/app/webgl/effects';

// Get effect manager from node
const effectManager = node.getEffectManager();

// Create effect
const effect = new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.2,
  contrast: 1.1,
  saturation: 1.3,
});

// Add effect
effectManager.addEffect(effect);

// Apply to node
node.applyEffects();
```

---

## 🎨 Effect API

### ColorAdjustmentEffect

```typescript
new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.2,      // -1.0 to 1.0 (0 = normal)
  contrast: 1.2,        // 0.0 to 2.0 (1.0 = normal)
  saturation: 1.5,      // 0.0 to 2.0 (1.0 = normal, 0 = grayscale)
  hue: 30,              // -180 to 180 degrees
  tint: {               // RGB tint with alpha
    r: 1.0,
    g: 0.9,
    b: 0.8,
    a: 1.0,
  },
  enabled: true,        // Optional, default true
  intensity: 1.0,       // Optional, 0.0 to 1.0, global multiplier
});

// Methods
effect.setBrightness(0.3);
effect.setContrast(1.1);
effect.setSaturation(1.2);
effect.setHue(45);
effect.setTint({ r: 1.0, g: 0.8, b: 0.6 });
```

### ChromaKeyEffect

```typescript
new ChromaKeyEffect({
  type: EffectType.CHROMA_KEY,
  keyColor: {           // Color to key out (0.0 to 1.0)
    r: 0.0,
    g: 1.0,             // Green screen
    b: 0.0,
  },
  threshold: 0.4,       // 0.0 to 1.0, how close color must be
  smoothness: 0.1,      // 0.0 to 1.0, edge feathering
});

// Methods
effect.setKeyColor({ r: 0.0, g: 0.0, b: 1.0 }); // Blue screen
effect.setThreshold(0.35);
effect.setSmoothness(0.15);
```

### BlurEffect

```typescript
new BlurEffect({
  type: EffectType.BLUR,
  radius: 5.0,          // Blur radius in pixels
  passes: 1,            // Number of blur passes (1-N)
});

// Methods
effect.setRadius(8.0);
effect.setPasses(2);

// Requires custom shader: "blur"
```

### SharpenEffect

```typescript
new SharpenEffect({
  type: EffectType.SHARPEN,
  amount: 1.0,          // 0.0 to 2.0
});

// Methods
effect.setAmount(1.5);

// Requires custom shader: "sharpen"
```

### VignetteEffect

```typescript
new VignetteEffect({
  type: EffectType.VIGNETTE,
  amount: 0.6,          // 0.0 to 1.0, vignette darkness
  radius: 0.75,         // 0.0 to 1.0, vignette size
  smoothness: 0.45,     // 0.0 to 1.0, edge softness
});

// Methods
effect.setVignetteIntensity(0.7);
effect.setRadius(0.8);
effect.setSmoothness(0.5);
```

### CustomEffect

```typescript
new CustomEffect({
  type: EffectType.CUSTOM,
  shaderName: 'myShader',
  uniforms: {
    u_customParam: 1.5,
    u_customColor: [1.0, 0.0, 0.0],
  },
});

// Methods
effect.setShader('anotherShader');
effect.setUniform('u_customParam', 2.0);
```

---

## 🎛️ Effect Manager API

### Adding Effects

```typescript
const manager = new EffectManager();

// Add effect (auto-generated ID)
const id = manager.addEffect(effect);

// Add effect with custom ID
manager.addEffect(effect, 'myEffect');
```

### Managing Effects

```typescript
// Get effect
const effect = manager.getEffect('myEffect');

// Check if exists
if (manager.hasEffect('myEffect')) { ... }

// Remove effect
manager.removeEffect('myEffect');

// Get all effects
const effects = manager.getAllEffects();

// Get by type
const colorEffects = manager.getEffectsByType(EffectType.COLOR_ADJUSTMENT);

// Clear all
manager.clear();
```

### Effect Ordering

```typescript
// Effects are applied in order
manager.addEffect(effect1, 'first');
manager.addEffect(effect2, 'second');
manager.addEffect(effect3, 'third');

// Reorder
manager.reorder(['third', 'first', 'second']);

// Move effect
manager.moveEffect('first', 2); // Move to position 2
```

### Enable/Disable

```typescript
// Check if any enabled
if (manager.hasEnabledEffects()) { ... }

// Enable/disable all
manager.setAllEnabled(false);
manager.setAllEnabled(true);

// Individual effect
effect.setEnabled(false);
```

### Get Uniforms

```typescript
// Get merged uniforms from all effects
const uniforms = manager.getAllUniforms();
// Returns: { u_brightness: 0.2, u_contrast: 1.1, ... }

// Get required shader
const shader = manager.getRequiredShader();
// Returns: "blur", "sharpen", or null
```

### Apply to Node

```typescript
// Convenience method
manager.applyToNode(node);
// Equivalent to:
// node.setCustomUniforms(manager.getAllUniforms());
// node.setShaderName(manager.getRequiredShader());
```

---

## 🎨 Effect Presets

Quick setup for common looks:

```typescript
import { EffectManager } from '@/app/webgl/effects';

// Vibrant
const vibrant = EffectManager.createPreset('vibrant');
// +0.1 brightness, 1.2 contrast, 1.5 saturation

// Cool
const cool = EffectManager.createPreset('cool');
// Blue tint (0.8, 0.9, 1.0), 0.9 saturation

// Warm
const warm = EffectManager.createPreset('warm');
// Orange tint (1.0, 0.9, 0.8), 1.1 saturation

// Vintage
const vintage = EffectManager.createPreset('vintage');
// Sepia tint, contrast, low saturation, vignette

// Black & White
const bw = EffectManager.createPreset('blackwhite');
// 0 saturation (grayscale), 1.2 contrast

// Apply preset
vibrant.applyToNode(node);
```

---

## 🔧 Common Patterns

### Multiple Effects

```typescript
const manager = node.getEffectManager();

// Color correction
manager.addEffect(new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.1,
  contrast: 1.2,
}), 'color');

// Green screen
manager.addEffect(new ChromaKeyEffect({
  type: EffectType.CHROMA_KEY,
  keyColor: { r: 0.0, g: 1.0, b: 0.0 },
}), 'chroma');

// Vignette
manager.addEffect(new VignetteEffect({
  type: EffectType.VIGNETTE,
  amount: 0.5,
}), 'vignette');

node.applyEffects();
```

### Dynamic Effect Control

```typescript
const effect = manager.getEffect('color') as ColorAdjustmentEffect;

// Animate intensity
function animateEffect(progress: number) {
  effect.setIntensity(progress); // 0.0 to 1.0
  node.applyEffects();
}

// Toggle effect
effect.setEnabled(!effect.isEnabled());
node.applyEffects();

// Update parameters
effect.setBrightness(0.3);
effect.setSaturation(1.5);
node.applyEffects();
```

### Save/Load Effects

```typescript
// Save
const json = manager.toJSON();
localStorage.setItem('effects', JSON.stringify(json));

// Load
const saved = JSON.parse(localStorage.getItem('effects'));
const restored = EffectManager.fromJSON(saved);
restored.applyToNode(node);
```

### Clone Effects

```typescript
// Clone single effect
const original = new ColorAdjustmentEffect({ ... });
const clone = original.clone();

// Clone manager
const originalManager = node.getEffectManager();
const clonedManager = originalManager.clone();
```

---

## 🎬 Shader Uniforms Reference

### Video Shader (video.frag.glsl)

Supports most effects without custom shader:

```glsl
// Color adjustments
uniform float u_brightness;        // -1.0 to 1.0
uniform float u_contrast;          // 0.0 to 2.0
uniform float u_saturation;        // 0.0 to 2.0
uniform float u_hue;               // -180.0 to 180.0
uniform vec4 u_tintColor;          // RGBA (0.0 to 1.0)

// Chroma key
uniform bool u_useChromaKey;       // Enable/disable
uniform vec3 u_chromaKeyColor;     // RGB key color
uniform float u_chromaKeyThreshold;
uniform float u_chromaKeySmoothness;

// Vignette
uniform float u_vignetteIntensity;
uniform float u_vignetteRadius;
uniform float u_vignetteSmoothness;
```

### Blur Shader (blur.frag.glsl)

```glsl
uniform float u_blurRadius;        // Blur radius in pixels
uniform vec2 u_textureSize;        // Texture dimensions
```

### Sharpen Shader (sharpen.frag.glsl)

```glsl
uniform float u_sharpenAmount;     // 0.0 to 2.0
uniform vec2 u_textureSize;        // Texture dimensions
```

---

## 🧪 Testing

### Test an Effect

```typescript
import { describe, it, expect } from 'vitest';
import { ColorAdjustmentEffect, EffectType } from '../Effect';

it('should create color effect', () => {
  const effect = new ColorAdjustmentEffect({
    type: EffectType.COLOR_ADJUSTMENT,
    brightness: 0.3,
  });
  
  const uniforms = effect.getUniforms();
  expect(uniforms.u_brightness).toBe(0.3);
});
```

### Test Effect Manager

```typescript
it('should merge uniforms', () => {
  const manager = new EffectManager();
  
  manager.addEffect(new ColorAdjustmentEffect({
    type: EffectType.COLOR_ADJUSTMENT,
    brightness: 0.2,
  }));
  
  manager.addEffect(new ChromaKeyEffect({
    type: EffectType.CHROMA_KEY,
    keyColor: { r: 0, g: 1, b: 0 },
  }));
  
  const uniforms = manager.getAllUniforms();
  expect(uniforms.u_brightness).toBe(0.2);
  expect(uniforms.u_useChromaKey).toBe(true);
});
```

---

## 🚨 Common Issues

### Issue: Effect not visible

**Solutions:**
- Check `effect.isEnabled()` returns `true`
- Check `effect.getIntensity()` is > 0
- Verify uniforms with `effect.getUniforms()`
- Call `node.applyEffects()` after changes

### Issue: Blur/Sharpen not working

**Solution:** These require custom shaders. Ensure shaders are registered:

```typescript
shaderManager.register({
  name: 'blur',
  vertex: blurVertexShader,
  fragment: blurFragmentShader,
});
```

### Issue: Effect parameters not updating

**Solution:** Call `node.applyEffects()` after parameter changes:

```typescript
effect.setBrightness(0.5);
node.applyEffects(); // ← Required!
```

### Issue: Effects conflicting

**Cause:** Later effects override earlier ones if they set the same uniforms.

**Solution:** Check effect order with `manager.getAllEffects()` and reorder if needed.

---

## 📊 Performance Tips

1. **Disable unused effects:** `effect.setEnabled(false)`
2. **Limit blur radius:** Higher radius = more GPU work
3. **Use intensity for fade:** Smooth fade-in/out with `setIntensity()`
4. **Combine compatible effects:** Color + chroma + vignette in one shader
5. **Cache uniforms:** Don't call `getAllUniforms()` every frame

---

## 🔗 Integration with RenderNode

Effects are automatically integrated into `RenderNode`:

```typescript
// RenderNode has built-in EffectManager
const node = new RenderNode();

// Access effect manager
const manager = node.getEffectManager();

// Add effects
manager.addEffect(colorEffect);

// Apply effects (merges into custom uniforms)
node.applyEffects();

// Effects are included when node is rendered
renderer.render(scene, camera);
```

---

## 📚 Type Definitions

### Effect Types

```typescript
enum EffectType {
  COLOR_ADJUSTMENT = "color_adjustment",
  CHROMA_KEY = "chroma_key",
  BLUR = "blur",
  SHARPEN = "sharpen",
  VIGNETTE = "vignette",
  CUSTOM = "custom",
}
```

### Effect Config Interfaces

```typescript
interface EffectConfig {
  type: EffectType;
  enabled?: boolean;
  intensity?: number;
}

interface ColorAdjustmentConfig extends EffectConfig {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  tint?: { r: number; g: number; b: number; a?: number };
}

// ... (see Effect.ts for full definitions)
```

---

## 🎓 Best Practices

1. **Use Presets:** Start with presets and customize
2. **Name Your Effects:** Use meaningful IDs when adding effects
3. **Group Related Effects:** Keep color adjustments together
4. **Test Incrementally:** Test each effect individually first
5. **Document Custom Effects:** Comment custom shader uniforms
6. **Save Configurations:** Serialize effect settings for user presets
7. **Validate Ranges:** Effects clamp values, but validate in UI too

---

## 📖 Full Example

```typescript
import {
  EffectManager,
  ColorAdjustmentEffect,
  ChromaKeyEffect,
  VignetteEffect,
  EffectType,
} from '@/app/webgl/effects';

// Create node with effects
function setupVideoNode(node: RenderNode) {
  const manager = node.getEffectManager();
  
  // Color correction
  const colorEffect = new ColorAdjustmentEffect({
    type: EffectType.COLOR_ADJUSTMENT,
    brightness: 0.1,
    contrast: 1.2,
    saturation: 1.1,
  });
  manager.addEffect(colorEffect, 'color');
  
  // Green screen removal
  const chromaKey = new ChromaKeyEffect({
    type: EffectType.CHROMA_KEY,
    keyColor: { r: 0.0, g: 1.0, b: 0.0 },
    threshold: 0.4,
    smoothness: 0.1,
  });
  manager.addEffect(chromaKey, 'chroma');
  
  // Subtle vignette
  const vignette = new VignetteEffect({
    type: EffectType.VIGNETTE,
    amount: 0.3,
    radius: 0.8,
  });
  manager.addEffect(vignette, 'vignette');
  
  // Apply all effects
  node.applyEffects();
  
  return { colorEffect, chromaKey, vignette };
}

// Use in timeline
const node = sceneBuilder.getNodeForClip(clip);
const effects = setupVideoNode(node);

// Animate effects
function updateEffects(time: number) {
  // Fade in color effect
  effects.colorEffect.setIntensity(Math.min(1.0, time / 2.0));
  node.applyEffects();
}
```

---

## 🔍 Debugging

### Log Effect State

```typescript
const effect = manager.getEffect('color');
console.log('Enabled:', effect.isEnabled());
console.log('Intensity:', effect.getIntensity());
console.log('Uniforms:', effect.getUniforms());
console.log('Config:', effect.getConfig());
```

### Log Manager State

```typescript
console.log('Effect count:', manager.getAllEffects().length);
console.log('Has enabled:', manager.hasEnabledEffects());
console.log('All uniforms:', manager.getAllUniforms());
console.log('Required shader:', manager.getRequiredShader());
```

### Inspect in Renderer

Check uniforms are applied:

```typescript
const node = scene.getVisibleNodes()[0];
console.log('Custom uniforms:', node.getCustomUniforms());
console.log('Shader name:', node.getShaderName());
```

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2024  
**For:** Step 8 - Effects & Filters

For complete documentation, see [STEP8_COMPLETION.md](./STEP8_COMPLETION.md)