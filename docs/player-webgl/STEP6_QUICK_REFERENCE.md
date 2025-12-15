# Step 6 Quick Reference: Video Time Synchronization

## VideoSyncManager API

### Constructor
```typescript
new VideoSyncManager(resourceLoader: ResourceLoader, config?: VideoSyncConfig)
```

**Config Options:**
```typescript
{
  seekTolerance?: number;  // Default: 0.1s
  seekThrottle?: number;   // Default: 50ms
  debug?: boolean;         // Default: false
}
```

### Core Methods

#### sync()
Synchronize videos on every frame:
```typescript
videoSyncManager.sync(
  visibleClips: Clip[],
  currentTime: number,
  isPlaying: boolean
);
```

#### forceSeek()
Force immediate seek (bypass tolerance):
```typescript
videoSyncManager.forceSeek(currentTime: number);
```

#### pauseAll() / playAll()
Batch operations:
```typescript
videoSyncManager.pauseAll();
videoSyncManager.playAll();
```

### Statistics & Monitoring

```typescript
const stats = videoSyncManager.getStats();
// Returns: { trackedVideos, syncCount, seekCount, playCount, pauseCount, skippedSeeks, throttledSeeks }

videoSyncManager.resetStats();
videoSyncManager.getDebugInfo(); // Detailed string output
```

## Time Calculation

### Formula
```
localTime = currentTime - clip.startTime
videoTime = clip.trimStart + localTime
clampedTime = clamp(videoTime, trimStart, trimEnd)
```

### Example
```typescript
// Clip: startTime=5s, duration=3s, trim=[2s, 5s]
// Timeline at 7s:
localTime = 7 - 5 = 2s
videoTime = 2 + 2 = 4s
// Video element currentTime = 4s
```

## Integration Pattern

### In WebGLPlayerManager

```typescript
// 1. Initialize
this.videoSyncManager = new VideoSyncManager(this.resourceLoader, {
  seekTolerance: 0.1,
  seekThrottle: 50,
  debug: this.options.debug,
});

// 2. Update Loop
private handleUpdate(deltaTime: number): void {
  if (this.state.isPlaying) {
    this.state.currentTime += deltaTime;
  }
  
  this.videoSyncManager.sync(
    this.visibleClips,
    this.state.currentTime,
    this.state.isPlaying
  );
}

// 3. User Seek
seekTo(time: number): void {
  this.state.currentTime = time;
  this.videoSyncManager.forceSeek(time);
}

// 4. Cleanup
dispose(): void {
  this.videoSyncManager?.dispose();
}
```

## Performance Tuning

### High Precision
```typescript
{
  seekTolerance: 0.02,  // 20ms
  seekThrottle: 16,     // ~60fps
}
```

### Balanced (Default)
```typescript
{
  seekTolerance: 0.1,   // 100ms
  seekThrottle: 50,     // 20 updates/sec
}
```

### Low Overhead
```typescript
{
  seekTolerance: 0.2,   // 200ms
  seekThrottle: 100,    // 10 updates/sec
}
```

## Common Patterns

### Visible Clips Extraction
```typescript
private getVisibleClips(tracks: Track[], time: number): Clip[] {
  return tracks
    .filter(t => t.visible)
    .flatMap(t => t.clips)
    .filter(c => time >= c.startTime && time < c.startTime + c.duration);
}
```

### Monitoring Efficiency
```typescript
const stats = videoSyncManager.getStats();
const efficiency = stats.skippedSeeks / stats.syncCount * 100;
console.log(`Seek efficiency: ${efficiency.toFixed(1)}%`);
```

### Debug Mode
```typescript
const manager = new VideoSyncManager(resourceLoader, { debug: true });
// Logs every sync, seek, play, pause operation
```

## Troubleshooting

### Videos Not Seeking
- Check seek tolerance (may be too large)
- Use `forceSeek()` for immediate updates
- Verify video texture is loaded

### Performance Issues
- Increase `seekTolerance` (reduce seek frequency)
- Increase `seekThrottle` (limit seek rate)
- Reduce number of simultaneous videos

### Synchronization Drift
- Decrease `seekTolerance` (more frequent correction)
- Check video loading/buffering status
- Verify clip timing calculations

### Play/Pause Not Working
- Check browser autoplay policies
- Verify video muted state
- Check for async play() errors in console

## Testing

### Mock Setup
```typescript
class MockVideoTexture {
  private video = document.createElement("video");
  
  constructor() {
    Object.defineProperty(this.video, "duration", {
      value: 10,
      writable: true,
    });
    this.video.play = vi.fn().mockResolvedValue(undefined);
  }
  
  getVideo() { return this.video; }
}
```

### Basic Test
```typescript
it("should synchronize video time", () => {
  const clip = createClip(0, 5, 0, 5);
  const texture = new MockVideoTexture();
  resourceLoader.addTexture(clip.resourceSrc, texture);
  
  videoSyncManager.sync([clip], 2.0, false);
  
  expect(texture.getVideo().currentTime).toBeCloseTo(2.0);
});
```

## Key Insights

### Seek Tolerance
- Prevents micro-seeks during playback
- Default 0.1s is good for 24-60fps content
- Adjust based on framerate and precision needs

### Seek Throttle
- Prevents excessive seeks on same video
- Default 50ms = max 20 seeks/sec
- Browser seek latency typically 30-100ms

### Visibility Management
- Only visible clips are synchronized
- Invisible videos automatically paused
- Reduces CPU/memory usage

### Trim Clamping
- Always clamps to [trimStart, trimEnd]
- Prevents video seeking outside trim bounds
- Essential for correct trim behavior

## Files Modified

- `frontend/app/webgl/player/VideoSyncManager.ts` (new)
- `frontend/app/webgl/player/VideoSyncManager.test.ts` (new)
- `frontend/app/webgl/player/WebGLPlayerManager.ts` (updated)

## Test Results

✅ 25/25 tests passing
- Basic synchronization
- Trim support
- Play/pause sync
- Multiple clips
- Force seek
- Statistics
- Edge cases