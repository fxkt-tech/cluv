# Step 7: Image, Text, and Shape Clips - Quick Reference

**Date:** 2024
**Status:** ✅ Complete

---

## Quick Start

### Creating Text Clips

```typescript
import { TextTexture, TextAlign, TextBaseline } from "@/webgl/texture/TextTexture";

// Create text texture
const textTexture = new TextTexture(contextManager, {
  text: "Hello World",
  fontSize: 48,
  fontFamily: "Arial, sans-serif",
  color: "#ffffff",
  textAlign: TextAlign.CENTER,
  padding: 20,
  shadowColor: "rgba(0,0,0,0.5)",
  shadowBlur: 5
});

// Update text
textTexture.setText("New Text");
textTexture.update();

// Measure text dimensions
const dimensions = textTexture.measureText("Some Text");
console.log(dimensions); // { width: 100, height: 50 }

// Get canvas for custom rendering
const canvas = textTexture.getCanvas();

// Dispose when done
textTexture.dispose();
```

### Creating Shape Clips

```typescript
import { ShapeTexture, ShapeType } from "@/webgl/texture/ShapeTexture";

// Create rectangle
const rectTexture = new ShapeTexture(contextManager, {
  type: ShapeType.RECTANGLE,
  width: 200,
  height: 100,
  fillColor: "#ff0000",
  strokeColor: "#000000",
  strokeWidth: 3
});

// Create circle
const circleTexture = new ShapeTexture(contextManager, {
  type: ShapeType.CIRCLE,
  width: 150,
  height: 150,
  fillColor: "#00ff00"
});

// Create star
const starTexture = new ShapeTexture(contextManager, {
  type: ShapeType.STAR,
  width: 200,
  height: 200,
  sides: 5,
  innerRadius: 0.5,
  fillColor: "#ffdd00",
  rotation: 30
});

// Update shape
starTexture.setShapeConfig({
  rotation: 60,
  fillColor: "#ff0000"
});
starTexture.update();

// Dispose when done
starTexture.dispose();
```

---

## TextTexture API

### Constructor

```typescript
new TextTexture(
  contextManager: WebGLContextManager,
  textConfig: TextRenderConfig,
  textureConfig?: TextureConfig
)
```

### TextRenderConfig

```typescript
interface TextRenderConfig {
  text: string;                      // Text content
  fontFamily?: string;               // Default: "Arial, sans-serif"
  fontSize?: number;                 // Default: 32
  fontWeight?: string | number;      // Default: "normal"
  fontStyle?: string;                // Default: "normal"
  color?: string;                    // Default: "#ffffff"
  backgroundColor?: string;          // Default: "transparent"
  textAlign?: TextAlign;             // Default: LEFT
  textBaseline?: TextBaseline;       // Default: TOP
  lineHeight?: number;               // Default: 1.2
  padding?: number;                  // Default: 10
  maxWidth?: number;                 // Default: 0 (no wrapping)
  strokeColor?: string;              // Default: "transparent"
  strokeWidth?: number;              // Default: 0
  shadowColor?: string;              // Default: "transparent"
  shadowBlur?: number;               // Default: 0
  shadowOffsetX?: number;            // Default: 0
  shadowOffsetY?: number;            // Default: 0
}
```

### Enums

```typescript
enum TextAlign {
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right"
}

enum TextBaseline {
  TOP = "top",
  MIDDLE = "middle",
  BOTTOM = "bottom",
  ALPHABETIC = "alphabetic",
  HANGING = "hanging"
}
```

### Methods

```typescript
// Update text content
setText(text: string): void

// Update configuration
setTextConfig(config: Partial<TextRenderConfig>): void

// Get current text
getText(): string

// Get current configuration
getTextConfig(): Readonly<TextRenderConfig>

// Measure text dimensions
measureText(text: string): { width: number; height: number }

// Get canvas element
getCanvas(): HTMLCanvasElement

// Update texture (call after changes)
update(): void

// Dispose resources
dispose(): void
```

### Properties (inherited from Texture)

```typescript
width: number        // Texture width
height: number       // Texture height
isReady: boolean     // Whether texture is ready for use
```

---

## ShapeTexture API

### Constructor

```typescript
new ShapeTexture(
  contextManager: WebGLContextManager,
  shapeConfig: ShapeRenderConfig,
  textureConfig?: TextureConfig
)
```

### ShapeRenderConfig

```typescript
interface ShapeRenderConfig {
  type: ShapeType;                   // Shape type (required)
  width: number;                     // Canvas width (required)
  height: number;                    // Canvas height (required)
  fillColor?: string;                // Default: "#ffffff"
  strokeColor?: string;              // Default: "transparent"
  strokeWidth?: number;              // Default: 0
  cornerRadius?: number;             // For rounded rectangles
  sides?: number;                    // For polygons/stars, default: 6
  innerRadius?: number;              // For stars, default: 0.5
  rotation?: number;                 // Rotation in degrees, default: 0
  shadowColor?: string;              // Default: "transparent"
  shadowBlur?: number;               // Default: 0
  shadowOffsetX?: number;            // Default: 0
  shadowOffsetY?: number;            // Default: 0
}
```

### ShapeType Enum

```typescript
enum ShapeType {
  RECTANGLE = "rectangle",
  CIRCLE = "circle",
  ELLIPSE = "ellipse",
  POLYGON = "polygon",
  ROUNDED_RECTANGLE = "rounded_rectangle",
  STAR = "star",
  TRIANGLE = "triangle"
}
```

### Methods

```typescript
// Update shape configuration
setShapeConfig(config: Partial<ShapeRenderConfig>): void

// Get current configuration
getShapeConfig(): Readonly<ShapeRenderConfig>

// Get canvas element
getCanvas(): HTMLCanvasElement

// Update texture (call after changes)
update(): void

// Dispose resources
dispose(): void
```

### Properties (inherited from Texture)

```typescript
width: number        // Texture width
height: number       // Texture height
isReady: boolean     // Whether texture is ready for use
```

---

## SceneBuilder Integration

### Updated Constructor

```typescript
new SceneBuilder(
  sceneManager: SceneManager,
  resourceLoader: ResourceLoader,
  contextManager: WebGLContextManager,  // NEW: Required for texture creation
  config: SceneBuildConfig
)
```

### Clip Type Handling

SceneBuilder automatically handles clip types:

```typescript
// Video clips
{
  type: "video",
  resourceSrc: "path/to/video.mp4"
}

// Image clips
{
  type: "image",
  resourceSrc: "path/to/image.jpg"
}

// Text clips (with custom properties)
{
  type: "text",
  textContent: "Hello World",
  textConfig: {
    fontSize: 48,
    color: "#ffffff"
  }
}
```

### New Methods

```typescript
// Get cached texture for a clip (debugging)
getCachedTexture(clipId: string): TextTexture | ShapeTexture | null
```

### Node Type Mapping

```typescript
"video" → NodeType.VIDEO
"image" → NodeType.IMAGE
"text"  → NodeType.TEXT
"audio" → null (no visual)
```

---

## Common Patterns

### Basic Text with Shadow

```typescript
const textTexture = new TextTexture(contextManager, {
  text: "Title",
  fontSize: 64,
  fontWeight: "bold",
  color: "#ffffff",
  textAlign: TextAlign.CENTER,
  shadowColor: "rgba(0,0,0,0.8)",
  shadowBlur: 10,
  shadowOffsetY: 3
});
```

### Multi-line Text with Wrapping

```typescript
const textTexture = new TextTexture(contextManager, {
  text: "This is a long text that will wrap to multiple lines",
  fontSize: 24,
  maxWidth: 400,
  lineHeight: 1.5,
  padding: 20
});
```

### Outlined Text

```typescript
const textTexture = new TextTexture(contextManager, {
  text: "Outlined",
  fontSize: 48,
  color: "#ffffff",
  strokeColor: "#000000",
  strokeWidth: 3
});
```

### Rounded Rectangle Button

```typescript
const buttonTexture = new ShapeTexture(contextManager, {
  type: ShapeType.ROUNDED_RECTANGLE,
  width: 200,
  height: 60,
  cornerRadius: 10,
  fillColor: "#4CAF50",
  strokeColor: "#2E7D32",
  strokeWidth: 2,
  shadowColor: "rgba(0,0,0,0.3)",
  shadowBlur: 5,
  shadowOffsetY: 2
});
```

### Animated Star

```typescript
let rotation = 0;

function animate() {
  rotation += 1;
  starTexture.setShapeConfig({ rotation });
  starTexture.update();
  
  requestAnimationFrame(animate);
}
```

### Dynamic Text Updates

```typescript
let counter = 0;

function updateCounter() {
  textTexture.setText(`Count: ${counter}`);
  textTexture.update();
  counter++;
}

setInterval(updateCounter, 1000);
```

---

## Timeline Clip Examples

### Text Clip Definition

```typescript
const textClip: Clip = {
  id: "text1",
  name: "Title Text",
  type: "text",
  trackId: "track1",
  startTime: 0,
  duration: 5,
  position: { x: 0.5, y: 0.2 },
  scale: 1.0,
  rotation: 0,
  opacity: 1.0,
  volume: 1.0,
  trimStart: 0,
  trimEnd: 5,
  
  // Custom properties for text
  textContent: "My Video Title",
  textConfig: {
    fontSize: 64,
    fontFamily: "Impact, sans-serif",
    color: "#ffffff",
    textAlign: TextAlign.CENTER,
    shadowColor: "rgba(0,0,0,0.8)",
    shadowBlur: 10
  }
};
```

### Shape Clip Definition

```typescript
const shapeClip: Clip = {
  id: "shape1",
  name: "Lower Third",
  type: "shape", // Note: Extend MediaType to include "shape"
  trackId: "track2",
  startTime: 3,
  duration: 7,
  position: { x: 0.5, y: 0.85 },
  scale: 1.0,
  rotation: 0,
  opacity: 0.9,
  volume: 1.0,
  trimStart: 0,
  trimEnd: 7,
  
  // Custom properties for shape
  shapeConfig: {
    type: ShapeType.ROUNDED_RECTANGLE,
    width: 800,
    height: 100,
    cornerRadius: 10,
    fillColor: "rgba(0,0,0,0.7)",
    strokeColor: "#ffffff",
    strokeWidth: 2
  }
};
```

---

## Performance Tips

### 1. Text Texture Sizing

```typescript
// ❌ Inefficient - Large canvas
const badText = new TextTexture(contextManager, {
  text: "Small",
  fontSize: 200,  // Very large font
});

// ✅ Efficient - Reasonable size
const goodText = new TextTexture(contextManager, {
  text: "Small",
  fontSize: 48,   // Reasonable font
  padding: 10
});
```

### 2. Update Only When Needed

```typescript
// ❌ Updates every frame
function everyFrame() {
  textTexture.update();  // Expensive!
}

// ✅ Update only when content changes
function onTextChange(newText: string) {
  if (textTexture.getText() !== newText) {
    textTexture.setText(newText);
    textTexture.update();
  }
}
```

### 3. Reuse Textures

```typescript
// ❌ Creates new texture every time
function changeText(text: string) {
  const newTexture = new TextTexture(contextManager, { text });
  // Memory leak - old texture not disposed!
}

// ✅ Reuse existing texture
function changeText(text: string) {
  textTexture.setText(text);
  textTexture.update();
}
```

### 4. Dispose Unused Textures

```typescript
// When removing clip or changing texture
if (oldTexture) {
  oldTexture.dispose();
  oldTexture = null;
}
```

---

## Troubleshooting

### Issue: Canvas context creation fails

**Problem:** `TextTexture: Failed to create canvas context`

**Solution:** Canvas 2D API not available (jsdom environment)
```typescript
// For tests, mock canvas or run in browser environment
// Or install canvas package: npm install canvas
```

### Issue: Text appears pixelated

**Problem:** Low-quality text when scaled up

**Solutions:**
1. Increase font size in TextRenderConfig
2. Use higher DPI canvas (multiply dimensions by devicePixelRatio)
3. Consider SDF text rendering for better quality

### Issue: Shape not visible

**Problem:** Shape renders but doesn't appear

**Check:**
```typescript
// Ensure fill or stroke is visible
shapeConfig: {
  fillColor: "#ff0000",     // Not transparent
  // OR
  strokeColor: "#000000",   // With strokeWidth > 0
  strokeWidth: 3
}
```

### Issue: Texture not updating

**Problem:** Changed config but texture doesn't update

**Solution:** Call `update()` after changes
```typescript
textTexture.setText("New Text");
textTexture.update();  // Required!
```

---

## Common Errors

### Error: "contextManager is undefined"

```typescript
// ❌ Missing contextManager parameter
new SceneBuilder(sceneManager, resourceLoader, config);

// ✅ Include contextManager
new SceneBuilder(sceneManager, resourceLoader, contextManager, config);
```

### Error: "Cannot read property 'getContext' of null"

```typescript
// Canvas not available in environment
// Use browser or install canvas package
```

---

## TypeScript Types

### Import Types

```typescript
import type { TextRenderConfig } from "@/webgl/texture/TextTexture";
import type { ShapeRenderConfig } from "@/webgl/texture/ShapeTexture";
import type { WebGLContextManager } from "@/webgl/core/WebGLContext";
```

### Extending Clip Type

```typescript
// Add custom properties to Clip interface
interface ExtendedClip extends Clip {
  textContent?: string;
  textConfig?: TextRenderConfig;
  shapeConfig?: ShapeRenderConfig;
}
```

---

## Testing

### Unit Tests

```typescript
import { TextTexture, TextAlign } from "./TextTexture";
import { ShapeTexture, ShapeType } from "./ShapeTexture";

// Note: Requires browser environment or canvas package

describe("TextTexture", () => {
  it("should create text texture", () => {
    const texture = new TextTexture(mockContext, {
      text: "Test"
    });
    expect(texture.isReady).toBe(true);
  });
});

describe("ShapeTexture", () => {
  it("should create circle", () => {
    const texture = new ShapeTexture(mockContext, {
      type: ShapeType.CIRCLE,
      width: 100,
      height: 100
    });
    expect(texture.isReady).toBe(true);
  });
});
```

---

## References

- **TextTexture:** `frontend/app/webgl/texture/TextTexture.ts`
- **ShapeTexture:** `frontend/app/webgl/texture/ShapeTexture.ts`
- **SceneBuilder:** `frontend/app/webgl/player/SceneBuilder.ts`
- **Full Documentation:** `docs/STEP7_COMPLETION.md`
- **Test Suite:** `frontend/app/webgl/texture/TextTexture.test.ts` (32 tests)
- **Test Suite:** `frontend/app/webgl/texture/ShapeTexture.test.ts` (33 tests)

---

## Next Steps

After implementing text and shape clips:

1. **Step 8:** Effects & Filters (color adjustments, chroma key, blend modes)
2. **Step 9:** UI Integration (connect player to timeline controls)
3. **Step 10:** Performance Optimizations (culling, batching, atlasing)
4. **Future:** SDF text rendering for better quality
5. **Future:** Texture atlasing for better performance