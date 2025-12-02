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

    Ok(Resource {
        id: material.id,
        name: std::path::Path::new(&material.src)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown")
            .to_string(),
        src: material.src,
        resource_type: material.resource_type,
        material_type: material.material_type,
    })
}

/// List all materials in the project
/// Reads from protocol.json instead of scanning the filesystem
#[tauri::command]
pub fn list_materials(project_path: String) -> Result<Vec<Resource>, String> {
    let materials = list_all_materials(&project_path).map_err(|e| e.to_string())?;

    let resources = materials
        .into_iter()
        .map(|material| Resource {
            id: material.id,
            name: std::path::Path::new(&material.src)
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("unknown")
                .to_string(),
            src: material.src,
            resource_type: material.resource_type,
            material_type: material.material_type,
        })
        .collect();

    Ok(resources)
}

/// Delete a material from the project by its ID
/// Removes the material from protocol.json and deletes the file
#[tauri::command]
pub fn delete_material(project_path: String, material_id: String) -> Result<(), String> {
    remove_material(&project_path, &material_id).map_err(|e| e.to_string())
}
