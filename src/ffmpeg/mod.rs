//! FFmpeg command builder and executor module

pub mod codec;
pub mod filter;
pub mod input;
pub mod output;
pub mod stream;
pub mod util;

use crate::error::{CluvError, Result};
use crate::options::FFmpegOptions;
use std::process::Stdio;
use tokio::process::Command;

/// FFmpeg command builder and executor
#[derive(Debug)]
pub struct FFmpeg {
    options: FFmpegOptions,
    inputs: Vec<input::Input>,
    filters: Vec<filter::Filter>,
    outputs: Vec<output::Output>,
}

impl FFmpeg {
    /// Create a new FFmpeg instance with default options
    pub fn new() -> Self {
        Self {
            options: FFmpegOptions::new(),
            inputs: Vec::new(),
            filters: Vec::new(),
            outputs: Vec::new(),
        }
    }

    /// Create a new FFmpeg instance with custom options
    pub fn with_options(options: FFmpegOptions) -> Self {
        Self {
            options,
            inputs: Vec::new(),
            filters: Vec::new(),
            outputs: Vec::new(),
        }
    }

    /// Add an input to the FFmpeg command
    pub fn add_input(mut self, input: input::Input) -> Self {
        self.inputs.push(input);
        self
    }

    /// Add multiple inputs to the FFmpeg command
    pub fn add_inputs<I>(mut self, inputs: I) -> Self
    where
        I: IntoIterator<Item = input::Input>,
    {
        self.inputs.extend(inputs);
        self
    }

    /// Add a filter to the FFmpeg command
    pub fn add_filter(mut self, filter: filter::Filter) -> Self {
        self.filters.push(filter);
        self
    }

    /// Add multiple filters to the FFmpeg command
    pub fn add_filters<I>(mut self, filters: I) -> Self
    where
        I: IntoIterator<Item = filter::Filter>,
    {
        self.filters.extend(filters);
        self
    }

    /// Add an output to the FFmpeg command
    pub fn add_output(mut self, output: output::Output) -> Self {
        self.outputs.push(output);
        self
    }

    /// Add multiple outputs to the FFmpeg command
    pub fn add_outputs<I>(mut self, outputs: I) -> Self
    where
        I: IntoIterator<Item = output::Output>,
    {
        self.outputs.extend(outputs);
        self
    }

    /// Clear all outputs
    pub fn clear_outputs(mut self) -> Self {
        self.outputs.clear();
        self
    }

    /// Build the command line arguments
    pub fn build_args(&self) -> Vec<String> {
        let mut args = Vec::new();

        // Add log level
        args.push("-v".to_string());
        args.push(self.options.log_level.to_string());

        // Add overwrite flag
        if self.options.overwrite {
            args.push("-y".to_string());
        }

        // Add custom arguments
        args.extend(self.options.custom_args.clone());

        // Add inputs
        for input in &self.inputs {
            args.extend(input.to_args());
        }

        // Add filters
        if !self.filters.is_empty() {
            let filter_complex = self.build_filter_complex();
            if !filter_complex.is_empty() {
                args.push("-filter_complex".to_string());
                args.push(filter_complex);
            }
        }

        // Add outputs
        for output in &self.outputs {
            args.extend(output.to_args());
        }

        args
    }

    /// Build the filter_complex string
    fn build_filter_complex(&self) -> String {
        if self.filters.is_empty() {
            return String::new();
        }

        let filter_strings: Vec<String> = self.filters.iter().map(|f| f.to_string()).collect();
        filter_strings.join(";")
    }

    /// Print the command that would be executed (dry run)
    pub fn dry_run(&self) {
        let args = self.build_args();
        let mut command_parts = vec![self.options.binary_path.clone()];
        command_parts.extend(args);
        println!("{}", command_parts.join(" "));
    }

    /// Execute the FFmpeg command
    pub async fn run(&self) -> Result<()> {
        if self.options.dry_run {
            self.dry_run();
            return Ok(());
        }

        if self.options.debug {
            self.dry_run();
        }

        let args = self.build_args();
        let mut cmd = Command::new(&self.options.binary_path);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Set environment variables
        for (key, value) in &self.options.env_vars {
            cmd.env(key, value);
        }

        let output = cmd
            .output()
            .await
            .map_err(|e| CluvError::ffmpeg(format!("Failed to execute FFmpeg: {}", e)))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(CluvError::ffmpeg(format!(
                "FFmpeg command failed with exit code {:?}: {}",
                output.status.code(),
                stderr
            )));
        }

        Ok(())
    }

    /// Execute FFmpeg command and return combined output
    pub async fn run_with_output(&self) -> Result<String> {
        if self.options.dry_run {
            self.dry_run();
            return Ok(String::new());
        }

        if self.options.debug {
            self.dry_run();
        }

        let args = self.build_args();
        let mut cmd = Command::new(&self.options.binary_path);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Set environment variables
        for (key, value) in &self.options.env_vars {
            cmd.env(key, value);
        }

        let output = cmd
            .output()
            .await
            .map_err(|e| CluvError::ffmpeg(format!("Failed to execute FFmpeg: {}", e)))?;

        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        let combined = format!("{}\n{}", stdout, stderr);

        if !output.status.success() {
            return Err(CluvError::ffmpeg(format!(
                "FFmpeg command failed with exit code {:?}: {}",
                output.status.code(),
                combined
            )));
        }

        Ok(combined)
    }
}

impl Default for FFmpeg {
    fn default() -> Self {
        Self::new()
    }
}

/// Builder pattern for creating FFmpeg instances
pub struct FFmpegBuilder {
    ffmpeg: FFmpeg,
}

impl FFmpegBuilder {
    /// Start building a new FFmpeg command
    pub fn new() -> Self {
        Self {
            ffmpeg: FFmpeg::new(),
        }
    }

    /// Start building with custom options
    pub fn with_options(options: FFmpegOptions) -> Self {
        Self {
            ffmpeg: FFmpeg::with_options(options),
        }
    }

    /// Add an input
    pub fn input(mut self, input: input::Input) -> Self {
        self.ffmpeg = self.ffmpeg.add_input(input);
        self
    }

    /// Add a filter
    pub fn filter(mut self, filter: filter::Filter) -> Self {
        self.ffmpeg = self.ffmpeg.add_filter(filter);
        self
    }

    /// Add an output
    pub fn output(mut self, output: output::Output) -> Self {
        self.ffmpeg = self.ffmpeg.add_output(output);
        self
    }

    /// Build the final FFmpeg instance
    pub fn build(self) -> FFmpeg {
        self.ffmpeg
    }
}

impl Default for FFmpegBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::options::LogLevel;

    #[test]
    fn test_ffmpeg_builder() {
        let ffmpeg = FFmpegBuilder::new()
            .input(input::Input::new("input.mp4"))
            .output(output::Output::new("output.mp4"))
            .build();

        let args = ffmpeg.build_args();
        assert!(args.contains(&"-v".to_string()));
        assert!(args.contains(&"error".to_string()));
        assert!(args.contains(&"-y".to_string()));
        assert!(args.contains(&"-i".to_string()));
        assert!(args.contains(&"input.mp4".to_string()));
        assert!(args.contains(&"output.mp4".to_string()));
    }

    #[test]
    fn test_custom_options() {
        let options = FFmpegOptions::new()
            .log_level(LogLevel::Debug)
            .overwrite(false);

        let ffmpeg = FFmpeg::with_options(options);
        let args = ffmpeg.build_args();

        assert!(args.contains(&"debug".to_string()));
        assert!(!args.contains(&"-y".to_string()));
    }
}
