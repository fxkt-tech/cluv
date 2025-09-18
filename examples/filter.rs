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

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let ff_opts = FFmpegOptions::new().debug(true).dry_run(true);
    let mut ff = FFmpeg::new().set_options(ff_opts);

    // Define input video
    let i_main = Input::with_simple("examples/metadata/in.mp4").ffcx(&mut ff);
    let i_logo = Input::with_simple("examples/metadata/logo.jpg").ffcx(&mut ff);

    // Alternative filters you can try (uncomment to use):
    let f_scale = Filter::scale(1280, 720).r(i_main.v()).ffcx(&mut ff);
    let f_overlay = Filter::overlay(10, 10)
        .r(f_scale)
        .r(i_logo.v())
        .ffcx(&mut ff);

    // Create output with H.264 video codec and copy audio
    Output::with_simple("examples/metadata/out.mp4")
        .map_stream(f_overlay)
        .map_stream(i_main.may_a())
        .video_codec(VideoCodec::H264)
        .audio_codec(AudioCodec::Copy)
        .metadata("comment", "iamcluv")
        .ffcx(&mut ff);

    // Build and execute the FFmpeg command
    let result = ff.run().await;

    match result {
        Ok(()) => {
            // println!("✅ Video filtering completed successfully!");
        }
        Err(e) => {
            eprintln!("❌ Video filtering failed: {}", e);
            return Err(e.into());
        }
    }

    Ok(())
}
