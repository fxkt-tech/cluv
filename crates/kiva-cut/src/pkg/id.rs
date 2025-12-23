use sqids::Sqids;

pub fn generate_id() -> sqids::Result<String> {
    let sqids = Sqids::builder().min_length(20).build()?;
    // 获取当前时间戳
    let timestamp = chrono::Local::now().timestamp() as u64;
    // 获取一个1-10000之间的随机数
    let random_number = rand::random::<u64>() % 10000 + 1;

    sqids.encode(&[timestamp, random_number])
}
