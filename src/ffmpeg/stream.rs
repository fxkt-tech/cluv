#[derive(Clone)]
pub enum Stream {
    Audio,
    Video,
    MayAudio,
    MayVideo,
}

impl From<String> for Stream {
    fn from(s: String) -> Self {
        match s.as_str() {
            "Audio" => Stream::Audio,
            "Video" => Stream::Video,
            "MayAudio" => Stream::MayAudio,
            "MayVideo" => Stream::MayVideo,
            _ => unimplemented!(),
        }
    }
}

impl Into<String> for Stream {
    fn into(self) -> String {
        match self {
            Stream::Audio => String::from("Audio"),
            Stream::Video => String::from("Video"),
            Stream::MayAudio => String::from("MayAudio"),
            Stream::MayVideo => String::from("MayVideo"),
        }
    }
}

pub trait Streamer {
    fn name(&self) -> String;
}

pub struct StreamImpl {
    pub idx: i32,
    pub stream: Stream,
}

impl Streamer for StreamImpl {
    fn name(&self) -> String {
        let stream: String = self.stream.clone().into();
        format!("[{}:{}]", self.idx, stream)
    }
}
