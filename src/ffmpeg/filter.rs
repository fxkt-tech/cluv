use std::fmt::Debug;
use std::rc::Rc;

use super::naming::gen;
use super::stream::{Stream, StreamImpl, Streamer};

pub trait Filter: Streamer {
    fn get(self) -> Box<dyn Streamer>;
    fn string(&self) -> String;
    // fn use_streams(&mut self, streamer: Box<dyn Streamer>) -> &mut Self;
}

#[derive(Clone)]
pub struct Simple {
    n: String,
    content: String,

    streamers: Vec<Rc<dyn Streamer>>,
}

impl Simple {
    pub fn use_streams(&mut self, streamer: Rc<dyn Streamer>) -> &mut Self {
        self.streamers.push(streamer);
        self
    }
}

impl Streamer for Simple {
    fn name(&self) -> String {
        self.n.clone()
    }
}

impl Filter for Simple {
    fn get(self) -> Box<dyn Streamer> {
        Box::new(self)
    }

    fn string(&self) -> String {
        let used_names: Vec<String> = self.streamers.iter().map(|s| s.name()).collect();
        vec![
            used_names
                .iter()
                .map(|name| format!("[{}]", name))
                .collect::<Vec<String>>()
                .join(""),
            self.content.clone(),
            format!("[{}]", self.n.clone()),
        ]
        .join("")
    }
}

pub struct Filters {
    filters: Vec<Rc<dyn Filter>>,
}

impl Filters {
    pub fn new() -> Self {
        Filters {
            filters: Vec::new(),
        }
    }

    pub fn add<F: Filter + 'static>(&mut self, f: F) -> &mut Self {
        self.filters.push(Rc::new(f));
        self
    }

    pub fn params(&mut self) -> Vec<String> {
        let mut args = Vec::new();
        args.push(String::from("-filter_complex"));
        let mut filter_strs = Vec::new();
        for filter in &self.filters {
            filter_strs.push(filter.string());
        }
        args.push(filter_strs.join(";"));
        args
    }
}

pub fn select(idx: i32, stream: Stream) -> StreamImpl {
    StreamImpl { idx, stream }
}

pub fn scale<T>(x: T, y: T) -> Simple
where
    T: PartialOrd + Debug,
{
    Simple {
        n: gen(),
        content: format!("scale={:?}:{:?}", x, y),
        streamers: Vec::new(),
    }
}
