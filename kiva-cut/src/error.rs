//! Error handling for the cluv library

/// Result type alias for cluv operations
pub type Result<T> = std::result::Result<T, CutError>;

/// Main error type for cluv operations
#[derive(Debug, thiserror::Error)]
pub enum CutError {
    /// FFmpeg execution error
    #[error("FFmpeg error: {0}")]
    FFmpeg(String),

    /// FFprobe execution error
    #[error("FFprobe error: {0}")]
    FFprobe(String),

    /// IO error
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// JSON serialization/deserialization error
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    /// Invalid parameters
    #[error("Invalid parameters: {0}")]
    InvalidParams(String),

    /// Missing required parameter
    #[error("Missing required parameter: {0}")]
    MissingParam(String),

    /// File not found
    #[error("File not found: {0}")]
    FileNotFound(String),

    /// Unsupported format
    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),

    /// Regex error
    #[error("Regex error: {0}")]
    Regex(#[from] regex::Error),

    /// Custom error with message
    #[error("{0}")]
    Custom(String),
}

impl CutError {
    /// Create a new FFmpeg error
    pub fn ffmpeg<S: Into<String>>(msg: S) -> Self {
        CutError::FFmpeg(msg.into())
    }

    /// Create a new FFprobe error
    pub fn ffprobe<S: Into<String>>(msg: S) -> Self {
        CutError::FFprobe(msg.into())
    }

    /// Create a new invalid parameters error
    pub fn invalid_params<S: Into<String>>(msg: S) -> Self {
        CutError::InvalidParams(msg.into())
    }

    /// Create a new missing parameter error
    pub fn missing_param<S: Into<String>>(param: S) -> Self {
        CutError::MissingParam(param.into())
    }

    /// Create a new file not found error
    pub fn file_not_found<S: Into<String>>(path: S) -> Self {
        CutError::FileNotFound(path.into())
    }

    /// Create a new unsupported format error
    pub fn unsupported_format<S: Into<String>>(format: S) -> Self {
        CutError::UnsupportedFormat(format.into())
    }

    /// Create a new custom error
    pub fn custom<S: Into<String>>(msg: S) -> Self {
        CutError::Custom(msg.into())
    }
}

/// Predefined error instances for common scenarios
impl CutError {
    /// Error for when interval is required for normal frame type
    pub fn interval_required() -> CutError {
        CutError::InvalidParams("interval required when frame_type is 1 (normal frame)".to_string())
    }

    /// Error for invalid parameters
    pub fn params_invalid() -> CutError {
        CutError::InvalidParams("params is invalid".to_string())
    }
}

// Convert from common error types
impl From<uuid::Error> for CutError {
    fn from(err: uuid::Error) -> Self {
        CutError::Custom(format!("UUID error: {}", err))
    }
}
