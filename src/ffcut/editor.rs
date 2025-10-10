//! Main video editor implementation

use crate::error::{CluvError, Result};
use crate::ffcut::{
    material::Material,
    protocol::{CutProtocol, ExportType},
    segment::Segment,
    stage::Stage,
    track::Track,
    EditSession,
};
use crate::ffmpeg::stream::Streamable;
use crate::ffmpeg::{
    codec::{AudioCodec, VideoCodec},
    filter::Filter,
    input::Input,
    output::Output,
    FFmpeg,
};
use crate::FFmpegOptions;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Main video editor for composition and export
#[derive(Debug)]
pub struct Editor {
    /// FFmpeg options
    ffmpeg_options: FFmpegOptions,
    /// Current editing session
    session: EditSession,
}

/// Export options for video rendering
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExportOptions {
    /// Output file path
    pub output_file: String,
    /// Export type
    pub export_type: ExportType,
    /// Video codec (for video exports)
    pub video_codec: Option<String>,
    /// Audio codec
    pub audio_codec: Option<String>,
    /// Video quality (CRF)
    pub quality: Option<i32>,
    /// Video bitrate
    pub video_bitrate: Option<i32>,
    /// Audio bitrate
    pub audio_bitrate: Option<i32>,
    /// Custom FFmpeg options
    pub custom_options: HashMap<String, String>,
}

impl Editor {
    /// Create a new editor with default options
    pub fn new() -> Self {
        Self {
            ffmpeg_options: FFmpegOptions::new(),
            session: EditSession::default(),
        }
    }

    /// Set stage configuration
    pub fn set_stage(mut self, stage: Stage) -> Self {
        self.session.stage = stage;
        self
    }

    /// Set ffmpeg options
    pub fn set_ffmpeg_options(mut self, options: FFmpegOptions) -> Self {
        self.ffmpeg_options = options;
        self
    }

    /// Load session from cut protocol
    pub fn load_from_protocol(&mut self, protocol: &CutProtocol) -> Result<()> {
        self.session = CutProtocol::to_session(protocol)?;
        Ok(())
    }

    /// Load session from JSON string
    pub fn load_from_json(&mut self, json: &str) -> Result<()> {
        let protocol = CutProtocol::from_json(json)?;
        self.load_from_protocol(&protocol)
    }

    /// Save session to cut protocol
    pub fn save_to_protocol(&self) -> CutProtocol {
        self.session.to_protocol()
    }

    /// Save session to JSON string
    pub fn save_to_json(&self) -> Result<String> {
        let protocol = self.save_to_protocol();
        protocol.to_json()
    }

    /// Get current editing session
    pub fn session(&self) -> &EditSession {
        &self.session
    }

    /// Get mutable editing session
    pub fn session_mut(&mut self) -> &mut EditSession {
        &mut self.session
    }

    /// Add material to the session
    pub fn add_material(&mut self, material: Material) -> &mut Self {
        self.session.add_material(material);
        self
    }

    /// Add track to the session
    pub fn add_track(&mut self, track: Track) -> &mut Self {
        self.session.add_track(track);
        self
    }

    /// Create and add a video track
    pub fn add_video_track(&mut self) -> &mut Self {
        let track = Track::video();
        self.session.add_track(track);
        self
    }

    /// Create and add an audio track
    pub fn add_audio_track(&mut self) -> &mut Self {
        let track = Track::audio();
        self.session.add_track(track);
        self
    }

    /// Add segment to track
    pub fn add_segment_to_track(&mut self, track_id: &str, segment: Segment) -> Result<()> {
        if let Some(track) = self.session.get_track_mut(track_id) {
            track.add_segment(segment);
            Ok(())
        } else {
            Err(CluvError::invalid_params(format!(
                "Track '{}' not found",
                track_id
            )))
        }
    }

    /// Validate the current session
    pub fn validate(&self) -> Result<()> {
        self.session.validate()
    }

    /// Export video using the built-in composition engine
    pub async fn export(&self, options: ExportOptions) -> Result<()> {
        self.validate()?;

        let mut ffmpeg = FFmpeg::new().set_options(self.ffmpeg_options.clone());

        // Add inputs for all referenced materials
        let mut material_inputs: HashMap<String, Input> = HashMap::new();
        for track in &self.session.tracks {
            for segment in &track.segments {
                if !material_inputs.contains_key(&segment.material_id) {
                    if let Some(material) = self.session.get_material(&segment.material_id) {
                        let input = Input::with_time(
                            segment.source_timerange.start as f32 / 1000.0,
                            segment.source_timerange.duration as f32 / 1000.0,
                            material.src(),
                        )
                        .ffcx(&mut ffmpeg);
                        material_inputs.insert(segment.material_id.clone(), input);
                    }
                }
            }
        }

        // Create stage background
        let mut stage_bg = Filter::color(
            self.session.stage.width,
            self.session.stage.height,
            self.session.total_duration() as f64 / 1000.0,
        )
        .ffcx(&mut ffmpeg);

        // Process video tracks in reverse order (bottom to top)
        let video_tracks = self.session.video_tracks();
        for track in video_tracks.iter().rev() {
            if !track.enabled {
                continue;
            }

            for segment in &track.segments {
                if let Some(input) = material_inputs.get(&segment.material_id) {
                    let mut f_last_v = input.v();

                    // Apply time-based trimming
                    let target_start = segment.target_timerange.start as f64 / 1000.0;
                    let target_duration = segment.target_timerange.duration as f64 / 1000.0;

                    // 视频流：缩放视频
                    if let Some(scale) = segment.scale {
                        let f_scale = Filter::scale(scale.width, scale.height)
                            .r(f_last_v)
                            .ffcx(&mut ffmpeg);
                        f_last_v = f_scale.to_stream();
                    }

                    // 视频流：是否需要倍速
                    if segment.needs_speed_adjustment() {
                        let speed = segment.playback_speed();
                        let f_setpts = Filter::setpts(format!("1/{speed}*PTS"))
                            .r(f_last_v)
                            .ffcx(&mut ffmpeg);
                        f_last_v = f_setpts.to_stream();
                    }

                    // 视频流：设置本段视频在时间线上的位置
                    let f_delay = Filter::setpts(format!("PTS+{target_start}/TB"))
                        .r(f_last_v)
                        .ffcx(&mut ffmpeg);
                    f_last_v = f_delay.to_stream();

                    // 视频流：合并视频流到主舞台
                    let x = segment.position.map(|p| p.x).unwrap_or(0);
                    let y = segment.position.map(|p| p.y).unwrap_or(0);
                    let f_overlay = Filter::overlay_with_enable(
                        x,
                        y,
                        format!(
                            "enable='between(t,{},{})'",
                            target_start,
                            target_start + target_duration
                        ),
                    )
                    .r(stage_bg)
                    .r(f_last_v)
                    .ffcx(&mut ffmpeg);
                    stage_bg = f_overlay;
                }
            }
        }

        // Handle audio tracks
        let audio_tracks = self.session.audio_tracks();
        let mut audio_inputs = Vec::new();

        for track in &audio_tracks {
            if !track.enabled || track.muted {
                continue;
            }

            for segment in &track.segments {
                if let Some(input) = material_inputs.get(&segment.material_id) {
                    let mut f_last_a = input.a();

                    // Apply time-based trimming for audio
                    let source_start = segment.source_timerange.start as f64 / 1000.0;
                    let source_duration = segment.source_timerange.duration as f64 / 1000.0;
                    let target_start = segment.target_timerange.start as f64 / 1000.0;
                    let target_duration = segment.target_timerange.duration as f64 / 1000.0;

                    if source_start > 0.0 || source_duration != target_duration {
                        let f_atrim = Filter::atrim(source_start, source_duration)
                            .r(f_last_a)
                            .ffcx(&mut ffmpeg);
                        f_last_a = f_atrim.to_stream();

                        // Reset audio PTS
                        let f_asetpts = Filter::asetpts("PTS-STARTPTS")
                            .r(f_last_a)
                            .ffcx(&mut ffmpeg);
                        f_last_a = f_asetpts.to_stream();
                    }

                    // Apply speed adjustment for audio
                    if segment.needs_speed_adjustment() {
                        let speed = segment.playback_speed();
                        let f_atempo = Filter::atempo(speed).r(f_last_a).ffcx(&mut ffmpeg);
                        f_last_a = f_atempo.to_stream();
                    }

                    // Add delay for positioning in time
                    if target_start > 0.0 {
                        let adelay_filter = Filter::with_name("adelay")
                            .param(format!("{}ms", (target_start * 1000.0) as i32))
                            .r(f_last_a)
                            .ffcx(&mut ffmpeg);
                        f_last_a = adelay_filter.to_stream();
                    }

                    audio_inputs.push(f_last_a);
                }
            }
        }

        // Mix all audio tracks
        let sound_bg = if audio_inputs.is_empty() {
            let sound_bg =
                Filter::anullsrc(self.session.total_duration() as f32 / 1000.0).ffcx(&mut ffmpeg);
            sound_bg.to_stream()
        } else if audio_inputs.len() == 1 {
            audio_inputs[0].clone()
        } else {
            let f_amix = Filter::amix(audio_inputs.len() as i32)
                .refs(audio_inputs)
                .ffcx(&mut ffmpeg);
            f_amix.to_stream()
        };

        // Create output
        let mut output = Output::with_simple(&options.output_file);

        match options.export_type {
            ExportType::Video => {
                output = output
                    .map_stream(stage_bg)
                    .map_stream(sound_bg)
                    .video_codec(VideoCodec::from(
                        options.video_codec.as_deref().unwrap_or("libx264"),
                    ))
                    .audio_codec(AudioCodec::from(
                        options.audio_codec.as_deref().unwrap_or("aac"),
                    ));

                if let Some(quality) = options.quality {
                    output = output.crf(quality);
                }

                if let Some(bitrate) = options.video_bitrate {
                    output = output.video_bitrate(bitrate);
                }

                if let Some(bitrate) = options.audio_bitrate {
                    output = output.audio_bitrate(bitrate);
                }

                output = output.mov_flags("faststart");
            }
            ExportType::Audio => {
                output = output.map_stream(sound_bg).audio_codec(AudioCodec::from(
                    options.audio_codec.as_deref().unwrap_or("mp3"),
                ));

                if let Some(bitrate) = options.audio_bitrate {
                    output = output.audio_bitrate(bitrate);
                }
            }
        }

        // Add custom options
        for (key, value) in &options.custom_options {
            output = output.option(key, value);
        }

        output.ffcx(&mut ffmpeg);

        ffmpeg.run().await
    }

    /// Export with simple options
    pub async fn simple_export(&self, output_file: &str, export_type: ExportType) -> Result<()> {
        let options = ExportOptions {
            output_file: output_file.to_string(),
            export_type,
            video_codec: None,
            audio_codec: None,
            quality: None,
            video_bitrate: None,
            audio_bitrate: None,
            custom_options: HashMap::new(),
        };

        self.export(options).await
    }

    /// Export as MP4 video
    pub async fn export_mp4(&self, output_file: &str) -> Result<()> {
        self.simple_export(output_file, ExportType::Video).await
    }

    /// Export as MP3 audio
    pub async fn export_mp3(&self, output_file: &str) -> Result<()> {
        self.simple_export(output_file, ExportType::Audio).await
    }
}

impl Default for Editor {
    fn default() -> Self {
        Self::new()
    }
}

impl ExportOptions {
    /// Create new export options
    pub fn new<S: Into<String>>(output_file: S, export_type: ExportType) -> Self {
        Self {
            output_file: output_file.into(),
            export_type,
            video_codec: None,
            audio_codec: None,
            quality: None,
            video_bitrate: None,
            audio_bitrate: None,
            custom_options: HashMap::new(),
        }
    }

    /// Set video codec
    pub fn with_video_codec<S: Into<String>>(mut self, codec: S) -> Self {
        self.video_codec = Some(codec.into());
        self
    }

    /// Set audio codec
    pub fn with_audio_codec<S: Into<String>>(mut self, codec: S) -> Self {
        self.audio_codec = Some(codec.into());
        self
    }

    /// Set quality (CRF)
    pub fn with_quality(mut self, quality: i32) -> Self {
        self.quality = Some(quality);
        self
    }

    /// Set video bitrate
    pub fn with_video_bitrate(mut self, bitrate: i32) -> Self {
        self.video_bitrate = Some(bitrate);
        self
    }

    /// Set audio bitrate
    pub fn with_audio_bitrate(mut self, bitrate: i32) -> Self {
        self.audio_bitrate = Some(bitrate);
        self
    }

    /// Add custom option
    pub fn with_custom_option<K: Into<String>, V: Into<String>>(
        mut self,
        key: K,
        value: V,
    ) -> Self {
        self.custom_options.insert(key.into(), value.into());
        self
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        ffcut::{material::VideoMaterial, segment::SegmentType},
        TimeRange,
    };

    #[test]
    fn test_editor_creation() {
        let editor = Editor::new();
        assert_eq!(editor.session.stage.width, 1920);
        assert_eq!(editor.session.stage.height, 1080);
        assert!(editor.session.materials.is_empty());
        assert!(editor.session.tracks.is_empty());
    }

    #[test]
    fn test_add_materials_and_tracks() {
        let mut editor = Editor::new();

        let material = Material::Video(VideoMaterial::new("video1", "test.mp4", 1920, 1080));
        editor.add_material(material);

        editor.add_video_track();

        assert_eq!(editor.session.materials.len(), 1);
        assert_eq!(editor.session.tracks.len(), 1);
    }

    #[test]
    fn test_add_segment_to_track() {
        let mut editor = Editor::new();

        let material = Material::Video(VideoMaterial::new("video1", "test.mp4", 1920, 1080));
        editor.add_material(material);

        editor.add_video_track();

        let segment = Segment::new(
            "segment1",
            SegmentType::Video,
            "video1",
            TimeRange::new(0, 5000),
            TimeRange::new(0, 5000),
        );

        let result = editor.add_segment_to_track("track1", segment);
        assert!(result.is_ok());

        let track = editor.session.get_track("track1").unwrap();
        assert_eq!(track.segments.len(), 1);
    }

    #[test]
    fn test_protocol_conversion() {
        let mut editor = Editor::new();

        let material = Material::Video(VideoMaterial::new("video1", "test.mp4", 1920, 1080));
        editor.add_material(material);

        let protocol_json = r#"
        {
            "stage": {
                "width": 1920,
                "height": 1080
            },
            "materials": {
                "videos": [
                    {
                        "id": "video1",
                        "src": "test.mp4",
                        "dimension": {
                            "width": 1920,
                            "height": 1080
                        }
                    }
                ],
                "images": [],
                "audios": []
            },
            "tracks": []
        }
        "#;

        let result = editor.load_from_json(protocol_json);
        assert!(result.is_ok());

        let json_output = editor.save_to_json().unwrap();
        assert!(json_output.contains("test.mp4"));
    }

    #[test]
    fn test_export_options() {
        let options = ExportOptions::new("output.mp4", ExportType::Video)
            .with_video_codec("libx264")
            .with_audio_codec("aac")
            .with_quality(23)
            .with_video_bitrate(5000)
            .with_audio_bitrate(128)
            .with_custom_option("preset", "medium");

        assert_eq!(options.output_file, "output.mp4");
        assert_eq!(options.video_codec, Some("libx264".to_string()));
        assert_eq!(options.audio_codec, Some("aac".to_string()));
        assert_eq!(options.quality, Some(23));
        assert_eq!(options.video_bitrate, Some(5000));
        assert_eq!(options.audio_bitrate, Some(128));
        assert_eq!(
            options.custom_options.get("preset"),
            Some(&"medium".to_string())
        );
    }
}
