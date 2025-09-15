//! Filter handling for FFmpeg operations

use crate::ffmpeg::stream::Stream;
use std::fmt;

/// Represents an FFmpeg filter
#[derive(Debug, Clone)]
pub struct Filter {
    /// Filter name
    pub name: String,
    /// Filter parameters
    pub params: Vec<String>,
    /// Input streams or labels
    pub inputs: Vec<String>,
    /// Output labels
    pub outputs: Vec<String>,
}

impl Filter {
    /// Create a new filter with the given name
    pub fn new<S: Into<String>>(name: S) -> Self {
        Self {
            name: name.into(),
            params: Vec::new(),
            inputs: Vec::new(),
            outputs: Vec::new(),
        }
    }

    /// Add a parameter to the filter
    pub fn param<S: Into<String>>(mut self, param: S) -> Self {
        self.params.push(param.into());
        self
    }

    /// Add multiple parameters
    pub fn params<I, S>(mut self, params: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        for param in params {
            self.params.push(param.into());
        }
        self
    }

    /// Set input streams or labels
    pub fn inputs<I, S>(mut self, inputs: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.inputs = inputs.into_iter().map(|s| s.into()).collect();
        self
    }

    /// Set output labels
    pub fn outputs<I, S>(mut self, outputs: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: Into<String>,
    {
        self.outputs = outputs.into_iter().map(|s| s.into()).collect();
        self
    }

    /// Use specific streams as input
    pub fn use_streams(mut self, streams: &[Stream]) -> Self {
        self.inputs = streams.iter().map(|s| s.to_string()).collect();
        self
    }

    /// Use a single stream as input
    pub fn use_stream(mut self, stream: &Stream) -> Self {
        self.inputs = vec![stream.to_string()];
        self
    }

    /// Set a single output label
    pub fn output<S: Into<String>>(mut self, label: S) -> Self {
        self.outputs = vec![label.into()];
        self
    }

    /// Build the filter string representation
    pub fn build(&self) -> String {
        let mut result = String::new();

        // Add inputs
        if !self.inputs.is_empty() {
            result.push_str(&format!("[{}]", self.inputs.join("][")));
        }

        // Add filter name
        result.push_str(&self.name);

        // Add parameters
        if !self.params.is_empty() {
            result.push('=');
            result.push_str(&self.params.join(":"));
        }

        // Add outputs
        if !self.outputs.is_empty() {
            result.push_str(&format!("[{}]", self.outputs.join("][")));
        }

        result
    }
}

impl fmt::Display for Filter {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.build())
    }
}

/// Video filter constructors
impl Filter {
    /// Scale filter for resizing video
    pub fn scale(width: i32, height: i32) -> Self {
        let w_str = if width <= 0 {
            "-2".to_string()
        } else {
            width.to_string()
        };
        let h_str = if height <= 0 {
            "-2".to_string()
        } else {
            height.to_string()
        };

        Self::new("scale").params([w_str, h_str])
    }

    /// Scale filter with aspect ratio preservation
    pub fn scale_keep_aspect(size: i32) -> Self {
        Self::new("scale").params([format!("{}:-2", size)])
    }

    /// Crop filter for cutting video
    pub fn crop(width: i32, height: i32, x: i32, y: i32) -> Self {
        Self::new("crop").params([
            width.to_string(),
            height.to_string(),
            x.to_string(),
            y.to_string(),
        ])
    }

    /// Delogo filter for removing logos/watermarks
    pub fn delogo(x: i32, y: i32, width: i32, height: i32) -> Self {
        Self::new("delogo").params([
            format!("x={}", x),
            format!("y={}", y),
            format!("w={}", width),
            format!("h={}", height),
        ])
    }

    /// Overlay filter for adding watermarks
    pub fn overlay(x: i32, y: i32) -> Self {
        Self::new("overlay").params([format!("{}:{}", x, y)])
    }

    /// Overlay filter with position string
    pub fn overlay_pos<S: Into<String>>(position: S) -> Self {
        Self::new("overlay").param(position.into())
    }

    /// FPS filter for changing frame rate
    pub fn fps<S: Into<String>>(fps: S) -> Self {
        Self::new("fps").param(fps.into())
    }

    /// Select filter for frame selection
    pub fn select<S: Into<String>>(expression: S) -> Self {
        Self::new("select").param(expression.into())
    }

    /// Tile filter for creating sprite sheets
    pub fn tile(cols: i32, rows: i32) -> Self {
        Self::new("tile").params([format!("layout={}x{}", cols, rows)])
    }

    /// SetPTS filter for video timestamps
    pub fn setpts<S: Into<String>>(expression: S) -> Self {
        Self::new("setpts").param(expression.into())
    }

    /// Fade filter for video transitions
    pub fn fade_in(start_frame: i32, duration: i32) -> Self {
        Self::new("fade").params([
            "t=in".to_string(),
            format!("st={}", start_frame),
            format!("d={}", duration),
        ])
    }

    /// Fade out filter
    pub fn fade_out(start_frame: i32, duration: i32) -> Self {
        Self::new("fade").params([
            "t=out".to_string(),
            format!("st={}", start_frame),
            format!("d={}", duration),
        ])
    }

    /// Rotate filter
    pub fn rotate(angle: f64) -> Self {
        Self::new("rotate").param(angle.to_string())
    }

    /// Flip horizontal
    pub fn hflip() -> Self {
        Self::new("hflip")
    }

    /// Flip vertical
    pub fn vflip() -> Self {
        Self::new("vflip")
    }

    /// Transpose filter
    pub fn transpose(direction: i32) -> Self {
        Self::new("transpose").param(direction.to_string())
    }
}

/// Audio filter constructors
impl Filter {
    /// Volume filter for audio
    pub fn volume(volume: f64) -> Self {
        Self::new("volume").param(volume.to_string())
    }

    /// Audio fade in
    pub fn afade_in(start_time: f64, duration: f64) -> Self {
        Self::new("afade").params([
            "t=in".to_string(),
            format!("ss={}", start_time),
            format!("d={}", duration),
        ])
    }

    /// Audio fade out
    pub fn afade_out(start_time: f64, duration: f64) -> Self {
        Self::new("afade").params([
            "t=out".to_string(),
            format!("ss={}", start_time),
            format!("d={}", duration),
        ])
    }

    /// Resample audio
    pub fn resample(sample_rate: i32) -> Self {
        Self::new("aresample").param(sample_rate.to_string())
    }

    /// Audio channels
    pub fn achannels(channels: i32) -> Self {
        Self::new("aformat").param(format!("channel_layouts={}", channels))
    }

    /// Audio SetPTS filter
    pub fn asetpts<S: Into<String>>(expression: S) -> Self {
        Self::new("asetpts").param(expression.into())
    }

    /// Audio mix filter
    pub fn amix(inputs: i32) -> Self {
        Self::new("amix").param(format!("inputs={}", inputs))
    }
}

/// Complex filter constructors
impl Filter {
    /// Split filter for duplicating streams
    pub fn split(outputs: i32) -> Self {
        let mut filter = Self::new("split");
        if outputs > 1 {
            filter = filter.param(outputs.to_string());
        }
        filter
    }

    /// Audio split filter
    pub fn asplit(outputs: i32) -> Self {
        let mut filter = Self::new("asplit");
        if outputs > 1 {
            filter = filter.param(outputs.to_string());
        }
        filter
    }

    /// Concat filter for video concatenation
    pub fn concat(n_segments: i32, v_streams: i32, a_streams: i32) -> Self {
        Self::new("concat").params([
            format!("n={}", n_segments),
            format!("v={}", v_streams),
            format!("a={}", a_streams),
        ])
    }

    /// Null filter (pass-through)
    pub fn null() -> Self {
        Self::new("null")
    }

    /// Audio null filter
    pub fn anull() -> Self {
        Self::new("anull")
    }
}

/// Filter chain builder
#[derive(Debug, Default)]
pub struct FilterChain {
    filters: Vec<Filter>,
}

impl FilterChain {
    /// Create a new filter chain
    pub fn new() -> Self {
        Self::default()
    }

    /// Add a filter to the chain
    pub fn add_filter(mut self, filter: Filter) -> Self {
        self.filters.push(filter);
        self
    }

    /// Add multiple filters
    pub fn add_filters<I>(mut self, filters: I) -> Self
    where
        I: IntoIterator<Item = Filter>,
    {
        self.filters.extend(filters);
        self
    }

    /// Build the filter complex string
    pub fn build(&self) -> String {
        if self.filters.is_empty() {
            return String::new();
        }

        let filter_strings: Vec<String> = self.filters.iter().map(|f| f.to_string()).collect();
        filter_strings.join(";")
    }
}

impl fmt::Display for FilterChain {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.build())
    }
}

/// Collection of filters
pub type Filters = Vec<Filter>;

/// Utility functions for common filter patterns
pub mod util {

    /// Fix pixel length to even number for compatibility
    pub fn fix_pixel_len(len: i32) -> String {
        if len <= 0 {
            "-2".to_string()
        } else if len % 2 == 0 {
            len.to_string()
        } else {
            (len + 1).to_string()
        }
    }

    /// Create logo position string for overlay
    pub fn logo_position(dx: i32, dy: i32, position: &str) -> String {
        match position {
            "top-left" => format!("{}:{}", dx, dy),
            "top-right" => format!("W-w-{}:{}", dx, dy),
            "bottom-left" => format!("{}:H-h-{}", dx, dy),
            "bottom-right" => format!("W-w-{}:H-h-{}", dx, dy),
            "center" => format!("(W-w)/2+{}:(H-h)/2+{}", dx, dy),
            _ => format!("{}:{}", dx, dy),
        }
    }

    /// Create time-based expression for filters
    pub fn time_expression(start_time: f64) -> String {
        format!("gte(t,{})", start_time)
    }

    /// Create frame-based expression for filters
    pub fn frame_expression(frames: &[i32]) -> String {
        if frames.is_empty() {
            return String::new();
        }

        let expressions: Vec<String> = frames
            .iter()
            .map(|&frame| format!("eq(n,{})", frame))
            .collect();
        expressions.join("+")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_filter_creation() {
        let filter = Filter::new("scale").param("1920").param("1080");

        assert_eq!(filter.name, "scale");
        assert_eq!(filter.params, vec!["1920", "1080"]);
    }

    #[test]
    fn test_scale_filter() {
        let filter = Filter::scale(1920, 1080);
        assert_eq!(filter.build(), "scale=1920:1080");

        let filter_auto = Filter::scale(-1, 720);
        assert_eq!(filter_auto.build(), "scale=-2:720");
    }

    #[test]
    fn test_overlay_filter() {
        let filter = Filter::overlay(10, 20);
        assert_eq!(filter.build(), "overlay=10:20");
    }

    #[test]
    fn test_delogo_filter() {
        let filter = Filter::delogo(100, 50, 200, 100);
        assert_eq!(filter.build(), "delogo=x=100:y=50:w=200:h=100");
    }

    #[test]
    fn test_filter_with_inputs_outputs() {
        let filter = Filter::new("overlay").inputs(["0:v", "1:v"]).output("out");

        assert_eq!(filter.build(), "[0:v][1:v]overlay[out]");
    }

    #[test]
    fn test_filter_chain() {
        let chain = FilterChain::new()
            .add_filter(Filter::scale(1920, 1080))
            .add_filter(Filter::overlay(10, 20));

        assert_eq!(chain.build(), "scale=1920:1080;overlay=10:20");
    }

    #[test]
    fn test_split_filter() {
        let filter = Filter::split(3);
        assert_eq!(filter.build(), "split=3");
    }

    #[test]
    fn test_util_functions() {
        assert_eq!(util::fix_pixel_len(-1), "-2");
        assert_eq!(util::fix_pixel_len(1920), "1920");
        assert_eq!(util::fix_pixel_len(1921), "1922");

        let pos = util::logo_position(10, 20, "top-right");
        assert_eq!(pos, "W-w-10:20");

        let frame_expr = util::frame_expression(&[0, 5, 10]);
        assert_eq!(frame_expr, "eq(n,0)+eq(n,5)+eq(n,10)");
    }
}
