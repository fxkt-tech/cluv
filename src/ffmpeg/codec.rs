pub enum Codec {
    Copy,
    Nope,

    // audio
    AAC,
    FDKAAC,
    MP3Lame,

    // video
    X264,
    WZ264,
    X265,
    WZ265,
    VP9,

    // image
    MJPEG,

    // container
    HLS,
    Dash,
    MP4,
    MP3,
    JPEG,
    JPG,
    PNG,
    WEBP,
}

impl From<&str> for Codec {
    fn from(s: &str) -> Self {
        match s {
            "copy" => Codec::Copy,
            "nope" => Codec::Nope,
            "aac" => Codec::AAC,
            "libfdk_aac" => Codec::FDKAAC,
            "libmp3lame" => Codec::MP3Lame,
            "libx264" => Codec::X264,
            "libwz264" => Codec::WZ264,
            "libx265" => Codec::X265,
            "libwz265" => Codec::WZ265,
            "libvpx-vp9" => Codec::VP9,
            "mjpeg" => Codec::MJPEG,
            "hls" => Codec::HLS,
            "dash" => Codec::Dash,
            "mp4" => Codec::MP4,
            "mp3" => Codec::MP3,
            "jpeg" => Codec::JPEG,
            "jpg" => Codec::JPG,
            "png" => Codec::PNG,
            "webp" => Codec::WEBP,
            _ => panic!("Invalid codec"),
        }
    }
}

impl From<Codec> for &'static str {
    fn from(c: Codec) -> Self {
        match c {
            Codec::Copy => "copy",
            Codec::Nope => "nope",
            Codec::AAC => "aac",
            Codec::FDKAAC => "libfdk_aac",
            Codec::MP3Lame => "libmp3lame",
            Codec::X264 => "libx264",
            Codec::WZ264 => "libwz264",
            Codec::X265 => "libx265",
            Codec::WZ265 => "libwz265",
            Codec::VP9 => "libvpx-vp9",
            Codec::MJPEG => "mjpeg",
            Codec::HLS => "hls",
            Codec::Dash => "dash",
            Codec::MP4 => "mp4",
            Codec::MP3 => "mp3",
            Codec::JPEG => "jpeg",
            Codec::JPG => "jpg",
            Codec::PNG => "png",
            Codec::WEBP => "webp",
        }
    }
}
