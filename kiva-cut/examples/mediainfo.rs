use kiva_cut::{ffprobe::FFprobe, options::FFprobeOptions};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let media_info = FFprobe::new()
        .set_options(FFprobeOptions::new().debug(true))
        .input("examples/metadata/in.mp4")
        .run()
        .await?;

    println!("{:?}", media_info);

    Ok(())
}
