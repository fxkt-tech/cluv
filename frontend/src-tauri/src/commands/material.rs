use crate::models::Resource;
use crate::service::material::{import_material_from_source, list_all_materials, remove_material};

/// Import a material file (video, audio, or image) to the project
/// The file will be copied to the materials directory and added to protocol.json
#[tauri::command]
pub async fn import_material(
    project_path: String,
    source_path: String,
) -> Result<Resource, String> {
    let material = import_material_from_source(&project_path, &source_path)
        .await
        .map_err(|e| e.to_string())?;

    Ok(material)
}

/// List all materials in the project
/// Reads from protocol.json instead of scanning the filesystem
#[tauri::command]
pub fn list_materials(project_path: String) -> Result<Vec<Resource>, String> {
    list_all_materials(&project_path).map_err(|e| e.to_string())
}

/// Delete a material from the project by its ID
/// Removes the material from protocol.json and deletes the file
#[tauri::command]
pub fn delete_material(project_path: String, material_id: String) -> Result<(), String> {
    remove_material(&project_path, &material_id).map_err(|e| e.to_string())
}
