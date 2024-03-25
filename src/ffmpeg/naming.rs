use rand::Rng;
pub fn gen() -> String {
    let mut rng = rand::thread_rng();
    format!("{:x}", rng.gen::<u32>())
}
