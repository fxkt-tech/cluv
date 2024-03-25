use std::process::{exit, Command};

fn main() {
    let output = Command::new("ffmpeg")
        .args(&[
            "-v",
            "error",
            "-i",
            "input.mp4",
            "-filter_complex",
            "scale=-2:1280[final]",
            "-map",
            "[final]",
            "-c:v",
            "libx264",
            "-c:a",
            "aac",
            "output.mp4",
        ])
        .output()
        .expect("Failed to execute ffmpeg command");

    if output.status.success() {
        println!(
            "ffmpeg command executed successfully: {:?}",
            String::from_utf8_lossy(&output.stdout).to_string()
        );
    } else {
        println!(
            "ffmpeg command failed with error: {:?}",
            String::from_utf8_lossy(&output.stderr).to_string()
        );
        exit(1);
    }
}
