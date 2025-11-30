use crate::material_manager::import_material_file;
use crate::models::Resource;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

/// List all resources in a project
pub fn list_resources_in_dir(project_path: &str) -> Result<Vec<Resource>, String> {
    // First try to read from materials directory (new system)
    let materials_dir = PathBuf::from(project_path).join("materials");

    if materials_dir.exists() {
        let mut resources = Vec::new();

        for entry in fs::read_dir(&materials_dir)
            .map_err(|e| format!("Failed to read materials directory: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    let file_name_str = file_name.to_string_lossy().to_string();
                    let resource_type = path
                        .extension()
                        .unwrap_or_default()
                        .to_string_lossy()
                        .to_string();

                    resources.push(Resource {
                        id: Uuid::new_v4().to_string(),
                        name: file_name_str,
                        path: path.to_string_lossy().to_string(),
                        resource_type,
                    });
                }
            }
        }
        return Ok(resources);
    }

    // Fallback to resources directory (old system) for backward compatibility
    let resources_dir = PathBuf::from(project_path).join("resources");

    if !resources_dir.exists() {
        return Ok(Vec::new());
    }

    let mut resources = Vec::new();

    for entry in fs::read_dir(&resources_dir)
        .map_err(|e| format!("Failed to read resources directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(file_name) = path.file_name() {
                let file_name_str = file_name.to_string_lossy().to_string();
                let resource_type = path
                    .extension()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .to_string();

                resources.push(Resource {
                    id: Uuid::new_v4().to_string(),
                    name: file_name_str,
                    path: path.to_string_lossy().to_string(),
                    resource_type,
                });
            }
        }
    }

    Ok(resources)
}

/// Import a resource into project
pub fn import_resource_to_project(
    project_path: &str,
    source_path: &str,
) -> Result<Resource, String> {
    // Use the new Material system which saves to protocol.json and materials/ directory
    let protocol_material = import_material_file(project_path, source_path)?;

    Ok(Resource {
        id: protocol_material.id,
        name: source_path
            .split('\\')
            .last()
            .or_else(|| source_path.split('/').last())
            .unwrap_or("unknown")
            .to_string(),
        path: protocol_material.src,
        resource_type: match protocol_material.material_type {
            crate::material_manager::MaterialType::Video => "video",
            crate::material_manager::MaterialType::Audio => "audio",
            crate::material_manager::MaterialType::Image => "image",
        }
        .to_string(),
    })
}

/// Import a resource into project from base64 content
pub fn import_resource_from_base64(
    project_path: &str,
    file_name: &str,
    base64_content: &str,
) -> Result<Resource, String> {
    // Use the new Material system which saves to protocol.json and materials/ directory
    let protocol_material = crate::material_manager::import_material_from_base64(
        project_path,
        file_name,
        base64_content,
    )?;

    Ok(Resource {
        id: protocol_material.id,
        name: file_name.to_string(),
        path: protocol_material.src,
        resource_type: match protocol_material.material_type {
            crate::material_manager::MaterialType::Video => "video",
            crate::material_manager::MaterialType::Audio => "audio",
            crate::material_manager::MaterialType::Image => "image",
        }
        .to_string(),
    })
}
