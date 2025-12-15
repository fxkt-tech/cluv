# Step 9: UI Integration - Quick Reference

## Overview

Step 9 integrates the WebGL player into the editor UI with React components for playback control and visual effects management.

---

## Components

### WebGLPlayerArea

**Location:** `frontend/app/editor/components/Player/WebGLPlayerArea.tsx`

```tsx
import { WebGLPlayerArea, WebGLPlayerAreaRef } from './components';

function MyEditor() {
  const playerRef = useRef<WebGLPlayerAreaRef>(null);
  
  return (
    <WebGLPlayerArea
      ref={playerRef}
      tracks={tracks}
      playbackTime="00:00:00"
      onTimeUpdate={handleTimeUpdate}
      fps={30}
    />
  );
}
```

**Props:**
- `playbackTime: string` - Display time (e.g., "00:05:30")
- `tracks: Track[]` - Timeline tracks to render
- `onPlayPause?: () => void` - Play/pause callback
- `onPrevious?: () => void` - Previous frame callback
- `onNext?: () => void` - Next frame callback
- `onTimeUpdate?: (time: number) => void` - Time update callback
- `onDurationChange?: (duration: number) => void` - Duration callback
- `externalTime?: number` - External time control
- `width?: number` - Canvas width (default: 1920)
- `height?: number` - Canvas height (default: 1080)
- `fps?: number` - Frames per second (default: 30)

**Ref Methods:**
```tsx
playerRef.current?.play();
playerRef.current?.pause();
playerRef.current?.seekTo(5.0);
const time = playerRef.current?.getCurrentTime();
const duration = playerRef.current?.getDuration();
const playing = playerRef.current?.isPlaying();
playerRef.current?.updateScene(tracks);
const manager = playerRef.current?.getPlayerManager();
```

---

### EffectsPanel

**Location:** `frontend/app/editor/components/Properties/EffectsPanel.tsx`

```tsx
import { EffectsPanel } from './components';

function PropertiesPanel() {
  const [effectManager, setEffectManager] = useState<EffectManager | null>(null);
  
  const handleEffectChange = (manager: EffectManager) => {
    setEffectManager(manager);
    // Update clip and trigger scene re-render
  };
  
  return (
    <EffectsPanel
      effectManager={effectManager}
      onEffectChange={handleEffectChange}
    />
  );
}
```

**Props:**
- `effectManager?: EffectManager | null` - Effect manager from selected clip
- `onEffectChange?: (manager: EffectManager) => void` - Change callback

---

## Effects

### Color Adjustment
- **Brightness:** -1 to 1 (default: 0)
- **Contrast:** 0 to 2 (default: 1)
- **Saturation:** 0 to 2 (default: 1)
- **Hue:** -180° to 180° (default: 0)

### Chroma Key (Green Screen)
- **Key Color:** RGB picker
- **Threshold:** 0 to 1 (default: 0.4)
- **Smoothness:** 0 to 1 (default: 0.1)

### Blur
- **Radius:** 0 to 20 pixels (default: 5)
- **Passes:** 1 to 4 (default: 1)

### Sharpen
- **Amount:** 0 to 3 (default: 1.0)

### Vignette
- **Amount:** 0 to 1 (default: 0.5)
- **Radius:** 0 to 1 (default: 0.75)
- **Smoothness:** 0 to 1 (default: 0.5)

---

## Presets

Quick-apply effect combinations:

```tsx
// Available presets
- Vibrant: Enhanced saturation and contrast
- Cool: Blue tint with reduced saturation
- Warm: Orange tint with enhanced saturation
- Vintage: Sepia tone with vignette
- B&W: Desaturated black and white
- Clear All: Reset to defaults
```

---

## Usage Patterns

### Basic Playback Control

```tsx
// Play
playerRef.current?.play();

// Pause
playerRef.current?.pause();

// Seek to specific time
playerRef.current?.seekTo(5.0);

// Frame stepping
const fps = 30;
const frameTime = 1 / fps;
const currentTime = playerRef.current?.getCurrentTime() || 0;

// Next frame
playerRef.current?.seekTo(currentTime + frameTime);

// Previous frame
playerRef.current?.seekTo(Math.max(0, currentTime - frameTime));
```

### Timeline Synchronization

```tsx
// External time control (timeline scrubbing)
<WebGLPlayerArea
  externalTime={timelineCurrentTime}
  onTimeUpdate={(time) => setTimelineCurrentTime(time)}
/>

// Prevent circular updates
useEffect(() => {
  if (externalTime !== undefined && !isPlaying) {
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    const timeDiff = Math.abs(currentTime - externalTime);
    
    // Only sync if difference exceeds threshold
    if (timeDiff > 0.1) {
      playerRef.current?.seekTo(externalTime);
    }
  }
}, [externalTime, isPlaying]);
```

### Effect Management

```tsx
// Apply effect to selected clip
const handleEffectChange = (manager: EffectManager) => {
  if (selectedClip) {
    // Update clip
    const updatedClip = {
      ...selectedClip,
      effectManager: manager
    };
    
    updateClip(updatedClip);
    
    // Trigger scene update
    playerRef.current?.updateScene(tracks);
  }
};

// Apply preset
const applyPreset = (preset: 'vibrant' | 'cool' | 'warm' | 'vintage' | 'blackwhite') => {
  if (effectManager) {
    const presetManager = EffectManager.createPreset(preset);
    const effects = presetManager.getAllEffects();
    
    effectManager.clear();
    effects.forEach(effect => effectManager.addEffect(effect));
    
    handleEffectChange(effectManager);
  }
};

// Clear all effects
const clearEffects = () => {
  if (effectManager) {
    effectManager.clear();
    handleEffectChange(effectManager);
  }
};
```

### Manual Effect Creation

```tsx
import {
  ColorAdjustmentEffect,
  ChromaKeyEffect,
  BlurEffect,
  SharpenEffect,
  VignetteEffect,
  EffectType,
  EffectManager
} from '../../../webgl/effects';

// Create effect manager
const manager = new EffectManager();

// Add color adjustment
manager.addEffect(new ColorAdjustmentEffect({
  type: EffectType.COLOR_ADJUSTMENT,
  brightness: 0.2,
  contrast: 1.1,
  saturation: 1.3,
  enabled: true
}));

// Add chroma key
manager.addEffect(new ChromaKeyEffect({
  type: EffectType.CHROMA_KEY,
  keyColor: { r: 0.0, g: 1.0, b: 0.0 },
  threshold: 0.4,
  smoothness: 0.1,
  enabled: true
}));

// Add blur
manager.addEffect(new BlurEffect({
  type: EffectType.BLUR,
  radius: 10,
  passes: 2,
  enabled: true
}));

// Add sharpen
manager.addEffect(new SharpenEffect({
  type: EffectType.SHARPEN,
  amount: 1.5,
  enabled: true
}));

// Add vignette
manager.addEffect(new VignetteEffect({
  type: EffectType.VIGNETTE,
  amount: 0.6,
  radius: 0.7,
  smoothness: 0.5,
  enabled: true
}));
```

---

## Performance Tips

### Canvas Resolution
```tsx
// For preview, use lower resolution
<WebGLPlayerArea width={1280} height={720} />

// For export, use full resolution
<WebGLPlayerArea width={1920} height={1080} />

// For 4K
<WebGLPlayerArea width={3840} height={2160} />
```

### Effect Optimization
```tsx
// Disable unused effects instead of removing
effect.setEnabled(false);

// Reduce blur passes for better performance
<BlurEffect radius={5} passes={1} />

// Use sharpen sparingly (performance impact)
<SharpenEffect amount={0.5} />
```

### Scene Updates
```tsx
// Batch scene updates
const updateMultipleClips = (clips: Clip[]) => {
  clips.forEach(clip => updateClip(clip));
  // Single scene update after all changes
  playerRef.current?.updateScene(tracks);
};

// Avoid updating on every effect slider change
// Use debounce or throttle
const debouncedUpdate = useMemo(
  () => debounce((manager: EffectManager) => {
    playerRef.current?.updateScene(tracks);
  }, 100),
  [tracks]
);
```

---

## Keyboard Shortcuts

Recommend implementing:

```tsx
// Space: Play/Pause
if (e.key === ' ') playerRef.current?.isPlaying() 
  ? playerRef.current?.pause() 
  : playerRef.current?.play();

// Left Arrow: Previous frame
if (e.key === 'ArrowLeft') {
  const time = playerRef.current?.getCurrentTime() || 0;
  playerRef.current?.seekTo(time - (1 / fps));
}

// Right Arrow: Next frame
if (e.key === 'ArrowRight') {
  const time = playerRef.current?.getCurrentTime() || 0;
  playerRef.current?.seekTo(time + (1 / fps));
}

// Home: Seek to start
if (e.key === 'Home') playerRef.current?.seekTo(0);

// End: Seek to end
if (e.key === 'End') {
  const duration = playerRef.current?.getDuration() || 0;
  playerRef.current?.seekTo(duration);
}
```

---

## Debugging

### Get Renderer Statistics
```tsx
const manager = playerRef.current?.getPlayerManager();
if (manager) {
  const stats = manager.getRendererStats();
  console.log('FPS:', stats.fps);
  console.log('Frame Time:', stats.frameTime);
  console.log('Draw Calls:', stats.drawCalls);
}
```

### Check Effect Status
```tsx
if (effectManager) {
  console.log('Effect Count:', effectManager.getCount());
  console.log('Has Enabled Effects:', effectManager.hasEnabledEffects());
  console.log('Required Shader:', effectManager.getRequiredShader());
  console.log('All Uniforms:', effectManager.getAllUniforms());
}
```

### Monitor Scene Updates
```tsx
useEffect(() => {
  console.log('Scene updated with', tracks.length, 'tracks');
  const clipCount = tracks.reduce((sum, t) => sum + t.clips.length, 0);
  console.log('Total clips:', clipCount);
}, [tracks]);
```

---

## Common Issues

### WebGL Not Supported
```tsx
// Check WebGL availability
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
if (!gl) {
  console.error('WebGL not supported');
  // Show fallback UI
}
```

### Effects Not Visible
```tsx
// Ensure effect is enabled
effect.setEnabled(true);

// Check effect manager has effects
console.log(effectManager.hasEnabledEffects());

// Verify scene update after effect change
handleEffectChange(manager);
playerRef.current?.updateScene(tracks);
```

### Timeline Desync
```tsx
// Add tolerance to prevent update loops
const SYNC_TOLERANCE = 0.1; // 100ms
if (Math.abs(currentTime - externalTime) > SYNC_TOLERANCE) {
  playerRef.current?.seekTo(externalTime);
}
```

---

## Testing

### Unit Tests
```bash
npm test -- WebGLPlayerArea.test.tsx
```

### Manual Testing Checklist
- [ ] Play/pause works
- [ ] Frame stepping accurate
- [ ] Timeline scrubbing syncs
- [ ] Effects apply in real-time
- [ ] Presets work correctly
- [ ] Multiple effects combine properly
- [ ] Canvas resizes responsively
- [ ] Error handling displays correctly

---

## File Locations

```
frontend/
├── app/
│   ├── editor/
│   │   ├── components/
│   │   │   ├── Player/
│   │   │   │   ├── WebGLPlayerArea.tsx          ← Main player component
│   │   │   │   └── __tests__/
│   │   │   │       └── WebGLPlayerArea.test.tsx ← Tests
│   │   │   ├── Properties/
│   │   │   │   ├── EffectsPanel.tsx             ← Effects UI
│   │   │   │   └── PropertiesPanel.tsx          ← Updated with Effects tab
│   │   │   └── index.ts                         ← Component exports
│   │   ├── types/editor.ts                      ← Updated types
│   │   ├── hooks/useEditorState.ts              ← Updated hooks
│   │   └── constants/data.ts                    ← Updated constants
│   └── webgl/
│       ├── effects/                             ← Effect system (Step 8)
│       └── player/
│           └── WebGLPlayerManager.ts            ← Player manager (Step 2)
└── docs/
    ├── STEP9_UI_INTEGRATION.md                  ← Full documentation
    ├── STEP9_COMPLETION.md                      ← Completion summary
    └── STEP9_QUICK_REFERENCE.md                 ← This file
```

---

## Next Steps

After completing Step 9, consider:

1. **Effect Keyframing** - Animate effects over time
2. **Transition Effects** - Cross-fade between clips
3. **Audio Playback** - Integrate audio with WebGL player
4. **Export Pipeline** - Render to video file
5. **Custom Effects** - Plugin system for third-party effects

---

## Resources

- [Step 9 Full Documentation](./STEP9_UI_INTEGRATION.md)
- [Step 9 Completion Summary](./STEP9_COMPLETION.md)
- [Step 8 Effects Documentation](./STEP8_COMPLETION.md)
- [WebGL Player Tests](../app/editor/components/Player/__tests__/)