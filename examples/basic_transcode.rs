//! Basic video transcoding example
//!
//! This example demonstrates how to transcode a video file to MP4 format
//! with custom video and audio settings.

use cluv::{
    AudioFilter, Filters, KeyValue, SubTranscodeParams, TranscodeParams, TranscodeVideoFilter,
    Transcoder,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    println!("Basic Video Transcoding Example");
    println!("===============================");

    let transcoder = Transcoder::new();

    // Configure transcoding parameters
    let params = TranscodeParams::builder()
        .input_file("input.mp4") // Change this to your input file
        .add_sub(SubTranscodeParams {
            output_file: "output_basic.mp4".to_string(),
            filters: Some(Filters {
                container: None,
                metadata: vec![
                    KeyValue {
                        key: "title".to_string(),
                        value: "Transcoded with Cluv".to_string(),
                    },
                    KeyValue {
                        key: "comment".to_string(),
                        value: "Basic transcoding example".to_string(),
                    },
                    KeyValue {
                        key: "encoder".to_string(),
                        value: "Cluv Rust Library".to_string(),
                    },
                ],
                video: Some(TranscodeVideoFilter {
                    codec: Some("libx264".to_string()),
                    width: Some(1280),
                    height: Some(720),
                    crf: Some(23), // Good quality, reasonable file size
                    gop: Some(60), // 2 seconds at 30fps
                    pix_fmt: Some("yuv420p".to_string()),
                    ..Default::default()
                }),
                audio: Some(AudioFilter {
                    codec: Some("aac".to_string()),
                    bitrate: Some(128), // 128 kbps
                }),
                logo: Vec::new(),
                delogo: Vec::new(),
                clip: None,
                hls: None,
            }),
            threads: Some(4), // Use 4 threads for encoding
        })
        .build()?;

    println!("Starting transcoding...");
    println!("Input: {}", params.input_file);
    println!("Output: {}", params.subs[0].output_file);

    // Start transcoding
    match transcoder.simple_mp4(params).await {
        Ok(()) => {
            println!("✅ Transcoding completed successfully!");
            println!("Output file: output_basic.mp4");
        }
        Err(e) => {
            eprintln!("❌ Transcoding failed: {}", e);
            return Err(e.into());
        }
    }

    Ok(())
}
