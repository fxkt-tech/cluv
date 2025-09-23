//! Screenshot generation example
//!
//! This example demonstrates various ways to take screenshots from video files
//! including single screenshots, interval-based screenshots, and keyframe extraction.

use cluv::{Snapshot, SnapshotParams};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    println!("Screenshot Generation Example");
    println!("============================");

    let snapshot = Snapshot::new();

    // Example 1: Single screenshot at specific time
    println!("1. Taking single screenshot at 30 seconds...");
    let single_params = SnapshotParams::builder()
        .input_file("input.mp4") // Change this to your input file
        .output_file("thumbnail_30s.jpg")
        .single_snapshot()
        .start_time(30.0) // Screenshot at 30 seconds
        .resolution(1280, 720)
        .build()?;

    match snapshot.simple(single_params).await {
        Ok(()) => println!("✅ Single screenshot saved: thumbnail_30s.jpg"),
        Err(e) => eprintln!("❌ Failed to take single screenshot: {}", e),
    }

    // Example 2: Multiple screenshots at 10-second intervals
    println!("2. Taking screenshots every 10 seconds...");
    let interval_params = SnapshotParams::builder()
        .input_file("input.mp4")
        .output_file("screenshot_%03d.jpg") // %03d creates numbered files
        .frame_type(1) // Interval-based screenshots
        .interval(10.0) // Every 10 seconds
        .max_count(5) // Maximum 5 screenshots
        .resolution(800, 450)
        .build()?;

    match snapshot.simple(interval_params).await {
        Ok(()) => {
            println!("✅ Interval screenshots saved: screenshot_001.jpg, screenshot_002.jpg, etc.")
        }
        Err(e) => eprintln!("❌ Failed to take interval screenshots: {}", e),
    }

    // Example 3: Extract keyframes only
    println!("3. Extracting keyframes...");
    let keyframe_params = SnapshotParams::builder()
        .input_file("input.mp4")
        .output_file("keyframe_%03d.jpg")
        .keyframes_only()
        .max_count(10) // Maximum 10 keyframes
        .resolution(640, 360)
        .build()?;

    match snapshot.simple(keyframe_params).await {
        Ok(()) => println!("✅ Keyframes saved: keyframe_001.jpg, keyframe_002.jpg, etc."),
        Err(e) => eprintln!("❌ Failed to extract keyframes: {}", e),
    }

    // Example 4: Screenshots at specific frames
    println!("4. Taking screenshots at specific frames...");
    let specific_frames_params = SnapshotParams::builder()
        .input_file("input.mp4")
        .output_file("frame_%03d.jpg")
        .specific_frames(vec![0, 150, 300, 450, 600]) // Frame numbers
        .resolution(1920, 1080)
        .build()?;

    match snapshot.simple(specific_frames_params).await {
        Ok(()) => {
            println!("✅ Specific frame screenshots saved: frame_001.jpg, frame_002.jpg, etc.")
        }
        Err(e) => eprintln!("❌ Failed to take specific frame screenshots: {}", e),
    }

    // Example 5: High-quality thumbnail
    println!("5. Creating high-quality thumbnail...");
    let hq_params = SnapshotParams::builder()
        .input_file("input.mp4")
        .output_file("high_quality_thumb.jpg")
        .single_snapshot()
        .start_time(60.0) // At 1 minute
        .resolution(1920, 1080) // Full HD
        .build()?;

    match snapshot.simple(hq_params).await {
        Ok(()) => println!("✅ High-quality thumbnail saved: high_quality_thumb.jpg"),
        Err(e) => eprintln!("❌ Failed to create high-quality thumbnail: {}", e),
    }

    println!("\n🎉 Screenshot generation examples completed!");
    println!("Check the generated files in the current directory.");

    Ok(())
}
