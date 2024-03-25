#[derive(Clone)]
pub struct Input {
    cv: String,
    r: String,
    safe: String,
    f: String,
    ss: f32,
    t: f32,
    i: String,
}

impl Input {
    pub fn with_simple(i: &str) -> Self {
        Input {
            cv: String::new(),
            r: String::new(),
            safe: String::new(),
            f: String::new(),
            ss: 0 as f32,
            t: 0 as f32,
            i: i.to_string(),
        }
    }

    pub fn with_time(ss: f32, t: f32, i: String) -> Self {
        Input {
            cv: String::new(),
            r: String::new(),
            safe: String::new(),
            f: String::new(),
            ss,
            t,
            i,
        }
    }

    pub fn params(&self) -> Vec<String> {
        let mut args = Vec::new();

        if self.cv != "" {
            args.append(&mut vec![String::from("-cv"), self.cv.clone()])
        }
        if self.r != "" {
            args.append(&mut vec![String::from("-r"), self.r.clone()])
        }
        if self.safe != "" {
            args.append(&mut vec![String::from("-safe"), self.safe.clone()])
        }
        if self.f != "" {
            args.append(&mut vec![String::from("-f"), self.f.clone()])
        }
        if self.ss > 0 as f32 {
            args.append(&mut vec![String::from("-ss"), self.ss.to_string()]);
        }
        if self.t > 0 as f32 {
            args.append(&mut vec![String::from("-t"), self.t.to_string()]);
        }
        if self.i != "" {
            args.append(&mut vec![String::from("-i"), self.i.clone()]);
        }

        args
    }
}

#[derive(Clone)]
pub struct Inputs {
    inputs: Vec<Input>,
}

impl Inputs {
    pub fn new() -> Self {
        Inputs { inputs: Vec::new() }
    }

    pub fn add(&mut self, i: Input) -> &mut Self {
        self.inputs.push(i);
        self
    }

    pub fn params(&mut self) -> Vec<String> {
        let mut input_strs = Vec::new();
        for input in self.inputs.clone() {
            input_strs.append(&mut input.params());
        }
        input_strs
    }
}
