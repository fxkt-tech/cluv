use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectHistory {
    pub id: String,
    pub name: String,
    pub path: String,
    pub create_time: String,
    pub last_modified: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Resource {
    pub id: String,
    pub name: String,
    pub src: String,
    pub resource_type: String,
    pub material_type: String,
}
