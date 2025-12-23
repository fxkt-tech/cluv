//! Material management for video editing

use crate::error::{CutError, Result};
use serde::{Deserialize, Serialize};
use std::path::Path;
use uuid::Uuid;

/// Represents a material that can be used in video editing
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
pub enum Material {
    /// Video material
    Video(VideoMaterial),
    /// Audio material
    Audio(AudioMaterial),
    /// Image material
    Image(ImageMaterial),
}

/// Video material with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMaterial {
    /// Unique identifier
    pub id: String,
    /// Source file path or URL
    pub src: String,
    /// Video dimensions
    pub dimension: Dimension,
    /// Duration in milliseconds (optional)
    pub duration: Option<u32>,
    /// Frame rate (optional)
    pub fps: Option<f32>,
    /// Video codec (optional)
    pub codec: Option<String>,
    /// Bitrate in kbps (optional)
    pub bitrate: Option<u32>,
}

/// Audio material with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioMaterial {
    /// Unique identifier
    pub id: String,
    /// Source file path or URL
    pub src: String,
    /// Duration in milliseconds (optional)
    pub duration: Option<u32>,
    /// Sample rate in Hz (optional)
    pub sample_rate: Option<u32>,
    /// Number of channels (optional)
    pub channels: Option<u32>,
    /// Audio codec (optional)
    pub codec: Option<String>,
    /// Bitrate in kbps (optional)
    pub bitrate: Option<u32>,
}

/// Image material with metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageMaterial {
    /// Unique identifier
    pub id: String,
    /// Source file path or URL
    pub src: String,
    /// Image dimensions
    pub dimension: Dimension,
    /// Image format (optional)
    pub format: Option<String>,
}

/// Dimension specification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Dimension {
    /// Width in pixels
    pub width: i32,
    /// Height in pixels
    pub height: i32,
}

/// Material type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MaterialType {
    /// Video material
    Video,
    /// Audio material
    Audio,
    /// Image material
    Image,
}

impl Material {
    /// Get the material ID
    pub fn id(&self) -> &str {
        match self {
            Material::Video(v) => &v.id,
            Material::Audio(a) => &a.id,
            Material::Image(i) => &i.id,
        }
    }

    /// Get the source path
    pub fn src(&self) -> &str {
        match self {
            Material::Video(v) => &v.src,
            Material::Audio(a) => &a.src,
            Material::Image(i) => &i.src,
        }
    }

    /// Get the material type
    pub fn material_type(&self) -> MaterialType {
        match self {
            Material::Video(_) => MaterialType::Video,
            Material::Audio(_) => MaterialType::Audio,
            Material::Image(_) => MaterialType::Image,
        }
    }

    /// Get dimensions if available
    pub fn dimensions(&self) -> Option<Dimension> {
        match self {
            Material::Video(v) => Some(v.dimension),
            Material::Image(i) => Some(i.dimension),
            Material::Audio(_) => None,
        }
    }

    /// Get duration if available (in milliseconds)
    pub fn duration(&self) -> Option<u32> {
        match self {
            Material::Video(v) => v.duration,
            Material::Audio(a) => a.duration,
            Material::Image(_) => None,
        }
    }

    /// Check if the material file exists
    pub fn exists(&self) -> bool {
        Path::new(self.src()).exists()
    }

    /// Validate the material
    pub fn validate(&self) -> Result<()> {
        // Check if ID is not empty
        if self.id().is_empty() {
            return Err(CutError::invalid_params("Material ID cannot be empty"));
        }

        // Check if source path is not empty
        if self.src().is_empty() {
            return Err(CutError::invalid_params("Material source cannot be empty"));
        }

        // Validate specific material types
        match self {
            Material::Video(v) => v.validate(),
            Material::Audio(a) => a.validate(),
            Material::Image(i) => i.validate(),
        }
    }

    /// Create a video material
    pub fn video<S: Into<String>>(src: S) -> Self {
        Material::Video(VideoMaterial {
            id: Uuid::new_v4().into(),
            src: src.into(),
            dimension: Dimension {
                width: 0,
                height: 0,
            },
            duration: None,
            fps: None,
            codec: None,
            bitrate: None,
        })
    }

    /// Create an audio material
    pub fn audio<S: Into<String>>(src: S) -> Self {
        Material::Audio(AudioMaterial {
            id: Uuid::new_v4().into(),
            src: src.into(),
            duration: None,
            sample_rate: None,
            channels: None,
            codec: None,
            bitrate: None,
        })
    }

    /// Create an image material
    pub fn image<S: Into<String>>(src: S) -> Self {
        Material::Image(ImageMaterial {
            id: Uuid::new_v4().into(),
            src: src.into(),
            dimension: Dimension {
                width: 0,
                height: 0,
            },
            format: None,
        })
    }
}

impl VideoMaterial {
    /// Create a new video material
    pub fn new<S1: Into<String>, S2: Into<String>>(
        id: S1,
        src: S2,
        width: i32,
        height: i32,
    ) -> Self {
        Self {
            id: id.into(),
            src: src.into(),
            dimension: Dimension { width, height },
            duration: None,
            fps: None,
            codec: None,
            bitrate: None,
        }
    }

    /// Set duration in milliseconds
    pub fn with_duration(mut self, duration: u32) -> Self {
        self.duration = Some(duration);
        self
    }

    /// Set frame rate
    pub fn with_fps(mut self, fps: f32) -> Self {
        self.fps = Some(fps);
        self
    }

    /// Set codec
    pub fn with_codec<S: Into<String>>(mut self, codec: S) -> Self {
        self.codec = Some(codec.into());
        self
    }

    /// Set bitrate in kbps
    pub fn with_bitrate(mut self, bitrate: u32) -> Self {
        self.bitrate = Some(bitrate);
        self
    }

    /// Get aspect ratio
    pub fn aspect_ratio(&self) -> f64 {
        if self.dimension.height == 0 {
            0.0
        } else {
            self.dimension.width as f64 / self.dimension.height as f64
        }
    }

    /// Validate the video material
    pub fn validate(&self) -> Result<()> {
        if self.dimension.width <= 0 {
            return Err(CutError::invalid_params("Video width must be positive"));
        }
        if self.dimension.height <= 0 {
            return Err(CutError::invalid_params("Video height must be positive"));
        }
        if let Some(fps) = self.fps {
            if fps <= 0.0 {
                return Err(CutError::invalid_params("Video FPS must be positive"));
            }
        }
        Ok(())
    }
}

impl AudioMaterial {
    /// Create a new audio material
    pub fn new<S1: Into<String>, S2: Into<String>>(id: S1, src: S2) -> Self {
        Self {
            id: id.into(),
            src: src.into(),
            duration: None,
            sample_rate: None,
            channels: None,
            codec: None,
            bitrate: None,
        }
    }

    /// Set duration in milliseconds
    pub fn with_duration(mut self, duration: u32) -> Self {
        self.duration = Some(duration);
        self
    }

    /// Set sample rate in Hz
    pub fn with_sample_rate(mut self, sample_rate: u32) -> Self {
        self.sample_rate = Some(sample_rate);
        self
    }

    /// Set number of channels
    pub fn with_channels(mut self, channels: u32) -> Self {
        self.channels = Some(channels);
        self
    }

    /// Set codec
    pub fn with_codec<S: Into<String>>(mut self, codec: S) -> Self {
        self.codec = Some(codec.into());
        self
    }

    /// Set bitrate in kbps
    pub fn with_bitrate(mut self, bitrate: u32) -> Self {
        self.bitrate = Some(bitrate);
        self
    }

    /// Validate the audio material
    pub fn validate(&self) -> Result<()> {
        if let Some(sample_rate) = self.sample_rate {
            if sample_rate == 0 {
                return Err(CutError::invalid_params("Sample rate must be positive"));
            }
        }
        if let Some(channels) = self.channels {
            if channels == 0 {
                return Err(CutError::invalid_params("Channel count must be positive"));
            }
        }
        Ok(())
    }
}

impl ImageMaterial {
    /// Create a new image material
    pub fn new<S1: Into<String>, S2: Into<String>>(
        id: S1,
        src: S2,
        width: i32,
        height: i32,
    ) -> Self {
        Self {
            id: id.into(),
            src: src.into(),
            dimension: Dimension { width, height },
            format: None,
        }
    }

    /// Set format
    pub fn with_format<S: Into<String>>(mut self, format: S) -> Self {
        self.format = Some(format.into());
        self
    }

    /// Get aspect ratio
    pub fn aspect_ratio(&self) -> f64 {
        if self.dimension.height == 0 {
            0.0
        } else {
            self.dimension.width as f64 / self.dimension.height as f64
        }
    }

    /// Validate the image material
    pub fn validate(&self) -> Result<()> {
        if self.dimension.width <= 0 {
            return Err(CutError::invalid_params("Image width must be positive"));
        }
        if self.dimension.height <= 0 {
            return Err(CutError::invalid_params("Image height must be positive"));
        }
        Ok(())
    }
}

impl MaterialType {
    pub fn to_string(&self) -> String {
        match self {
            MaterialType::Image => "image".to_string(),
            MaterialType::Audio => "audio".to_string(),
            MaterialType::Video => "video".to_string(),
        }
    }
}

impl Dimension {
    /// Create a new dimension
    pub fn new(width: i32, height: i32) -> Self {
        Self { width, height }
    }

    /// Get aspect ratio
    pub fn aspect_ratio(&self) -> f64 {
        if self.height == 0 {
            0.0
        } else {
            self.width as f64 / self.height as f64
        }
    }

    /// Check if landscape orientation
    pub fn is_landscape(&self) -> bool {
        self.width > self.height
    }

    /// Check if portrait orientation
    pub fn is_portrait(&self) -> bool {
        self.width < self.height
    }

    /// Check if square
    pub fn is_square(&self) -> bool {
        self.width == self.height
    }

    /// Get pixel count
    pub fn pixel_count(&self) -> i64 {
        self.width as i64 * self.height as i64
    }

    /// Scale by factor
    pub fn scale(&self, factor: f64) -> Self {
        let width = (self.width as f64 * factor).round() as i32;
        let height = (self.height as f64 * factor).round() as i32;
        Self::new(width, height)
    }
}

impl From<(i32, i32)> for Dimension {
    fn from(tuple: (i32, i32)) -> Self {
        Self::new(tuple.0, tuple.1)
    }
}

impl From<Dimension> for (i32, i32) {
    fn from(dim: Dimension) -> Self {
        (dim.width, dim.height)
    }
}

impl std::fmt::Display for Dimension {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}x{}", self.width, self.height)
    }
}

impl std::fmt::Display for MaterialType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MaterialType::Video => write!(f, "video"),
            MaterialType::Audio => write!(f, "audio"),
            MaterialType::Image => write!(f, "image"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_video_material() {
        let video = VideoMaterial::new("video1", "test.mp4", 1920, 1080)
            .with_duration(60000)
            .with_fps(30.0)
            .with_codec("h264")
            .with_bitrate(5000);

        assert_eq!(video.id, "video1");
        assert_eq!(video.src, "test.mp4");
        assert_eq!(video.dimension.width, 1920);
        assert_eq!(video.dimension.height, 1080);
        assert_eq!(video.duration, Some(60000));
        assert_eq!(video.fps, Some(30.0));
        assert_eq!(video.codec, Some("h264".to_string()));
        assert_eq!(video.bitrate, Some(5000));
        assert!((video.aspect_ratio() - (16.0 / 9.0)).abs() < 0.001);
        assert!(video.validate().is_ok());
    }

    #[test]
    fn test_audio_material() {
        let audio = AudioMaterial::new("audio1", "test.wav")
            .with_duration(30000)
            .with_sample_rate(44100)
            .with_channels(2)
            .with_codec("pcm")
            .with_bitrate(1411);

        assert_eq!(audio.id, "audio1");
        assert_eq!(audio.src, "test.wav");
        assert_eq!(audio.duration, Some(30000));
        assert_eq!(audio.sample_rate, Some(44100));
        assert_eq!(audio.channels, Some(2));
        assert_eq!(audio.codec, Some("pcm".to_string()));
        assert_eq!(audio.bitrate, Some(1411));
        assert!(audio.validate().is_ok());
    }

    #[test]
    fn test_image_material() {
        let image = ImageMaterial::new("image1", "test.jpg", 1920, 1080).with_format("jpeg");

        assert_eq!(image.id, "image1");
        assert_eq!(image.src, "test.jpg");
        assert_eq!(image.dimension.width, 1920);
        assert_eq!(image.dimension.height, 1080);
        assert_eq!(image.format, Some("jpeg".to_string()));
        assert!((image.aspect_ratio() - (16.0 / 9.0)).abs() < 0.001);
        assert!(image.validate().is_ok());
    }

    #[test]
    fn test_material_enum() {
        let video = Material::video("test.mp4");
        let audio = Material::audio("test.wav");
        let image = Material::image("test.jpg");

        assert_eq!(video.id(), "v1");
        assert_eq!(video.material_type(), MaterialType::Video);
        assert!(video.dimensions().is_some());

        assert_eq!(audio.id(), "a1");
        assert_eq!(audio.material_type(), MaterialType::Audio);
        assert!(audio.dimensions().is_none());

        assert_eq!(image.id(), "i1");
        assert_eq!(image.material_type(), MaterialType::Image);
        assert!(image.dimensions().is_some());
    }

    #[test]
    fn test_dimension() {
        let dim = Dimension::new(1920, 1080);
        assert_eq!(dim.width, 1920);
        assert_eq!(dim.height, 1080);
        assert!(dim.is_landscape());
        assert!(!dim.is_portrait());
        assert!(!dim.is_square());
        assert_eq!(dim.pixel_count(), 1920 * 1080);

        let scaled = dim.scale(0.5);
        assert_eq!(scaled.width, 960);
        assert_eq!(scaled.height, 540);
    }

    #[test]
    fn test_validation() {
        let invalid_video = VideoMaterial::new("v1", "test.mp4", 0, 1080);
        assert!(invalid_video.validate().is_err());

        let invalid_fps = VideoMaterial::new("v1", "test.mp4", 1920, 1080).with_fps(0.0);
        assert!(invalid_fps.validate().is_err());

        let invalid_audio = AudioMaterial::new("a1", "test.wav").with_channels(0);
        assert!(invalid_audio.validate().is_err());

        let invalid_image = ImageMaterial::new("i1", "test.jpg", -100, 1080);
        assert!(invalid_image.validate().is_err());
    }

    #[test]
    fn test_conversions() {
        let dim = Dimension::new(1920, 1080);
        let tuple: (i32, i32) = dim.into();
        assert_eq!(tuple, (1920, 1080));

        let dim_from_tuple = Dimension::from((1280, 720));
        assert_eq!(dim_from_tuple, Dimension::new(1280, 720));
    }

    #[test]
    fn test_display() {
        let dim = Dimension::new(1920, 1080);
        assert_eq!(format!("{}", dim), "1920x1080");

        assert_eq!(format!("{}", MaterialType::Video), "video");
        assert_eq!(format!("{}", MaterialType::Audio), "audio");
        assert_eq!(format!("{}", MaterialType::Image), "image");
    }
}
