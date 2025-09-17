//! Transcoding functionality for video processing operations

use crate::error::{CluvError, Result};
use crate::ffmpeg::codec::{AudioCodec, Format, VideoCodec};
use crate::ffmpeg::filter::Filter;
use crate::ffmpeg::input::Input;
use crate::ffmpeg::output::Output;
use crate::ffmpeg::stream::Stream;
use crate::ffmpeg::FFmpeg;

use crate::options::CluvOptions;
use serde::{Deserialize, Serialize};

/// Main transcoder for video processing operations
#[derive(Debug)]
pub struct Transcoder {
    options: CluvOptions,
}

/// Parameters for transcoding operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscodeParams {
    /// Input file path
    pub input_file: String,
    /// Sub-transcode parameters for multiple outputs
    pub subs: Vec<SubTranscodeParams>,
}

/// Sub-transcode parameters for individual outputs
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubTranscodeParams {
    /// Output file path
    pub output_file: String,
    /// Filters to apply
    pub filters: Option<Filters>,
    /// Thread count for processing
    pub threads: Option<i32>,
}

/// Container conversion parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConvertContainerParams {
    /// Input file path
    pub input_file: String,
    /// Output file path
    pub output_file: String,
    /// Metadata to add
    pub metadata: Vec<KeyValue>,
    /// Thread count
    pub threads: Option<i32>,
}

/// HLS transcoding parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscodeHlsParams {
    /// Input file path
    pub input_file: String,
    /// Output file path
    pub output_file: String,
    /// Filters to apply
    pub filters: Option<Filters>,
    /// Thread count
    pub threads: Option<i32>,
}

/// TS transcoding parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscodeTsParams {
    /// Input file path
    pub input_file: String,
    /// Output file path
    pub output_file: String,
    /// Filters to apply
    pub filters: Option<Filters>,
    /// Thread count
    pub threads: Option<i32>,
}

/// Concatenation parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConcatParams {
    /// Input file paths
    pub input_files: Vec<String>,
    /// Concat file path (temporary file list)
    pub concat_file: String,
    /// Output file path
    pub output_file: String,
    /// Duration limit
    pub duration: Option<f32>,
}

/// Audio extraction parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractAudioParams {
    /// Input file path
    pub input_file: String,
    /// Output file path
    pub output_file: String,
}

/// Frame merge parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MergeFramesParams {
    /// Frames input file pattern
    pub frames_input_file: String,
    /// Video input file (optional)
    pub video_input_file: Option<String>,
    /// Audio input file
    pub audio_input_file: String,
    /// Filters to apply
    pub filters: Option<Filters>,
    /// Output file path
    pub output_file: String,
}

/// Filter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Filters {
    /// Container format
    pub container: Option<String>,
    /// Metadata key-value pairs
    pub metadata: Vec<KeyValue>,
    /// Video filters
    pub video: Option<VideoFilter>,
    /// Audio filters
    pub audio: Option<AudioFilter>,
    /// Logo/watermark filters
    pub logo: Vec<LogoFilter>,
    /// Delogo filters
    pub delogo: Vec<DelogoFilter>,
    /// Clip filter
    pub clip: Option<ClipFilter>,
    /// HLS-specific options
    pub hls: Option<HlsOptions>,
}

/// Key-value pair for metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyValue {
    /// Key
    pub key: String,
    /// Value
    pub value: String,
}

/// Video filter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFilter {
    /// Video codec
    pub codec: Option<String>,
    /// Width in pixels
    pub width: Option<i32>,
    /// Height in pixels
    pub height: Option<i32>,
    /// Short side length (for aspect ratio preservation)
    pub short: Option<i32>,
    /// Frame rate
    pub fps: Option<String>,
    /// Constant Rate Factor
    pub crf: Option<i32>,
    /// Quality setting
    pub quality: Option<f32>,
    /// Video bitrate
    pub bitrate: Option<i32>,
    /// GOP size
    pub gop: Option<i32>,
    /// PTS expression
    pub pts: Option<String>,
    /// Audio PTS expression
    pub apts: Option<String>,
    /// Pixel format
    pub pix_fmt: Option<String>,
}

/// Audio filter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioFilter {
    /// Audio codec
    pub codec: Option<String>,
    /// Audio bitrate
    pub bitrate: Option<i32>,
}

/// Logo/watermark filter
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogoFilter {
    /// Logo file path
    pub file: String,
    /// Position preset
    pub position: Option<String>,
    /// X offset
    pub dx: Option<f32>,
    /// Y offset
    pub dy: Option<f32>,
    /// Logo width
    pub width: Option<f32>,
    /// Logo height
    pub height: Option<f32>,
}

/// Delogo filter for removing watermarks
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelogoFilter {
    /// Start time
    pub start_time: Option<f32>,
    /// Rectangle to remove
    pub rect: Rectangle,
}

/// Rectangle definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rectangle {
    /// X coordinate
    pub x: f32,
    /// Y coordinate
    pub y: f32,
    /// Width
    pub width: f32,
    /// Height
    pub height: f32,
}

/// Clip filter for time-based cutting
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipFilter {
    /// Seek to start time
    pub seek: Option<f32>,
    /// Duration
    pub duration: Option<f32>,
}

/// HLS-specific options
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HlsOptions {
    /// Segment type
    pub segment_type: Option<String>,
    /// HLS flags
    pub flags: Option<String>,
    /// Playlist type
    pub playlist_type: Option<String>,
    /// Segment duration
    pub time: Option<i32>,
    /// Master playlist name
    pub master_playlist_name: Option<String>,
    /// Segment filename pattern
    pub segment_filename: Option<String>,
}

impl Transcoder {
    /// Create a new transcoder with default options
    pub fn new() -> Self {
        Self {
            options: CluvOptions::new(),
        }
    }

    /// Create a new transcoder with custom options
    pub fn with_options(options: CluvOptions) -> Self {
        Self { options }
    }

    /// Simple MP4 transcoding
    pub async fn simple_mp4(&self, params: TranscodeParams) -> Result<()> {
        self.validate_transcode_params(&params)?;

        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());
        let logo_start_index = 1;

        // Add main input
        ffmpeg = ffmpeg.add_input(Input::new(&params.input_file));

        // Process each sub-transcode
        for (i, sub) in params.subs.iter().enumerate() {
            let mut filters = Vec::new();
            let mut output_options = Vec::new();

            // Create split filter for multiple outputs
            if params.subs.len() > 1 {
                let split_filter = Filter::with_name("split")
                    .param(params.subs.len().to_string())
                    .refs([Stream::video(0)])
                    .output(format!("split_{}", i));
                filters.push(split_filter);
            }

            let mut last_video_filter = if params.subs.len() > 1 {
                format!("split_{}", i)
            } else {
                "0:v".to_string()
            };

            if let Some(ref filter_config) = sub.filters {
                // Process delogo filters
                for delogo in &filter_config.delogo {
                    let delogo_filter = Filter::with_name("delogo")
                        .params([
                            format!("x={}", delogo.rect.x),
                            format!("y={}", delogo.rect.y),
                            format!("w={}", delogo.rect.width),
                            format!("h={}", delogo.rect.height),
                        ])
                        .refs([&last_video_filter])
                        .output(format!("delogo_{}_{}", i, filters.len()));

                    last_video_filter = format!("delogo_{}_{}", i, filters.len());
                    filters.push(delogo_filter);
                }

                // Process video scaling
                if let Some(ref video) = filter_config.video {
                    if video.width.is_some() || video.height.is_some() {
                        let width = self.fix_pixel_len(video.width.unwrap_or(-2));
                        let height = self.fix_pixel_len(video.height.unwrap_or(-2));

                        let scale_filter = Filter::with_name("scale")
                            .params([width, height])
                            .refs([&last_video_filter])
                            .output(format!("scale_{}_{}", i, filters.len()));

                        last_video_filter = format!("scale_{}_{}", i, filters.len());
                        filters.push(scale_filter);
                    }

                    // Set CRF if specified
                    if let Some(crf) = video.crf {
                        output_options.push(("-crf".to_string(), crf.to_string()));
                    }
                }

                // Process logo overlays
                for (logo_idx, logo) in filter_config.logo.iter().enumerate() {
                    // Add logo input
                    ffmpeg = ffmpeg.add_input(Input::new(&logo.file));

                    let logo_stream = format!("{}:v", logo_start_index + logo_idx);
                    let mut logo_filter_stream = logo_stream.clone();

                    // Scale logo if needed
                    if logo.width.is_some() || logo.height.is_some() {
                        let logo_width =
                            self.fix_pixel_len(logo.width.map(|w| w as i32).unwrap_or(-2));
                        let logo_height =
                            self.fix_pixel_len(logo.height.map(|h| h as i32).unwrap_or(-2));

                        let logo_scale_filter = Filter::with_name("scale")
                            .params([logo_width, logo_height])
                            .refs([&logo_stream])
                            .output(format!("logo_scale_{}_{}_{}", i, logo_idx, filters.len()));

                        logo_filter_stream =
                            format!("logo_scale_{}_{}_{}", i, logo_idx, filters.len());
                        filters.push(logo_scale_filter);
                    }

                    // Create overlay filter
                    let overlay_pos = self.logo_position(
                        logo.dx.unwrap_or(0.0) as i32,
                        logo.dy.unwrap_or(0.0) as i32,
                        logo.position.as_deref().unwrap_or("top-left"),
                    );

                    let overlay_filter = Filter::with_name("overlay")
                        .param(overlay_pos)
                        .refs([&last_video_filter, &logo_filter_stream])
                        .output(format!("overlay_{}_{}", i, filters.len()));

                    last_video_filter = format!("overlay_{}_{}", i, filters.len());
                    filters.push(overlay_filter);
                }
            }

            // Add all filters
            for filter in filters {
                ffmpeg = ffmpeg.add_filter(filter);
            }

            // Create output
            let mut output = Output::new(&sub.output_file);

            // Map video stream
            output = output.map_stream(&last_video_filter);

            // Map audio stream
            output = output.map_stream("0:a");

            // Set codecs
            if let Some(ref filter_config) = sub.filters {
                if let Some(ref video) = filter_config.video {
                    if let Some(ref codec) = video.codec {
                        output = output.video_codec(VideoCodec::from(codec.as_str()));
                    }
                }

                if let Some(ref audio) = filter_config.audio {
                    if let Some(ref codec) = audio.codec {
                        output = output.audio_codec(AudioCodec::from(codec.as_str()));
                    }
                }

                // Add metadata
                for kv in &filter_config.metadata {
                    output = output.metadata(&kv.key, &kv.value);
                }

                // Add clip timing if specified
                if let Some(ref clip) = filter_config.clip {
                    if let Some(seek) = clip.seek {
                        output = output.start_time(seek);
                    }
                    if let Some(duration) = clip.duration {
                        output = output.duration(duration);
                    }
                }
            }

            // Set threads
            if let Some(threads) = sub.threads {
                output = output.threads(threads);
            }

            // Set default options
            output = output.mov_flags("faststart").max_muxing_queue_size(4096);

            ffmpeg = ffmpeg.add_output(output);
        }

        ffmpeg.run().await
    }

    /// Simple MP3 transcoding
    pub async fn simple_mp3(&self, params: TranscodeParams) -> Result<()> {
        self.validate_transcode_params(&params)?;

        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());

        // Add input
        ffmpeg = ffmpeg.add_input(Input::new(&params.input_file));

        // Create audio split if multiple outputs
        if params.subs.len() > 1 {
            let asplit_filter = Filter::with_name("asplit")
                .param(params.subs.len().to_string())
                .refs([Stream::audio(0)]);

            ffmpeg = ffmpeg.add_filter(asplit_filter);
        }

        // Process each output
        for (i, sub) in params.subs.iter().enumerate() {
            let mut output = Output::new(&sub.output_file);

            // Map audio stream
            let audio_stream = if params.subs.len() > 1 {
                format!("asplit:{}", i)
            } else {
                "0:a".to_string()
            };
            output = output.map_stream(&audio_stream);

            // Set audio codec and options
            if let Some(ref filters) = sub.filters {
                if let Some(ref audio) = filters.audio {
                    if let Some(ref codec) = audio.codec {
                        output = output.audio_codec(AudioCodec::from(codec.as_str()));
                    }
                    if let Some(bitrate) = audio.bitrate {
                        output = output.audio_bitrate(bitrate);
                    }
                }
            }

            // Set threads
            if let Some(threads) = sub.threads {
                output = output.threads(threads);
            }

            output = output.max_muxing_queue_size(4096);

            ffmpeg = ffmpeg.add_output(output);
        }

        ffmpeg.run().await
    }

    /// Simple JPEG screenshot
    pub async fn simple_jpeg(&self, params: TranscodeParams) -> Result<()> {
        self.validate_transcode_params(&params)?;

        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());

        // Add input
        ffmpeg = ffmpeg.add_input(Input::new(&params.input_file));

        // Create split if multiple outputs
        if params.subs.len() > 1 {
            let split_filter = Filter::with_name("split")
                .param(params.subs.len().to_string())
                .refs([Stream::video(0)]);
            ffmpeg = ffmpeg.add_filter(split_filter);
        }

        for (i, sub) in params.subs.iter().enumerate() {
            let mut last_filter = if params.subs.len() > 1 {
                format!("split:{}", i)
            } else {
                "0:v".to_string()
            };

            if let Some(ref filter_config) = sub.filters {
                // Apply video filters similar to MP4 but for single frame
                if let Some(ref video) = filter_config.video {
                    if video.width.is_some() || video.height.is_some() {
                        let width = self.fix_pixel_len(video.width.unwrap_or(-2));
                        let height = self.fix_pixel_len(video.height.unwrap_or(-2));

                        let scale_filter = Filter::with_name("scale")
                            .params([width, height])
                            .refs([&last_filter])
                            .output(format!("scale_{}", i));

                        last_filter = format!("scale_{}", i);
                        ffmpeg = ffmpeg.add_filter(scale_filter);
                    }
                }
            }

            let mut output = Output::new(&sub.output_file)
                .map_stream(&last_filter)
                .format(Format::Image2);

            if let Some(ref filters) = sub.filters {
                if let Some(ref video) = filters.video {
                    if let Some(ref codec) = video.codec {
                        output = output.video_codec(VideoCodec::from(codec.as_str()));
                    }
                }
            }

            if let Some(threads) = sub.threads {
                output = output.threads(threads);
            }

            output = output.max_muxing_queue_size(4096);

            ffmpeg = ffmpeg.add_output(output);
        }

        ffmpeg.run().await
    }

    /// Convert container format without re-encoding
    pub async fn convert_container(&self, params: ConvertContainerParams) -> Result<()> {
        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());

        ffmpeg = ffmpeg.add_input(Input::new(&params.input_file));

        let mut output = Output::new(&params.output_file)
            .video_codec(VideoCodec::Copy)
            .audio_codec(AudioCodec::Copy)
            .mov_flags("faststart")
            .max_muxing_queue_size(4096);

        // Add metadata
        for kv in &params.metadata {
            output = output.metadata(&kv.key, &kv.value);
        }

        if let Some(threads) = params.threads {
            output = output.threads(threads);
        }

        ffmpeg = ffmpeg.add_output(output);

        ffmpeg.run().await
    }

    /// Simple HLS transcoding
    pub async fn simple_hls(&self, params: TranscodeHlsParams) -> Result<()> {
        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());

        // Add input with clipping if specified
        let input = if let Some(ref filters) = params.filters {
            if let Some(ref clip) = filters.clip {
                Input::with_time(
                    clip.seek.unwrap_or(0.0),
                    clip.duration.unwrap_or(0.0),
                    &params.input_file,
                )
            } else {
                Input::new(&params.input_file)
            }
        } else {
            Input::new(&params.input_file)
        };

        ffmpeg = ffmpeg.add_input(input);

        let mut last_video_filter = "0:v".to_string();

        // Apply filters if specified
        if let Some(ref filter_config) = params.filters {
            if let Some(ref video) = filter_config.video {
                if video.width.is_some() || video.height.is_some() {
                    let width = self.fix_pixel_len(video.width.unwrap_or(-2));
                    let height = self.fix_pixel_len(video.height.unwrap_or(-2));

                    let scale_filter = Filter::with_name("scale")
                        .params([width, height])
                        .refs([Stream::video(0)])
                        .output("scaled");

                    last_video_filter = "scaled".to_string();
                    ffmpeg = ffmpeg.add_filter(scale_filter);
                }
            }
        }

        let mut output = Output::new(&params.output_file)
            .map_stream(&last_video_filter)
            .map_stream("0:a")
            .format(Format::Hls)
            .option("sc_threshold", "0")
            .mov_flags("faststart");

        // Set HLS-specific options
        if let Some(ref filters) = params.filters {
            if let Some(ref video) = filters.video {
                if let Some(crf) = video.crf {
                    output = output.crf(crf);
                }
                if let Some(ref codec) = video.codec {
                    output = output.video_codec(VideoCodec::from(codec.as_str()));
                }
                if let Some(gop) = video.gop {
                    output = output.gop_size(gop);
                }
            }

            if let Some(ref audio) = filters.audio {
                if let Some(ref codec) = audio.codec {
                    output = output.audio_codec(AudioCodec::from(codec.as_str()));
                }
            }

            if let Some(ref hls) = filters.hls {
                if let Some(time) = hls.time {
                    output = output.hls_time(time);
                }
                if let Some(ref segment_filename) = hls.segment_filename {
                    output = output.hls_segment_filename(segment_filename);
                }
                if let Some(ref segment_type) = hls.segment_type {
                    output = output.hls_segment_type(segment_type);
                }
                if let Some(ref flags) = hls.flags {
                    output = output.hls_flags(flags);
                }
                if let Some(ref playlist_type) = hls.playlist_type {
                    output = output.hls_playlist_type(playlist_type);
                }
            }
        }

        if let Some(threads) = params.threads {
            output = output.threads(threads);
        }

        ffmpeg = ffmpeg.add_output(output);

        ffmpeg.run().await
    }

    /// Extract audio from video
    pub async fn extract_audio(&self, params: ExtractAudioParams) -> Result<()> {
        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());

        ffmpeg = ffmpeg.add_input(Input::new(&params.input_file)).add_output(
            Output::new(&params.output_file)
                .audio_codec(AudioCodec::Copy)
                .video_codec(VideoCodec::None),
        );

        ffmpeg.run().await
    }

    /// Concatenate multiple video files
    pub async fn concat(&self, params: ConcatParams) -> Result<()> {
        // Create concat file
        self.create_concat_file(&params.input_files, &params.concat_file)
            .await?;

        let mut ffmpeg = FFmpeg::new().set_options(self.options.ffmpeg.clone());

        ffmpeg = ffmpeg.add_input(Input::with_concat(&params.concat_file));

        let mut output = Output::new(&params.output_file)
            .video_codec(VideoCodec::Copy)
            .audio_codec(AudioCodec::Copy);

        if let Some(duration) = params.duration {
            output = output.duration(duration);
        }

        ffmpeg = ffmpeg.add_output(output);

        ffmpeg.run().await
    }

    // Helper methods

    fn validate_transcode_params(&self, params: &TranscodeParams) -> Result<()> {
        if params.input_file.is_empty() {
            return Err(CluvError::missing_param("input_file"));
        }

        if params.subs.is_empty() {
            return Err(CluvError::invalid_params(
                "No sub-transcode parameters provided",
            ));
        }

        for sub in &params.subs {
            if sub.output_file.is_empty() {
                return Err(CluvError::missing_param("output_file"));
            }
        }

        Ok(())
    }

    fn fix_pixel_len(&self, len: i32) -> String {
        if len <= 0 {
            "-2".to_string()
        } else if len % 2 == 0 {
            len.to_string()
        } else {
            (len + 1).to_string()
        }
    }

    fn logo_position(&self, dx: i32, dy: i32, position: &str) -> String {
        match position {
            "top-left" => format!("{}:{}", dx, dy),
            "top-right" => format!("W-w-{}:{}", dx, dy),
            "bottom-left" => format!("{}:H-h-{}", dx, dy),
            "bottom-right" => format!("W-w-{}:H-h-{}", dx, dy),
            "center" => format!("(W-w)/2+{}:(H-h)/2+{}", dx, dy),
            _ => format!("{}:{}", dx, dy),
        }
    }

    async fn create_concat_file(&self, files: &[String], concat_file: &str) -> Result<()> {
        use tokio::io::AsyncWriteExt;

        let content = files
            .iter()
            .map(|f| format!("file '{}'", f))
            .collect::<Vec<_>>()
            .join("\n");

        let mut file = tokio::fs::File::create(concat_file)
            .await
            .map_err(|e| CluvError::custom(format!("Failed to create concat file: {}", e)))?;

        file.write_all(content.as_bytes())
            .await
            .map_err(|e| CluvError::custom(format!("Failed to write concat file: {}", e)))?;

        Ok(())
    }
}

impl Default for Transcoder {
    fn default() -> Self {
        Self::new()
    }
}

// Builder implementations

impl TranscodeParams {
    pub fn builder() -> TranscodeParamsBuilder {
        TranscodeParamsBuilder::new()
    }
}

pub struct TranscodeParamsBuilder {
    input_file: Option<String>,
    subs: Vec<SubTranscodeParams>,
}

impl TranscodeParamsBuilder {
    pub fn new() -> Self {
        Self {
            input_file: None,
            subs: Vec::new(),
        }
    }

    pub fn input_file<S: Into<String>>(mut self, input: S) -> Self {
        self.input_file = Some(input.into());
        self
    }

    pub fn add_output<S: Into<String>>(mut self, output: S) -> Self {
        self.subs.push(SubTranscodeParams {
            output_file: output.into(),
            filters: None,
            threads: None,
        });
        self
    }

    pub fn add_sub(mut self, sub: SubTranscodeParams) -> Self {
        self.subs.push(sub);
        self
    }

    pub fn build(self) -> Result<TranscodeParams> {
        let input_file = self
            .input_file
            .ok_or_else(|| CluvError::missing_param("input_file"))?;

        if self.subs.is_empty() {
            return Err(CluvError::invalid_params("No outputs specified"));
        }

        Ok(TranscodeParams {
            input_file,
            subs: self.subs,
        })
    }
}

impl Default for TranscodeParamsBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl LogoFilter {
    /// Check if logo needs scaling
    pub fn needs_scaling(&self) -> bool {
        self.width.is_some() || self.height.is_some()
    }
}

// Default implementations for structs
impl Default for Filters {
    fn default() -> Self {
        Self {
            container: None,
            metadata: Vec::new(),
            video: None,
            audio: None,
            logo: Vec::new(),
            delogo: Vec::new(),
            clip: None,
            hls: None,
        }
    }
}

impl Default for VideoFilter {
    fn default() -> Self {
        Self {
            codec: None,
            width: None,
            height: None,
            short: None,
            fps: None,
            crf: None,
            quality: None,
            bitrate: None,
            gop: None,
            pts: None,
            apts: None,
            pix_fmt: None,
        }
    }
}

impl Default for AudioFilter {
    fn default() -> Self {
        Self {
            codec: None,
            bitrate: None,
        }
    }
}

impl Default for ClipFilter {
    fn default() -> Self {
        Self {
            seek: None,
            duration: None,
        }
    }
}

impl Default for HlsOptions {
    fn default() -> Self {
        Self {
            segment_type: None,
            flags: None,
            playlist_type: None,
            time: None,
            master_playlist_name: None,
            segment_filename: None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transcode_params_builder() {
        let params = TranscodeParams::builder()
            .input_file("input.mp4")
            .add_output("output1.mp4")
            .add_output("output2.mp4")
            .build()
            .unwrap();

        assert_eq!(params.input_file, "input.mp4");
        assert_eq!(params.subs.len(), 2);
        assert_eq!(params.subs[0].output_file, "output1.mp4");
        assert_eq!(params.subs[1].output_file, "output2.mp4");
    }

    #[test]
    fn test_logo_needs_scaling() {
        let logo = LogoFilter {
            file: "logo.png".to_string(),
            position: Some("top-left".to_string()),
            dx: Some(10.0),
            dy: Some(10.0),
            width: Some(100.0),
            height: None,
        };

        assert!(logo.needs_scaling());

        let logo_no_scale = LogoFilter {
            file: "logo.png".to_string(),
            position: Some("top-left".to_string()),
            dx: Some(10.0),
            dy: Some(10.0),
            width: None,
            height: None,
        };

        assert!(!logo_no_scale.needs_scaling());
    }

    #[test]
    fn test_transcoder_logo_position() {
        let transcoder = Transcoder::new();

        assert_eq!(transcoder.logo_position(10, 20, "top-left"), "10:20");
        assert_eq!(transcoder.logo_position(10, 20, "top-right"), "W-w-10:20");
        assert_eq!(transcoder.logo_position(10, 20, "bottom-left"), "10:H-h-20");
        assert_eq!(
            transcoder.logo_position(10, 20, "center"),
            "(W-w)/2+10:(H-h)/2+20"
        );
    }

    #[test]
    fn test_fix_pixel_len() {
        let transcoder = Transcoder::new();

        assert_eq!(transcoder.fix_pixel_len(1920), "1920");
        assert_eq!(transcoder.fix_pixel_len(1921), "1922");
        assert_eq!(transcoder.fix_pixel_len(-1), "-2");
        assert_eq!(transcoder.fix_pixel_len(0), "-2");
    }
}
