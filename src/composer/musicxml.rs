use crate::composer::composer::{NoteEvent, Plan, Track};
use anyhow::Result;
use quick_xml::events::{BytesStart, BytesText, Event};
use quick_xml::Reader;
use quick_xml::Writer;
use std::fs::File;
use std::io::{BufReader, Write};

fn step_alter(midi: i32) -> (&'static str, i32) {
    match (midi % 12 + 12) % 12 {
        0 => ("C", 0),
        1 => ("C", 1),
        2 => ("D", 0),
        3 => ("D", 1),
        4 => ("E", 0),
        5 => ("F", 0),
        6 => ("F", 1),
        7 => ("G", 0),
        8 => ("G", 1),
        9 => ("A", 0),
        10 => ("A", 1),
        11 => ("B", 0),
        _ => ("C", 0),
    }
}

fn note_type(ppq: u32, dur: u32) -> Option<&'static str> {
    if dur == 4 * ppq {
        Some("whole")
    } else if dur == 2 * ppq {
        Some("half")
    } else if dur == ppq {
        Some("quarter")
    } else if dur * 2 == ppq {
        Some("eighth")
    } else if dur * 4 == ppq {
        Some("16th")
    } else if dur * 8 == ppq {
        Some("32nd")
    } else {
        None
    }
}

fn write_text_elem<W: std::io::Write>(w: &mut Writer<W>, name: &str, text: &str) -> Result<()> {
    let start = BytesStart::new(name);
    w.write_event(Event::Start(start))?;
    w.write_event(Event::Text(BytesText::new(text)))?;
    w.write_event(Event::End(BytesStart::new(name).to_end()))?;
    Ok(())
}

pub fn write_xml(plan: &Plan, path: &str) -> Result<()> {
    let file = File::create(path)?;
    let mut w = Writer::new_with_indent(file, b' ', 2);
    w.get_mut()
        .write_all(b"<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n")?;
    w.get_mut().write_all(b"<!DOCTYPE score-partwise PUBLIC \"-//Recordare//DTD MusicXML 3.1 Partwise//EN\" \"http://www.musicxml.org/dtds/partwise.dtd\">\n")?;

    let mut root = BytesStart::new("score-partwise");
    root.push_attribute(("version", "3.1"));
    w.write_event(Event::Start(root))?;

    w.write_event(Event::Start(BytesStart::new("part-list")))?;
    for (i, track) in plan.tracks.iter().enumerate() {
        let id = format!("P{}", i + 1);
        let mut sp = BytesStart::new("score-part");
        sp.push_attribute(("id", id.as_str()));
        w.write_event(Event::Start(sp))?;
        write_text_elem(&mut w, "part-name", &track.name)?;
        let inst_id = format!("{}-I1", id);
        let mut si = BytesStart::new("score-instrument");
        si.push_attribute(("id", inst_id.as_str()));
        w.write_event(Event::Start(si))?;
        write_text_elem(&mut w, "instrument-name", &track.name)?;
        w.write_event(Event::End(BytesStart::new("score-instrument").to_end()))?;

        let mut mi = BytesStart::new("midi-instrument");
        mi.push_attribute(("id", inst_id.as_str()));
        w.write_event(Event::Start(mi))?;
        let ch = (track.channel as u32 + 1).to_string();
        write_text_elem(&mut w, "midi-channel", &ch)?;
        let prog = track.program.to_string();
        write_text_elem(&mut w, "midi-program", &prog)?;
        w.write_event(Event::End(BytesStart::new("midi-instrument").to_end()))?;
        w.write_event(Event::End(BytesStart::new("score-part").to_end()))?;
    }
    w.write_event(Event::End(BytesStart::new("part-list").to_end()))?;

    let measure_ticks = plan.ppq * plan.time_signature.0;

    for (i, track) in plan.tracks.iter().enumerate() {
        let id = format!("P{}", i + 1);
        let inst_id = format!("{}-I1", id);
        let mut part = BytesStart::new("part");
        part.push_attribute(("id", id.as_str()));
        w.write_event(Event::Start(part))?;

        let mut measure_index = 1u32;
        let mut ticks_in_measure = 0u32;
        let mut measure = BytesStart::new("measure");
        let num = measure_index.to_string();
        measure.push_attribute(("number", num.as_str()));
        w.write_event(Event::Start(measure))?;

        w.write_event(Event::Start(BytesStart::new("attributes")))?;
        write_text_elem(&mut w, "divisions", &plan.ppq.to_string())?;
        w.write_event(Event::Start(BytesStart::new("time")))?;
        write_text_elem(&mut w, "beats", &plan.time_signature.0.to_string())?;
        write_text_elem(&mut w, "beat-type", &plan.time_signature.1.to_string())?;
        w.write_event(Event::End(BytesStart::new("time").to_end()))?;
        match i {
            0 => {
                w.write_event(Event::Start(BytesStart::new("clef")))?;
                write_text_elem(&mut w, "sign", "G")?;
                write_text_elem(&mut w, "line", "2")?;
                w.write_event(Event::End(BytesStart::new("clef").to_end()))?;
            }
            _ => {
                w.write_event(Event::Start(BytesStart::new("clef")))?;
                write_text_elem(&mut w, "sign", "F")?;
                write_text_elem(&mut w, "line", "4")?;
                w.write_event(Event::End(BytesStart::new("clef").to_end()))?;
            }
        }
        w.write_event(Event::End(BytesStart::new("attributes").to_end()))?;

        w.write_event(Event::Start(BytesStart::new("direction")))?;
        w.write_event(Event::Start(BytesStart::new("direction-type")))?;
        w.write_event(Event::Start(BytesStart::new("metronome")))?;
        write_text_elem(&mut w, "beat-unit", "quarter")?;
        write_text_elem(&mut w, "per-minute", &plan.bpm.to_string())?;
        w.write_event(Event::End(BytesStart::new("metronome").to_end()))?;
        w.write_event(Event::End(BytesStart::new("direction-type").to_end()))?;
        let mut sound = BytesStart::new("sound");
        let bpm_s = plan.bpm.to_string();
        sound.push_attribute(("tempo", bpm_s.as_str()));
        w.write_event(Event::Empty(sound))?;
        w.write_event(Event::End(BytesStart::new("direction").to_end()))?;

        for ev in &track.events {
            if ticks_in_measure >= measure_ticks {
                w.write_event(Event::End(BytesStart::new("measure").to_end()))?;
                measure_index += 1;
                ticks_in_measure = 0;
                let mut m = BytesStart::new("measure");
                let n = measure_index.to_string();
                m.push_attribute(("number", n.as_str()));
                w.write_event(Event::Start(m))?;
            }

            w.write_event(Event::Start(BytesStart::new("note")))?;
            let midi = ev.midi_key as i32;
            let (step, alter) = step_alter(midi);
            let octave = (midi / 12) - 1;
            w.write_event(Event::Start(BytesStart::new("pitch")))?;
            write_text_elem(&mut w, "step", step)?;
            if alter != 0 {
                write_text_elem(&mut w, "alter", &alter.to_string())?;
            }
            write_text_elem(&mut w, "octave", &octave.to_string())?;
            w.write_event(Event::End(BytesStart::new("pitch").to_end()))?;

            let mut inst = BytesStart::new("instrument");
            inst.push_attribute(("id", inst_id.as_str()));
            w.write_event(Event::Empty(inst))?;

            write_text_elem(&mut w, "duration", &ev.duration_ticks.to_string())?;
            write_text_elem(&mut w, "voice", "1")?;
            if let Some(t) = note_type(plan.ppq, ev.duration_ticks) {
                write_text_elem(&mut w, "type", t)?;
            }
            w.write_event(Event::End(BytesStart::new("note").to_end()))?;
            ticks_in_measure += ev.duration_ticks;
        }

        w.write_event(Event::End(BytesStart::new("measure").to_end()))?;
        w.write_event(Event::End(BytesStart::new("part").to_end()))?;
    }

    w.write_event(Event::End(BytesStart::new("score-partwise").to_end()))?;
    Ok(())
}

pub fn read_xml(path: &str) -> Result<Plan> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    let mut xml_reader = Reader::from_reader(reader);
    xml_reader.trim_text(true);

    let mut plan = Plan {
        style: "unknown".to_string(),
        ppq: 480,
        bpm: 120,
        time_signature: (4, 4),
        length_bars: 0,
        tracks: Vec::new(),
    };

    let mut current_track: Option<Track> = None;
    let mut current_measure_ticks = 0;
    let mut current_measure_number = 0;
    let mut in_note = false;
    let mut current_note: Option<NoteEvent> = None;
    let mut current_duration = 0;
    let mut current_step = String::new();
    let mut current_alter = 0;
    let mut current_octave = 0;

    let mut buf = Vec::new();
    loop {
        match xml_reader.read_event_into(&mut buf) {
            Ok(Event::Start(e)) => match e.name().as_ref() {
                b"part" => {
                    current_track = Some(Track {
                        name: "Track".to_string(),
                        channel: 0,
                        program: 0,
                        events: Vec::new(),
                    });
                }
                b"measure" => {
                    current_measure_ticks = 0;
                    current_measure_number += 1;
                }
                b"divisions" => {
                    if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                        plan.ppq = std::str::from_utf8(text.as_ref())
                            .unwrap_or("480")
                            .parse()
                            .unwrap_or(480);
                    }
                }
                b"beats" => {
                    if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                        plan.time_signature.0 = std::str::from_utf8(text.as_ref())
                            .unwrap_or("4")
                            .parse()
                            .unwrap_or(4);
                    }
                }
                b"beat-type" => {
                    if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                        plan.time_signature.1 = std::str::from_utf8(text.as_ref())
                            .unwrap_or("4")
                            .parse()
                            .unwrap_or(4);
                    }
                }
                b"per-minute" => {
                    if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                        plan.bpm = std::str::from_utf8(text.as_ref())
                            .unwrap_or("120")
                            .parse()
                            .unwrap_or(120);
                    }
                }
                b"sound" => {
                    if let Some(tempo_str) = e.attributes().find_map(|attr| {
                        attr.ok().and_then(|a| {
                            if a.key.as_ref() == b"tempo" {
                                std::str::from_utf8(a.value.as_ref())
                                    .ok()
                                    .map(|s| s.to_string())
                            } else {
                                None
                            }
                        })
                    }) {
                        plan.bpm = tempo_str.parse().unwrap_or(120);
                    }
                }
                b"note" => {
                    in_note = true;
                    current_note = Some(NoteEvent {
                        start_ticks: current_measure_ticks,
                        duration_ticks: 0,
                        midi_key: 0,
                        velocity: 80,
                    });
                }
                b"step" => {
                    if in_note {
                        if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                            current_step = std::str::from_utf8(text.as_ref())
                                .unwrap_or("C")
                                .to_string();
                        }
                    }
                }
                b"alter" => {
                    if in_note {
                        if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                            current_alter = std::str::from_utf8(text.as_ref())
                                .unwrap_or("0")
                                .parse()
                                .unwrap_or(0);
                        }
                    }
                }
                b"octave" => {
                    if in_note {
                        if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                            current_octave = std::str::from_utf8(text.as_ref())
                                .unwrap_or("4")
                                .parse()
                                .unwrap_or(4);
                        }
                    }
                }
                b"duration" => {
                    if in_note {
                        if let Ok(Event::Text(text)) = xml_reader.read_event_into(&mut buf) {
                            current_duration = std::str::from_utf8(text.as_ref())
                                .unwrap_or(&plan.ppq.to_string())
                                .parse()
                                .unwrap_or(plan.ppq);
                        }
                    }
                }
                _ => {}
            },
            Ok(Event::End(e)) => match e.name().as_ref() {
                b"part" => {
                    if let Some(track) = current_track.take() {
                        plan.tracks.push(track);
                    }
                }
                b"note" => {
                    if in_note {
                        if let Some(mut note) = current_note.take() {
                            note.duration_ticks = current_duration;
                            note.midi_key =
                                note_name_to_midi(&current_step, current_alter, current_octave);

                            if let Some(track) = &mut current_track {
                                track.events.push(note);
                            }

                            current_measure_ticks += current_duration;
                            current_duration = 0;
                            current_step.clear();
                            current_alter = 0;
                            current_octave = 0;
                        }
                        in_note = false;
                    }
                }
                _ => {}
            },
            Ok(Event::Eof) => break,
            Err(e) => return Err(e.into()),
            _ => {}
        }
        buf.clear();
    }

    plan.length_bars = current_measure_number;
    Ok(plan)
}

fn note_name_to_midi(step: &str, alter: i32, octave: i32) -> u8 {
    let base_note = match step {
        "C" => 0,
        "D" => 2,
        "E" => 4,
        "F" => 5,
        "G" => 7,
        "A" => 9,
        "B" => 11,
        _ => 0,
    };

    let midi_note = (octave + 1) * 12 + base_note + alter;
    midi_note.max(0).min(127) as u8
}
