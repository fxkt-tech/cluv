use tauri::AppHandle;

use crate::service::{
    material::{get_protocol_content, save_protocol_content},
    paths::get_project_dir,
};

#[tauri::command]
pub async fn get_protocol(app: AppHandle, project_id: &str) -> Result<String, String> {
    let project_dir = get_project_dir(&app, project_id)?;
    let project_dir_str = project_dir
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?;
    let content = get_protocol_content(project_dir_str).map_err(|e| e.to_string())?;
    Ok(content)
}

#[tauri::command]
pub async fn save_protocol(
    app: AppHandle,
    project_id: &str,
    proto_content: &str,
) -> Result<(), String> {
    let project_dir = get_project_dir(&app, project_id)?;
    let project_dir_str = project_dir
        .to_str()
        .ok_or_else(|| "Invalid path encoding".to_string())?;
    save_protocol_content(project_dir_str, proto_content).map_err(|e| e.to_string())?;
    Ok(())
}
