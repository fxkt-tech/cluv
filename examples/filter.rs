//! Video filter example
//!
//! This example demonstrates how to apply various video filters
//! including delogo filter to remove logos/watermarks from videos.
//! It shows how to use filters with video streams and map outputs.

use cluv::ffmpeg::{
    codec::{AudioCodec, VideoCodec},
    filter::Filter,
    input::Input,
    output::Output,
    FFmpeg,
};
use cluv::options::FFmpegOptions;
use cluv::LogLevel;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    // Define input video
    let i_main = Input::new("examples/metadata/in.mp4");
    let i_logo = Input::new("examples/metadata/logo.jpg");

    // Alternative filters you can try (uncomment to use):
    let f_scale = Filter::scale(1280, 720).refs([i_main.video()]);
    let f_overlay = Filter::overlay(10, 10).r(f_scale.clone()).r(i_logo.video());

    // Create output with H.264 video codec and copy audio
    let output = Output::new("examples/metadata/out.mp4")
        .map_stream(f_overlay.clone())
        .map_stream(i_main.may_audio())
        .video_codec(VideoCodec::H264)
        .audio_codec(AudioCodec::Copy)
        .metadata("comment", "iamcluv");

    // Build and execute the FFmpeg command
    let result = FFmpeg::new()
        .set_options(
            FFmpegOptions::new()
                .debug(true)
                // .dry_run(true)
                .log_level(LogLevel::Error),
        )
        .add_inputs([i_main, i_logo])
        .add_filters([f_scale, f_overlay])
        .add_outputs([output])
        .run()
        .await;

    match result {
        Ok(()) => {
            // println!("✅ Video filtering completed successfully!");
        }
        Err(e) => {
            eprintln!("❌ Video filtering failed: {}", e);
            return Err(e.into());
        }
    }

    // println!();
    // println!("💡 Tips:");
    // println!("  - Adjust delogo coordinates (x, y, width, height) for your logo position");
    // println!("  - Use preview mode to test filter parameters before final processing");
    // println!("  - Combine multiple filters using filter chains");
    // println!("  - Set dry_run to false in FFmpegOptions to actually execute");
    // println!("  - Consider using split filter for multiple outputs with different filters");

    // println!();
    // println!("🔧 Other useful filters:");
    // println!("  - Filter::scale(width, height) - Resize video");
    // println!("  - Filter::blur(radius) - Apply blur effect");
    // println!("  - Filter::brightness(value) - Adjust brightness");
    // println!("  - Filter::contrast(value) - Adjust contrast");
    // println!("  - Filter::overlay(x, y) - Add overlay/watermark");

    Ok(())
}
