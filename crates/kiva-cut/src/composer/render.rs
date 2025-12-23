use crate::composer::composer::Plan;
use anyhow::Result;
use midly::{
    num::{u15, u7},
    Format, Header, MetaMessage, MidiMessage, Smf, Timing, TrackEvent, TrackEventKind,
};
use std::fs::File;
use std::process::Command;

pub fn render_wav(
    plan: &Plan,
    soundfont_path: &str,
    wav_path: &str,
    _sample_rate: u32,
) -> Result<()> {
    let midi_path = format!("{}.mid", wav_path.trim_end_matches('.'));
    write_midi(plan, &midi_path)?;
    let status = Command::new("fluidsynth")
        .args(["-F", wav_path, soundfont_path, &midi_path])
        .status();
    match status {
        Ok(s) if s.success() => Ok(()),
        _ => Err(anyhow::anyhow!("请安装fluidsynth以渲染真实音色")),
    }
}

fn write_midi(plan: &Plan, path: &str) -> Result<()> {
    let header = Header {
        format: Format::SingleTrack,
        timing: Timing::Metrical(u15::from(plan.ppq as u16)),
    };
    let mut track = Vec::<TrackEvent>::new();
    track.push(TrackEvent {
        delta: 0.into(),
        kind: TrackEventKind::Meta(MetaMessage::TrackName(b"genaudio")),
    });
    track.push(TrackEvent {
        delta: 0.into(),
        kind: TrackEventKind::Meta(MetaMessage::Tempo(
            ((60_000_000u32 / plan.bpm) as u32).into(),
        )),
    });
    for (ch, t) in plan.tracks.iter().enumerate() {
        track.push(TrackEvent {
            delta: 0.into(),
            kind: TrackEventKind::Midi {
                channel: (ch as u8).into(),
                message: MidiMessage::ProgramChange {
                    program: u7::from(t.program),
                },
            },
        });
        for e in &t.events {
            track.push(TrackEvent {
                delta: e.start_ticks.into(),
                kind: TrackEventKind::Midi {
                    channel: (ch as u8).into(),
                    message: MidiMessage::NoteOn {
                        key: u7::from(e.midi_key),
                        vel: u7::from(e.velocity),
                    },
                },
            });
            track.push(TrackEvent {
                delta: e.duration_ticks.into(),
                kind: TrackEventKind::Midi {
                    channel: (ch as u8).into(),
                    message: MidiMessage::NoteOff {
                        key: u7::from(e.midi_key),
                        vel: u7::from(0),
                    },
                },
            });
        }
    }
    track.push(TrackEvent {
        delta: 0.into(),
        kind: TrackEventKind::Meta(MetaMessage::EndOfTrack),
    });
    let smf = Smf {
        header,
        tracks: vec![track],
    };
    let mut f = File::create(path)?;
    smf.write_std(&mut f)?;
    Ok(())
}
