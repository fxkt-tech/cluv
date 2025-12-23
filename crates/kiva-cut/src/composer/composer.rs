use crate::composer::cli::StyleArg;
use crate::composer::style::style_spec;
use rand::{rngs::StdRng, Rng, SeedableRng};
use serde::Serialize;

#[derive(Clone, Serialize)]
pub struct NoteEvent {
    pub start_ticks: u32,
    pub duration_ticks: u32,
    pub midi_key: u8,
    pub velocity: u8,
}

#[derive(Clone, Serialize)]
pub struct Track {
    pub name: String,
    pub channel: u8,
    pub program: u8,
    pub events: Vec<NoteEvent>,
}

#[derive(Clone, Serialize)]
pub struct Plan {
    pub style: String,
    pub ppq: u32,
    pub bpm: u32,
    pub time_signature: (u32, u32),
    pub length_bars: u32,
    pub tracks: Vec<Track>,
}

#[derive(Clone)]
pub struct ComposerConfig {
    pub style_name: String,
    pub ppq: u32,
    pub bpm: u32,
    pub time_signature: (u32, u32),
    pub length_bars: u32,
    pub root_midi: i32,
    pub lead_program: u8,
    pub harmony_program: u8,
    pub scale: Vec<i32>,
    pub progression: Vec<(i32, i32)>,
    pub melody_density: f32,
    pub velocity_min: u8,
    pub velocity_max: u8,
    pub seed: u64,
}

pub fn compose(style: &StyleArg, bpm: u32, length_bars: u32) -> Plan {
    let spec = style_spec(style);
    let cfg = ComposerConfig {
        style_name: spec.name,
        ppq: 480,
        bpm,
        time_signature: spec.time_signature,
        length_bars,
        root_midi: 60,
        lead_program: spec.instrument_program,
        harmony_program: spec.harmony_program,
        scale: spec.scale,
        progression: spec.progression,
        melody_density: 1.0,
        velocity_min: 70,
        velocity_max: 110,
        seed: 42,
    };
    compose_with_config(cfg)
}

pub fn compose_with_config(cfg: ComposerConfig) -> Plan {
    let mut rng = StdRng::seed_from_u64(cfg.seed);
    let mut melody = Vec::new();
    let mut time = 0u32;
    let beats_per_bar = cfg.time_signature.0;
    let total_beats = beats_per_bar * cfg.length_bars;
    let dur_per_note = (cfg.ppq as f32 / cfg.melody_density).max(1.0) as u32;
    for _ in 0..(total_beats as f32 * cfg.melody_density) as u32 {
        let degree = rng.random_range(0..cfg.scale.len());
        let octave = rng.random_range(0..2);
        let pitch = cfg.root_midi + cfg.scale[degree] + 12 * octave as i32;
        let vel = rng.random_range(cfg.velocity_min..=cfg.velocity_max);
        melody.push(NoteEvent {
            start_ticks: time,
            duration_ticks: dur_per_note,
            midi_key: pitch as u8,
            velocity: vel,
        });
        time += dur_per_note;
    }
    let track_lead = Track {
        name: "Lead".into(),
        channel: 0,
        program: cfg.lead_program,
        events: melody,
    };
    let mut harmony = Vec::new();
    let mut bar_tick = 0u32;
    for (interval, len_beats) in cfg
        .progression
        .iter()
        .cycle()
        .take(cfg.length_bars as usize)
    {
        let chord_root = cfg.root_midi + *interval as i32;
        let dur_ticks = cfg.ppq * *len_beats as u32;
        let vel = ((cfg.velocity_min as u16 + cfg.velocity_max as u16) / 2) as u8;
        harmony.push(NoteEvent {
            start_ticks: bar_tick,
            duration_ticks: dur_ticks,
            midi_key: chord_root as u8,
            velocity: vel,
        });
        bar_tick += cfg.ppq * beats_per_bar;
    }
    let track_harmony = Track {
        name: "Harmony".into(),
        channel: 1,
        program: cfg.harmony_program,
        events: harmony,
    };
    Plan {
        style: cfg.style_name,
        ppq: cfg.ppq,
        bpm: cfg.bpm,
        time_signature: cfg.time_signature,
        length_bars: cfg.length_bars,
        tracks: vec![track_lead, track_harmony],
    }
}

pub fn parse_prompt_to_config(prompt: &str, fallback: &ComposerConfig) -> ComposerConfig {
    let p = prompt.to_lowercase();
    let mut cfg = fallback.clone();
    if p.contains("jazz") || p.contains("爵士") {
        cfg.style_name = "jazz".into();
        cfg.lead_program = 2;
        cfg.scale = vec![0, 2, 3, 5, 7, 9, 10];
    }
    if p.contains("rock") || p.contains("摇滚") {
        cfg.style_name = "rock".into();
        cfg.lead_program = 30;
        cfg.scale = vec![0, 2, 3, 5, 7, 8, 10];
    }
    if p.contains("ambient") || p.contains("氛围") {
        cfg.style_name = "ambient".into();
        cfg.lead_program = 88;
        cfg.velocity_min = 60;
        cfg.velocity_max = 90;
        cfg.melody_density = 0.5;
    }
    if let Some(bpm) = find_number_after(&p, "bpm") {
        cfg.bpm = bpm as u32;
    }
    if let Some((b, t)) = find_time_signature(&p) {
        cfg.time_signature = (b, t);
    }
    if let Some((minv, maxv)) = find_velocity_range(&p) {
        cfg.velocity_min = minv;
        cfg.velocity_max = maxv;
    }
    if let Some(root) = find_key_root(&p) {
        cfg.root_midi = root;
    }
    if let Some(d) = find_density(&p) {
        cfg.melody_density = d;
    }
    cfg
}

fn find_number_after(s: &str, tag: &str) -> Option<i32> {
    let idx = s.find(tag)?;
    let tail = &s[idx + tag.len()..];
    for tok in tail.split_whitespace() {
        if let Ok(n) = tok.parse::<i32>() {
            return Some(n);
        }
    }
    None
}

fn find_time_signature(s: &str) -> Option<(u32, u32)> {
    for tok in s.split_whitespace() {
        if let Some(pos) = tok.find('/') {
            let (a, b) = tok.split_at(pos);
            let b = &b[1..];
            if let (Ok(x), Ok(y)) = (a.parse::<u32>(), b.parse::<u32>()) {
                return Some((x, y));
            }
        }
    }
    None
}

fn find_velocity_range(s: &str) -> Option<(u8, u8)> {
    if let Some(_i) = s.find("vel") {
        if let Some(n) = find_number_after(s, "vel") {
            return Some((n.max(0) as u8, (n + 20).min(127) as u8));
        }
    }
    None
}

fn find_density(s: &str) -> Option<f32> {
    if let Some(_i) = s.find("密度") {
        if let Some(n) = find_number_after(s, "密度") {
            return Some((n as f32).max(0.25));
        }
    }
    if let Some(_i) = s.find("density") {
        if let Some(n) = find_number_after(s, "density") {
            return Some((n as f32).max(0.25));
        }
    }
    None
}

fn find_key_root(s: &str) -> Option<i32> {
    let keys = [
        ("c", 0),
        ("c#", 1),
        ("db", 1),
        ("d", 2),
        ("d#", 3),
        ("eb", 3),
        ("e", 4),
        ("f", 5),
        ("f#", 6),
        ("gb", 6),
        ("g", 7),
        ("g#", 8),
        ("ab", 8),
        ("a", 9),
        ("a#", 10),
        ("bb", 10),
        ("b", 11),
    ];
    for (k, offset) in keys {
        if s.contains(k) {
            return Some(60 + offset);
        }
    }
    None
}
