use clap::{Parser, ValueEnum};

#[derive(Copy, Clone, Eq, PartialEq, Ord, PartialOrd, ValueEnum)]
pub enum StyleArg {
    Classical,
    Jazz,
    Pop,
    Rock,
    Ambient,
}

#[derive(Parser)]
#[command(
    name = "genaudio",
    version,
    about = "Rust编曲生成器，输出MusicXML并可渲染真实音色"
)]
pub struct Args {
    #[arg(long, value_enum, default_value_t = StyleArg::Pop)]
    pub style: StyleArg,

    #[arg(long, default_value_t = 100)]
    pub bpm: u32,

    #[arg(long, default_value_t = 16)]
    pub length_bars: u32,

    #[arg(long)]
    pub out_xml: Option<String>,

    #[arg(long)]
    pub render_wav: Option<String>,

    #[arg(long)]
    pub soundfont: Option<String>,

    #[arg(long, default_value_t = 44100)]
    pub sample_rate: u32,

    #[arg(long)]
    pub input_xml: Option<String>,

    #[arg(long)]
    pub prompt: Option<String>,

    #[arg(long, default_value_t = 480)]
    pub ppq: u32,

    #[arg(long, default_value_t = String::from("4/4"))]
    pub time_signature: String,

    #[arg(long, default_value_t = 60)]
    pub root: i32,

    #[arg(long)]
    pub lead_program: Option<u8>,

    #[arg(long)]
    pub harmony_program: Option<u8>,

    #[arg(long, default_value_t = 1.0)]
    pub melody_density: f32,

    #[arg(long)]
    pub velocity_min: Option<u8>,

    #[arg(long)]
    pub velocity_max: Option<u8>,

    #[arg(long, default_value_t = 42)]
    pub seed: u64,
}

impl Args {
    pub fn parse() -> Self {
        <Self as Parser>::parse()
    }
}
