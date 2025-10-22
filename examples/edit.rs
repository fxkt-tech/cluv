//! Simple video editing example mimicking the Go fusion example
//!
//! This example closely follows the structure of the Go main.go example,
//! creating a composition with video and audio tracks and exporting as audio.

use cluv::{
    ffcut::{
        editor::{Editor, ExportOptions},
        segment::Segment,
        stage::Stage,
    },
    ExportType, FFmpegOptions, FFprobeOptions, Result,
};

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::init();

    // 初始化编辑器
    let mut editor = Editor::new()
        .set_stage(Stage::new(960, 540))
        .set_ffmpeg_options(FFmpegOptions::new().debug(true).dry_run(false))
        .set_ffprobe_options(FFprobeOptions::new().debug(true));

    // 添加素材
    let video_material_id = editor.add_video_material("examples/metadata/in.mp4");
    let video_material2_id = editor.add_video_material("examples/metadata/in2.mp4");

    // 添加轨道
    let video_track_id = editor.add_video_track();

    // 添加素材到轨道
    editor.add_segment_to_track(
        &video_track_id,
        Segment::video(&video_material_id, (0, 5000).into(), (0, 5000).into())
            .position((100, 200).into())
            .scale((1280, 720).into()),
    )?;
    editor.add_segment_to_track(
        &video_track_id,
        Segment::video(&video_material2_id, (5000, 5000).into(), (0, 5000).into())
            .position((100, 200).into())
            .scale((1280, 720).into()),
    )?;

    // 修复素材参数
    editor.fix_materials().await?;

    println!("Starting export...");

    let proto = editor.save_to_json()?;
    println!("{proto}");

    match editor
        .export(ExportOptions::new(
            "examples/metadata/edit/outout.mp4",
            ExportType::Video,
        ))
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
