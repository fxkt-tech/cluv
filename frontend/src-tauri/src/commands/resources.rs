use crate::resources::{import_resource_to_project, list_resources_in_dir};

/// List all resources in a project
#[tauri::command]
pub fn list_resources(project_path: String) -> Result<Vec<crate::models::Resource>, String> {
    list_resources_in_dir(&project_path)
}

/// Import a resource into project
#[tauri::command]
pub fn import_resource(
    project_path: String,
    source_path: String,
) -> Result<crate::models::Resource, String> {
    import_resource_to_project(&project_path, &source_path)
}
