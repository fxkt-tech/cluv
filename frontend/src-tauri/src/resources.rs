use crate::models::Resource;
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

/// List all resources in a project
pub fn list_resources_in_dir(project_path: &str) -> Result<Vec<Resource>, String> {
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
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err("Source file does not exist".to_string());
    }

    let resources_dir = PathBuf::from(project_path).join("resources");
    if !resources_dir.exists() {
        fs::create_dir_all(&resources_dir)
            .map_err(|e| format!("Failed to create resources directory: {}", e))?;
    }

    let file_name = source
        .file_name()
        .ok_or_else(|| "Invalid source path".to_string())?;
    let dest_path = resources_dir.join(file_name);

    fs::copy(&source, &dest_path).map_err(|e| format!("Failed to copy resource: {}", e))?;

    let resource_type = dest_path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    Ok(Resource {
        id: Uuid::new_v4().to_string(),
        name: file_name.to_string_lossy().to_string(),
        path: dest_path.to_string_lossy().to_string(),
        resource_type,
    })
}

/// Import a resource into project from base64 content
pub fn import_resource_from_base64(
    project_path: &str,
    file_name: &str,
    base64_content: &str,
) -> Result<Resource, String> {
    use base64::engine::Engine;

    let resources_dir = PathBuf::from(project_path).join("resources");
    if !resources_dir.exists() {
        fs::create_dir_all(&resources_dir)
            .map_err(|e| format!("Failed to create resources directory: {}", e))?;
    }

    let dest_path = resources_dir.join(file_name);

    // Decode base64 content
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(base64_content)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    fs::write(&dest_path, decoded).map_err(|e| format!("Failed to write resource: {}", e))?;

    let resource_type = dest_path
        .extension()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    Ok(Resource {
        id: Uuid::new_v4().to_string(),
        name: file_name.to_string(),
        path: dest_path.to_string_lossy().to_string(),
        resource_type,
    })
}
