use std::process::Command;

use self::{
    filter::{Filter, Filters},
    input::{Input, Inputs},
    output::{Output, Outputs},
};
use anyhow::{Ok, Result};

pub mod filter;
pub mod input;
pub mod naming;
pub mod output;
pub mod stream;

pub struct FFmpeg {
    // debug: bool,
    bin: String,
    y: bool,
    v: String,

    inputs: Inputs,
    filters: Filters,
    outputs: Outputs,
}

impl FFmpeg {
    pub fn new() -> Self {
        FFmpeg {
            // debug: true,
            bin: String::from("ffmpeg"),
            y: true,
            v: String::from("error"),
            inputs: Inputs::new(),
            filters: Filters::new(),
            outputs: Outputs::new(),
        }
    }

    pub fn add_input(&mut self, input: Input) -> &mut Self {
        self.inputs.add(input);
        self
    }

    pub fn add_filter<F: Filter + 'static>(&mut self, filter: F) -> &mut Self {
        self.filters.add(filter);
        self
    }

    pub fn add_output(&mut self, output: Output) -> &mut Self {
        self.outputs.add(output);
        self
    }

    fn params(&mut self) -> Vec<String> {
        let mut args = Vec::new();
        if self.y {
            args.push(String::from("-y"))
        }
        if self.v != "" {
            args.append(&mut vec![String::from("-v"), self.v.clone()]);
        }
        args
    }

    pub fn run(&mut self) -> Result<()> {
        let ff_args = self.params();
        let input_args = self.inputs.params();
        let filter_args = self.filters.params();
        let output_args = self.outputs.params();
        let mut cmd = Command::new(&self.bin);
        let output = cmd
            .args(ff_args)
            .args(input_args)
            .args(filter_args)
            .args(output_args)
            .output()
            .expect("Failed to execute ffmpeg command");

        println!("{:?}", cmd.get_args());

        if !output.status.success() || !output.stderr.is_empty() {
            println!("{:?}", String::from_utf8_lossy(&output.stderr).to_string());
        }
        Ok(())
    }
}
