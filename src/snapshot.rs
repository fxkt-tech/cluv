//! Snapshot functionality for screenshot and sprite generation

use crate::error::{CluvError, Result};
use crate::ffmpeg::codec::Format;
use crate::ffmpeg::filter::Filter;
use crate::ffmpeg::input::Input;
use crate::ffmpeg::output::Output;
use crate::ffmpeg::stream::Stream;
use crate::ffmpeg::FFmpeg;
use crate::ffprobe::FFprobe;
use crate::options::CluvOptions;
use serde::{Deserialize, Serialize};

/// Snapshot processor for generating screenshots and sprites
#[derive(Debug)]
pub struct Snapshot {
    options: CluvOptions,
}

/// Parameters for taking screenshots
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SnapshotParams {
    /// Input file path
    pub input_file: String,
    /// Output file path
    pub output_file: String,
    /// Screenshot type (0: keyframes only, 1: interval, 2: specific frames)
    pub frame_type: i32,
    /// Interval in seconds between screenshots (for frame_type 1)
    pub interval: Option<f32>,
    /// Interval in frames between screenshots (for frame_type 1)
    pub interval_frames: Option<i32>,
    /// Specific frame numbers (for frame_type 2)
    pub frames: Vec<i32>,
    /// Start time offset
    pub start_time: Option<f32>,
    /// Maximum number of screenshots
    pub max_count: Option<i32>,
    /// Output width
    pub width: Option<i32>,
    /// Output height
    pub height: Option<i32>,
}

/// Parameters for sprite sheet generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpriteParams {
    /// Input file path
    pub input_file: String,
    /// Output sprite file path
    pub output_file: String,
    /// Number of columns in sprite
    pub cols: i32,
    /// Number of rows in sprite
    pub rows: i32,
    /// Width of each thumbnail
    pub width: i32,
    /// Height of each thumbnail
    pub height: i32,
    /// Interval between frames in seconds
    pub interval: f32,
}

/// Parameters for SVG markup generation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SvgMarkParams {
    /// Input file path
    pub input_file: String,
    /// Output SVG file path
    pub output_file: String,
    /// Start time for screenshot
    pub start_time: Option<f32>,
    /// Annotations to add
    pub annotations: Vec<SvgAnnotation>,
}

/// SVG annotation for markup
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SvgAnnotation {
    /// Annotation type (rect, pen, arrow, text)
    pub annotation_type: String,
    /// Stroke color
    pub stroke: Option<String>,
    /// Text content (for text annotations)
    pub text: Option<String>,
    /// Points for pen annotations
    pub points: Vec<Point>,
    /// Start point for shapes
    pub from_point: Option<Point>,
    /// End point for shapes
    pub to_point: Option<Point>,
    /// Stroke width
    pub stroke_width: Option<i32>,
    /// Font size (for text)
    pub font_size: Option<i32>,
}

/// 2D point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Point {
    /// X coordinate (0.0 to 1.0 normalized)
    pub x: f32,
    /// Y coordinate (0.0 to 1.0 normalized)
    pub y: f32,
}

impl Snapshot {
    /// Create a new snapshot processor
    pub fn new() -> Self {
        Self {
            options: CluvOptions::new(),
        }
    }

    /// Create a new snapshot processor with custom options
    pub fn with_options(options: CluvOptions) -> Self {
        Self { options }
    }

    /// Take simple screenshots
    pub async fn simple(&self, params: SnapshotParams) -> Result<()> {
        self.validate_snapshot_params(&params)?;

        let mut ffmpeg = FFmpeg::with_options(self.options.ffmpeg.clone());
        let mut filters = Vec::new();

        // Add input with start time if specified
        let input = if let Some(start_time) = params.start_time {
            Input::new(&params.input_file).start_time(start_time)
        } else {
            Input::new(&params.input_file)
        };

        ffmpeg = ffmpeg.add_input(input);

        let mut last_filter = "0:v".to_string();

        // Apply frame selection based on frame_type
        match params.frame_type {
            0 => {
                // Keyframes only
                let select_filter = Filter::with_name("select")
                    .param("'eq(pict_type,I)'")
                    .refs([&last_filter]);

                last_filter = "keyframes".to_string();
                filters.push(select_filter);
            }
            1 => {
                // Interval-based screenshots
                if params.max_count != Some(1) {
                    if let Some(interval_frames) = params.interval_frames {
                        let select_filter = Filter::with_name("select")
                            .param(format!("'not(mod(n,{}))'", interval_frames))
                            .refs([&last_filter]);

                        last_filter = "interval_frames".to_string();
                        filters.push(select_filter);
                    } else if let Some(interval) = params.interval {
                        let fps_filter = Filter::with_name("fps")
                            .param(format!("{}", 1.0 / interval))
                            .refs([&last_filter]);

                        last_filter = "interval_fps".to_string();
                        filters.push(fps_filter);
                    }
                }
            }
            2 => {
                // Specific frames
                if !params.frames.is_empty() {
                    let frame_expressions: Vec<String> = params
                        .frames
                        .iter()
                        .map(|&frame| format!("eq(n,{})", frame))
                        .collect();
                    let select_expr = format!("'{}'", frame_expressions.join("+"));

                    let select_filter = Filter::with_name("select")
                        .param(select_expr)
                        .refs([&last_filter]);

                    last_filter = "specific_frames".to_string();
                    filters.push(select_filter);
                }
            }
            _ => {
                return Err(CluvError::invalid_params("Invalid frame_type"));
            }
        }

        // Apply scaling if specified
        if params.width.is_some() || params.height.is_some() {
            let width = self.fix_pixel_len(params.width.unwrap_or(-2));
            let height = self.fix_pixel_len(params.height.unwrap_or(-2));

            let scale_filter = Filter::with_name("scale")
                .params([width, height])
                .refs([&last_filter]);

            last_filter = "scaled".to_string();
            filters.push(scale_filter);
        }

        // Add all filters
        for filter in filters {
            ffmpeg = ffmpeg.add_filter(filter);
        }

        // Create output
        let mut output = Output::new(&params.output_file).format(Format::Image2);

        // Map the final filter output
        if !last_filter.is_empty() && last_filter != "0:v" {
            output = output.map_stream(&last_filter);
        }

        // Set frame count if specified
        if let Some(max_count) = params.max_count {
            output = output.max_frames(max_count);
        }

        // Add VSync for frame selection
        if params.frame_type != 1 || params.max_count != Some(1) {
            output = output.vsync("vfr");
        }

        ffmpeg = ffmpeg.add_output(output);

        ffmpeg.run().await
    }

    /// Generate sprite sheet
    pub async fn sprite(&self, params: SpriteParams) -> Result<()> {
        self.validate_sprite_params(&params)?;

        // Get video information to calculate duration and frame count
        let ffprobe = FFprobe::with_options(self.options.ffprobe.clone()).input(&params.input_file);

        let media_info = ffprobe.run().await?;

        let mut duration = (params.cols * params.rows) as f32 * params.interval;
        let mut frames = params.cols * params.rows;

        // Adjust based on actual video properties
        if let Some(video_stream) = media_info.first_video_stream() {
            if let Some(nb_frames) = video_stream.frame_count() {
                if nb_frames < frames as i64 {
                    frames = nb_frames as i32;
                }
            }
            if let Some(video_duration) = video_stream.duration_seconds() {
                if video_duration > 0.0 {
                    duration = video_duration as f32;
                }
            }
        }

        let mut ffmpeg = FFmpeg::with_options(self.options.ffmpeg.clone());

        ffmpeg = ffmpeg.add_input(Input::new(&params.input_file));

        // Create FPS filter for frame extraction
        let fps_value = frames as f32 / duration;
        let fps_filter = Filter::with_name("fps")
            .param(fps_value.to_string())
            .refs([Stream::video(0)]);

        // Scale individual frames
        let scale_filter = Filter::with_name("scale")
            .params([params.width.to_string(), params.height.to_string()])
            .refs(["fps_out"]);

        // Create tile layout
        let tile_filter = Filter::with_name("tile")
            .param(format!("layout={}x{}", params.cols, params.rows))
            .refs(["scaled"]);

        ffmpeg = ffmpeg
            .add_filter(fps_filter)
            .add_filter(scale_filter)
            .add_filter(tile_filter);

        let output = Output::new(&params.output_file).map_stream("tiled");

        ffmpeg = ffmpeg.add_output(output);

        ffmpeg.run().await
    }

    /// Generate SVG markup (requires external SVG library support)
    #[cfg(feature = "svg-support")]
    pub async fn svg_mark(&self, params: SvgMarkParams) -> Result<()> {
        use std::fs::File;
        use std::io::Write;

        // First, take a screenshot
        let screenshot_path = format!("{}.tmp.jpg", params.output_file);
        let screenshot_params = SnapshotParams {
            input_file: params.input_file.clone(),
            output_file: screenshot_path.clone(),
            frame_type: 1,
            interval: None,
            interval_frames: None,
            frames: Vec::new(),
            start_time: params.start_time,
            max_count: Some(1),
            width: None,
            height: None,
        };

        self.simple(screenshot_params).await?;

        // Get video dimensions
        let ffprobe = FFprobe::with_options(self.options.ffprobe.clone()).input(&screenshot_path);

        let media_info = ffprobe.run().await?;
        let (width, height) = media_info
            .video_resolution()
            .ok_or_else(|| CluvError::custom("Could not determine video dimensions"))?;

        // Create SVG
        let mut svg_content = format!(
            r#"<svg width="{}" height="{}" xmlns="http://www.w3.org/2000/svg">"#,
            width, height
        );

        // Add background image
        svg_content.push_str(&format!(
            r#"<image x="0" y="0" width="{}" height="{}" href="{}"/>"#,
            width, height, screenshot_path
        ));

        // Add annotations
        for annotation in &params.annotations {
            match annotation.annotation_type.as_str() {
                "rect" => {
                    if let (Some(from), Some(to)) = (&annotation.from_point, &annotation.to_point) {
                        let x = (from.x.min(to.x) * width as f32) as i32;
                        let y = (from.y.min(to.y) * height as f32) as i32;
                        let w = ((from.x - to.x).abs() * width as f32) as i32;
                        let h = ((from.y - to.y).abs() * height as f32) as i32;

                        let mut style = "fill:transparent".to_string();
                        if let Some(ref stroke) = annotation.stroke {
                            style.push_str(&format!(";stroke:{}", stroke));
                        }
                        if let Some(stroke_width) = annotation.stroke_width {
                            style.push_str(&format!(";stroke-width:{}px", stroke_width));
                        }

                        svg_content.push_str(&format!(
                            r#"<rect x="{}" y="{}" width="{}" height="{}" style="{}"/>"#,
                            x, y, w, h, style
                        ));
                    }
                }
                "pen" => {
                    if !annotation.points.is_empty() {
                        let mut path_data = String::new();
                        for (i, point) in annotation.points.iter().enumerate() {
                            let x = (point.x * width as f32) as i32;
                            let y = (point.y * height as f32) as i32;

                            if i == 0 {
                                path_data.push_str(&format!("M{} {} ", x, y));
                            } else {
                                path_data.push_str(&format!("L{} {} ", x, y));
                            }
                        }

                        let mut style = "fill:transparent".to_string();
                        if let Some(ref stroke) = annotation.stroke {
                            style.push_str(&format!(";stroke:{}", stroke));
                        }
                        if let Some(stroke_width) = annotation.stroke_width {
                            style.push_str(&format!(";stroke-width:{}px", stroke_width));
                        }

                        svg_content
                            .push_str(&format!(r#"<path d="{}" style="{}"/>"#, path_data, style));
                    }
                }
                "text" => {
                    if let (Some(from), Some(ref text)) = (&annotation.from_point, &annotation.text)
                    {
                        let x = (from.x * width as f32) as i32;
                        let y = (from.y * height as f32) as i32;

                        let mut style = String::new();
                        if let Some(ref stroke) = annotation.stroke {
                            style.push_str(&format!("fill:{}", stroke));
                        }
                        if let Some(font_size) = annotation.font_size {
                            style.push_str(&format!(";font-size:{}px", font_size));
                        }

                        svg_content.push_str(&format!(
                            r#"<text x="{}" y="{}" style="{}">{}</text>"#,
                            x, y, style, text
                        ));
                    }
                }
                _ => {
                    // Ignore unknown annotation types
                }
            }
        }

        svg_content.push_str("</svg>");

        // Write SVG file
        let mut file = File::create(&params.output_file)
            .map_err(|e| CluvError::custom(format!("Failed to create SVG file: {}", e)))?;

        file.write_all(svg_content.as_bytes())
            .map_err(|e| CluvError::custom(format!("Failed to write SVG file: {}", e)))?;

        // Clean up temporary screenshot
        let _ = std::fs::remove_file(&screenshot_path);

        Ok(())
    }

    #[cfg(not(feature = "svg-support"))]
    pub async fn svg_mark(&self, _params: SvgMarkParams) -> Result<()> {
        Err(CluvError::custom(
            "SVG support is not enabled. Enable the 'svg-support' feature to use this functionality."
        ))
    }

    // Helper methods

    fn validate_snapshot_params(&self, params: &SnapshotParams) -> Result<()> {
        if params.input_file.is_empty() {
            return Err(CluvError::missing_param("input_file"));
        }

        if params.output_file.is_empty() {
            return Err(CluvError::missing_param("output_file"));
        }

        // Validate frame_type
        if !(0..=2).contains(&params.frame_type) {
            return Err(CluvError::invalid_params("frame_type must be 0, 1, or 2"));
        }

        // For interval screenshots with multiple frames, require interval
        if params.frame_type == 1 && params.max_count != Some(1) {
            if params.interval.is_none() && params.interval_frames.is_none() {
                return Err(CluvError::interval_required());
            }
        }

        // For specific frame screenshots, require frames list
        if params.frame_type == 2 && params.frames.is_empty() {
            return Err(CluvError::invalid_params(
                "frames list is required for frame_type 2",
            ));
        }

        Ok(())
    }

    fn validate_sprite_params(&self, params: &SpriteParams) -> Result<()> {
        if params.input_file.is_empty() {
            return Err(CluvError::missing_param("input_file"));
        }

        if params.output_file.is_empty() {
            return Err(CluvError::missing_param("output_file"));
        }

        if params.cols <= 0 || params.rows <= 0 {
            return Err(CluvError::invalid_params("cols and rows must be positive"));
        }

        if params.width <= 0 || params.height <= 0 {
            return Err(CluvError::invalid_params(
                "width and height must be positive",
            ));
        }

        if params.interval <= 0.0 {
            return Err(CluvError::invalid_params("interval must be positive"));
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
}

impl Default for Snapshot {
    fn default() -> Self {
        Self::new()
    }
}

// Builder implementations

impl SnapshotParams {
    pub fn builder() -> SnapshotParamsBuilder {
        SnapshotParamsBuilder::new()
    }
}

pub struct SnapshotParamsBuilder {
    input_file: Option<String>,
    output_file: Option<String>,
    frame_type: i32,
    interval: Option<f32>,
    interval_frames: Option<i32>,
    frames: Vec<i32>,
    start_time: Option<f32>,
    max_count: Option<i32>,
    width: Option<i32>,
    height: Option<i32>,
}

impl SnapshotParamsBuilder {
    pub fn new() -> Self {
        Self {
            input_file: None,
            output_file: None,
            frame_type: 1, // Default to interval screenshots
            interval: None,
            interval_frames: None,
            frames: Vec::new(),
            start_time: None,
            max_count: None,
            width: None,
            height: None,
        }
    }

    pub fn input_file<S: Into<String>>(mut self, input: S) -> Self {
        self.input_file = Some(input.into());
        self
    }

    pub fn output_file<S: Into<String>>(mut self, output: S) -> Self {
        self.output_file = Some(output.into());
        self
    }

    pub fn frame_type(mut self, frame_type: i32) -> Self {
        self.frame_type = frame_type;
        self
    }

    pub fn interval(mut self, interval: f32) -> Self {
        self.interval = Some(interval);
        self
    }

    pub fn interval_frames(mut self, frames: i32) -> Self {
        self.interval_frames = Some(frames);
        self
    }

    pub fn specific_frames(mut self, frames: Vec<i32>) -> Self {
        self.frames = frames;
        self.frame_type = 2;
        self
    }

    pub fn start_time(mut self, time: f32) -> Self {
        self.start_time = Some(time);
        self
    }

    pub fn max_count(mut self, count: i32) -> Self {
        self.max_count = Some(count);
        self
    }

    pub fn resolution(mut self, width: i32, height: i32) -> Self {
        self.width = Some(width);
        self.height = Some(height);
        self
    }

    pub fn keyframes_only(mut self) -> Self {
        self.frame_type = 0;
        self
    }

    pub fn single_screenshot(mut self) -> Self {
        self.max_count = Some(1);
        self
    }

    pub fn build(self) -> Result<SnapshotParams> {
        let input_file = self
            .input_file
            .ok_or_else(|| CluvError::missing_param("input_file"))?;
        let output_file = self
            .output_file
            .ok_or_else(|| CluvError::missing_param("output_file"))?;

        Ok(SnapshotParams {
            input_file,
            output_file,
            frame_type: self.frame_type,
            interval: self.interval,
            interval_frames: self.interval_frames,
            frames: self.frames,
            start_time: self.start_time,
            max_count: self.max_count,
            width: self.width,
            height: self.height,
        })
    }
}

impl Default for SnapshotParamsBuilder {
    fn default() -> Self {
        Self::new()
    }
}

impl SpriteParams {
    pub fn builder() -> SpriteParamsBuilder {
        SpriteParamsBuilder::new()
    }
}

pub struct SpriteParamsBuilder {
    input_file: Option<String>,
    output_file: Option<String>,
    cols: i32,
    rows: i32,
    width: i32,
    height: i32,
    interval: f32,
}

impl SpriteParamsBuilder {
    pub fn new() -> Self {
        Self {
            input_file: None,
            output_file: None,
            cols: 10,
            rows: 10,
            width: 160,
            height: 90,
            interval: 1.0,
        }
    }

    pub fn input_file<S: Into<String>>(mut self, input: S) -> Self {
        self.input_file = Some(input.into());
        self
    }

    pub fn output_file<S: Into<String>>(mut self, output: S) -> Self {
        self.output_file = Some(output.into());
        self
    }

    pub fn grid(mut self, cols: i32, rows: i32) -> Self {
        self.cols = cols;
        self.rows = rows;
        self
    }

    pub fn thumbnail_size(mut self, width: i32, height: i32) -> Self {
        self.width = width;
        self.height = height;
        self
    }

    pub fn interval(mut self, interval: f32) -> Self {
        self.interval = interval;
        self
    }

    pub fn build(self) -> Result<SpriteParams> {
        let input_file = self
            .input_file
            .ok_or_else(|| CluvError::missing_param("input_file"))?;
        let output_file = self
            .output_file
            .ok_or_else(|| CluvError::missing_param("output_file"))?;

        Ok(SpriteParams {
            input_file,
            output_file,
            cols: self.cols,
            rows: self.rows,
            width: self.width,
            height: self.height,
            interval: self.interval,
        })
    }
}

impl Default for SpriteParamsBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_snapshot_params_builder() {
        let params = SnapshotParams::builder()
            .input_file("input.mp4")
            .output_file("screenshot_%03d.jpg")
            .interval(5.0)
            .max_count(10)
            .resolution(1920, 1080)
            .build()
            .unwrap();

        assert_eq!(params.input_file, "input.mp4");
        assert_eq!(params.output_file, "screenshot_%03d.jpg");
        assert_eq!(params.frame_type, 1);
        assert_eq!(params.interval, Some(5.0));
        assert_eq!(params.max_count, Some(10));
        assert_eq!(params.width, Some(1920));
        assert_eq!(params.height, Some(1080));
    }

    #[test]
    fn test_sprite_params_builder() {
        let params = SpriteParams::builder()
            .input_file("input.mp4")
            .output_file("sprite.jpg")
            .grid(5, 4)
            .thumbnail_size(120, 68)
            .interval(2.0)
            .build()
            .unwrap();

        assert_eq!(params.input_file, "input.mp4");
        assert_eq!(params.output_file, "sprite.jpg");
        assert_eq!(params.cols, 5);
        assert_eq!(params.rows, 4);
        assert_eq!(params.width, 120);
        assert_eq!(params.height, 68);
        assert_eq!(params.interval, 2.0);
    }

    #[test]
    fn test_keyframes_only() {
        let params = SnapshotParams::builder()
            .input_file("input.mp4")
            .output_file("keyframe_%03d.jpg")
            .keyframes_only()
            .build()
            .unwrap();

        assert_eq!(params.frame_type, 0);
    }

    #[test]
    fn test_specific_frames() {
        let params = SnapshotParams::builder()
            .input_file("input.mp4")
            .output_file("frame_%03d.jpg")
            .specific_frames(vec![0, 30, 60, 90])
            .build()
            .unwrap();

        assert_eq!(params.frame_type, 2);
        assert_eq!(params.frames, vec![0, 30, 60, 90]);
    }

    #[test]
    fn test_single_screenshot() {
        let params = SnapshotParams::builder()
            .input_file("input.mp4")
            .output_file("thumbnail.jpg")
            .single_screenshot()
            .start_time(30.0)
            .build()
            .unwrap();

        assert_eq!(params.max_count, Some(1));
        assert_eq!(params.start_time, Some(30.0));
    }

    #[test]
    fn test_validation_errors() {
        // Missing input file
        let result = SnapshotParams::builder().output_file("output.jpg").build();
        assert!(result.is_err());

        // Missing output file
        let result = SnapshotParams::builder().input_file("input.mp4").build();
        assert!(result.is_err());
    }

    #[test]
    fn test_fix_pixel_len() {
        let snapshot = Snapshot::new();

        assert_eq!(snapshot.fix_pixel_len(1920), "1920");
        assert_eq!(snapshot.fix_pixel_len(1921), "1922");
        assert_eq!(snapshot.fix_pixel_len(-1), "-2");
        assert_eq!(snapshot.fix_pixel_len(0), "-2");
    }
}
