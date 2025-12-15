# Step 5: Trim Support - Quick Reference

**Status:** ✅ COMPLETED  
**Tests:** 31/31 passing

---

## Overview

Video trim support allows clips to display only a portion of the source video by specifying `trimStart` and `trimEnd` times.

---

## Shader Uniforms

```glsl
uniform float u_trimStart;    // Trim start time (seconds)
uniform float u_trimEnd;      // Trim end time (seconds)
uniform float u_clipTime;     // Current time within clip (0 to duration)
uniform float u_clipDuration; // Total clip duration
```

### Calculation in Shader

```glsl
float trimmedDuration = u_trimEnd - u_trimStart;
float progress = u_clipTime / u_clipDuration;  // 0.0 to 1.0
```

---

## SceneBuilder Usage

The `SceneBuilder` automatically sets trim uniforms when building the scene:

```typescript
// SceneBuilder.updateNodeFromClip()
const localTime = currentTime - clip.startTime;

node.setCustomUniforms({
  u_clipTime: localTime,           // Time within clip
  u_trimStart: clip.trimStart,     // Start of trim region
  u_trimEnd: clip.trimEnd,         // End of trim region
  u_clipDuration: clip.duration,   // Total clip duration
});
```

---

## Timeline Example

```
Source Video: [════════════════] (10 seconds)
                 ↓ trim
Trimmed:      [   ═════════   ]   (trimStart: 2s, trimEnd: 7s)
                 ↓ place in timeline
Clip:         [═════════]         (startTime: 1s, duration: 5s)
```

### Time Calculation

```typescript
// At timeline time 3.5s:
const clip = {
  startTime: 1.0,   // Clip starts at 1s in timeline
  duration: 5.0,    // Clip lasts 5 seconds
  trimStart: 2.0,   // Show video from 2s
  trimEnd: 7.0,     // to 7s (5s range)
};

const currentTime = 3.5;
const localTime = currentTime - clip.startTime;  // 3.5 - 1.0 = 2.5s
const videoTime = clip.trimStart + localTime;    // 2.0 + 2.5 = 4.5s

// Show frame at 4.5s of source video
```

---

## API Example

```typescript
const clip: Clip = {
  id: "clip1",
  type: "video",
  startTime: 5.0,      // Timeline position
  duration: 3.0,       // Clip duration
  trimStart: 2.0,      // Video start time
  trimEnd: 5.0,        // Video end time
  // ... other properties
};

// SceneBuilder automatically handles trim uniforms
sceneBuilder.buildScene([track], currentTime);

// Get node and check uniforms
const node = sceneBuilder.getNodeForClip("clip1");
const uniforms = node.getCustomUniforms();
// uniforms.u_trimStart === 2.0
// uniforms.u_trimEnd === 5.0
// uniforms.u_clipTime === (currentTime - 5.0)
// uniforms.u_clipDuration === 3.0
```

---

## Test Coverage

✅ **12 new tests in `TrimSupport.test.ts`**
- Uniform setting (3 tests)
- Edge cases (3 tests)
- Multiple clips (1 test)
- Trim calculations (2 tests)
- Visibility (3 tests)

✅ **19 existing tests in `SceneBuilder.test.ts`**
- Updated to use `u_clipTime` instead of `u_videoTime`

---

## Files Modified

### Shaders
- `app/webgl/shader/shaders/video.frag.glsl` - Added trim uniforms and logic
- `app/webgl/shader/index.ts` - Updated shader definitions

### Application
- `app/webgl/player/SceneBuilder.ts` - Set trim uniforms on nodes
- `app/webgl/player/SceneBuilder.test.ts` - Fixed uniform names

### Tests
- `app/webgl/player/TrimSupport.test.ts` - **NEW** comprehensive tests

---

## Key Concepts

### Clip Time vs Video Time

- **Clip Time**: Time relative to clip start (0 to duration)
- **Video Time**: Time in the source video (trimStart + clipTime)

```typescript
clipTime = currentTime - clip.startTime;
videoTime = clip.trimStart + clipTime;
```

### Visibility Rule

A clip is visible when:
```typescript
currentTime >= clip.startTime && currentTime < (clip.startTime + clip.duration)
```

Note: End time is **exclusive** (< not <=)

### Trim Duration

```typescript
trimDuration = clip.trimEnd - clip.trimStart;
```

For normal 1x playback:
```typescript
clip.duration === trimDuration
```

---

## Current Status

### ✅ What Works
- Trim uniforms calculated and passed to shader
- SceneBuilder handles trim data correctly
- Multiple clips with different trims work
- Edge cases handled (start/end of video, small ranges)

### ⚠️ Next Step (Step 6)
- Video element time synchronization
- Update `video.currentTime = trimStart + clipTime`
- Handle play/pause/seek with trim awareness

---

## Common Patterns

### No Trim (Full Video)
```typescript
clip.trimStart = 0;
clip.trimEnd = videoDuration;
clip.duration = videoDuration;
```

### Trim Middle Section
```typescript
clip.trimStart = 2.0;
clip.trimEnd = 5.0;
clip.duration = 3.0;  // Must match trim duration
```

### Trim End Only
```typescript
clip.trimStart = 0;
clip.trimEnd = 3.0;
clip.duration = 3.0;
```

### Trim Start Only
```typescript
clip.trimStart = 5.0;
clip.trimEnd = videoDuration;
clip.duration = videoDuration - 5.0;
```

---

## Debugging

### Check Uniforms
```typescript
const node = sceneBuilder.getNodeForClip(clipId);
const uniforms = node?.getCustomUniforms();
console.log('Trim uniforms:', uniforms);
```

### Verify Visibility
```typescript
const result = sceneBuilder.buildScene(tracks, currentTime);
console.log('Visible clips:', result.visibleClipCount);
console.log('Active clip IDs:', sceneBuilder.getActiveClipIds());
```

### Calculate Expected Video Time
```typescript
const localTime = currentTime - clip.startTime;
const expectedVideoTime = clip.trimStart + localTime;
console.log(`At timeline ${currentTime}s, show video at ${expectedVideoTime}s`);
```

---

## Performance Notes

- Uniforms updated per frame for visible clips (4 floats per node)
- No texture uploads, minimal overhead
- Node reuse avoids recreating nodes for invisible clips
- Future: Throttle video.currentTime updates (Step 6)

---

## Related Documentation

- [STEP5_COMPLETION.md](./STEP5_COMPLETION.md) - Full implementation details
- [STEP4_COMPLETION.md](./STEP4_COMPLETION.md) - SceneBuilder architecture
- [PROGRESS_SUMMARY.md](./PROGRESS_SUMMARY.md) - Overall project status

---

**Need help?** Check the test files for comprehensive usage examples!