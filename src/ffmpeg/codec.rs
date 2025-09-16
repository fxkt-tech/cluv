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
    Mp4,
    /// AVI container
    Avi,
    /// MKV container
    Mkv,
    /// WebM container
    Webm,
    /// MOV container
    Mov,
    /// FLV container
    Flv,
    /// MP3 format
    Mp3,
    /// AAC format
    Aac,
    /// WAV format
    Wav,
    /// JPEG image
    Jpeg,
    /// PNG image
    Png,
    /// HLS format
    Hls,
    /// MPEG-TS format
    Mpegts,
    /// Image2 format (for image sequences)
    Image2,
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
            Format::Mp4 => "mp4",
            Format::Avi => "avi",
            Format::Mkv => "matroska",
            Format::Webm => "webm",
            Format::Mov => "mov",
            Format::Flv => "flv",
            Format::Mp3 => "mp3",
            Format::Aac => "aac",
            Format::Wav => "wav",
            Format::Jpeg => "image2",
            Format::Png => "image2",
            Format::Hls => "hls",
            Format::Mpegts => "mpegts",
            Format::Image2 => "image2",
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
            Format::Mp4 => "mp4",
            Format::Avi => "avi",
            Format::Mkv => "mkv",
            Format::Webm => "webm",
            Format::Mov => "mov",
            Format::Flv => "flv",
            Format::Mp3 => "mp3",
            Format::Aac => "aac",
            Format::Wav => "wav",
            Format::Jpeg => "jpg",
            Format::Png => "png",
            Format::Hls => "m3u8",
            Format::Mpegts => "ts",
            Format::Image2 => "jpg",
            Format::Custom(_) => "",
        }
    }

    /// Check if format is a video container
    pub fn is_video(&self) -> bool {
        matches!(
            self,
            Format::Mp4
                | Format::Avi
                | Format::Mkv
                | Format::Webm
                | Format::Mov
                | Format::Flv
                | Format::Hls
                | Format::Mpegts
        )
    }

    /// Check if format is audio-only
    pub fn is_audio(&self) -> bool {
        matches!(self, Format::Mp3 | Format::Aac | Format::Wav)
    }

    /// Check if format is image-based
    pub fn is_image(&self) -> bool {
        matches!(self, Format::Jpeg | Format::Png | Format::Image2)
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
            "mp4" => Format::Mp4,
            "avi" => Format::Avi,
            "matroska" | "mkv" => Format::Mkv,
            "webm" => Format::Webm,
            "mov" => Format::Mov,
            "flv" => Format::Flv,
            "mp3" => Format::Mp3,
            "aac" => Format::Aac,
            "wav" => Format::Wav,
            "jpeg" | "jpg" => Format::Jpeg,
            "png" => Format::Png,
            "hls" => Format::Hls,
            "mpegts" | "ts" => Format::Mpegts,
            "image2" => Format::Image2,
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
        assert!(Format::Mp4.is_video());
        assert!(Format::Mp3.is_audio());
        assert!(Format::Jpeg.is_image());
        assert_eq!(Format::Mp4.extension(), "mp4");
    }
}
