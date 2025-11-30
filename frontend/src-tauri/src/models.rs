use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectHistory {
    pub id: String,
    pub name: String,
    pub path: String,
    pub create_time: String,
    pub last_modified: String,
}

// #[derive(Debug, Serialize, Deserialize, Clone)]
// pub struct ProjectMetadata {
//     pub name: String,
//     pub path: String,
//     pub created_at: String,
//     pub version: String,
// }

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Resource {
    pub id: String,
    pub name: String,
    pub path: String,
    pub resource_type: String,
}
