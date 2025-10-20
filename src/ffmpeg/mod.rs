//! FFmpeg command builder and executor module

pub mod codec;
pub mod filter;
pub mod input;
pub mod output;
pub mod stream;
pub mod util;

use crate::error::{CluvError, Result};
use crate::ffmpeg::stream::StreamInput;
use crate::ffmpeg::{filter::Filter, input::Input, output::Output};
use crate::options::FFmpegOptions;
use std::process::Stdio;
use std::sync::atomic::AtomicU32;
use tokio::process::Command;

/// FFmpeg command builder and executor
#[derive(Debug)]
pub struct FFmpeg {
    ffmpeg_options: FFmpegOptions,
    inputs: Vec<Input>,
    filters: Vec<Filter>,
    outputs: Vec<Output>,
    // input counter
    input_counter: AtomicU32,
}

impl FFmpeg {
    /// Create a new FFmpeg instance with default options
    pub fn new() -> Self {
        Self {
            ffmpeg_options: FFmpegOptions::new(),
            inputs: Vec::new(),
            filters: Vec::new(),
            outputs: Vec::new(),
            input_counter: AtomicU32::new(0),
        }
    }

    /// Set custom options for the FFmpeg command
    pub fn set_ffmpeg_options(&mut self, options: FFmpegOptions) -> &mut Self {
        self.ffmpeg_options = options;
        self
    }

    /// Add an input to the FFmpeg command
    pub fn add_input(&mut self, mut input: Input) -> Input {
        let idx = self
            .input_counter
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        input.set_idx(idx);
        let input_copy = input.clone();
        self.inputs.push(input);
        input_copy
    }

    /// Add an input to the FFmpeg command (mutable reference version)
    pub fn add_input_mut(&mut self, input: Input) {
        self.inputs.push(input);
    }

    /// Add multiple inputs to the FFmpeg command
    // #[deprecated(since = "0.1.0", note = "ff会自动添加，不需要手动添加了")]
    pub fn add_inputs<I>(&mut self, inputs: I) -> &mut Self
    where
        I: IntoIterator<Item = Input>,
    {
        self.inputs.extend(inputs);
        self
    }

    /// Add a filter to the FFmpeg command
    pub fn add_filter<I>(&mut self, mut filter: Filter, inputs: I) -> Filter
    where
        I: IntoIterator<Item = StreamInput>,
    {
        // Set the filter inputs (similar to the r function in Filter)
        filter.inputs = inputs.into_iter().collect();
        let filter_copy = filter.clone();
        self.filters.push(filter);
        filter_copy
    }

    /// Add multiple filters to the FFmpeg command
    pub fn add_filters<I>(&mut self, filters: I) -> &mut Self
    where
        I: IntoIterator<Item = Filter>,
    {
        self.filters.extend(filters);
        self
    }

    pub fn add_filter_mut(mut self, filter: Filter) -> Self {
        self.filters.push(filter);
        self
    }

    /// Add an output to the FFmpeg command
    pub fn add_output(&mut self, output: Output) {
        self.outputs.push(output);
    }

    /// Add multiple outputs to the FFmpeg command
    pub fn add_outputs<I>(mut self, outputs: I) -> Self
    where
        I: IntoIterator<Item = Output>,
    {
        self.outputs.extend(outputs);
        self
    }

    pub fn add_output_mut(&mut self, output: Output) -> &mut Self {
        self.outputs.push(output);
        self
    }

    /// Build the command line arguments
    pub fn build_args(&self) -> Vec<String> {
        let mut args = Vec::new();

        // Add log level
        args.push("-v".to_string());
        args.push(self.ffmpeg_options.log_level.to_string());

        // Add overwrite flag
        if self.ffmpeg_options.overwrite {
            args.push("-y".to_string());
        }

        // Add custom arguments
        args.extend(self.ffmpeg_options.custom_args.clone());

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
    fn dry_run(&mut self) {
        let args = self.build_args();
        let mut command_parts = vec![self.ffmpeg_options.binary_path.clone()];
        command_parts.extend(args);
        println!("{}", command_parts.join(" "));
    }

    /// Execute the FFmpeg command
    pub async fn run(&mut self) -> Result<()> {
        if self.ffmpeg_options.dry_run {
            self.dry_run();
            return Ok(());
        }

        if self.ffmpeg_options.debug {
            self.dry_run();
        }

        let args = self.build_args();
        let mut cmd = Command::new(&self.ffmpeg_options.binary_path);
        cmd.args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        // Set environment variables
        for (key, value) in &self.ffmpeg_options.env_vars {
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
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::options::LogLevel;

    #[test]
    fn test_custom_options() {
        let args = FFmpeg::new()
            .set_ffmpeg_options(
                FFmpegOptions::new()
                    .log_level(LogLevel::Debug)
                    .overwrite(true),
            )
            .build_args();

        assert!(args.contains(&"debug".to_string()));
        assert!(!args.contains(&"-y".to_string()));
    }
}
