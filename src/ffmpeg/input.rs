//! Input handling for FFmpeg operations

use std::fmt;

/// FFmpeg input configuration
#[derive(Debug, Clone)]
pub struct Input {
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
    pub fn new<S: Into<String>>(path: S) -> Self {
        Self {
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
            path: concat_file.into(),
            start_time: None,
            duration: None,
            framerate: None,
            format: Some("concat".to_string()),
            options: vec![("safe".to_string(), "0".to_string())],
        }
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

/// Collection of inputs
pub type Inputs = Vec<Input>;

/// Input builder for more complex configurations
#[derive(Debug, Default)]
pub struct InputBuilder {
    path: Option<String>,
    start_time: Option<f32>,
    duration: Option<f32>,
    framerate: Option<String>,
    format: Option<String>,
    options: Vec<(String, String)>,
}

impl InputBuilder {
    /// Create a new input builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the input path
    pub fn path<S: Into<String>>(mut self, path: S) -> Self {
        self.path = Some(path.into());
        self
    }

    /// Set the start time
    pub fn start_time(mut self, time: f32) -> Self {
        self.start_time = Some(time);
        self
    }

    /// Set the duration
    pub fn duration(mut self, duration: f32) -> Self {
        self.duration = Some(duration);
        self
    }

    /// Set the framerate
    pub fn framerate<S: Into<String>>(mut self, fps: S) -> Self {
        self.framerate = Some(fps.into());
        self
    }

    /// Set the format
    pub fn format<S: Into<String>>(mut self, format: S) -> Self {
        self.format = Some(format.into());
        self
    }

    /// Add an option
    pub fn option<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.options.push((key.into(), value.into()));
        self
    }

    /// Build the input
    pub fn build(self) -> Result<Input, String> {
        let path = self.path.ok_or("Path is required for input")?;

        Ok(Input {
            path,
            start_time: self.start_time,
            duration: self.duration,
            framerate: self.framerate,
            format: self.format,
            options: self.options,
        })
    }
}

/// Convenience functions for creating common input types
impl Input {
    /// Create a simple file input
    pub fn file<S: Into<String>>(path: S) -> Self {
        Self::new(path)
    }

    /// Create a time-limited input
    pub fn timed<S: Into<String>>(path: S, start: f32, duration: f32) -> Self {
        Self::with_time(start, duration, path)
    }

    /// Create an input for image sequences
    pub fn image_sequence<S: Into<String>>(pattern: S, fps: f32) -> Self {
        Self::new(pattern).framerate(fps.to_string())
    }

    /// Create an input from a webcam or camera device
    pub fn camera<S: Into<String>>(device: S) -> Self {
        #[cfg(target_os = "linux")]
        let format = "v4l2";
        #[cfg(target_os = "macos")]
        let format = "avfoundation";
        #[cfg(target_os = "windows")]
        let format = "dshow";

        Self::new(device).format(format)
    }

    /// Create an input from screen capture
    pub fn screen_capture() -> Self {
        #[cfg(target_os = "linux")]
        {
            Self::new(":0.0").format("x11grab")
        }
        #[cfg(target_os = "macos")]
        {
            Self::new("1").format("avfoundation")
        }
        #[cfg(target_os = "windows")]
        {
            Self::new("desktop").format("gdigrab")
        }
    }

    /// Create an input for HTTP/RTMP streams
    pub fn stream<S: Into<String>>(url: S) -> Self {
        Self::new(url)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_simple_input() {
        let input = Input::new("test.mp4");
        let args = input.to_args();

        assert_eq!(args, vec!["-i", "test.mp4"]);
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
    fn test_input_builder() {
        let input = InputBuilder::new()
            .path("test.mp4")
            .start_time(5.0)
            .framerate("30")
            .build()
            .unwrap();

        assert_eq!(input.path, "test.mp4");
        assert_eq!(input.start_time, Some(5.0));
        assert_eq!(input.framerate, Some("30".to_string()));
    }

    #[test]
    fn test_concat_input() {
        let input = Input::with_concat("filelist.txt");
        let args = input.to_args();

        assert!(args.contains(&"-f".to_string()));
        assert!(args.contains(&"concat".to_string()));
        assert!(args.contains(&"-safe".to_string()));
        assert!(args.contains(&"0".to_string()));
    }
}
