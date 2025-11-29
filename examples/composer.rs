use cluv::composer::{cli, composer, musicxml, render, style};

use anyhow::Result;

fn main() -> Result<()> {
    let args = cli::Args::parse();

    let plan = if let Some(xml_path) = args.input_xml.as_ref() {
        // Read from existing MusicXML file
        musicxml::read_xml(xml_path)?
    } else {
        // Generate new music from configuration
        let base_spec = style::style_spec(&args.style);
        let mut cfg = composer::ComposerConfig {
            style_name: base_spec.name,
            ppq: args.ppq,
            bpm: args.bpm,
            time_signature: parse_time_signature(&args.time_signature),
            length_bars: args.length_bars,
            root_midi: args.root,
            lead_program: args.lead_program.unwrap_or(base_spec.instrument_program),
            harmony_program: args.harmony_program.unwrap_or(base_spec.harmony_program),
            scale: base_spec.scale,
            progression: base_spec.progression,
            melody_density: args.melody_density,
            velocity_min: args.velocity_min.unwrap_or(70),
            velocity_max: args.velocity_max.unwrap_or(110),
            seed: args.seed,
        };
        if let Some(p) = args.prompt.as_ref() {
            cfg = composer::parse_prompt_to_config(p, &cfg);
        }
        composer::compose_with_config(cfg)
    };

    if let Some(xml_path) = args.out_xml.as_ref() {
        musicxml::write_xml(&plan, xml_path)?;
    }
    if let Some(wav_path) = args.render_wav.as_ref() {
        if let Some(sf) = args.soundfont.as_ref() {
            render::render_wav(&plan, sf, wav_path, args.sample_rate)?;
        }
    }
    Ok(())
}

fn parse_time_signature(s: &str) -> (u32, u32) {
    let parts: Vec<_> = s.split('/').collect();
    if parts.len() == 2 {
        if let (Ok(a), Ok(b)) = (parts[0].parse(), parts[1].parse()) {
            return (a, b);
        }
    }
    (4, 4)
}
