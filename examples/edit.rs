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
    Dimension, ExportType, FFmpegOptions, FFprobeOptions, LogLevel, Result, Track,
};

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    let mut editor = Editor::new()
        .set_stage(Stage::new(960, 540))
        .set_ffmpeg_options(
            FFmpegOptions::new()
                .debug(true)
                .dry_run(true)
                .log_level(LogLevel::Debug),
        )
        .set_ffprobe_options(FFprobeOptions::new().debug(true));

    let video_material_id = editor.add_material(Material::video("examples/metadata/in.mp4"));
    let video_material2_id = editor.add_material(Material::video("examples/metadata/in2.mp4"));

    let video_track_id = editor.add_track(Track::video());

    editor.add_segment_to_track(
        &video_track_id,
        Segment::video(
            &video_material_id,
            TimeRange::new(0, 5000),
            TimeRange::new(0, 5000),
        )
        .position(Position::new(100, 200))
        .scale(Dimension::new(1280, 720)),
    )?;

    editor.add_segment_to_track(
        &video_track_id,
        Segment::video(
            &video_material2_id,
            TimeRange::new(5000, 5000),
            TimeRange::new(0, 5000),
        )
        .position(Position::new(100, 200))
        .scale(Dimension::new(1280, 720)),
    )?;

    editor.fix().await?;

    println!("Starting export...");

    let proto = editor.save_to_protocol().to_json()?;
    println!("{proto}");

    match editor
        .export(ExportOptions::new("outout.mp4", ExportType::Video))
        .await
    {
        Ok(()) => println!("Export completed successfully: outout.mp4"),
        Err(e) => {
            println!("Export failed: {}", e);
            return Err(e);
        }
    }

    println!("=== Simple Edit Example Completed ===");
    Ok(())
}
