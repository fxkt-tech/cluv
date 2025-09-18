//! Input handling for FFmpeg operations

use std::{fmt, sync::atomic::Ordering};

use crate::ffmpeg::{stream::Stream, FFmpeg};

/// FFmpeg input configuration
#[derive(Debug, Clone)]
pub struct Input {
    /// Input index for identification
    pub idx: u32,
    /// Input file path or URL
    pub path: String,
    /// Start time offset (seek)
    pub start_time: Option<f32>,
    /// Duration to read
    pub duration: Option<f32>,
    /// Frame rate for image sequences
    pub framerate: Option<String>,
    /// Input format
    pub format: Option<String>,
    /// Additional input options
    pub options: Vec<(String, String)>,
}

impl Input {
    /// Create a new simple input from a file path
    pub fn with_simple<S: Into<String>>(path: S) -> Self {
        Self {
            idx: 0,
            path: path.into(),
            start_time: None,
            duration: None,
            framerate: None,
            format: None,
            options: Vec::new(),
        }
    }

    /// Create an input with start time and duration
    pub fn with_time<S: Into<String>>(start_time: f32, duration: f32, path: S) -> Self {
        Self {
            idx: 0,
            path: path.into(),
            start_time: Some(start_time),
            duration: Some(duration),
            framerate: None,
            format: None,
            options: Vec::new(),
        }
    }

    /// Create an input for concatenation using a file list
    pub fn with_concat<S: Into<String>>(concat_file: S) -> Self {
        Self {
            idx: 0,
            path: concat_file.into(),
            start_time: None,
            duration: None,
            framerate: None,
            format: Some("concat".to_string()),
            options: vec![("safe".to_string(), "0".to_string())],
        }
    }

    /// Add this input to an FFmpeg instance
    pub fn ffcx(mut self, ffmpeg: &mut FFmpeg) -> Self {
        let idx = ffmpeg.input_counter.fetch_add(1, Ordering::SeqCst);
        self.set_idx(idx);
        ffmpeg.add_input_mut(self.clone());
        self
    }

    pub fn set_idx(&mut self, idx: u32) -> &mut Self {
        self.idx = idx;
        self
    }

    /// Set the start time (seek position)
    pub fn start_time(mut self, time: f32) -> Self {
        self.start_time = Some(time);
        self
    }

    /// Set the duration to read
    pub fn duration(mut self, duration: f32) -> Self {
        self.duration = Some(duration);
        self
    }

    /// Set the frame rate for image sequences
    pub fn framerate<S: Into<String>>(mut self, fps: S) -> Self {
        self.framerate = Some(fps.into());
        self
    }

    /// Set the input format
    pub fn format<S: Into<String>>(mut self, format: S) -> Self {
        self.format = Some(format.into());
        self
    }

    /// Add a custom input option
    pub fn option<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.options.push((key.into(), value.into()));
        self
    }

    pub fn v(&self) -> Stream {
        Stream::video(self.idx as i32)
    }

    pub fn may_v(&self) -> Stream {
        Stream::may_video(self.idx as i32)
    }

    pub fn a(&self) -> Stream {
        Stream::audio(self.idx as i32)
    }

    pub fn may_a(&self) -> Stream {
        Stream::may_audio(self.idx as i32)
    }

    /// Convert to FFmpeg command line arguments
    pub fn to_args(&self) -> Vec<String> {
        let mut args = Vec::new();

        // Add input format if specified
        if let Some(ref format) = self.format {
            args.push("-f".to_string());
            args.push(format.clone());
        }

        // Add framerate if specified
        if let Some(ref fps) = self.framerate {
            args.push("-r".to_string());
            args.push(fps.clone());
        }

        // Add start time if specified
        if let Some(start_time) = self.start_time {
            args.push("-ss".to_string());
            args.push(start_time.to_string());
        }

        // Add duration if specified
        if let Some(duration) = self.duration {
            args.push("-t".to_string());
            args.push(duration.to_string());
        }

        // Add custom options
        for (key, value) in &self.options {
            args.push(format!("-{}", key));
            args.push(value.clone());
        }

        // Add input file
        args.push("-i".to_string());
        args.push(self.path.clone());

        args
    }
}

impl fmt::Display for Input {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.path)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_input() {
        let input = Input::with_simple("test.mp4");
        let args = input.to_args();

        assert_eq!(args, vec!["-i", "test.mp4"]);
        // idx should be assigned automatically
        assert!(input.idx < 1000); // reasonable upper bound for test
    }

    #[test]
    fn test_timed_input() {
        let input = Input::with_time(10.0, 30.0, "test.mp4");
        let args = input.to_args();

        assert!(args.contains(&"-ss".to_string()));
        assert!(args.contains(&"10".to_string()));
        assert!(args.contains(&"-t".to_string()));
        assert!(args.contains(&"30".to_string()));
    }

    #[test]
    fn test_concat_input() {
        let input = Input::with_concat("filelist.txt");
        let args = input.to_args();

        assert!(args.contains(&"-f".to_string()));
        assert!(args.contains(&"concat".to_string()));
        assert!(args.contains(&"-safe".to_string()));
        assert!(args.contains(&"0".to_string()));
        // idx should be assigned automatically
        assert!(input.idx < 1000); // reasonable upper bound for test
    }

    #[test]
    fn test_audio_method() {
        let input = Input::with_simple("test.mp4");
        let audio_stream = input.a();

        // Verify that the audio stream has the correct input index
        assert_eq!(audio_stream.input_index, input.idx as i32);
        assert_eq!(
            audio_stream.stream_type,
            crate::ffmpeg::stream::StreamType::Audio
        );
    }
}
