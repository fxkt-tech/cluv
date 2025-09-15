//! Output handling for FFmpeg operations

use crate::ffmpeg::codec::{AudioCodec, Format, PixelFormat, VideoCodec};
use crate::ffmpeg::stream::Stream;
use std::collections::HashMap;
use std::fmt;

/// FFmpeg output configuration
#[derive(Debug, Clone)]
pub struct Output {
    /// Output file path
    pub path: String,
    /// Video codec
    pub video_codec: Option<VideoCodec>,
    /// Audio codec
    pub audio_codec: Option<AudioCodec>,
    /// Output format
    pub format: Option<Format>,
    /// Pixel format
    pub pixel_format: Option<PixelFormat>,
    /// Video bitrate
    pub video_bitrate: Option<i32>,
    /// Audio bitrate
    pub audio_bitrate: Option<i32>,
    /// Constant Rate Factor (CRF) for quality-based encoding
    pub crf: Option<i32>,
    /// Frame rate
    pub framerate: Option<String>,
    /// Thread count
    pub threads: Option<i32>,
    /// Start time for output
    pub start_time: Option<f32>,
    /// Duration for output
    pub duration: Option<f32>,
    /// Maximum video frames
    pub max_frames: Option<i32>,
    /// Stream mappings
    pub mappings: Vec<String>,
    /// Metadata key-value pairs
    pub metadata: HashMap<String, String>,
    /// Custom options
    pub options: Vec<(String, String)>,
    /// MOV flags
    pub mov_flags: Option<String>,
    /// Max muxing queue size
    pub max_muxing_queue_size: Option<i32>,
    /// GOP size
    pub gop_size: Option<i32>,
    /// VSync method
    pub vsync: Option<String>,
    /// HLS-specific options
    pub hls_time: Option<i32>,
    pub hls_segment_filename: Option<String>,
    pub hls_segment_type: Option<String>,
    pub hls_flags: Option<String>,
    pub hls_playlist_type: Option<String>,
}

impl Output {
    /// Create a new output with just a file path
    pub fn new<S: Into<String>>(path: S) -> Self {
        Self {
            path: path.into(),
            video_codec: None,
            audio_codec: None,
            format: None,
            pixel_format: None,
            video_bitrate: None,
            audio_bitrate: None,
            crf: None,
            framerate: None,
            threads: None,
            start_time: None,
            duration: None,
            max_frames: None,
            mappings: Vec::new(),
            metadata: HashMap::new(),
            options: Vec::new(),
            mov_flags: None,
            max_muxing_queue_size: None,
            gop_size: None,
            vsync: None,
            hls_time: None,
            hls_segment_filename: None,
            hls_segment_type: None,
            hls_flags: None,
            hls_playlist_type: None,
        }
    }

    /// Set video codec
    pub fn video_codec(mut self, codec: VideoCodec) -> Self {
        self.video_codec = Some(codec);
        self
    }

    /// Set audio codec
    pub fn audio_codec(mut self, codec: AudioCodec) -> Self {
        self.audio_codec = Some(codec);
        self
    }

    /// Set output format
    pub fn format(mut self, format: Format) -> Self {
        self.format = Some(format);
        self
    }

    /// Set pixel format
    pub fn pixel_format(mut self, format: PixelFormat) -> Self {
        self.pixel_format = Some(format);
        self
    }

    /// Set video bitrate
    pub fn video_bitrate(mut self, bitrate: i32) -> Self {
        self.video_bitrate = Some(bitrate);
        self
    }

    /// Set audio bitrate
    pub fn audio_bitrate(mut self, bitrate: i32) -> Self {
        self.audio_bitrate = Some(bitrate);
        self
    }

    /// Set CRF for quality-based encoding
    pub fn crf(mut self, crf: i32) -> Self {
        self.crf = Some(crf);
        self
    }

    /// Set frame rate
    pub fn framerate<S: Into<String>>(mut self, fps: S) -> Self {
        self.framerate = Some(fps.into());
        self
    }

    /// Set thread count
    pub fn threads(mut self, count: i32) -> Self {
        self.threads = Some(count);
        self
    }

    /// Set start time
    pub fn start_time(mut self, time: f32) -> Self {
        self.start_time = Some(time);
        self
    }

    /// Set duration
    pub fn duration(mut self, duration: f32) -> Self {
        self.duration = Some(duration);
        self
    }

    /// Set maximum video frames
    pub fn max_frames(mut self, frames: i32) -> Self {
        self.max_frames = Some(frames);
        self
    }

    /// Add a stream mapping
    pub fn map<S: Into<String>>(mut self, mapping: S) -> Self {
        self.mappings.push(mapping.into());
        self
    }

    /// Add a stream mapping from a stream reference
    pub fn map_stream(mut self, stream: &Stream) -> Self {
        self.mappings.push(stream.to_string());
        self
    }

    /// Add metadata
    pub fn metadata<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.metadata.insert(key.into(), value.into());
        self
    }

    /// Add a custom option
    pub fn option<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.options.push((key.into(), value.into()));
        self
    }

    /// Set MOV flags
    pub fn mov_flags<S: Into<String>>(mut self, flags: S) -> Self {
        self.mov_flags = Some(flags.into());
        self
    }

    /// Set max muxing queue size
    pub fn max_muxing_queue_size(mut self, size: i32) -> Self {
        self.max_muxing_queue_size = Some(size);
        self
    }

    /// Set GOP size
    pub fn gop_size(mut self, size: i32) -> Self {
        self.gop_size = Some(size);
        self
    }

    /// Set VSync method
    pub fn vsync<S: Into<String>>(mut self, method: S) -> Self {
        self.vsync = Some(method.into());
        self
    }

    /// Set HLS segment duration
    pub fn hls_time(mut self, time: i32) -> Self {
        self.hls_time = Some(time);
        self
    }

    /// Set HLS segment filename pattern
    pub fn hls_segment_filename<S: Into<String>>(mut self, filename: S) -> Self {
        self.hls_segment_filename = Some(filename.into());
        self
    }

    /// Set HLS segment type
    pub fn hls_segment_type<S: Into<String>>(mut self, segment_type: S) -> Self {
        self.hls_segment_type = Some(segment_type.into());
        self
    }

    /// Set HLS flags
    pub fn hls_flags<S: Into<String>>(mut self, flags: S) -> Self {
        self.hls_flags = Some(flags.into());
        self
    }

    /// Set HLS playlist type
    pub fn hls_playlist_type<S: Into<String>>(mut self, playlist_type: S) -> Self {
        self.hls_playlist_type = Some(playlist_type.into());
        self
    }

    /// Convert to FFmpeg command line arguments
    pub fn to_args(&self) -> Vec<String> {
        let mut args = Vec::new();

        // Add stream mappings
        for mapping in &self.mappings {
            args.push("-map".to_string());
            args.push(mapping.clone());
        }

        // Add video codec
        if let Some(ref codec) = self.video_codec {
            args.push("-c:v".to_string());
            args.push(codec.to_string());
        }

        // Add audio codec
        if let Some(ref codec) = self.audio_codec {
            args.push("-c:a".to_string());
            args.push(codec.to_string());
        }

        // Add pixel format
        if let Some(ref pix_fmt) = self.pixel_format {
            args.push("-pix_fmt".to_string());
            args.push(pix_fmt.to_string());
        }

        // Add video bitrate
        if let Some(bitrate) = self.video_bitrate {
            args.push("-b:v".to_string());
            args.push(format!("{}k", bitrate));
        }

        // Add audio bitrate
        if let Some(bitrate) = self.audio_bitrate {
            args.push("-b:a".to_string());
            args.push(format!("{}k", bitrate));
        }

        // Add CRF
        if let Some(crf) = self.crf {
            args.push("-crf".to_string());
            args.push(crf.to_string());
        }

        // Add framerate
        if let Some(ref fps) = self.framerate {
            args.push("-r".to_string());
            args.push(fps.clone());
        }

        // Add threads
        if let Some(threads) = self.threads {
            args.push("-threads".to_string());
            args.push(threads.to_string());
        }

        // Add start time
        if let Some(start_time) = self.start_time {
            args.push("-ss".to_string());
            args.push(start_time.to_string());
        }

        // Add duration
        if let Some(duration) = self.duration {
            args.push("-t".to_string());
            args.push(duration.to_string());
        }

        // Add max frames
        if let Some(frames) = self.max_frames {
            args.push("-vframes".to_string());
            args.push(frames.to_string());
        }

        // Add format
        if let Some(ref format) = self.format {
            args.push("-f".to_string());
            args.push(format.to_string());
        }

        // Add MOV flags
        if let Some(ref flags) = self.mov_flags {
            args.push("-movflags".to_string());
            args.push(flags.clone());
        }

        // Add max muxing queue size
        if let Some(size) = self.max_muxing_queue_size {
            args.push("-max_muxing_queue_size".to_string());
            args.push(size.to_string());
        }

        // Add GOP size
        if let Some(gop) = self.gop_size {
            args.push("-g".to_string());
            args.push(gop.to_string());
        }

        // Add VSync
        if let Some(ref vsync) = self.vsync {
            args.push("-vsync".to_string());
            args.push(vsync.clone());
        }

        // Add HLS options
        if let Some(time) = self.hls_time {
            args.push("-hls_time".to_string());
            args.push(time.to_string());
        }

        if let Some(ref filename) = self.hls_segment_filename {
            args.push("-hls_segment_filename".to_string());
            args.push(filename.clone());
        }

        if let Some(ref segment_type) = self.hls_segment_type {
            args.push("-hls_segment_type".to_string());
            args.push(segment_type.clone());
        }

        if let Some(ref flags) = self.hls_flags {
            args.push("-hls_flags".to_string());
            args.push(flags.clone());
        }

        if let Some(ref playlist_type) = self.hls_playlist_type {
            args.push("-hls_playlist_type".to_string());
            args.push(playlist_type.clone());
        }

        // Add metadata
        for (key, value) in &self.metadata {
            args.push("-metadata".to_string());
            args.push(format!("{}={}", key, value));
        }

        // Add custom options
        for (key, value) in &self.options {
            args.push(format!("-{}", key));
            args.push(value.clone());
        }

        // Add output file
        args.push(self.path.clone());

        args
    }
}

impl fmt::Display for Output {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.path)
    }
}

/// Collection of outputs
pub type Outputs = Vec<Output>;

/// Output builder for more complex configurations
#[derive(Debug, Default)]
pub struct OutputBuilder {
    path: Option<String>,
    video_codec: Option<VideoCodec>,
    audio_codec: Option<AudioCodec>,
    format: Option<Format>,
    pixel_format: Option<PixelFormat>,
    video_bitrate: Option<i32>,
    audio_bitrate: Option<i32>,
    crf: Option<i32>,
    framerate: Option<String>,
    threads: Option<i32>,
    start_time: Option<f32>,
    duration: Option<f32>,
    max_frames: Option<i32>,
    mappings: Vec<String>,
    metadata: HashMap<String, String>,
    options: Vec<(String, String)>,
}

impl OutputBuilder {
    /// Create a new output builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the output path
    pub fn path<S: Into<String>>(mut self, path: S) -> Self {
        self.path = Some(path.into());
        self
    }

    /// Set video codec
    pub fn video_codec(mut self, codec: VideoCodec) -> Self {
        self.video_codec = Some(codec);
        self
    }

    /// Set audio codec
    pub fn audio_codec(mut self, codec: AudioCodec) -> Self {
        self.audio_codec = Some(codec);
        self
    }

    /// Set format
    pub fn format(mut self, format: Format) -> Self {
        self.format = Some(format);
        self
    }

    /// Set CRF
    pub fn crf(mut self, crf: i32) -> Self {
        self.crf = Some(crf);
        self
    }

    /// Add mapping
    pub fn map<S: Into<String>>(mut self, mapping: S) -> Self {
        self.mappings.push(mapping.into());
        self
    }

    /// Add metadata
    pub fn metadata<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.metadata.insert(key.into(), value.into());
        self
    }

    /// Build the output
    pub fn build(self) -> Result<Output, String> {
        let path = self.path.ok_or("Path is required for output")?;

        Ok(Output {
            path,
            video_codec: self.video_codec,
            audio_codec: self.audio_codec,
            format: self.format,
            pixel_format: self.pixel_format,
            video_bitrate: self.video_bitrate,
            audio_bitrate: self.audio_bitrate,
            crf: self.crf,
            framerate: self.framerate,
            threads: self.threads,
            start_time: self.start_time,
            duration: self.duration,
            max_frames: self.max_frames,
            mappings: self.mappings,
            metadata: self.metadata,
            options: self.options,
            mov_flags: None,
            max_muxing_queue_size: None,
            gop_size: None,
            vsync: None,
            hls_time: None,
            hls_segment_filename: None,
            hls_segment_type: None,
            hls_flags: None,
            hls_playlist_type: None,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_output() {
        let output = Output::new("output.mp4");
        let args = output.to_args();

        assert_eq!(args, vec!["output.mp4"]);
    }

    #[test]
    fn test_output_with_codecs() {
        let output = Output::new("output.mp4")
            .video_codec(VideoCodec::H264)
            .audio_codec(AudioCodec::Aac)
            .crf(23);

        let args = output.to_args();

        assert!(args.contains(&"-c:v".to_string()));
        assert!(args.contains(&"libx264".to_string()));
        assert!(args.contains(&"-c:a".to_string()));
        assert!(args.contains(&"aac".to_string()));
        assert!(args.contains(&"-crf".to_string()));
        assert!(args.contains(&"23".to_string()));
    }

    #[test]
    fn test_output_builder() {
        let output = OutputBuilder::new()
            .path("test.mp4")
            .video_codec(VideoCodec::H264)
            .crf(20)
            .metadata("title", "Test Video")
            .build()
            .unwrap();

        assert_eq!(output.path, "test.mp4");
        assert_eq!(output.video_codec, Some(VideoCodec::H264));
        assert_eq!(output.crf, Some(20));
        assert_eq!(
            output.metadata.get("title"),
            Some(&"Test Video".to_string())
        );
    }
}
