use crate::composer::cli::StyleArg;

#[derive(Clone)]
pub struct StyleSpec {
    pub name: String,
    pub instrument_program: u8,
    pub harmony_program: u8,
    pub scale: Vec<i32>,
    pub progression: Vec<(i32, i32)>,
    pub time_signature: (u32, u32),
}

pub fn style_spec(style: &StyleArg) -> StyleSpec {
    match style {
        StyleArg::Classical => StyleSpec {
            name: "classical".into(),
            instrument_program: 0,
            harmony_program: 48,
            scale: vec![0, 2, 4, 5, 7, 9, 11],
            progression: vec![(0, 4), (5, 4), (3, 4), (4, 4)],
            time_signature: (4, 4),
        },
        StyleArg::Jazz => StyleSpec {
            name: "jazz".into(),
            instrument_program: 2,
            harmony_program: 48,
            scale: vec![0, 2, 3, 5, 7, 9, 10],
            progression: vec![(0, 4), (5, 4), (7, 4), (0, 4)],
            time_signature: (4, 4),
        },
        StyleArg::Pop => StyleSpec {
            name: "pop".into(),
            instrument_program: 0,
            harmony_program: 24,
            scale: vec![0, 2, 4, 5, 7, 9, 11],
            progression: vec![(0, 4), (5, 4), (9, 4), (7, 4)],
            time_signature: (4, 4),
        },
        StyleArg::Rock => StyleSpec {
            name: "rock".into(),
            instrument_program: 30,
            harmony_program: 24,
            scale: vec![0, 2, 3, 5, 7, 8, 10],
            progression: vec![(0, 4), (7, 4), (5, 4), (0, 4)],
            time_signature: (4, 4),
        },
        StyleArg::Ambient => StyleSpec {
            name: "ambient".into(),
            instrument_program: 88,
            harmony_program: 91,
            scale: vec![0, 2, 3, 7, 8, 10],
            progression: vec![(0, 8), (5, 8)],
            time_signature: (4, 4),
        },
    }
}
