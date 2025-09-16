use cluv::{ffprobe::FFprobe, options::FFprobeOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let media_info = FFprobe::with_options(FFprobeOptions::new().debug(true).dry_run(true))
        .input("examples/metadata/out.mp4")
        .run()
        .await?;

    println!("{:?}", media_info);

    Ok(())
}
