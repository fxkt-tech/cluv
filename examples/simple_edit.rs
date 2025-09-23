//! Simple video editing example mimicking the Go fusion example
//!
//! This example closely follows the structure of the Go main.go example,
//! creating a composition with video and audio tracks and exporting as audio.

use cluv::{
    edit::{
        editor::{Editor, ExportOptions},
        material::Material,
        protocol::ExportType,
        segment::{Position, Scale, Segment, TimeRange},
        stage::Stage,
    },
    CluvOptions, Dimension, LogLevel, Result,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();

    println!("=== Simple Video Edit Example ===");
    println!("Mimicking the Go fusion example...");

    // Create editor with stage size (960x540) and debug options like Go example
    let options =
        CluvOptions::new().with_ffmpeg(|opts| opts.debug(true).log_level(LogLevel::Debug));

    let stage = Stage::new(960, 540);
    let mut editor = Editor::with_stage_and_options(stage, options);

    // Add materials (equivalent to the Go example paths)
    let video_material = Material::video(
        "video_material",
        "/Users/justyer/Desktop/qwer.mp4",
        1280,
        720,
    );

    let audio_material = Material::audio("audio_material", "/Users/justyer/Desktop/qwer.wav");

    editor.add_material(video_material);
    editor.add_material(audio_material);

    // Create video track and add segment
    editor.add_video_track("video_track");

    let video_segment = Segment::video(
        "video_segment",
        "video_material",
        TimeRange::new(0, 5000), // SetTimeRange(0, 5000)
        TimeRange::new(0, 5000), // SetSection(0, 5000)
    )
    .with_position(Position::new(100, 200)) // SetPosition(100, 200)
    .with_scale(Dimension::new(1280, 720)); // SetItemSize(1280, 720)

    editor.add_segment_to_track("video_track", video_segment)?;

    // Create audio track and add segment
    editor.add_audio_track("audio_track");

    let audio_segment = Segment::audio(
        "audio_segment",
        "audio_material",
        TimeRange::new(0, 5000), // SetTimeRange(0, 5000)
        TimeRange::new(0, 5000), // SetSection(0, 5000)
    );

    editor.add_segment_to_track("audio_track", audio_segment)?;

    // Validate the composition
    editor.validate()?;

    // Export as audio (equivalent to fusion.ExportAudio with "outout.wav")
    // let export_options =
    //     ExportOptions::new("outout.wav", ExportType::Audio).with_audio_codec("pcm_s16le"); // Similar to WAV export

    println!("Starting export...");
    let proto = editor.save_to_protocol().to_json()?;
    println!("{proto}");
    // match editor.export(export_options).await {
    //     Ok(()) => println!("Export completed successfully: outout.wav"),
    //     Err(e) => {
    //         println!("Export failed: {}", e);
    //         return Err(e);
    //     }
    // }

    println!("=== Simple Edit Example Completed ===");
    Ok(())
}
