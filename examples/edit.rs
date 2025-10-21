//! Simple video editing example mimicking the Go fusion example
//!
//! This example closely follows the structure of the Go main.go example,
//! creating a composition with video and audio tracks and exporting as audio.

use cluv::{
    ffcut::{
        editor::{Editor, ExportOptions},
        material::Material,
        segment::{Position, Segment, TimeRange},
        stage::Stage,
    },
    Dimension, ExportType, FFmpegOptions, LogLevel, Result, Track,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();

    // make a editor
    let mut editor = Editor::new()
        .set_ffmpeg_options(
            FFmpegOptions::new()
                .debug(true)
                .dry_run(true)
                .log_level(LogLevel::Debug),
        )
        .set_stage(Stage::new(960, 540));

    // Add materials (equivalent to the Go example paths)
    let video_material_id = editor.add_material(Material::video("examples/metadata/in.mp4"));

    // Create video track and add segment
    let video_track_id = editor.add_track(Track::video());

    let video_segment = Segment::video(
        &video_material_id,
        TimeRange::new(0, 5000),
        TimeRange::new(0, 5000),
    )
    .position(Position::new(100, 200))
    .scale(Dimension::new(1280, 720));

    editor.add_segment_to_track(&video_track_id, video_segment)?;

    // editor.fix();

    println!("Starting export...");

    // let proto = editor.save_to_protocol().to_json()?;
    // println!("{proto}");

    let export_options = ExportOptions::new("outout.mp4", ExportType::Video);
    match editor.export(export_options).await {
        Ok(()) => println!("Export completed successfully: outout.mp4"),
        Err(e) => {
            println!("Export failed: {}", e);
            return Err(e);
        }
    }

    println!("=== Simple Edit Example Completed ===");
    Ok(())
}
