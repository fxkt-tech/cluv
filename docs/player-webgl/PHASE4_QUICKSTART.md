# Phase 4 Quick Start Guide

**WebGL Renderer Core - Get Started in 5 Minutes**

---

## Overview

Phase 4 provides the complete rendering pipeline for the WebGL Player. This guide will help you get a basic scene rendering in minutes.

---

## Prerequisites

- Phase 1, 2, and 3 modules installed
- Canvas element in your HTML
- Basic TypeScript/JavaScript knowledge

---

## Quick Setup

### Step 1: HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; overflow: hidden; }
    #canvas { width: 100vw; height: 100vh; display: block; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### Step 2: Basic Renderer Setup

```typescript
import { WebGLContextManager } from './webgl/core/WebGLContext';
import { ShaderManager, BUILTIN_SHADERS } from './webgl/shader';
import { TextureManager } from './webgl/texture';
import { GeometryManager } from './webgl/geometry';
import { Camera } from './webgl/scene/Camera';
import { SceneManager } from './webgl/scene/SceneManager';
import { RenderNode, NodeType } from './webgl/scene/RenderNode';
import { WebGLRenderer, RenderLoop } from './webgl/renderer';

// Get canvas
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Initialize WebGL
const context = new WebGLContextManager(canvas);
const shaderManager = new ShaderManager(context);
const textureManager = new TextureManager(context);
const geometryManager = new GeometryManager(context);

// Register shaders
shaderManager.register(BUILTIN_SHADERS.BASE);

// Create scene
const sceneManager = new SceneManager();
const layer = sceneManager.createLayer('main', 0);
const camera = Camera.createOrthographic2D(canvas.width, canvas.height);

// Create renderer
const renderer = new WebGLRenderer(
  context,
  shaderManager,
  textureManager,
  geometryManager,
  { clearColor: [0.2, 0.2, 0.2, 1.0] }
);

// Create render loop
const loop = new RenderLoop({
  onRender: () => renderer.render(sceneManager, camera, 0)
});

console.log('WebGL Player ready!');
```

### Step 3: Add Content

```typescript
// Add an image
const imageNode = new RenderNode({
  position: { x: canvas.width / 2, y: canvas.height / 2 },
  scale: { x: 400, y: 300 },
});
imageNode.setShaderName('base');
layer.addNode(imageNode);

// Load texture
const result = await textureManager.createImageFromURL('/image.jpg');
if (result.success) {
  imageNode.setTexture(result.texture);
}
```

---

## Common Use Cases

### Video Playback

```typescript
import { VideoTexture } from './webgl/texture';
import { BlendMode } from './webgl/scene/RenderNode';

// Register video shader
shaderManager.register(BUILTIN_SHADERS.VIDEO);

// Create video node
const videoNode = new RenderNode({
  type: NodeType.VIDEO,
  position: { x: 640, y: 360 },
  scale: { x: 1280, y: 720 },
  blendMode: BlendMode.NORMAL,
});
videoNode.setShaderName('video');
layer.addNode(videoNode);

// Load and play video
const videoResult = await textureManager.createVideoFromURL('/video.mp4', {
  autoUpdate: true,
  loop: true,
});

if (videoResult.success) {
  const videoTexture = videoResult.texture as VideoTexture;
  videoNode.setTexture(videoTexture);
  await videoTexture.play();
}
```

### Color Effects

```typescript
// Add color correction
videoNode.setCustomUniforms({
  u_brightness: 0.1,    // +10% brightness
  u_contrast: 1.2,      // +20% contrast
  u_saturation: 1.1,    // +10% saturation
  u_hue: 0.0,           // No hue shift
});

// Update effects in real-time
function updateBrightness(value: number) {
  const uniforms = videoNode.getCustomUniforms();
  uniforms.u_brightness = value;
  videoNode.setCustomUniforms(uniforms);
}
```

### Green Screen (Chroma Key)

```typescript
videoNode.setCustomUniforms({
  u_chromaKey: [0.0, 1.0, 0.0],      // Green color
  u_chromaKeyThreshold: 0.4,         // Sensitivity
  u_chromaKeySmooth: 0.1,            // Edge smoothing
});
```

### Multiple Layers

```typescript
// Background layer
const bgLayer = sceneManager.createLayer('background', 0);
const bgNode = new RenderNode({
  position: { x: 640, y: 360 },
  scale: { x: 1280, y: 720 },
});
bgNode.setShaderName('base');
bgLayer.addNode(bgNode);

// Video layer
const videoLayer = sceneManager.createLayer('video', 1);
// ... add video node ...

// Overlay layer
const overlayLayer = sceneManager.createLayer('overlay', 2);
const logoNode = new RenderNode({
  position: { x: 100, y: 100 },
  scale: { x: 150, y: 150 },
  opacity: 0.8,
  blendMode: BlendMode.ADD,
});
logoNode.setShaderName('base');
overlayLayer.addNode(logoNode);
```

### Timeline Playback

```typescript
// Set timing for clips
videoNode.setTiming(0, 10);      // Start at 0s, duration 10s
imageNode.setTiming(10, 5);      // Start at 10s, duration 5s

// In render loop
let currentTime = 0;
const loop = new RenderLoop({
  onUpdate: (deltaTime) => {
    currentTime += deltaTime;
  },
  onRender: () => {
    renderer.render(sceneManager, camera, currentTime);
  },
});

// Control playback
function seek(time: number) {
  currentTime = time;
}

function pause() {
  loop.pause();
}

function play() {
  loop.resume();
}
```

---

## Performance Monitoring

```typescript
// Enable stats
setInterval(() => {
  const loopStats = loop.getStats();
  const renderStats = renderer.getStats();
  
  console.log({
    fps: loopStats.fps.toFixed(1),
    frameTime: loopStats.frameTime.toFixed(2) + 'ms',
    drawCalls: renderStats.drawCalls,
    nodes: renderStats.nodesRendered,
  });
}, 1000);

// Get detailed stats
const stateStats = renderer.getRenderState().getStats();
console.log('State changes:', stateStats.stateChanges);
console.log('Program changes:', stateStats.programChanges);
```

---

## Window Resize Handling

```typescript
function handleResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  canvas.width = width;
  canvas.height = height;
  
  renderer.resize(width, height);
  camera.setViewport(0, 0, width, height);
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', handleResize);
```

---

## Cleanup

```typescript
// When done, cleanup resources
function cleanup() {
  loop.dispose();
  renderer.dispose();
  sceneManager.dispose();
  textureManager.disposeAll();
  shaderManager.disposeAll();
  geometryManager.dispose();
  context.dispose();
}

// Call on page unload
window.addEventListener('beforeunload', cleanup);
```

---

## Configuration Options

### Renderer Options

```typescript
const renderer = new WebGLRenderer(context, shaderManager, textureManager, geometryManager, {
  clearColor: [0.1, 0.1, 0.1, 1.0],  // Background color
  enableDepthTest: false,             // For 3D scenes
  enableCullFace: false,              // Back-face culling
  autoClear: true,                    // Auto clear canvas
  autoUpdateTextures: true,           // Auto update videos
  enableBatching: true,               // Batch by shader
  enableFrustumCulling: true,         // View culling (TODO)
});
```

### Render Loop Options

```typescript
const loop = new RenderLoop(callbacks, {
  targetFPS: 60,           // Target frame rate
  fixedTimeStep: false,    // Fixed vs variable time step
  timeStep: 1/60,          // Fixed step size
  maxFrameTime: 0.25,      // Max delta time (prevent spiral)
  autoStart: true,         // Start immediately
  statsWindow: 60,         // Stats averaging window
});
```

---

## Troubleshooting

### Issue: Black Screen

**Check:**
1. Canvas size is set correctly
2. Shader is registered and compiled
3. Texture is loaded successfully
4. Node is in visible range of camera
5. Node opacity > 0 and visible = true

**Debug:**
```typescript
console.log('Camera:', camera.getViewport());
console.log('Node:', node.getPosition(), node.getScale());
console.log('Texture:', node.getTexture());
console.log('Shader:', node.getShaderName());
```

### Issue: Low FPS

**Check:**
1. Enable batching: `enableBatching: true`
2. Reduce node count or enable culling
3. Check video count and resolution
4. Monitor stats: `renderer.getStats()`

**Optimize:**
```typescript
// Check performance bottleneck
const stats = renderer.getStats();
console.log('Draw calls:', stats.drawCalls);      // Should be low
console.log('State changes:', renderState.getStats().stateChanges); // Should be minimal
console.log('Nodes rendered:', stats.nodesRendered); // vs total nodes
```

### Issue: Video Not Playing

**Check:**
1. Video texture created with `autoUpdate: true`
2. Called `videoTexture.play()` 
3. Render loop is running
4. Browser autoplay policy (may need user interaction)

**Fix:**
```typescript
// Ensure user interaction
canvas.addEventListener('click', async () => {
  if (videoTexture) {
    await videoTexture.play();
  }
});
```

---

## Next Steps

1. **Add More Content:** Load images, videos, create layers
2. **Implement Effects:** Use custom uniforms for visual effects
3. **Add Interaction:** Mouse/touch picking with `sceneManager.pickNode()`
4. **Timeline Control:** Implement scrubbing, play/pause
5. **Performance:** Monitor stats, optimize batching

---

## Full Example

See `frontend/app/webgl/renderer/example.ts` for complete working examples:
- Video editor player
- Simple image viewer
- Real-time video effects
- Performance monitoring

---

## API Reference

### WebGLRenderer

```typescript
render(sceneManager, camera, currentTime): void
clear(color?, depth?, stencil?): void
resize(width, height): void
getStats(): RenderStats
setClearColor(r, g, b, a): void
setDepthTest(enabled): void
setBatching(enabled): void
```

### RenderLoop

```typescript
start(): void
stop(): void
pause(): void
resume(): void
getStats(): RenderLoopStats
setTargetFPS(fps): void
```

### RenderNode (New Methods)

```typescript
setShaderName(name): void
setTextureId(id): void
setGeometryId(id): void
setCustomUniforms(uniforms): void
setCustomUniform(name, value): void
```

---

## Resources

- **Full Documentation:** `frontend/app/webgl/README.md`
- **Phase 4 Report:** `docs/player-webgl/PHASE4_COMPLETION.md`
- **Examples:** `frontend/app/webgl/renderer/example.ts`
- **Tests:** `frontend/app/webgl/__tests__/`

---

**Happy Rendering! 🎨**