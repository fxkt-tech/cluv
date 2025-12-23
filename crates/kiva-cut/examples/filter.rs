use kiva_cut::ffmpeg::{
    codec::{AudioCodec, VideoCodec},
    filter::Filter,
    input::Input,
    output::Output,
    FFmpeg,
};
use kiva_cut::options::FFmpegOptions;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let mut ff = FFmpeg::new();
    ff.set_ffmpeg_options(FFmpegOptions::new().debug(true).dry_run(true));

    let i_main = ff.add_input(Input::with_simple("examples/metadata/in.mp4"));
    let i_logo = ff.add_input(Input::with_simple("examples/metadata/logo.jpg"));

    let f_scale = ff.add_filter(Filter::scale(1280, 720), [i_main.video()]);
    let f_overlay = ff.add_filter(Filter::overlay(10, 10), [f_scale, i_logo.video()]);

    ff.add_output(
        Output::with_simple("examples/metadata/out.mp4")
            .map_stream(f_overlay)
            .map_stream(i_main.may_a())
            .video_codec(VideoCodec::H264)
            .audio_codec(AudioCodec::Copy)
            .metadata("comment", "iamcluv"),
    );

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
