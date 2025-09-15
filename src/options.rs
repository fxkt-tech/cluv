//! Configuration options for FFmpeg and FFprobe operations

use std::collections::HashMap;

/// Options for configuring FFmpeg behavior
#[derive(Debug, Clone, Default)]
pub struct FFmpegOptions {
    /// Binary path for FFmpeg executable
    pub binary_path: String,
    /// Log level for FFmpeg output
    pub log_level: LogLevel,
    /// Whether to overwrite output files
    pub overwrite: bool,
    /// Whether to enable debug output
    pub debug: bool,
    /// Whether to perform a dry run (print command only)
    pub dry_run: bool,
    /// Additional custom arguments
    pub custom_args: Vec<String>,
    /// Environment variables
    pub env_vars: HashMap<String, String>,
}

/// Options for configuring FFprobe behavior
#[derive(Debug, Clone, Default)]
pub struct FFprobeOptions {
    /// Binary path for FFprobe executable
    pub binary_path: String,
    /// Whether to show data in JSON format
    pub json_format: bool,
    /// Whether to show all streams
    pub show_streams: bool,
    /// Whether to show format information
    pub show_format: bool,
    /// Additional custom arguments
    pub custom_args: Vec<String>,
    /// Environment variables
    pub env_vars: HashMap<String, String>,
}

/// Log levels for FFmpeg output
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    /// Show nothing at all
    Quiet,
    /// Show all messages
    Verbose,
    /// Show informational messages
    Info,
    /// Show warning messages
    Warning,
    /// Show error messages only
    Error,
    /// Show fatal errors only
    Fatal,
    /// Show debug information
    Debug,
}

impl Default for LogLevel {
    fn default() -> Self {
        LogLevel::Error
    }
}

impl LogLevel {
    /// Convert log level to FFmpeg command line argument
    pub fn as_str(&self) -> &'static str {
        match self {
            LogLevel::Quiet => "quiet",
            LogLevel::Verbose => "verbose",
            LogLevel::Info => "info",
            LogLevel::Warning => "warning",
            LogLevel::Error => "error",
            LogLevel::Fatal => "fatal",
            LogLevel::Debug => "debug",
        }
    }
}

impl std::fmt::Display for LogLevel {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.as_str())
    }
}

impl FFmpegOptions {
    /// Create new FFmpeg options with default values
    pub fn new() -> Self {
        Self {
            binary_path: "ffmpeg".to_string(),
            log_level: LogLevel::Error,
            overwrite: true,
            debug: false,
            dry_run: false,
            custom_args: Vec::new(),
            env_vars: HashMap::new(),
        }
    }

    /// Set the FFmpeg binary path
    pub fn binary_path<S: Into<String>>(mut self, path: S) -> Self {
        self.binary_path = path.into();
        self
    }

    /// Set the log level
    pub fn log_level(mut self, level: LogLevel) -> Self {
        self.log_level = level;
        self
    }

    /// Enable or disable file overwriting
    pub fn overwrite(mut self, overwrite: bool) -> Self {
        self.overwrite = overwrite;
        self
    }

    /// Enable or disable debug output
    pub fn debug(mut self, debug: bool) -> Self {
        self.debug = debug;
        self
    }

    /// Enable or disable dry run mode
    pub fn dry_run(mut self, dry_run: bool) -> Self {
        self.dry_run = dry_run;
        self
    }

    /// Add a custom argument
    pub fn add_arg<S: Into<String>>(mut self, arg: S) -> Self {
        self.custom_args.push(arg.into());
        self
    }

    /// Add multiple custom arguments
    pub fn add_args<I, S>(mut self, args: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        for arg in args {
            self.custom_args.push(arg.into());
        }
        self
    }

    /// Set an environment variable
    pub fn env_var<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.env_vars.insert(key.into(), value.into());
        self
    }
}

impl FFprobeOptions {
    /// Create new FFprobe options with default values
    pub fn new() -> Self {
        Self {
            binary_path: "ffprobe".to_string(),
            json_format: true,
            show_streams: true,
            show_format: true,
            custom_args: Vec::new(),
            env_vars: HashMap::new(),
        }
    }

    /// Set the FFprobe binary path
    pub fn binary_path<S: Into<String>>(mut self, path: S) -> Self {
        self.binary_path = path.into();
        self
    }

    /// Enable or disable JSON format output
    pub fn json_format(mut self, json: bool) -> Self {
        self.json_format = json;
        self
    }

    /// Enable or disable showing streams information
    pub fn show_streams(mut self, show: bool) -> Self {
        self.show_streams = show;
        self
    }

    /// Enable or disable showing format information
    pub fn show_format(mut self, show: bool) -> Self {
        self.show_format = show;
        self
    }

    /// Add a custom argument
    pub fn add_arg<S: Into<String>>(mut self, arg: S) -> Self {
        self.custom_args.push(arg.into());
        self
    }

    /// Add multiple custom arguments
    pub fn add_args<I, S>(mut self, args: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        for arg in args {
            self.custom_args.push(arg.into());
        }
        self
    }

    /// Set an environment variable
    pub fn env_var<K, V>(mut self, key: K, value: V) -> Self
    where
        K: Into<String>,
        V: Into<String>,
    {
        self.env_vars.insert(key.into(), value.into());
        self
    }
}

/// Builder for creating Cluv instance options
#[derive(Debug, Clone, Default)]
pub struct CluvOptions {
    /// FFmpeg options
    pub ffmpeg: FFmpegOptions,
    /// FFprobe options
    pub ffprobe: FFprobeOptions,
}

impl CluvOptions {
    /// Create new options with default values
    pub fn new() -> Self {
        Self {
            ffmpeg: FFmpegOptions::new(),
            ffprobe: FFprobeOptions::new(),
        }
    }

    /// Set FFmpeg options
    pub fn ffmpeg_options(mut self, options: FFmpegOptions) -> Self {
        self.ffmpeg = options;
        self
    }

    /// Set FFprobe options
    pub fn ffprobe_options(mut self, options: FFprobeOptions) -> Self {
        self.ffprobe = options;
        self
    }

    /// Configure FFmpeg options using a closure
    pub fn with_ffmpeg<F>(mut self, f: F) -> Self
    where
        F: FnOnce(FFmpegOptions) -> FFmpegOptions,
    {
        self.ffmpeg = f(self.ffmpeg);
        self
    }

    /// Configure FFprobe options using a closure
    pub fn with_ffprobe<F>(mut self, f: F) -> Self
    where
        F: FnOnce(FFprobeOptions) -> FFprobeOptions,
    {
        self.ffprobe = f(self.ffprobe);
        self
    }
}
