//! Video editing example using Cluv's edit module
//!
//! This example demonstrates how to use the Cluv video editing capabilities
//! to create a composition similar to the Go fusion example.

use cluv::{
    edit::{
        editor::{Editor, ExportOptions},
        material::Material,
        protocol::ExportType,
        segment::{Position, Scale, Segment, TimeRange},
        stage::Stage,
    },
    CluvOptions, Dimension, Result,
};

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();

    // Run the video editing example
    video_editing_example().await?;

    // Run the protocol example
    protocol_example().await?;

    println!("All examples completed successfully!");
    Ok(())
}

/// Example of programmatic video editing
async fn video_editing_example() -> Result<()> {
    println!("=== Video Editing Example ===");

    // Create a new editor with a stage size similar to the Go example
    let stage = Stage::new(960, 540);
    let mut editor = Editor::with_stage(stage);

    // Add video material
    let video_material = Material::video(
        "video_material_1",
        "/Users/justyer/Desktop/qwer.mp4",
        1280,
        720,
    );
    editor.add_material(video_material);

    // Add audio material
    let audio_material = Material::audio("audio_material_1", "/Users/justyer/Desktop/qwer.wav");
    editor.add_material(audio_material);

    // Create and add a video track
    editor.add_video_track("video_track_1");

    // Create a video segment
    let video_segment = Segment::video(
        "video_segment_1",
        "video_material_1",
        TimeRange::new(0, 5000), // Target: 0-5s on timeline
        TimeRange::new(0, 5000), // Source: 0-5s from original
    )
    .with_position(Position::new(100, 200)) // Position on stage
    .with_scale(Dimension::new(1280, 720)); // Scale to fit

    // Add the segment to the video track
    editor.add_segment_to_track("video_track_1", video_segment)?;

    // Create and add an audio track
    editor.add_audio_track("audio_track_1");

    // Create an audio segment
    let audio_segment = Segment::audio(
        "audio_segment_1",
        "audio_material_1",
        TimeRange::new(0, 5000), // Target: 0-5s on timeline
        TimeRange::new(0, 5000), // Source: 0-5s from original
    );

    // Add the segment to the audio track
    editor.add_segment_to_track("audio_track_1", audio_segment)?;

    // Validate the composition
    editor.validate()?;

    // Export as audio (like the Go example)
    let export_options = ExportOptions::new("output.wav", ExportType::Audio)
        .with_audio_codec("pcm_s16le")
        .with_audio_bitrate(1411);

    println!("Exporting audio composition...");
    editor.export(export_options).await?;
    println!("Audio export completed: output.wav");

    // Also export as video for demonstration
    let video_export_options = ExportOptions::new("output.mp4", ExportType::Video)
        .with_video_codec("libx264")
        .with_audio_codec("aac")
        .with_quality(23)
        .with_video_bitrate(2500)
        .with_audio_bitrate(128);

    println!("Exporting video composition...");
    editor.export(video_export_options).await?;
    println!("Video export completed: output.mp4");

    Ok(())
}

/// Example of loading from and saving to cut protocol JSON
async fn protocol_example() -> Result<()> {
    println!("\n=== Protocol Example ===");

    // Create a protocol similar to the provided cut_proto.json
    let protocol_json = r#"
    {
        "stage": {
            "width": 1280,
            "height": 720
        },
        "materials": {
            "videos": [
                {
                    "id": "9022275B-650A-4564-9397-CE6DEC419C5A",
                    "src": "video1.mp4",
                    "dimension": {
                        "width": 1920,
                        "height": 1080
                    }
                }
            ],
            "images": [],
            "audios": []
        },
        "tracks": [
            {
                "id": "36033738-8ab8-43bb-a22d-aa5fe9c0e691",
                "type": "video",
                "segments": [
                    {
                        "id": "segment-1",
                        "type": "video",
                        "material_id": "9022275B-650A-4564-9397-CE6DEC419C5A",
                        "target_timerange": {
                            "start": 0,
                            "duration": 10000
                        },
                        "source_timerange": {
                            "start": 0,
                            "duration": 10000
                        },
                        "scale": {
                            "width": 1280,
                            "height": 720
                        },
                        "position": {
                            "x": 0,
                            "y": 0
                        }
                    }
                ]
            }
        ]
    }
    "#;

    // Create editor and load from protocol
    let mut editor = Editor::new();
    editor.load_from_json(protocol_json)?;

    println!("Loaded composition from protocol JSON");
    println!(
        "Stage size: {}x{}",
        editor.session().stage.width,
        editor.session().stage.height
    );
    println!("Materials count: {}", editor.session().materials.len());
    println!("Tracks count: {}", editor.session().tracks.len());
    println!("Total duration: {}ms", editor.session().total_duration());

    // Validate the loaded composition
    editor.validate()?;

    // Save back to protocol JSON
    let saved_json = editor.save_to_json()?;
    println!("Saved composition back to JSON format");

    // Print a portion of the saved JSON for verification
    let lines: Vec<&str> = saved_json.lines().take(10).collect();
    println!("First 10 lines of saved JSON:");
    for line in lines {
        println!("  {}", line);
    }

    // Export this composition as well (if materials exist)
    println!("Note: To export this composition, ensure video1.mp4 exists in the current directory");

    Ok(())
}

/// Advanced editing example with multiple tracks and effects
#[allow(dead_code)]
async fn advanced_editing_example() -> Result<()> {
    println!("\n=== Advanced Editing Example ===");

    // Create editor with custom options
    let options = CluvOptions::new().with_ffmpeg(|opts| opts.debug(true));
    let stage = Stage::new(1920, 1080);
    let mut editor = Editor::with_stage_and_options(stage, options);

    // Add multiple materials
    editor
        .add_material(Material::video("intro_video", "intro.mp4", 1920, 1080))
        .add_material(Material::video("main_video", "main.mp4", 1920, 1080))
        .add_material(Material::audio("bg_music", "background.mp3"))
        .add_material(Material::image("logo", "logo.png", 200, 100));

    // Create multiple tracks
    editor
        .add_video_track("main_video_track")
        .add_video_track("overlay_track")
        .add_audio_track("main_audio_track")
        .add_audio_track("music_track");

    // Add segments to main video track
    let main_segment1 = Segment::video(
        "intro_seg",
        "intro_video",
        TimeRange::new(0, 3000),
        TimeRange::new(0, 3000),
    )
    .with_scale(Dimension::new(1920, 1080))
    .with_position(Position::new(0, 0));

    let main_segment2 = Segment::video(
        "main_seg",
        "main_video",
        TimeRange::new(3000, 15000),
        TimeRange::new(0, 15000),
    )
    .with_scale(Dimension::new(1920, 1080))
    .with_position(Position::new(0, 0));

    editor.add_segment_to_track("main_video_track", main_segment1)?;
    editor.add_segment_to_track("main_video_track", main_segment2)?;

    // Add logo overlay
    let logo_segment = Segment::image(
        "logo_seg",
        "logo",
        TimeRange::new(1000, 16000), // Show logo from 1s to 17s
        TimeRange::new(0, 1000),     // Static image
    )
    .with_scale(Dimension::new(200, 100))
    .with_position(Position::new(1720, 980)); // Bottom right

    editor.add_segment_to_track("overlay_track", logo_segment)?;

    // Add background music throughout
    let music_segment = Segment::audio(
        "music_seg",
        "bg_music",
        TimeRange::new(0, 18000),
        TimeRange::new(0, 18000),
    );

    editor.add_segment_to_track("music_track", music_segment)?;

    // Set track properties
    if let Some(music_track) = editor.session_mut().get_track_mut("music_track") {
        music_track.set_volume(0.3); // Lower background music volume
    }

    // Validate and export
    editor.validate()?;

    let export_options = ExportOptions::new("advanced_output.mp4", ExportType::Video)
        .with_video_codec("libx264")
        .with_audio_codec("aac")
        .with_quality(20)
        .with_custom_option("preset", "medium");

    println!("Exporting advanced composition...");
    editor.export(export_options).await?;
    println!("Advanced export completed: advanced_output.mp4");

    Ok(())
}

/// Example showing speed adjustment and trimming
#[allow(dead_code)]
async fn speed_and_trim_example() -> Result<()> {
    println!("\n=== Speed and Trim Example ===");

    let mut editor = Editor::with_stage(Stage::new(1920, 1080));

    // Add material
    editor.add_material(Material::video("source", "source.mp4", 1920, 1080));

    // Create track
    editor.add_video_track("main_track");

    // Create segments with different speeds
    let slow_segment = Segment::video(
        "slow_part",
        "source",
        TimeRange::new(0, 6000), // 6 seconds on timeline
        TimeRange::new(0, 3000), // 3 seconds from source (0.5x speed)
    )
    .with_scale(Dimension::new(1920, 1080));

    let normal_segment = Segment::video(
        "normal_part",
        "source",
        TimeRange::new(6000, 4000), // 4 seconds on timeline
        TimeRange::new(3000, 4000), // 4 seconds from source (1x speed)
    )
    .with_scale(Dimension::new(1920, 1080));

    let fast_segment = Segment::video(
        "fast_part",
        "source",
        TimeRange::new(10000, 2000), // 2 seconds on timeline
        TimeRange::new(7000, 6000),  // 6 seconds from source (3x speed)
    )
    .with_scale(Dimension::new(1920, 1080));

    editor.add_segment_to_track("main_track", slow_segment)?;
    editor.add_segment_to_track("main_track", normal_segment)?;
    editor.add_segment_to_track("main_track", fast_segment)?;

    // Export
    editor.export_mp4("speed_example.mp4").await?;
    println!("Speed example exported: speed_example.mp4");

    Ok(())
}
