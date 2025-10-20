//! Stream handling for FFmpeg operations

use std::fmt;

use crate::ffmpeg::filter::Filter;

/// Represents a stream selector for FFmpeg operations
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Stream {
    /// Input index (0-based)
    pub input_index: i32,
    /// Stream type
    pub stream_type: StreamType,
    /// Whether the stream may not exist
    pub may_not: bool,
    /// Stream index within the input (optional)
    pub stream_index: Option<i32>,
    /// Filter label for the stream (optional)
    pub label: Option<String>,
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
    /// Filter stream
    Filter,
}

impl Stream {
    /// Create a new stream selector
    pub fn new(input_index: i32, stream_type: StreamType, may_not: bool) -> Self {
        Self {
            input_index,
            stream_type,
            may_not,
            stream_index: None,
            label: None,
        }
    }

    /// Create a video stream selector
    pub fn video(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Video, false)
    }

    pub fn may_video(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Video, true)
    }

    /// Create an audio stream selector
    pub fn audio(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Audio, false)
    }

    pub fn may_audio(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Audio, true)
    }

    /// Create a subtitle stream selector
    pub fn subtitle(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Subtitle, false)
    }

    /// Create a data stream selector
    pub fn data(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Data, false)
    }

    /// Create an any stream selector
    pub fn any(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Any, false)
    }

    /// Create a label for the stream
    pub fn with_label(mut self, label: String) -> Self {
        self.label = Some(label);
        self
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
            StreamType::Filter => "",
        };

        let may = if self.may_not { "?" } else { "" };

        if let Some(label) = self.label.clone() {
            label
        } else if let Some(stream_index) = self.stream_index {
            if type_char.is_empty() {
                format!("[{}:{}{}]", self.input_index, stream_index, may)
            } else {
                format!(
                    "[{}:{}{}:{}]",
                    self.input_index, type_char, may, stream_index
                )
            }
        } else if type_char.is_empty() {
            format!("[{}]", self.input_index)
        } else {
            format!("[{}:{}{}]", self.input_index, type_char, may)
        }
    }

    /// Select first available stream of given type from input
    pub fn select(input_index: i32, stream_type: StreamType) -> Self {
        Self::new(input_index, stream_type, false)
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
            StreamType::Filter => None,
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
            StreamType::Filter => "filter",
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
        Self::new(input_index, StreamType::Video, false)
    }

    /// Get best audio stream from input
    pub fn best_audio(input_index: i32) -> Self {
        Self::new(input_index, StreamType::Audio, false)
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

/// Enum wrapper for all types that implement Streamable
#[derive(Debug, Clone)]
pub enum StreamInput {
    Stream(Stream),
    Filter(Filter),
    InputIndex(i32),
    InputWithType(i32, StreamType),
    InputWithIndex(i32, i32),
    StringSpec(String),
}

impl fmt::Display for StreamInput {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StreamInput::Stream(stream) => stream.fmt(f),
            StreamInput::Filter(filter) => filter.label.fmt(f),
            StreamInput::InputIndex(index) => write!(f, "{}", index),
            StreamInput::InputWithType(input, stream_type) => {
                write!(f, "{}:{}", input, stream_type)
            }
            StreamInput::InputWithIndex(input, index) => write!(f, "{}:{}", input, index),
            StreamInput::StringSpec(spec) => write!(f, "{}", spec),
        }
    }
}

impl Streamable for StreamInput {
    fn to_stream(&self) -> Stream {
        match self {
            StreamInput::Stream(stream) => stream.clone(),
            StreamInput::Filter(filter) => filter.to_stream(),
            StreamInput::InputIndex(index) => Stream::any(*index),
            StreamInput::InputWithType(input, stream_type) => {
                Stream::new(*input, stream_type.clone(), false)
            }
            StreamInput::InputWithIndex(input, index) => Stream::any(*input).with_index(*index),
            StreamInput::StringSpec(spec) => spec.to_stream(),
        }
    }
}

impl From<Stream> for StreamInput {
    fn from(stream: Stream) -> Self {
        StreamInput::Stream(stream)
    }
}

impl From<i32> for StreamInput {
    fn from(index: i32) -> Self {
        StreamInput::InputIndex(index)
    }
}

impl From<(i32, StreamType)> for StreamInput {
    fn from(tuple: (i32, StreamType)) -> Self {
        StreamInput::InputWithType(tuple.0, tuple.1)
    }
}

impl From<(i32, i32)> for StreamInput {
    fn from(tuple: (i32, i32)) -> Self {
        StreamInput::InputWithIndex(tuple.0, tuple.1)
    }
}

impl From<String> for StreamInput {
    fn from(spec: String) -> Self {
        StreamInput::StringSpec(spec)
    }
}

impl From<&str> for StreamInput {
    fn from(spec: &str) -> Self {
        StreamInput::StringSpec(spec.to_string())
    }
}

impl From<&String> for StreamInput {
    fn from(s: &String) -> Self {
        StreamInput::StringSpec(s.clone())
    }
}

impl From<&Stream> for StreamInput {
    fn from(stream: &Stream) -> Self {
        StreamInput::Stream(stream.clone())
    }
}

impl From<&Filter> for StreamInput {
    fn from(filter: &Filter) -> Self {
        StreamInput::Filter(filter.clone())
    }
}

impl From<&mut Filter> for StreamInput {
    fn from(filter: &mut Filter) -> Self {
        StreamInput::Filter(filter.clone())
    }
}

impl Streamable for Stream {
    fn to_stream(&self) -> Stream {
        self.clone()
    }
}

impl Streamable for Filter {
    fn to_stream(&self) -> Stream {
        Stream::any(0).with_label(self.label.to_string().clone())
    }
}

impl Streamable for i32 {
    fn to_stream(&self) -> Stream {
        Stream::any(*self)
    }
}

impl Streamable for (i32, StreamType) {
    fn to_stream(&self) -> Stream {
        Stream::new(self.0, self.1.clone(), false)
    }
}

impl Streamable for (i32, i32) {
    fn to_stream(&self) -> Stream {
        Stream::any(self.0).with_index(self.1)
    }
}

impl Streamable for String {
    fn to_stream(&self) -> Stream {
        // Parse string as stream specifier, fallback to input 0 if parsing fails
        if let Some(colon_pos) = self.find(':') {
            let input_part = &self[..colon_pos];
            let stream_part = &self[colon_pos + 1..];

            if let Ok(input_index) = input_part.parse::<i32>() {
                match stream_part {
                    "v" => Stream::video(input_index),
                    "a" => Stream::audio(input_index),
                    "s" => Stream::subtitle(input_index),
                    "d" => Stream::data(input_index),
                    _ => {
                        if let Ok(stream_index) = stream_part.parse::<i32>() {
                            Stream::any(input_index).with_index(stream_index)
                        } else {
                            Stream::any(input_index)
                        }
                    }
                }
            } else {
                Stream::any(0)
            }
        } else if let Ok(input_index) = self.parse::<i32>() {
            Stream::any(input_index)
        } else {
            Stream::any(0)
        }
    }
}

/// Collection of commonly used stream selectors
pub mod common {
    use super::*;

    /// First video stream from first input
    pub const VIDEO_0: Stream = Stream {
        input_index: 0,
        stream_type: StreamType::Video,
        may_not: false,
        stream_index: None,
        label: None,
    };

    /// First audio stream from first input
    pub const AUDIO_0: Stream = Stream {
        input_index: 0,
        stream_type: StreamType::Audio,
        may_not: false,
        stream_index: None,
        label: None,
    };

    /// All streams from first input
    pub const ALL_0: Stream = Stream {
        input_index: 0,
        stream_type: StreamType::Any,
        may_not: false,
        stream_index: None,
        label: None,
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
