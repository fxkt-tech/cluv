//! Codec definitions for FFmpeg operations

use std::fmt;

/// Video codec types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum VideoCodec {
    /// H.264/AVC codec
    H264,
    /// H.265/HEVC codec
    H265,
    /// VP8 codec
    VP8,
    /// VP9 codec
    VP9,
    /// AV1 codec
    AV1,
    /// MJPEG codec
    MJPEG,
    /// PNG codec
    PNG,
    /// JPEG codec
    JPEG,
    /// Copy stream without re-encoding
    Copy,
    /// No video stream
    None,
    /// Custom codec string
    Custom(String),
}

/// Audio codec types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AudioCodec {
    /// AAC codec
    AAC,
    /// MP3 codec
    MP3,
    /// AC3 codec
    AC3,
    /// Opus codec
    Opus,
    /// Vorbis codec
    Vorbis,
    /// FLAC codec
    FLAC,
    /// PCM codec
    PCM,
    /// Copy stream without re-encoding
    Copy,
    /// No audio stream
    None,
    /// Custom codec string
    Custom(String),
}

/// Container/format types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Format {
    /// MP4 container
    MP4,
    /// AVI container
    AVI,
    /// MKV container
    MKV,
    /// WebM container
    WEBM,
    /// MOV container
    MOV,
    /// FLV container
    FLV,
    /// MP3 format
    MP3,
    /// AAC format
    AAC,
    /// WAV format
    WAV,
    /// JPEG image
    JPEG,
    /// PNG image
    PNG,
    /// HLS format
    HLS,
    /// MPEG-TS format
    MPEGTS,
    /// Image2 format (for image sequences)
    IMAGE2,
    /// Custom format string
    Custom(String),
}

impl VideoCodec {
    /// Get the FFmpeg codec string
    pub fn as_str(&self) -> &str {
        match self {
            VideoCodec::H264 => "libx264",
            VideoCodec::H265 => "libx265",
            VideoCodec::VP8 => "libvpx",
            VideoCodec::VP9 => "libvpx-vp9",
            VideoCodec::AV1 => "libaom-av1",
            VideoCodec::MJPEG => "mjpeg",
            VideoCodec::PNG => "png",
            VideoCodec::JPEG => "mjpeg",
            VideoCodec::Copy => "copy",
            VideoCodec::None => "none",
            VideoCodec::Custom(s) => s,
        }
    }

    /// Create a custom video codec
    pub fn custom<S: Into<String>>(codec: S) -> Self {
        VideoCodec::Custom(codec.into())
    }

    /// Check if codec requires re-encoding
    pub fn requires_encoding(&self) -> bool {
        !matches!(self, VideoCodec::Copy | VideoCodec::None)
    }
}

impl AudioCodec {
    /// Get the FFmpeg codec string
    pub fn as_str(&self) -> &str {
        match self {
            AudioCodec::AAC => "aac",
            AudioCodec::MP3 => "libmp3lame",
            AudioCodec::AC3 => "ac3",
            AudioCodec::Opus => "libopus",
            AudioCodec::Vorbis => "libvorbis",
            AudioCodec::FLAC => "flac",
            AudioCodec::PCM => "pcm_s16le",
            AudioCodec::Copy => "copy",
            AudioCodec::None => "none",
            AudioCodec::Custom(s) => s,
        }
    }

    /// Create a custom audio codec
    pub fn custom<S: Into<String>>(codec: S) -> Self {
        AudioCodec::Custom(codec.into())
    }

    /// Check if codec requires re-encoding
    pub fn requires_encoding(&self) -> bool {
        !matches!(self, AudioCodec::Copy | AudioCodec::None)
    }
}

impl Format {
    /// Get the FFmpeg format string
    pub fn as_str(&self) -> &str {
        match self {
            Format::MP4 => "mp4",
            Format::AVI => "avi",
            Format::MKV => "matroska",
            Format::WEBM => "webm",
            Format::MOV => "mov",
            Format::FLV => "flv",
            Format::MP3 => "mp3",
            Format::AAC => "aac",
            Format::WAV => "wav",
            Format::JPEG => "image2",
            Format::PNG => "image2",
            Format::HLS => "hls",
            Format::MPEGTS => "mpegts",
            Format::IMAGE2 => "image2",
            Format::Custom(s) => s,
        }
    }

    /// Create a custom format
    pub fn custom<S: Into<String>>(format: S) -> Self {
        Format::Custom(format.into())
    }

    /// Get the typical file extension for this format
    pub fn extension(&self) -> &str {
        match self {
            Format::MP4 => "mp4",
            Format::AVI => "avi",
            Format::MKV => "mkv",
            Format::WEBM => "webm",
            Format::MOV => "mov",
            Format::FLV => "flv",
            Format::MP3 => "mp3",
            Format::AAC => "aac",
            Format::WAV => "wav",
            Format::JPEG => "jpg",
            Format::PNG => "png",
            Format::HLS => "m3u8",
            Format::MPEGTS => "ts",
            Format::IMAGE2 => "jpg",
            Format::Custom(_) => "",
        }
    }

    /// Check if format is a video container
    pub fn is_video(&self) -> bool {
        matches!(
            self,
            Format::MP4
                | Format::AVI
                | Format::MKV
                | Format::WEBM
                | Format::MOV
                | Format::FLV
                | Format::HLS
                | Format::MPEGTS
        )
    }

    /// Check if format is audio-only
    pub fn is_audio(&self) -> bool {
        matches!(self, Format::MP3 | Format::AAC | Format::WAV)
    }

    /// Check if format is image-based
    pub fn is_image(&self) -> bool {
        matches!(self, Format::JPEG | Format::PNG | Format::IMAGE2)
    }
}

impl fmt::Display for VideoCodec {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl fmt::Display for AudioCodec {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl fmt::Display for Format {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl From<&str> for VideoCodec {
    fn from(s: &str) -> Self {
        match s {
            "libx264" | "h264" => VideoCodec::H264,
            "libx265" | "h265" | "hevc" => VideoCodec::H265,
            "libvpx" | "vp8" => VideoCodec::VP8,
            "libvpx-vp9" | "vp9" => VideoCodec::VP9,
            "libaom-av1" | "av1" => VideoCodec::AV1,
            "mjpeg" => VideoCodec::MJPEG,
            "png" => VideoCodec::PNG,
            "jpeg" => VideoCodec::JPEG,
            "copy" => VideoCodec::Copy,
            "none" => VideoCodec::None,
            _ => VideoCodec::Custom(s.to_string()),
        }
    }
}

impl From<String> for VideoCodec {
    fn from(s: String) -> Self {
        VideoCodec::from(s.as_str())
    }
}

impl From<&str> for AudioCodec {
    fn from(s: &str) -> Self {
        match s {
            "aac" => AudioCodec::AAC,
            "libmp3lame" | "mp3" => AudioCodec::MP3,
            "ac3" => AudioCodec::AC3,
            "libopus" | "opus" => AudioCodec::Opus,
            "libvorbis" | "vorbis" => AudioCodec::Vorbis,
            "flac" => AudioCodec::FLAC,
            "pcm_s16le" | "pcm" => AudioCodec::PCM,
            "copy" => AudioCodec::Copy,
            "none" => AudioCodec::None,
            _ => AudioCodec::Custom(s.to_string()),
        }
    }
}

impl From<String> for AudioCodec {
    fn from(s: String) -> Self {
        AudioCodec::from(s.as_str())
    }
}

impl From<&str> for Format {
    fn from(s: &str) -> Self {
        match s {
            "mp4" => Format::MP4,
            "avi" => Format::AVI,
            "matroska" | "mkv" => Format::MKV,
            "webm" => Format::WEBM,
            "mov" => Format::MOV,
            "flv" => Format::FLV,
            "mp3" => Format::MP3,
            "aac" => Format::AAC,
            "wav" => Format::WAV,
            "jpeg" | "jpg" => Format::JPEG,
            "png" => Format::PNG,
            "hls" => Format::HLS,
            "mpegts" | "ts" => Format::MPEGTS,
            "image2" => Format::IMAGE2,
            _ => Format::Custom(s.to_string()),
        }
    }
}

impl From<String> for Format {
    fn from(s: String) -> Self {
        Format::from(s.as_str())
    }
}

/// Pixel format types
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PixelFormat {
    /// YUV 4:2:0 planar
    Yuv420p,
    /// YUV 4:2:2 planar
    Yuv422p,
    /// YUV 4:4:4 planar
    Yuv444p,
    /// RGB 24-bit
    Rgb24,
    /// RGBA 32-bit
    Rgba,
    /// BGR 24-bit
    Bgr24,
    /// BGRA 32-bit
    Bgra,
    /// Custom pixel format
    Custom(String),
}

impl PixelFormat {
    /// Get the FFmpeg pixel format string
    pub fn as_str(&self) -> &str {
        match self {
            PixelFormat::Yuv420p => "yuv420p",
            PixelFormat::Yuv422p => "yuv422p",
            PixelFormat::Yuv444p => "yuv444p",
            PixelFormat::Rgb24 => "rgb24",
            PixelFormat::Rgba => "rgba",
            PixelFormat::Bgr24 => "bgr24",
            PixelFormat::Bgra => "bgra",
            PixelFormat::Custom(s) => s,
        }
    }

    /// Create a custom pixel format
    pub fn custom<S: Into<String>>(format: S) -> Self {
        PixelFormat::Custom(format.into())
    }
}

impl fmt::Display for PixelFormat {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl From<&str> for PixelFormat {
    fn from(s: &str) -> Self {
        match s {
            "yuv420p" => PixelFormat::Yuv420p,
            "yuv422p" => PixelFormat::Yuv422p,
            "yuv444p" => PixelFormat::Yuv444p,
            "rgb24" => PixelFormat::Rgb24,
            "rgba" => PixelFormat::Rgba,
            "bgr24" => PixelFormat::Bgr24,
            "bgra" => PixelFormat::Bgra,
            _ => PixelFormat::Custom(s.to_string()),
        }
    }
}

impl From<String> for PixelFormat {
    fn from(s: String) -> Self {
        PixelFormat::from(s.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_video_codec_conversions() {
        assert_eq!(VideoCodec::H264.as_str(), "libx264");
        assert_eq!(VideoCodec::from("h264"), VideoCodec::H264);
        assert_eq!(VideoCodec::custom("custom_codec").as_str(), "custom_codec");
    }

    #[test]
    fn test_audio_codec_conversions() {
        assert_eq!(AudioCodec::AAC.as_str(), "aac");
        assert_eq!(AudioCodec::from("mp3"), AudioCodec::MP3);
        assert!(AudioCodec::AAC.requires_encoding());
        assert!(!AudioCodec::Copy.requires_encoding());
    }

    #[test]
    fn test_format_properties() {
        assert!(Format::MP4.is_video());
        assert!(Format::MP3.is_audio());
        assert!(Format::JPEG.is_image());
        assert_eq!(Format::MP4.extension(), "mp4");
    }
}
