//! Utility functions for FFmpeg operations

use std::path::Path;

/// Fix pixel length to ensure it's even (required for many codecs)
pub fn fix_pixel_len(len: i32) -> String {
    if len <= 0 {
        "-2".to_string() // Auto scale maintaining aspect ratio
    } else if len % 2 == 0 {
        len.to_string()
    } else {
        (len + 1).to_string() // Round up to next even number
    }
}

/// Convert seconds to FFmpeg time format (HH:MM:SS.mmm)
pub fn seconds_to_time_format(seconds: f64) -> String {
    let hours = (seconds / 3600.0) as i32;
    let minutes = ((seconds % 3600.0) / 60.0) as i32;
    let secs = seconds % 60.0;

    format!("{:02}:{:02}:{:06.3}", hours, minutes, secs)
}

/// Convert time format to seconds
pub fn time_format_to_seconds(time: &str) -> Result<f64, String> {
    let parts: Vec<&str> = time.split(':').collect();

    match parts.len() {
        1 => {
            // Just seconds
            parts[0]
                .parse::<f64>()
                .map_err(|e| format!("Invalid time format: {}", e))
        }
        2 => {
            // MM:SS
            let minutes: f64 = parts[0]
                .parse()
                .map_err(|e| format!("Invalid minutes: {}", e))?;
            let seconds: f64 = parts[1]
                .parse()
                .map_err(|e| format!("Invalid seconds: {}", e))?;
            Ok(minutes * 60.0 + seconds)
        }
        3 => {
            // HH:MM:SS
            let hours: f64 = parts[0]
                .parse()
                .map_err(|e| format!("Invalid hours: {}", e))?;
            let minutes: f64 = parts[1]
                .parse()
                .map_err(|e| format!("Invalid minutes: {}", e))?;
            let seconds: f64 = parts[2]
                .parse()
                .map_err(|e| format!("Invalid seconds: {}", e))?;
            Ok(hours * 3600.0 + minutes * 60.0 + seconds)
        }
        _ => Err("Invalid time format. Expected HH:MM:SS, MM:SS, or SS".to_string()),
    }
}

/// Calculate aspect ratio from width and height
pub fn aspect_ratio(width: i32, height: i32) -> f64 {
    if height == 0 {
        0.0
    } else {
        width as f64 / height as f64
    }
}

/// Calculate height from width maintaining aspect ratio
pub fn height_from_width_aspect(width: i32, aspect_ratio: f64) -> i32 {
    if aspect_ratio == 0.0 {
        0
    } else {
        let height = width as f64 / aspect_ratio;
        fix_even_number(height.round() as i32)
    }
}

/// Calculate width from height maintaining aspect ratio
pub fn width_from_height_aspect(height: i32, aspect_ratio: f64) -> i32 {
    let width = height as f64 * aspect_ratio;
    fix_even_number(width.round() as i32)
}

/// Ensure number is even (add 1 if odd)
pub fn fix_even_number(n: i32) -> i32 {
    if n % 2 == 0 {
        n
    } else {
        n + 1
    }
}

/// Generate unique temporary filename
pub fn generate_temp_filename(prefix: &str, extension: &str) -> String {
    use uuid::Uuid;
    let uuid = Uuid::new_v4();
    format!("{}_{}.{}", prefix, uuid.simple(), extension)
}

/// Validate file extension against supported formats
pub fn is_supported_video_format(path: &str) -> bool {
    let path = Path::new(path);
    if let Some(ext) = path.extension() {
        if let Some(ext_str) = ext.to_str() {
            matches!(
                ext_str.to_lowercase().as_str(),
                "mp4" | "avi" | "mkv" | "mov" | "flv" | "webm" | "m4v" | "3gp" | "wmv"
            )
        } else {
            false
        }
    } else {
        false
    }
}

/// Check if file extension is audio format
pub fn is_supported_audio_format(path: &str) -> bool {
    let path = Path::new(path);
    if let Some(ext) = path.extension() {
        if let Some(ext_str) = ext.to_str() {
            matches!(
                ext_str.to_lowercase().as_str(),
                "mp3" | "aac" | "wav" | "flac" | "ogg" | "m4a" | "wma" | "ac3"
            )
        } else {
            false
        }
    } else {
        false
    }
}

/// Check if file extension is image format
pub fn is_supported_image_format(path: &str) -> bool {
    let path = Path::new(path);
    if let Some(ext) = path.extension() {
        if let Some(ext_str) = ext.to_str() {
            matches!(
                ext_str.to_lowercase().as_str(),
                "jpg" | "jpeg" | "png" | "gif" | "bmp" | "tiff" | "webp"
            )
        } else {
            false
        }
    } else {
        false
    }
}

/// Format file size in human readable format
pub fn format_file_size(size: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = size as f64;
    let mut unit_index = 0;

    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }

    format!("{:.2} {}", size, UNITS[unit_index])
}

/// Parse bitrate string (e.g., "1000k", "2M") to bits per second
pub fn parse_bitrate(bitrate: &str) -> Result<i32, String> {
    let bitrate = bitrate.trim().to_lowercase();

    if let Some(stripped) = bitrate.strip_suffix('k') {
        let value: f64 = stripped
            .parse()
            .map_err(|e| format!("Invalid bitrate: {}", e))?;
        Ok((value * 1000.0) as i32)
    } else if let Some(stripped) = bitrate.strip_suffix('m') {
        let value: f64 = stripped
            .parse()
            .map_err(|e| format!("Invalid bitrate: {}", e))?;
        Ok((value * 1_000_000.0) as i32)
    } else {
        bitrate
            .parse()
            .map_err(|e| format!("Invalid bitrate: {}", e))
    }
}

/// Format bitrate as string with appropriate unit
pub fn format_bitrate(bitrate: i32) -> String {
    if bitrate >= 1_000_000 {
        format!("{:.1}M", bitrate as f64 / 1_000_000.0)
    } else if bitrate >= 1000 {
        format!("{:.1}k", bitrate as f64 / 1000.0)
    } else {
        format!("{}", bitrate)
    }
}

/// Create FFmpeg-compatible frame rate string
pub fn format_framerate(fps: f64) -> String {
    if fps.fract() == 0.0 {
        format!("{}", fps as i32)
    } else {
        // Common frame rates as fractions
        let fps_rounded = (fps * 1000.0).round() / 1000.0;
        match fps_rounded {
            f if (f - 23.976).abs() < 0.001 => "24000/1001".to_string(),
            f if (f - 29.970).abs() < 0.001 => "30000/1001".to_string(),
            f if (f - 59.940).abs() < 0.001 => "60000/1001".to_string(),
            _ => format!("{}", fps),
        }
    }
}

/// Calculate GOP size based on frame rate and duration
pub fn calculate_gop_size(fps: f64, _duration_seconds: f64) -> i32 {
    // Generally, GOP size should be 2-3 seconds worth of frames
    let gop_duration = 2.0;
    (fps * gop_duration).round() as i32
}

/// Escape string for FFmpeg filter use
pub fn escape_filter_string(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace(':', "\\:")
        .replace('[', "\\[")
        .replace(']', "\\]")
        .replace(',', "\\,")
        .replace(';', "\\;")
}

/// Create a fraction string from numerator and denominator
pub fn fraction(numerator: i32, denominator: i32) -> String {
    format!("{}/{}", numerator, denominator)
}

/// Mathematical utilities
pub mod math {
    /// Calculate greatest common divisor
    pub fn gcd(a: i32, b: i32) -> i32 {
        if b == 0 {
            a
        } else {
            gcd(b, a % b)
        }
    }

    /// Reduce fraction to lowest terms
    pub fn reduce_fraction(numerator: i32, denominator: i32) -> (i32, i32) {
        let gcd_val = gcd(numerator, denominator);
        (numerator / gcd_val, denominator / gcd_val)
    }

    /// Calculate absolute value
    pub fn abs(n: f64) -> f64 {
        if n < 0.0 {
            -n
        } else {
            n
        }
    }

    /// Clamp value between min and max
    pub fn clamp(value: f64, min: f64, max: f64) -> f64 {
        if value < min {
            min
        } else if value > max {
            max
        } else {
            value
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fix_pixel_len() {
        assert_eq!(fix_pixel_len(1920), "1920");
        assert_eq!(fix_pixel_len(1921), "1922");
        assert_eq!(fix_pixel_len(-1), "-2");
        assert_eq!(fix_pixel_len(0), "-2");
    }

    #[test]
    fn test_time_conversion() {
        assert_eq!(seconds_to_time_format(3661.5), "01:01:01.500");
        assert_eq!(time_format_to_seconds("01:01:01.5").unwrap(), 3661.5);
        assert_eq!(time_format_to_seconds("61.5").unwrap(), 61.5);
        assert_eq!(time_format_to_seconds("01:30").unwrap(), 90.0);
    }

    #[test]
    fn test_aspect_ratio() {
        assert_eq!(aspect_ratio(1920, 1080), 1920.0 / 1080.0);
        assert_eq!(height_from_width_aspect(1920, 16.0 / 9.0), 1080);
        assert_eq!(width_from_height_aspect(1080, 16.0 / 9.0), 1920);
    }

    #[test]
    fn test_file_format_detection() {
        assert!(is_supported_video_format("test.mp4"));
        assert!(is_supported_audio_format("test.mp3"));
        assert!(is_supported_image_format("test.jpg"));
        assert!(!is_supported_video_format("test.txt"));
    }

    #[test]
    fn test_bitrate_parsing() {
        assert_eq!(parse_bitrate("1000k").unwrap(), 1_000_000);
        assert_eq!(parse_bitrate("2M").unwrap(), 2_000_000);
        assert_eq!(parse_bitrate("500").unwrap(), 500);
        assert_eq!(format_bitrate(2_000_000), "2.0M");
        assert_eq!(format_bitrate(500_000), "500.0k");
    }

    #[test]
    fn test_framerate_formatting() {
        assert_eq!(format_framerate(30.0), "30");
        assert_eq!(format_framerate(23.976), "24000/1001");
        assert_eq!(format_framerate(25.5), "25.5");
    }

    #[test]
    fn test_escape_filter_string() {
        assert_eq!(escape_filter_string("test:value"), "test\\:value");
        assert_eq!(escape_filter_string("test[0]"), "test\\[0\\]");
    }

    #[test]
    fn test_math_functions() {
        assert_eq!(math::gcd(12, 8), 4);
        assert_eq!(math::reduce_fraction(12, 8), (3, 2));
        assert_eq!(math::clamp(5.0, 0.0, 10.0), 5.0);
        assert_eq!(math::clamp(-1.0, 0.0, 10.0), 0.0);
        assert_eq!(math::clamp(15.0, 0.0, 10.0), 10.0);
    }
}
