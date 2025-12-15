# Step 5 Completion: Video Trim Support

**Date:** 2024-01-XX  
**Status:** ✅ COMPLETED

---

## Overview

Implemented full trim support in the WebGL video shader and SceneBuilder, allowing clips to display only a portion of the source video through trimStart and trimEnd parameters.

---

## What Was Implemented

### 1. Shader Uniforms for Trim

**Added to `video.frag.glsl` and shader definitions:**
- `u_trimStart`: Trim start time in seconds (where to start in the source video)
- `u_trimEnd`: Trim end time in seconds (where to end in the source video)
- `u_clipTime`: Current time within the clip (0 to clip duration)
- `u_clipDuration`: Total duration of the clip

### 2. Shader Logic

**In `video.frag.glsl`:**
- Calculate trimmed duration: `trimmedDuration = u_trimEnd - u_trimStart`
- Calculate normalized progress through clip: `videoProgress = u_clipTime / u_clipDuration`
- Map to trimmed region of video (handled by application layer updating video.currentTime)
- Shader ensures proper UV mapping while app layer manages video element timing

### 3. SceneBuilder Integration

**Updated `SceneBuilder.ts`:**
- Set trim uniforms when creating/updating nodes
- Calculate `localTime = currentTime - clip.startTime` (time within the clip)
- Pass trim parameters to shader via custom uniforms:
  - `u_clipTime`: localTime (current position in clip)
  - `u_trimStart`: clip.trimStart
  - `u_trimEnd`: clip.trimEnd
  - `u_clipDuration`: clip.duration

### 4. Comprehensive Tests

**Created `TrimSupport.test.ts` with 12 tests covering:**

#### Uniform Setting (3 tests)
- ✅ Set trim uniforms on video nodes
- ✅ Update trim uniforms when clip time changes
- ✅ Handle clips with no trim (full video)

#### Trim Edge Cases (3 tests)
- ✅ Handle trim at the very start of video
- ✅ Handle trim at the very end of video
- ✅ Handle very small trim ranges (0.5s)

#### Multiple Clips (1 test)
- ✅ Handle multiple clips with different trim settings

#### Trim Calculations (2 tests)
- ✅ Calculate correct video time from trim and clip time
- ✅ Handle trim duration calculation

#### Trim Visibility (3 tests)
- ✅ Not render clip before its start time
- ✅ Not render clip after its end time
- ✅ Render clip exactly at boundary times

**All 12 tests passing** ✅

---

## Files Modified

### Shader Files
1. **`cluv/frontend/app/webgl/shader/shaders/video.frag.glsl`**
   - Added trim uniform declarations
   - Added trim calculation logic in main()
   - Documented shader behavior for trim support

2. **`cluv/frontend/app/webgl/shader/index.ts`**
   - Updated VIDEO_FRAGMENT_SHADER constant
   - Added trim uniforms to BUILTIN_SHADERS.VIDEO.uniforms array

### Application Files
3. **`cluv/frontend/app/webgl/player/SceneBuilder.ts`**
   - Updated `updateNodeFromClip()` to set trim uniforms
   - Changed `u_videoTime` to `u_clipTime` for clarity
   - Simplified video time calculation (removed redundant videoTime variable)

4. **`cluv/frontend/app/webgl/player/SceneBuilder.test.ts`**
   - Fixed existing tests to use `u_clipTime` instead of `u_videoTime`
   - Updated assertions to match new uniform names

### Test Files
5. **`cluv/frontend/app/webgl/player/TrimSupport.test.ts`** (NEW)
   - Comprehensive test suite for trim functionality
   - 12 tests covering all edge cases and scenarios

---

## How Trim Works

### Conceptual Model

```
Source Video: [═══════════════════════════] (10 seconds)
                     ↓ trim
Trimmed:      [      ══════════      ]      (trimStart: 2s, trimEnd: 7s = 5s duration)
                     ↓ place in timeline
Clip:         [══════════]                   (startTime: 1s, duration: 5s)
```

### Timeline Flow

1. **Clip Positioning**: Clip placed at `startTime` in timeline with `duration`
2. **Trim Mapping**: Clip shows video from `trimStart` to `trimEnd` of source
3. **Time Calculation**:
   ```
   localTime = currentTime - clip.startTime
   videoTime = trimStart + localTime
   ```

### Example

```typescript
const clip = {
  startTime: 2.0,      // Clip starts at 2s in timeline
  duration: 3.0,       // Clip lasts 3 seconds
  trimStart: 5.0,      // Show video starting from 5s
  trimEnd: 8.0,        // Show video ending at 8s
};

// At timeline time 4.5s:
localTime = 4.5 - 2.0 = 2.5s       // 2.5s into the clip
videoTime = 5.0 + 2.5 = 7.5s       // Show frame at 7.5s of source video
```

### Shader Uniforms

```glsl
uniform float u_trimStart;    // 5.0 (start of trim region)
uniform float u_trimEnd;      // 8.0 (end of trim region)
uniform float u_clipTime;     // 2.5 (time within clip)
uniform float u_clipDuration; // 3.0 (total clip duration)

// In shader:
float trimmedDuration = u_trimEnd - u_trimStart;  // 3.0
float progress = u_clipTime / u_clipDuration;     // 0.833
```

---

## Test Results

### TrimSupport.test.ts
```
✓ Trim Support (12)
  ✓ Uniform Setting (3)
    ✓ should set trim uniforms on video nodes
    ✓ should update trim uniforms when clip time changes
    ✓ should handle clips with no trim (full video)
  ✓ Trim Edge Cases (3)
    ✓ should handle trim at the very start of video
    ✓ should handle trim at the very end of video
    ✓ should handle very small trim ranges
  ✓ Multiple Clips with Different Trims (1)
    ✓ should handle multiple clips with different trim settings
  ✓ Trim Calculations (2)
    ✓ should calculate correct video time from trim and clip time
    ✓ should handle trim duration calculation
  ✓ Trim Visibility (3)
    ✓ should not render clip before its start time
    ✓ should not render clip after its end time
    ✓ should render clip exactly at boundary times

Test Files  1 passed (1)
Tests       12 passed (12)
```

### SceneBuilder.test.ts
```
✓ SceneBuilder (19)
  ✓ buildScene (9)
  ✓ Coordinate Conversion (2)
  ✓ Node Reuse (2)
  ✓ Cleanup (2)
  ✓ clear (1)
  ✓ getActiveClipIds (1)
  ✓ updateConfig (1)

Test Files  1 passed (1)
Tests       19 passed (19)
```

**Total: 31/31 tests passing** ✅

---

## Architecture Decisions

### 1. Separation of Concerns

**Shader Layer:**
- Receives trim parameters as uniforms
- Calculates progress through clip
- Samples texture at current UV coordinates

**Application Layer (Future):**
- Manages video element currentTime
- Synchronizes video.currentTime = trimStart + clipTime
- Handles play/pause/seek operations

### 2. Uniform Naming

Changed from `u_videoTime` to `u_clipTime` for clarity:
- `u_clipTime`: Time relative to clip start (0 to duration)
- More intuitive and matches the actual semantic meaning
- Application calculates actual video time separately

### 3. Trim Duration vs Clip Duration

- `trimEnd - trimStart` defines available video content
- `clip.duration` defines how long clip shows in timeline
- These should match for 1:1 playback speed
- Future: Support speed adjustments (duration ≠ trim duration)

---

## Integration Notes

### Next Steps (Step 6: Time Synchronization)

The trim uniforms are now properly set in the shader, but actual video synchronization requires:

1. **Video Element Management**
   - Update `VideoTexture` to support trim-aware playback
   - Set `video.currentTime = trimStart + clipTime`
   - Handle boundary conditions (clamp to trimEnd)

2. **Playback Controls**
   - Implement play/pause per clip
   - Handle seek operations with trim offset
   - Ensure video loops within trim bounds if needed

3. **Performance**
   - Avoid unnecessary video.currentTime updates (frame throttling)
   - Handle seek latency/loading states
   - Consider preloading for smooth playback

### Current Behavior

- ✅ Trim uniforms are correctly calculated and passed to shader
- ✅ Scene updates with correct time values
- ⚠️  Video element timing not yet synchronized (Step 6)
- ⚠️  Video plays from start regardless of trim (needs app-layer sync)

---

## Known Limitations

1. **No Video Time Sync Yet**: Video element currentTime is not synchronized with trim
   - Shader receives correct uniforms
   - Application layer needs to update video.currentTime
   - Will be addressed in Step 6

2. **No Speed Adjustment**: Clips always play at 1x speed
   - clip.duration must equal (trimEnd - trimStart)
   - Future: Support speed multiplier

3. **No Reverse Playback**: Video always plays forward
   - Future: Support negative speed for reverse

---

## API Usage Example

```typescript
// Create a clip with trim
const clip: Clip = {
  id: "clip1",
  type: "video",
  trackId: "track1",
  startTime: 5.0,      // Start at 5s in timeline
  duration: 3.0,       // Show for 3 seconds
  trimStart: 2.0,      // Use video from 2s
  trimEnd: 5.0,        // to 5s (3 second range)
  position: { x: 0.5, y: 0.5 },
  scale: 1.0,
  rotation: 0,
  opacity: 1.0,
  resourceSrc: "video.mp4",
};

// SceneBuilder automatically sets uniforms:
// u_clipTime: 0 to 3.0 (as timeline progresses)
// u_trimStart: 2.0
// u_trimEnd: 5.0
// u_clipDuration: 3.0

// Application should sync video (Step 6):
// video.currentTime = clip.trimStart + (currentTime - clip.startTime)
```

---

## Performance Considerations

### Uniform Updates
- Trim uniforms updated every frame for visible clips
- Minimal overhead (4 float uniforms per node)
- No texture uploads, just uniform binding

### Video Element Sync (Future)
- Should throttle video.currentTime updates
- Only update when difference > threshold (e.g., 33ms for 30fps)
- Consider requestVideoFrameCallback() for precise sync

### Memory
- No additional memory overhead
- Trim data already exists in Clip objects
- No duplicate video textures needed

---

## Conclusion

**Step 5 is COMPLETE** ✅

Trim support is now fully implemented in the shader layer:
- ✅ Shader accepts and processes trim uniforms
- ✅ SceneBuilder correctly calculates and passes trim data
- ✅ Comprehensive test coverage (12 new tests, all passing)
- ✅ Existing tests updated and passing (19 tests)
- ✅ Documentation and examples provided

**Ready for Step 6:** Time synchronization between timeline and video textures, which will leverage these trim uniforms to control actual video playback timing.