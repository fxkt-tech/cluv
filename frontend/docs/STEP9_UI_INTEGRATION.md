# Step 9: UI Integration - WebGL Player

## Overview

Step 9 integrates the WebGL player system with the editor UI, replacing the basic HTML5 video player with the full-featured WebGL rendering pipeline. This step connects timeline controls, playback management, and effect controls to the WebGL player.

## Components Implemented

### 1. WebGLPlayerArea Component

**Location:** `frontend/app/editor/components/Player/WebGLPlayerArea.tsx`

A React component that wraps `WebGLPlayerManager` and provides:

- **Canvas-based rendering:** Uses HTML5 canvas with WebGL context
- **Playback controls:** Play, pause, frame step forward/backward
- **Time synchronization:** Syncs with timeline scrubbing and external time control
- **Scene updates:** Automatically updates the WebGL scene when tracks/clips change
- **Resize handling:** Responsive canvas that maintains aspect ratio
- **Error handling:** Graceful fallback when WebGL initialization fails

#### Key Features

```typescript
export interface WebGLPlayerAreaRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  updateScene: (tracks: Track[]) => void;
  getPlayerManager: () => WebGLPlayerManager | null;
}
```

- Exposes imperative API via `ref` for parent component control
- Integrates with existing playback button UI
- Supports external time control (e.g., from timeline scrubbing)
- Displays WebGL status indicator
- Frame-accurate seeking based on FPS

#### Props

- `playbackTime`: Formatted time string to display
- `onPlayPause`, `onPrevious`, `onNext`: Callback handlers for playback controls
- `tracks`: Array of timeline tracks to render
- `onTimeUpdate`: Called during playback with current time
- `onDurationChange`: Called when duration changes
- `externalTime`: External time control (for timeline scrubbing)
- `width`, `height`, `fps`: Canvas and playback configuration

### 2. EffectsPanel Component

**Location:** `frontend/app/editor/components/Properties/EffectsPanel.tsx`

A comprehensive UI for controlling visual effects on selected clips.

#### Features

- **Effect Presets:** Quick-apply presets (Vibrant, Cool, Warm, Vintage, B&W)
- **Effect Categories:** Organized collapsible sections
- **Real-time Preview:** Changes apply immediately to the player
- **Parameter Controls:** Sliders and color pickers for fine-tuning
- **Enable/Disable:** Toggle effects on/off without losing settings

#### Supported Effects

1. **Color Adjustment**
   - Brightness (-1 to 1)
   - Contrast (-1 to 1)
   - Saturation (-1 to 1)
   - Hue (0 to 360°)

2. **Chroma Key (Green Screen)**
   - Key Color (RGB picker)
   - Threshold (0 to 1)
   - Smoothness (0 to 1)

3. **Blur**
   - Radius (0 to 20)
   - Passes (1 to 4)

4. **Sharpen**
   - Amount (0 to 3)

5. **Vignette**
   - Amount (0 to 1)
   - Radius (0 to 1)
   - Smoothness (0 to 1)

#### UI Components

```typescript
// Slider control with value display
<EffectControl
  label="Brightness"
  value={brightness}
  min={-1}
  max={1}
  step={0.01}
  onChange={(value) => updateEffect({ brightness: value })}
  disabled={!effectManager || !enabled}
/>

// Color picker with hex input
<ColorPicker
  label="Key Color"
  value={keyColor}
  onChange={(value) => updateEffect({ keyColor: value })}
  disabled={!effectManager || !enabled}
/>
```

### 3. Updated PropertiesPanel

**Location:** `frontend/app/editor/components/Properties/PropertiesPanel.tsx`

Extended the properties panel to include a new "Effects" tab alongside Video, Audio, and Speed tabs.

#### Changes

- Added `effectManager` prop for passing effect manager from selected clip
- Added `onEffectChange` callback for notifying parent of effect changes
- New "Effects" tab that renders `EffectsPanel`
- Updated tab type to include `"effects"`

```typescript
interface PropertiesPanelProps {
  activeTab: "video" | "audio" | "speed" | "effects";
  effectManager?: EffectManager | null;
  onEffectChange?: (manager: EffectManager) => void;
  // ... other props
}
```

## Integration Architecture

### Data Flow

```
Timeline Tracks
      ↓
WebGLPlayerArea
      ↓
WebGLPlayerManager
      ↓
SceneManager ← EffectManager
      ↓
Renderer
      ↓
Canvas Display
```

### Effect Control Flow

```
User Interaction (EffectsPanel)
      ↓
Update Effect Parameters
      ↓
Notify Parent (onEffectChange)
      ↓
Update Clip's EffectManager
      ↓
WebGLPlayerManager.updateScene()
      ↓
Renderer applies effects
```

## Usage Example

### Basic Integration

```typescript
import { WebGLPlayerArea, WebGLPlayerAreaRef } from './components';

function EditorPage() {
  const playerRef = useRef<WebGLPlayerAreaRef>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  return (
    <WebGLPlayerArea
      ref={playerRef}
      tracks={tracks}
      playbackTime={formatTime(currentTime)}
      onTimeUpdate={setCurrentTime}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
```

### With Effects Control

```typescript
function EditorPage() {
  const playerRef = useRef<WebGLPlayerAreaRef>(null);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  const handleEffectChange = (manager: EffectManager) => {
    // Update clip's effect manager
    if (selectedClip) {
      updateClip(selectedClip.id, { effectManager: manager });
      // Trigger re-render
      playerRef.current?.updateScene(tracks);
    }
  };

  return (
    <>
      <WebGLPlayerArea ref={playerRef} tracks={tracks} />
      <PropertiesPanel
        activeTab="effects"
        effectManager={selectedClip?.effectManager}
        onEffectChange={handleEffectChange}
      />
    </>
  );
}
```

### Playback Control

```typescript
// Play/pause
playerRef.current?.play();
playerRef.current?.pause();

// Seek to specific time
playerRef.current?.seekTo(5.0);

// Frame stepping
const frameTime = 1 / 30; // 30 fps
const currentTime = playerRef.current?.getCurrentTime() || 0;
playerRef.current?.seekTo(currentTime + frameTime);

// Get player manager for advanced operations
const manager = playerRef.current?.getPlayerManager();
if (manager) {
  const stats = manager.getRendererStats();
  console.log('FPS:', stats.fps);
}
```

## Styling and Theming

All components use the editor's existing Tailwind CSS theme:

- **Background colors:** `bg-editor-bg`, `bg-editor-panel`
- **Borders:** `border-editor-border`
- **Text colors:** `text-text-primary`, `text-text-secondary`, `text-text-muted`
- **Accent colors:** `text-accent-blue`, `text-accent-cyan`, `text-accent-red`
- **Hover states:** `hover:bg-editor-hover`, `hover:text-text-fg`

### Custom Slider Styling

Range inputs use custom Tailwind classes for consistent appearance:

```css
[&::-webkit-slider-thumb]:appearance-none
[&::-webkit-slider-thumb]:w-3
[&::-webkit-slider-thumb]:h-3
[&::-webkit-slider-thumb]:rounded-full
[&::-webkit-slider-thumb]:bg-accent-blue
[&::-webkit-slider-thumb]:hover:bg-accent-cyan
```

## Performance Considerations

### WebGL Initialization

- WebGL context created once on mount
- Graceful error handling if WebGL unavailable
- Automatic disposal on unmount

### Scene Updates

- Only updates when tracks array changes
- Uses `useEffect` with `tracks` dependency
- Efficient dirty checking in `WebGLPlayerManager`

### Effect Updates

- Effects update immediately for real-time preview
- No debouncing on sliders (smooth interaction)
- Effect manager cloned when clips are copied

### Render Loop

- Controlled by `WebGLPlayerManager` render loop
- Pauses when not playing to save resources
- Frame-accurate time updates via `requestAnimationFrame`

## Migration from Old PlayerArea

### Breaking Changes

None - the new `WebGLPlayerArea` implements the same `Ref` interface as the old `PlayerArea`.

### Migration Steps

1. Import `WebGLPlayerArea` instead of `PlayerArea`
2. Add `tracks` prop with timeline data
3. Optionally remove `videoSrc` prop (now uses tracks)
4. Update types to include `WebGLPlayerAreaRef`

```diff
- import { PlayerArea, PlayerAreaRef } from './components';
+ import { WebGLPlayerArea, WebGLPlayerAreaRef } from './components';

- const playerRef = useRef<PlayerAreaRef>(null);
+ const playerRef = useRef<WebGLPlayerAreaRef>(null);

  return (
-   <PlayerArea
+   <WebGLPlayerArea
      ref={playerRef}
-     videoSrc={videoSrc}
+     tracks={tracks}
      playbackTime={formatTime(currentTime)}
      onTimeUpdate={handleTimeUpdate}
    />
  );
```

## Known Limitations

1. **Browser Compatibility:** Requires WebGL-capable browser
2. **Canvas Size:** Canvas resizing may cause brief visual glitches
3. **Effect Performance:** Some effects (blur, multiple passes) may impact performance on lower-end devices
4. **Audio Playback:** Audio not yet implemented in WebGL player (planned for future step)

## Testing

### Unit Tests

Effects-related tests are covered in Step 8:
- `effects/Effect.test.ts` - Individual effect classes
- `effects/EffectManager.test.ts` - Effect manager functionality

### Component Tests

To be added:
- `WebGLPlayerArea.test.tsx` - Player component rendering and controls
- `EffectsPanel.test.tsx` - Effect UI interactions
- Integration tests for effect + player interaction

### Manual Testing

1. **Playback:** Verify play/pause/seek functionality
2. **Effect Controls:** Test each effect slider and preset
3. **Timeline Sync:** Scrub timeline and verify player updates
4. **Performance:** Monitor FPS with multiple effects active
5. **Error Handling:** Test with WebGL disabled/unavailable

## Future Enhancements

### Short Term

1. **Effect Keyframing:** Animate effect parameters over time
2. **Effect Masks:** Apply effects to specific regions
3. **Custom Shaders:** UI for loading custom GLSL shaders
4. **Effect Favorites:** Save and load custom effect presets

### Medium Term

1. **Transition Effects:** Cross-fade, wipe, etc. between clips
2. **Audio Visualization:** Real-time audio waveform/spectrum display
3. **Color Grading:** LUT support and advanced color tools
4. **Text Effects:** Animated text with effects

### Long Term

1. **GPU Acceleration:** Optimize for GPU-intensive effects
2. **Multi-track Compositing:** Layer blending and masking
3. **Plugin System:** Third-party effect plugins
4. **Real-time Collaboration:** Multi-user editing

## Troubleshooting

### WebGL Initialization Fails

**Symptom:** Red error message displayed instead of canvas

**Solutions:**
- Check browser WebGL support: visit https://get.webgl.org/
- Update graphics drivers
- Try different browser
- Disable hardware acceleration as last resort

### Effects Not Applying

**Symptom:** Effect sliders change but no visual update

**Solutions:**
- Check that effect is enabled (checkbox checked)
- Verify `onEffectChange` callback is wired correctly
- Ensure `updateScene()` is called after effect changes
- Check browser console for shader compilation errors

### Performance Issues

**Symptom:** Low FPS or stuttering playback

**Solutions:**
- Reduce blur radius or passes
- Disable multiple effects
- Lower canvas resolution
- Check `getRendererStats()` for bottlenecks

### Timeline Desync

**Symptom:** Player time doesn't match timeline

**Solutions:**
- Verify `externalTime` prop is passed correctly
- Check `onTimeUpdate` callback is setting timeline time
- Ensure no circular updates (add tolerance threshold)

## API Reference

### WebGLPlayerArea Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `playbackTime` | `string` | Yes | Formatted time string to display |
| `onPlayPause` | `() => void` | No | Callback when play/pause clicked |
| `onPrevious` | `() => void` | No | Callback when previous frame clicked |
| `onNext` | `() => void` | No | Callback when next frame clicked |
| `tracks` | `Track[]` | No | Timeline tracks to render (default: `[]`) |
| `onTimeUpdate` | `(time: number) => void` | No | Callback during playback with current time |
| `onDurationChange` | `(duration: number) => void` | No | Callback when duration changes |
| `externalTime` | `number` | No | External time control (for timeline sync) |
| `width` | `number` | No | Canvas width (default: `1920`) |
| `height` | `number` | No | Canvas height (default: `1080`) |
| `fps` | `number` | No | Frames per second (default: `30`) |

### WebGLPlayerAreaRef Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `play()` | `void` | Start playback |
| `pause()` | `void` | Pause playback |
| `seekTo(time)` | `void` | Seek to specific time in seconds |
| `getCurrentTime()` | `number` | Get current playback time |
| `getDuration()` | `number` | Get total duration |
| `isPlaying()` | `boolean` | Check if currently playing |
| `updateScene(tracks)` | `void` | Update scene with new tracks |
| `getPlayerManager()` | `WebGLPlayerManager \| null` | Get underlying player manager |

### EffectsPanel Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `effectManager` | `EffectManager \| null` | No | Effect manager from selected clip |
| `onEffectChange` | `(manager: EffectManager) => void` | No | Callback when effects change |

## Summary

Step 9 successfully integrates the WebGL player into the editor UI with:

✅ **WebGLPlayerArea component** - Canvas-based player with full playback controls  
✅ **EffectsPanel component** - Comprehensive effect controls with presets  
✅ **PropertiesPanel integration** - New Effects tab alongside existing tabs  
✅ **Timeline synchronization** - Bidirectional time sync  
✅ **Real-time preview** - Immediate effect feedback  
✅ **Responsive design** - Adapts to container size  
✅ **Error handling** - Graceful fallbacks  
✅ **Performance optimized** - Efficient render loop and updates  

The UI integration provides a solid foundation for further features like effect keyframing, transitions, and advanced compositing.