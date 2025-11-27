use crate::composer::composer::Plan;
use anyhow::Result;
use std::fs::File;
use std::io::Write;

pub fn write_xml(plan: &Plan, path: &str) -> Result<()> {
    let mut f = File::create(path)?;
    let mut s = String::new();
    s.push_str("<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n");
    s.push_str("<!DOCTYPE score-partwise PUBLIC \"-//Recordare//DTD MusicXML 3.1 Partwise//EN\" \"http://www.musicxml.org/dtds/partwise.dtd\">\n");
    s.push_str("<score-partwise version=\"3.1\">\n");
    s.push_str("  <part-list>\n");
    s.push_str("    <score-part id=\"P1\">\n");
    s.push_str("      <part-name>Lead</part-name>\n");
    s.push_str("    </score-part>\n");
    s.push_str("  </part-list>\n");
    s.push_str("  <part id=\"P1\">\n");
    let divisions = 480;
    let beats_per_bar = plan.time_signature.0;
    let mut measure_index = 1u32;
    let mut ticks_in_measure = 0u32;
    s.push_str(&format!("    <measure number=\"{}\">\n", measure_index));
    s.push_str("      <attributes>\n");
    s.push_str(&format!("        <divisions>{}</divisions>\n", divisions));
    s.push_str(&format!(
        "        <time><beats>{}</beats><beat-type>{}</beat-type></time>\n",
        plan.time_signature.0, plan.time_signature.1
    ));
    s.push_str("        <clef><sign>G</sign><line>2</line></clef>\n");
    s.push_str("      </attributes>\n");
    s.push_str("      <direction>\n");
    s.push_str("        <direction-type>\n");
    s.push_str("          <metronome>\n");
    s.push_str("            <beat-unit>quarter</beat-unit>\n");
    s.push_str(&format!(
        "            <per-minute>{}</per-minute>\n",
        plan.bpm
    ));
    s.push_str("          </metronome>\n");
    s.push_str("        </direction-type>\n");
    s.push_str(&format!("        <sound tempo=\"{}\"/>\n", plan.bpm));
    s.push_str("      </direction>\n");
    for ev in &plan.tracks[0].events {
        if ticks_in_measure >= beats_per_bar * divisions {
            s.push_str("    </measure>\n");
            measure_index += 1;
            ticks_in_measure = 0;
            s.push_str(&format!("    <measure number=\"{}\">\n", measure_index));
        }
        s.push_str("      <note>\n");
        let midi = ev.midi_key as i32;
        let step = match (midi % 12 + 12) % 12 {
            0 => "C",
            1 => "C",
            2 => "D",
            3 => "D",
            4 => "E",
            5 => "F",
            6 => "F",
            7 => "G",
            8 => "G",
            9 => "A",
            10 => "A",
            11 => "B",
            _ => "C",
        };
        let alter = match (midi % 12 + 12) % 12 {
            1 | 3 | 6 | 8 | 10 => 1,
            _ => 0,
        };
        let octave = (midi / 12) - 1;
        s.push_str("        <pitch>\n");
        s.push_str(&format!("          <step>{}</step>\n", step));
        if alter != 0 {
            s.push_str(&format!("          <alter>{}</alter>\n", alter));
        }
        s.push_str(&format!("          <octave>{}</octave>\n", octave));
        s.push_str("        </pitch>\n");
        s.push_str(&format!(
            "        <duration>{}</duration>\n",
            ev.duration_ticks
        ));
        s.push_str("        <voice>1</voice>\n");
        s.push_str("        <type>quarter</type>\n");
        s.push_str("      </note>\n");
        ticks_in_measure += ev.duration_ticks;
    }
    s.push_str("    </measure>\n");
    s.push_str("  </part>\n");
    s.push_str("  <part id=\"P2\">\n");
    measure_index = 1;
    ticks_in_measure = 0;
    s.push_str(&format!("    <measure number=\"{}\">\n", measure_index));
    s.push_str("      <attributes>\n");
    s.push_str(&format!("        <divisions>{}</divisions>\n", divisions));
    s.push_str(&format!(
        "        <time><beats>{}</beats><beat-type>{}</beat-type></time>\n",
        plan.time_signature.0, plan.time_signature.1
    ));
    s.push_str("        <clef><sign>F</sign><line>4</line></clef>\n");
    s.push_str("      </attributes>\n");
    s.push_str("      <direction>\n");
    s.push_str("        <direction-type>\n");
    s.push_str("          <metronome>\n");
    s.push_str("            <beat-unit>quarter</beat-unit>\n");
    s.push_str(&format!(
        "            <per-minute>{}</per-minute>\n",
        plan.bpm
    ));
    s.push_str("          </metronome>\n");
    s.push_str("        </direction-type>\n");
    s.push_str(&format!("        <sound tempo=\"{}\"/>\n", plan.bpm));
    s.push_str("      </direction>\n");
    for ev in &plan.tracks[1].events {
        if ticks_in_measure >= beats_per_bar * divisions {
            s.push_str("    </measure>\n");
            measure_index += 1;
            ticks_in_measure = 0;
            s.push_str(&format!("    <measure number=\"{}\">\n", measure_index));
        }
        s.push_str("      <note>\n");
        let midi = ev.midi_key as i32;
        let step = match (midi % 12 + 12) % 12 {
            0 => "C",
            1 => "C",
            2 => "D",
            3 => "D",
            4 => "E",
            5 => "F",
            6 => "F",
            7 => "G",
            8 => "G",
            9 => "A",
            10 => "A",
            11 => "B",
            _ => "C",
        };
        let alter = match (midi % 12 + 12) % 12 {
            1 | 3 | 6 | 8 | 10 => 1,
            _ => 0,
        };
        let octave = (midi / 12) - 1;
        s.push_str("        <pitch>\n");
        s.push_str(&format!("          <step>{}</step>\n", step));
        if alter != 0 {
            s.push_str(&format!("          <alter>{}</alter>\n", alter));
        }
        s.push_str(&format!("          <octave>{}</octave>\n", octave));
        s.push_str("        </pitch>\n");
        s.push_str(&format!(
            "        <duration>{}</duration>\n",
            ev.duration_ticks
        ));
        s.push_str("        <voice>1</voice>\n");
        s.push_str("        <type>whole</type>\n");
        s.push_str("      </note>\n");
        ticks_in_measure += ev.duration_ticks;
    }
    s.push_str("    </measure>\n");
    s.push_str("  </part>\n");
    s.push_str("</score-partwise>\n");
    f.write_all(s.as_bytes())?;
    Ok(())
}
