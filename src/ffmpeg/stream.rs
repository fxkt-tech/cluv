//! Stream handling for FFmpeg operations

use std::fmt;

/// Represents a stream selector for FFmpeg operations
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Stream {
    /// Input index (0-based)
    pub input_index: i32,
    /// Stream type
    pub stream_type: StreamType,
    /// Stream index within the input (optional)
    pub stream_index: Option<i32>,
}

/// Types of streams
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StreamType {
    /// Video stream
    Video,
    /// Audio stream
    Audio,
    /// Subtitle stream
    Subtitle,
    /// Data stream
    Data,
    /// Any stream type
    Any,
}

impl Stream {
    /// Create a new stream selector
    pub fn new(input_index: i32, stream_type: StreamType) -> Self {
        Self {
            input_index,
            stream_type,
            stream_index: None,
        }
    }

    /// Create a video stream selector
    pub fn video(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Video)
    }

    /// Create an audio stream selector
    pub fn audio(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Audio)
    }

    /// Create a subtitle stream selector
    pub fn subtitle(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Subtitle)
    }

    /// Create a data stream selector
    pub fn data(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Data)
    }

    /// Create an any stream selector
    pub fn any(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Any)
    }

    /// Set the specific stream index within the input
    pub fn with_index(mut self, index: i32) -> Self {
        self.stream_index = Some(index);
        self
    }

    /// Create a video stream with specific index
    pub fn video_index(input_index: i32, stream_index: i32) -> Self {
        Self::video(input_index).with_index(stream_index)
    }

    /// Create an audio stream with specific index
    pub fn audio_index(input_index: i32, stream_index: i32) -> Self {
        Self::audio(input_index).with_index(stream_index)
    }

    /// Get the stream specifier string for FFmpeg
    pub fn specifier(&self) -> String {
        let type_char = match self.stream_type {
            StreamType::Video => "v",
            StreamType::Audio => "a",
            StreamType::Subtitle => "s",
            StreamType::Data => "d",
            StreamType::Any => "",
        };

        if let Some(stream_index) = self.stream_index {
            if type_char.is_empty() {
                format!("{}:{}", self.input_index, stream_index)
            } else {
                format!("{}:{}:{}", self.input_index, type_char, stream_index)
            }
        } else if type_char.is_empty() {
            format!("{}", self.input_index)
        } else {
            format!("{}:{}", self.input_index, type_char)
        }
    }

    /// Check if this stream may contain audio
    pub fn may_audio(&self) -> bool {
        matches!(self.stream_type, StreamType::Audio | StreamType::Any)
    }

    /// Check if this stream may contain video
    pub fn may_video(&self) -> bool {
        matches!(self.stream_type, StreamType::Video | StreamType::Any)
    }

    /// Select first available stream of given type from input
    pub fn select(input_index: i32, stream_type: StreamType) -> Self {
        Self::new(input_index, stream_type)
    }
}

impl fmt::Display for Stream {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.specifier())
    }
}

impl StreamType {
    /// Get the character representation used in FFmpeg
    pub fn as_char(&self) -> Option<char> {
        match self {
            StreamType::Video => Some('v'),
            StreamType::Audio => Some('a'),
            StreamType::Subtitle => Some('s'),
            StreamType::Data => Some('d'),
            StreamType::Any => None,
        }
    }
}

impl fmt::Display for StreamType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            StreamType::Video => "video",
            StreamType::Audio => "audio",
            StreamType::Subtitle => "subtitle",
            StreamType::Data => "data",
            StreamType::Any => "any",
        };
        write!(f, "{}", s)
    }
}

/// Convenience functions for common stream patterns
impl Stream {
    /// Create stream selector for first video stream from input 0
    pub fn v0() -> Self {
        Self::video(0)
    }

    /// Create stream selector for first audio stream from input 0
    pub fn a0() -> Self {
        Self::audio(0)
    }

    /// Create stream selector for video stream from specific input
    pub fn v(input_index: i32) -> Self {
        Self::video(input_index)
    }

    /// Create stream selector for audio stream from specific input
    pub fn a(input_index: i32) -> Self {
        Self::audio(input_index)
    }

    /// Create stream selector for all streams from specific input
    pub fn all(input_index: i32) -> Self {
        Self::any(input_index)
    }

    /// Get best video stream from input
    pub fn best_video(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Video)
    }

    /// Get best audio stream from input
    pub fn best_audio(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Audio)
    }
}

/// Stream mapping utilities
pub struct StreamMapper;

impl StreamMapper {
    /// Map all streams from input to output
    pub fn map_all(input_index: i32) -> Vec<String> {
        vec![format!("{}", input_index)]
    }

    /// Map video stream from input to output
    pub fn map_video(input_index: i32) -> String {
        Stream::video(input_index).to_string()
    }

    /// Map audio stream from input to output
    pub fn map_audio(input_index: i32) -> String {
        Stream::audio(input_index).to_string()
    }

    /// Map specific stream by index
    pub fn map_stream(input_index: i32, stream_index: i32) -> String {
        format!("{}:{}", input_index, stream_index)
    }

    /// Map video and audio streams separately
    pub fn map_video_audio(input_index: i32) -> Vec<String> {
        vec![Self::map_video(input_index), Self::map_audio(input_index)]
    }
}

/// Helper trait for objects that can be converted to stream selectors
pub trait Streamable {
    fn to_stream(&self) -> Stream;
}

impl Streamable for Stream {
    fn to_stream(&self) -> Stream {
        self.clone()
    }
}

impl Streamable for i32 {
    fn to_stream(&self) -> Stream {
        Stream::any(*self)
    }
}

impl Streamable for (i32, StreamType) {
    fn to_stream(&self) -> Stream {
        Stream::new(self.0, self.1.clone())
    }
}

impl Streamable for (i32, i32) {
    fn to_stream(&self) -> Stream {
        Stream::any(self.0).with_index(self.1)
    }
}

/// Collection of commonly used stream selectors
pub mod common {
    use super::*;

    /// First video stream from first input
    pub const VIDEO_0: Stream = Stream {
        input_index: 0,
        stream_type: StreamType::Video,
        stream_index: None,
    };

    /// First audio stream from first input
    pub const AUDIO_0: Stream = Stream {
        input_index: 0,
        stream_type: StreamType::Audio,
        stream_index: None,
    };

    /// All streams from first input
    pub const ALL_0: Stream = Stream {
        input_index: 0,
        stream_type: StreamType::Any,
        stream_index: None,
    };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stream_creation() {
        let video_stream = Stream::video(0);
        assert_eq!(video_stream.input_index, 0);
        assert_eq!(video_stream.stream_type, StreamType::Video);
        assert_eq!(video_stream.stream_index, None);
    }

    #[test]
    fn test_stream_specifier() {
        assert_eq!(Stream::video(0).specifier(), "0:v");
        assert_eq!(Stream::audio(1).specifier(), "1:a");
        assert_eq!(Stream::video_index(0, 2).specifier(), "0:v:2");
        assert_eq!(Stream::any(0).specifier(), "0");
    }

    #[test]
    fn test_stream_display() {
        let stream = Stream::video(0);
        assert_eq!(stream.to_string(), "0:v");

        let indexed_stream = Stream::audio_index(1, 2);
        assert_eq!(indexed_stream.to_string(), "1:a:2");
    }

    #[test]
    fn test_stream_type_properties() {
        let video_stream = Stream::video(0);
        assert!(video_stream.may_video());
        assert!(!video_stream.may_audio());

        let audio_stream = Stream::audio(0);
        assert!(!audio_stream.may_video());
        assert!(audio_stream.may_audio());

        let any_stream = Stream::any(0);
        assert!(any_stream.may_video());
        assert!(any_stream.may_audio());
    }

    #[test]
    fn test_stream_mapper() {
        assert_eq!(StreamMapper::map_video(0), "0:v");
        assert_eq!(StreamMapper::map_audio(1), "1:a");
        assert_eq!(StreamMapper::map_stream(0, 2), "0:2");

        let video_audio = StreamMapper::map_video_audio(0);
        assert_eq!(video_audio, vec!["0:v", "0:a"]);
    }

    #[test]
    fn test_streamable_trait() {
        let stream = Stream::video(0);
        assert_eq!(stream.to_stream(), stream);

        let from_int: Stream = 1i32.to_stream();
        assert_eq!(from_int.input_index, 1);
        assert_eq!(from_int.stream_type, StreamType::Any);

        let from_tuple: Stream = (0, StreamType::Video).to_stream();
        assert_eq!(from_tuple.input_index, 0);
        assert_eq!(from_tuple.stream_type, StreamType::Video);
    }
}
