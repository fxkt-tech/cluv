use crate::material_manager::{
    MaterialType, import_material_file, list_materials_from_protocol, remove_material_from_protocol,
};
use crate::models::Resource;

/// Import a material file (video, audio, or image) to the project
/// The file will be copied to the materials directory and added to protocol.json
#[tauri::command]
pub fn import_material(project_path: String, source_path: String) -> Result<Resource, String> {
    let material = import_material_file(&project_path, &source_path)?;

    Ok(Resource {
        id: material.id,
        name: source_path
            .split('\\')
            .last()
            .or_else(|| source_path.split('/').last())
            .unwrap_or("unknown")
            .to_string(),
        path: material.src,
        resource_type: match material.material_type {
            MaterialType::Video => "video",
            MaterialType::Audio => "audio",
            MaterialType::Image => "image",
        }
        .to_string(),
    })
}

/// Delete a material from the project by its ID
/// Removes the material from protocol.json and deletes the file
#[tauri::command]
pub fn delete_material(project_path: String, material_id: String) -> Result<(), String> {
    remove_material_from_protocol(&project_path, &material_id)
}

/// List all materials in the project
/// Reads from protocol.json instead of scanning the filesystem
#[tauri::command]
pub fn list_materials(project_path: String) -> Result<Vec<Resource>, String> {
    let materials = list_materials_from_protocol(&project_path)?;

    let resources = materials
        .into_iter()
        .map(|material| Resource {
            id: material.id,
            name: material
                .src
                .split('\\')
                .last()
                .or_else(|| material.src.split('/').last())
                .unwrap_or("unknown")
                .to_string(),
            path: material.src,
            resource_type: match material.material_type {
                MaterialType::Video => "video",
                MaterialType::Audio => "audio",
                MaterialType::Image => "image",
            }
            .to_string(),
        })
        .collect();

    Ok(resources)
}
