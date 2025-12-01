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
pub mod composer;
pub mod cut;
pub mod error;
pub mod ffmpeg;
pub mod ffprobe;
pub mod options;
pub mod pkg;

// Re-export main types
pub use cut::{
    AudioMaterial, CutProtocol, Dimension, EditSession, Editor, ExportConfig, ExportType,
    ImageMaterial, Material, MaterialType, Position, Scale, Segment, Stage, TimeRange, Track,
    TrackType, VideoMaterial,
};
pub use error::{CluvError, Result};
pub use options::*;
