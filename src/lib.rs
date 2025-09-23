//! # Cluv
//!
//! A friendly FFmpeg wrapper for Rust, translated from the Go library `liv`.
//!
//! This library provides a high-level interface for video processing operations
//! including transcoding, screenshot generation, and various video filters.
//!
//! ## Features
//!
//! - Video transcoding to multiple formats (MP4, MP3, JPEG, HLS, TS)
//! - Screenshot generation with various modes
//! - Video filters (scaling, watermarks, delogo, clipping)
//! - Video concatenation and audio extraction
//! - Sprite sheet generation
//!
//! ## Example
//!
/// ```rust,no_run
/// use cluv::{Transcoder, TranscodeParams};
///
/// #[tokio::main]
/// async fn main() -> Result<(), Box<dyn std::error::Error>> {
///     let transcoder = Transcoder::new();
///     let params = TranscodeParams::builder()
///         .input_file("input.mp4")
///         .add_output("output.mp4")
///         .build()?;
///
///     transcoder.simple_mp4(params).await?;
///     Ok(())
/// }
/// ```
pub mod edit;
pub mod error;
pub mod ffmpeg;
pub mod ffprobe;
pub mod options;
pub mod pkg;
pub mod snapshot;
pub mod transcode;

// Re-export main types
pub use edit::{
    AudioMaterial, CutProtocol, Dimension, EditSession, Editor, ExportConfig, ExportType,
    ImageMaterial, Material, MaterialType, Position, Scale, Segment, Stage, TimeRange, Track,
    TrackType, VideoMaterial,
};
pub use error::{CluvError, Result};
pub use options::*;
pub use snapshot::{Point, Snapshot, SnapshotParams, SpriteParams, SvgAnnotation, SvgMarkParams};
pub use transcode::{
    AudioFilter, ClipFilter, ConcatParams, ConvertContainerParams, DelogoFilter,
    ExtractAudioParams, Filters, HlsOptions, KeyValue, LogoFilter, MergeFramesParams, Rectangle,
    SubTranscodeParams, TranscodeHlsParams, TranscodeParams, TranscodeTsParams, Transcoder,
    VideoFilter as TranscodeVideoFilter,
};
