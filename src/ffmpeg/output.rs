#[derive(Clone)]
pub struct Output {
    // maps: Vec<stream::Streamer>,
    cv: String,
    ca: String,
    bv: i32,
    ba: i32,
    pix_fmt: String,
    crf: i32,
    metadatas: Vec<String>,
    threads: i32,
    max_muxing_queue_size: i32,
    movflags: String,
    ss: f32,
    t: f32,
    f: String,
    file: String,
    var_stream_map: String,
    vsync: String,
    g: i32,

    // non_support_args: HashMap<String, String>,
    hls_segment_type: String,
    hls_flags: String,
    hls_playlist_type: String,
    hls_time: i32,
    master_pl_name: String,
    hls_segment_filename: String,
    hls_key_info_file: String,

    // img
    vframes: i32,
}

impl Output {
    pub fn new() -> Self {
        Output {
            cv: String::new(),
            ca: String::new(),
            bv: 0 as i32,
            ba: 0 as i32,
            pix_fmt: String::new(),
            crf: 0 as i32,
            metadatas: Vec::new(),
            threads: 0 as i32,
            max_muxing_queue_size: 0 as i32,
            movflags: String::new(),
            ss: 0 as f32,
            t: 0 as f32,
            f: String::new(),
            file: String::new(),
            var_stream_map: String::new(),
            vsync: String::new(),
            g: 0 as i32,
            hls_segment_type: String::new(),
            hls_flags: String::new(),
            hls_playlist_type: String::new(),
            hls_time: 0 as i32,
            master_pl_name: String::new(),
            hls_segment_filename: String::new(),
            hls_key_info_file: String::new(),
            vframes: 0 as i32,
        }
    }

    pub fn file(&mut self, name: &str) -> &mut Self {
        self.f = name.to_string();
        self
    }

    pub fn params(&self) -> Vec<String> {
        let mut args = Vec::new();

        if self.cv != "" {
            args.append(&mut vec![String::from("-cv"), self.cv.clone()])
        }
        if self.ca != "" {
            args.append(&mut vec![String::from("-ca"), self.ca.clone()])
        }
        if self.bv > 0 {
            args.append(&mut vec![String::from("-bv"), self.bv.to_string()])
        }
        if self.ba > 0 {
            args.append(&mut vec![String::from("-ba"), self.ba.to_string()])
        }
        if self.pix_fmt != "" {
            args.append(&mut vec![String::from("-pix_fmt"), self.pix_fmt.clone()])
        }
        if self.crf > 0 {
            args.append(&mut vec![String::from("-crf"), self.crf.to_string()])
        }
        if !self.metadatas.is_empty() {
            for metadata in &self.metadatas {
                args.append(&mut vec![String::from("-metadata"), metadata.clone()])
            }
        }
        if self.threads > 0 {
            args.append(&mut vec![
                String::from("-threads"),
                self.threads.to_string(),
            ])
        }
        if self.max_muxing_queue_size > 0 {
            args.append(&mut vec![
                String::from("-max_muxing_queue_size"),
                self.max_muxing_queue_size.to_string(),
            ])
        }
        if self.movflags != "" {
            args.append(&mut vec![String::from("-movflags"), self.movflags.clone()])
        }
        if self.ss > 0 as f32 {
            args.append(&mut vec![String::from("-ss"), self.ss.to_string()]);
        }
        if self.t > 0 as f32 {
            args.append(&mut vec![String::from("-t"), self.t.to_string()]);
        }
        if self.f != "" {
            args.append(&mut vec![String::from("-f"), self.f.clone()]);
        }
        if self.file != "" {
            args.append(&mut vec![String::from("-file"), self.file.clone()]);
        }
        if self.var_stream_map != "" {
            args.append(&mut vec![
                String::from("-var_stream_map"),
                self.var_stream_map.clone(),
            ]);
        }
        if self.vsync != "" {
            args.append(&mut vec![String::from("-vsync"), self.vsync.clone()]);
        }
        if self.g > 0 {
            args.append(&mut vec![String::from("-g"), self.g.to_string()]);
        }
        if self.hls_segment_type != "" {
            args.append(&mut vec![
                String::from("-hls_segment_type"),
                self.hls_segment_type.clone(),
            ]);
        }
        if self.hls_flags != "" {
            args.append(&mut vec![
                String::from("-hls_flags"),
                self.hls_flags.clone(),
            ]);
        }
        if self.hls_playlist_type != "" {
            args.append(&mut vec![
                String::from("-hls_playlist_type"),
                self.hls_playlist_type.clone(),
            ]);
        }
        if self.hls_time > 0 {
            args.append(&mut vec![
                String::from("-hls_time"),
                self.hls_time.to_string(),
            ]);
        }
        if self.master_pl_name != "" {
            args.append(&mut vec![
                String::from("-master_pl_name"),
                self.master_pl_name.clone(),
            ]);
        }
        if self.hls_segment_filename != "" {
            args.append(&mut vec![
                String::from("-hls_segment_filename"),
                self.hls_segment_filename.clone(),
            ]);
        }
        if self.hls_key_info_file != "" {
            args.append(&mut vec![
                String::from("-hls_key_info_file"),
                self.hls_key_info_file.clone(),
            ]);
        }
        if self.vframes > 0 {
            args.append(&mut vec![
                String::from("-vframes"),
                self.vframes.to_string(),
            ]);
        }

        args
    }
}

#[derive(Clone)]
pub struct Outputs {
    outputs: Vec<Output>,
}

impl Outputs {
    pub fn new() -> Self {
        Outputs {
            outputs: Vec::new(),
        }
    }

    pub fn add(&mut self, o: Output) -> &mut Self {
        self.outputs.push(o);
        self
    }

    pub fn params(&mut self) -> Vec<String> {
        let mut output_strs = Vec::new();
        for output in self.outputs.clone() {
            output_strs.append(&mut output.params());
        }
        output_strs
    }
}
