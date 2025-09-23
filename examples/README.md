# Cluv Video Editing Examples

This directory contains examples demonstrating the video editing capabilities of Cluv, which provides a Rust implementation of track-based video composition similar to the Go `liv/ffcut/fusion` library.

## Overview

The Cluv editing module provides:

- **Stage-based composition**: Define a canvas/viewport for video composition
- **Material management**: Handle video, audio, and image assets
- **Track-based editing**: Organize content in separate video and audio tracks
- **Segment management**: Place and manipulate clips on tracks with precise timing
- **Protocol support**: Load and save compositions in JSON format
- **FFmpeg integration**: Export to various formats (MP4, WAV, etc.)

## Examples

### 1. Simple Edit Example (`simple_edit.rs`)

This example closely mirrors the Go `main.go` example:

```bash
cargo run --example simple_edit
```

**Features demonstrated:**
- Creating a 960x540 stage
- Adding video and audio materials
- Creating video and audio tracks
- Adding segments with position and scale
- Exporting as WAV audio

### 2. Comprehensive Edit Example (`edit_example.rs`)

A more complete example showing advanced features:

```bash
cargo run --example edit_example
```

**Features demonstrated:**
- Programmatic video editing
- Protocol JSON loading/saving
- Multiple export formats
- Advanced compositions with overlays
- Speed adjustments and trimming

## Core Concepts

### Stage

The stage defines the canvas dimensions for your composition:

```rust
use cluv::edit::Stage;

let stage = Stage::new(1920, 1080); // Full HD
let stage = Stage::hd720();         // 720p preset
let stage = Stage::vertical_hd();   // Vertical video (1080x1920)
```

### Materials

Materials represent the source assets (video, audio, images):

```rust
use cluv::edit::Material;

// Video material
let video = Material::video("video1", "path/to/video.mp4", 1920, 1080);

// Audio material  
let audio = Material::audio("audio1", "path/to/audio.wav");

// Image material
let image = Material::image("logo", "path/to/logo.png", 200, 100);
```

### Tracks

Tracks organize your content by type (video, audio, etc.):

```rust
use cluv::edit::{Track, TrackType};

let video_track = Track::video("main_video");
let audio_track = Track::audio("main_audio");
```

### Segments

Segments are clips of materials placed on tracks:

```rust
use cluv::edit::{Segment, TimeRange, Position, Scale};

let segment = Segment::video(
    "segment1",
    "video_material_id",
    TimeRange::new(0, 5000),    // Timeline: 0-5s
    TimeRange::new(1000, 5000), // Source: 1-6s from original
)
.with_position(Position::new(100, 200))  // X=100, Y=200 on stage
.with_scale(Scale::new(1280, 720));      // Scale to 1280x720
```

### Editor

The editor manages the composition and handles export:

```rust
use cluv::edit::{Editor, ExportOptions, ExportType};

let mut editor = Editor::with_stage(Stage::hd1080());

// Add materials and tracks
editor.add_material(video_material);
editor.add_video_track("track1");
editor.add_segment_to_track("track1", segment)?;

// Export
let options = ExportOptions::new("output.mp4", ExportType::Video);
editor.export(options).await?;
```

## Protocol Format

The editing module supports loading and saving compositions in JSON format, compatible with the `cut_proto.json` specification:

```json
{
  "stage": {
    "width": 1280,
    "height": 720
  },
  "materials": {
    "videos": [
      {
        "id": "video1",
        "src": "video.mp4",
        "dimension": {
          "width": 1920,
          "height": 1080
        }
      }
    ],
    "images": [],
    "audios": []
  },
  "tracks": [
    {
      "id": "track1",
      "type": "video",
      "segments": [
        {
          "id": "segment1",
          "type": "video",
          "material_id": "video1",
          "target_timerange": {
            "start": 0,
            "duration": 10000
          },
          "source_timerange": {
            "start": 0,
            "duration": 10000
          },
          "scale": {
            "width": 1280,
            "height": 720
          },
          "position": {
            "x": 0,
            "y": 0
          }
        }
      ]
    }
  ]
}
```

## Export Options

The editor supports multiple export formats:

### Video Export (MP4)
```rust
let options = ExportOptions::new("output.mp4", ExportType::Video)
    .with_video_codec("libx264")
    .with_audio_codec("aac")
    .with_quality(23)
    .with_video_bitrate(5000)
    .with_audio_bitrate(128);
```

### Audio Export (WAV/MP3)
```rust
let options = ExportOptions::new("output.wav", ExportType::Audio)
    .with_audio_codec("pcm_s16le")
    .with_audio_bitrate(1411);
```

### Image Sequence Export
```rust
let options = ExportOptions::new("frame_%04d.jpg", ExportType::Image);
```

## Advanced Features

### Speed Adjustment

Segments automatically handle speed changes when source and target durations differ:

```rust
let segment = Segment::video(
    "fast_segment",
    "material1",
    TimeRange::new(0, 2000),    // 2 seconds on timeline
    TimeRange::new(0, 6000),    // 6 seconds from source = 3x speed
);
```

### Track Properties

Tracks support various properties:

```rust
let mut track = Track::audio("audio1");
track.set_volume(0.5)      // 50% volume
     .set_muted(false)     // Not muted
     .set_enabled(true);   // Enabled
```

### Multi-layer Composition

Video tracks are composited bottom-to-top, allowing for overlays:

```rust
// Background video
editor.add_video_track("background");
// Overlay track (rendered on top)
editor.add_video_track("overlay");
```

## Comparison with Go Library

| Go (fusion) | Rust (cluv::edit) | Description |
|-------------|-------------------|-------------|
| `fusion.New()` | `Editor::new()` | Create editor |
| `fusion.WithStageSize()` | `Stage::new()` | Set stage size |
| `fusion.NewTrack()` | `Track::video()` | Create track |
| `fusion.NewTrackItem()` | `Segment::video()` | Create segment |
| `.SetAssetId()` | Constructor param | Set material ID |
| `.SetTimeRange()` | `TimeRange::new()` | Set timeline range |
| `.SetSection()` | Source timerange | Set source range |
| `.SetPosition()` | `.with_position()` | Set position |
| `.SetItemSize()` | `.with_scale()` | Set size |
| `.Export()` | `.export()` | Export composition |

## Running Examples

Make sure you have the required media files in the specified paths, or modify the paths in the examples to match your files.

For the simple example:
- `/Users/justyer/Desktop/qwer.mp4` (video file)
- `/Users/justyer/Desktop/qwer.wav` (audio file)

The examples will create output files in the current directory:
- `outout.wav` (audio export)
- `output.mp4` (video export)

## Error Handling

The editing module provides comprehensive validation:

```rust
// Validate materials, tracks, and segments
editor.validate()?;

// Specific validations
material.validate()?;
track.validate()?;
segment.validate()?;
```

Common validation errors:
- Empty IDs
- Invalid dimensions
- Missing material references
- Invalid time ranges
- Overlapping segments (when not intended)

## Performance Considerations

- **Material Loading**: Materials are loaded on-demand during export
- **Memory Usage**: Large compositions may require significant memory
- **FFmpeg Processing**: Export time depends on composition complexity and output format
- **Validation**: Validate compositions before export to catch issues early

## Future Enhancements

Planned features:
- Real-time preview
- Audio effects and filters
- Video transitions
- Text and subtitle support
- Color correction
- GPU acceleration
- Distributed rendering