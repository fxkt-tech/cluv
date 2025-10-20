//! Simple video editing example mimicking the Go fusion example
//!
//! This example closely follows the structure of the Go main.go example,
//! creating a composition with video and audio tracks and exporting as audio.

use cluv::{
    ffcut::{
        editor::Editor,
        material::Material,
        segment::{Position, Segment, TimeRange},
        stage::Stage,
    },
    Dimension, FFmpegOptions, LogLevel, Result, Track,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();

    // make a editor
    let mut editor = Editor::new()
        .set_ffmpeg_options(FFmpegOptions::new().debug(true).log_level(LogLevel::Debug))
        .set_stage(Stage::new(960, 540));

    // Add materials (equivalent to the Go example paths)
    let video_material = Material::video("/Users/justyer/Desktop/qwer.mp4");

    editor.add_material(video_material.clone());

    // Create video track and add segment
    let video_track = Track::video();
    editor.add_track(video_track);

    let video_segment = Segment::video(
        video_material.id(),
        TimeRange::new(0, 5000),
        TimeRange::new(0, 5000),
    )
    .position(Position::new(100, 200))
    .scale(Dimension::new(1280, 720));

    // editor.add_segment_to_track(&video_track.id(), video_segment)?;

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
