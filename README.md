# Cluv

A friendly FFmpeg wrapper for Rust, translated from the Go library [liv](https://github.com/fxkt-tech/liv).

Cluv provides a high-level, type-safe interface for video processing operations including transcoding, screenshot generation, and various video filters.

## Features

- **Video Transcoding**: Convert videos to multiple formats (MP4, MP3, JPEG, HLS, TS)
- **Screenshot Generation**: Extract frames with various modes (keyframes, intervals, specific frames)
- **Sprite Sheets**: Generate thumbnail grids from videos
- **Video Filters**: Apply scaling, watermarks, delogo, clipping, and more
- **Audio Processing**: Extract, convert, and process audio streams
- **Batch Operations**: Process multiple outputs in a single operation
- **Async Support**: Built with Tokio for non-blocking operations
- **Type Safety**: Comprehensive error handling and validation

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
cluv = "0.1.0"
tokio = { version = "1.0", features = ["full"] }
```

## Prerequisites

You need to have FFmpeg and FFprobe installed on your system:

### macOS
```bash
brew install ffmpeg
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### Windows
Download from [FFmpeg official website](https://ffmpeg.org/download.html) or use chocolatey:
```bash
choco install ffmpeg
```

## Quick Start

### Basic Video Transcoding

```rust
use cluv::{Transcoder, TranscodeParams, SubTranscodeParams, Filters, VideoFilter, AudioFilter};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let transcoder = Transcoder::new();
    
    let params = TranscodeParams::builder()
        .input_file("input.mp4")
        .add_sub(SubTranscodeParams {
            output_file: "output.mp4".to_string(),
            filters: Some(Filters {
                video: Some(VideoFilter {
                    codec: Some("libx264".to_string()),
                    width: Some(1920),
                    height: Some(1080),
                    crf: Some(23),
                    ..Default::default()
                }),
                audio: Some(AudioFilter {
                    codec: Some("aac".to_string()),
                    bitrate: Some(128),
                }),
                ..Default::default()
            }),
            threads: Some(4),
        })
        .build()?;

    transcoder.simple_mp4(params).await?;
    println!("Transcoding completed!");
    Ok(())
}
```

### Taking Screenshots

```rust
use cluv::{Snapshot, SnapshotParams};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let snapshot = Snapshot::new();
    
    let params = SnapshotParams::builder()
        .input_file("input.mp4")
        .output_file("thumbnail.jpg")
        .single_screenshot()
        .start_time(30.0) // Screenshot at 30 seconds
        .resolution(1280, 720)
        .build()?;

    snapshot.simple(params).await?;
    println!("Screenshot saved!");
    Ok(())
}
```

### Generating Sprite Sheets

```rust
use cluv::{Snapshot, SpriteParams};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let snapshot = Snapshot::new();
    
    let params = SpriteParams::builder()
        .input_file("input.mp4")
        .output_file("sprite.jpg")
        .grid(5, 4) // 5 columns, 4 rows
        .thumbnail_size(160, 90)
        .interval(2.0) // 2 seconds between frames
        .build()?;

    snapshot.sprite(params).await?;
    println!("Sprite sheet generated!");
    Ok(())
}
```

## Advanced Usage

### Custom FFmpeg Options

```rust
use cluv::{Transcoder, CluvOptions, FFmpegOptions, LogLevel};

let options = CluvOptions::new()
    .with_ffmpeg(|opts| {
        opts.log_level(LogLevel::Debug)
            .debug(true)
            .binary_path("/usr/local/bin/ffmpeg")
            .add_arg("-preset")
            .add_arg("slow")
    });

let transcoder = Transcoder::with_options(options);
```

### Multiple Output Resolutions

```rust
let params = TranscodeParams::builder()
    .input_file("input.mp4")
    .add_sub(SubTranscodeParams {
        output_file: "output_720p.mp4".to_string(),
        filters: Some(Filters {
            video: Some(VideoFilter {
                width: Some(1280),
                height: Some(720),
                crf: Some(23),
                ..Default::default()
            }),
            ..Default::default()
        }),
        threads: Some(2),
    })
    .add_sub(SubTranscodeParams {
        output_file: "output_480p.mp4".to_string(),
        filters: Some(Filters {
            video: Some(VideoFilter {
                width: Some(854),
                height: Some(480),
                crf: Some(25),
                ..Default::default()
            }),
            ..Default::default()
        }),
        threads: Some(2),
    })
    .build()?;

transcoder.simple_mp4(params).await?;
```

### HLS Streaming

```rust
use cluv::{Transcoder, TranscodeHlsParams, HlsOptions};

let params = TranscodeHlsParams {
    input_file: "input.mp4".to_string(),
    output_file: "playlist.m3u8".to_string(),
    filters: Some(Filters {
        video: Some(VideoFilter {
            codec: Some("libx264".to_string()),
            width: Some(1280),
            height: Some(720),
            gop: Some(60),
            ..Default::default()
        }),
        hls: Some(HlsOptions {
            segment_type: Some("mpegts".to_string()),
            time: Some(6), // 6-second segments
            segment_filename: Some("segment_%03d.ts".to_string()),
            ..Default::default()
        }),
        ..Default::default()
    }),
    threads: Some(4),
};

transcoder.simple_hls(params).await?;
```

### Adding Watermarks

```rust
use cluv::{LogoFilter, DelogoFilter, Rectangle};

let filters = Filters {
    video: Some(VideoFilter {
        codec: Some("libx264".to_string()),
        ..Default::default()
    }),
    logo: vec![LogoFilter {
        file: "watermark.png".to_string(),
        position: Some("top-right".to_string()),
        dx: Some(10.0),
        dy: Some(10.0),
        width: Some(100.0),
        height: Some(50.0),
    }],
    delogo: vec![DelogoFilter {
        start_time: Some(0.0),
        rect: Rectangle {
            x: 100.0,
            y: 50.0,
            width: 200.0,
            height: 100.0,
        },
    }],
    ..Default::default()
};
```

## Command Line Usage

The library includes a command-line interface for common operations:

```bash
# Transcode video
cargo run -- transcode input.mov output.mp4

# Take screenshot
cargo run -- screenshot input.mp4 thumbnail.jpg

# Generate sprite sheet
cargo run -- sprite input.mp4 sprite.jpg

# Convert to HLS
cargo run -- hls input.mp4 output.m3u8

# Multiple outputs
cargo run -- multi input.mp4
```

## API Reference

### Core Types

- **`Transcoder`**: Main transcoding engine
- **`Snapshot`**: Screenshot and sprite generation
- **`TranscodeParams`**: Parameters for transcoding operations
- **`SnapshotParams`**: Parameters for screenshot operations
- **`SpriteParams`**: Parameters for sprite generation

### Filter Types

- **`VideoFilter`**: Video processing options (codec, resolution, bitrate, etc.)
- **`AudioFilter`**: Audio processing options
- **`LogoFilter`**: Watermark configuration
- **`DelogoFilter`**: Watermark removal configuration
- **`ClipFilter`**: Time-based clipping

### Configuration

- **`CluvOptions`**: Global configuration for FFmpeg and FFprobe
- **`FFmpegOptions`**: FFmpeg-specific settings
- **`FFprobeOptions`**: FFprobe-specific settings

## Error Handling

Cluv provides comprehensive error types:

```rust
use cluv::{CluvError, Result};

match transcoder.simple_mp4(params).await {
    Ok(()) => println!("Success!"),
    Err(CluvError::FFmpeg(msg)) => eprintln!("FFmpeg error: {}", msg),
    Err(CluvError::InvalidParams(msg)) => eprintln!("Invalid parameters: {}", msg),
    Err(CluvError::MissingParam(param)) => eprintln!("Missing parameter: {}", param),
    Err(e) => eprintln!("Other error: {}", e),
}
```

## Performance Tips

1. **Use appropriate thread counts**: Set `threads` based on your CPU cores
2. **Choose optimal CRF values**: 18-28 for x264, 23 is a good default
3. **Use hardware acceleration**: Add custom args for GPU encoding when available
4. **Batch operations**: Process multiple outputs in one transcoding session

## Supported Formats

### Video Codecs
- H.264 (libx264)
- H.265 (libx265)
- VP8/VP9
- AV1
- MJPEG

### Audio Codecs
- AAC
- MP3
- AC3
- Opus
- FLAC

### Container Formats
- MP4
- AVI
- MKV
- WebM
- MOV
- HLS
- MPEG-TS

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
git clone https://github.com/fxkt-tech/cluv
cd cluv
cargo build
cargo test
```

### Running Examples

```bash
# Basic transcoding
cargo run --example basic_transcode

# Screenshot example
cargo run --example screenshot

# Sprite generation
cargo run --example sprite_sheet
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the [liv](https://github.com/fxkt-tech/liv) Go library
- Built on top of the powerful [FFmpeg](https://ffmpeg.org/) multimedia framework
- Uses [Tokio](https://tokio.rs/) for async runtime

## Support

If you encounter any issues or have questions:

1. Check the [documentation](https://docs.rs/cluv)
2. Search existing [issues](https://github.com/fxkt-tech/cluv/issues)
3. Create a new issue with detailed information about your problem

## Changelog

### v0.1.0
- Initial release
- Basic transcoding functionality
- Screenshot and sprite generation
- HLS support
- Comprehensive filter system
- Async/await support