use mei::ffmpeg::stream::Stream;
use std::rc::Rc;

use mei::ffmpeg::{
    filter::{scale, select},
    input::Input,
    output::Output,
    FFmpeg,
};

fn main() {
    let i_main = Input::with_simple("/Users/justyer/Downloads/result.mp4");
    let f_scale = scale(720, 1280)
        .use_streams(Rc::new(select(0, Stream::Video)))
        .to_owned();
    let f_scale2 = scale(540, -2)
        .use_streams(Rc::new(f_scale.clone()))
        .to_owned();
    let o_main = Output::new().file("final.mp4").to_owned();

    FFmpeg::new()
        .add_input(i_main)
        .add_filter(f_scale)
        .add_filter(f_scale2)
        .add_output(o_main)
        .run()
        .unwrap();
}
