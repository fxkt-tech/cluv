use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Get KivaCut data directory path
pub fn get_kiva_cut_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;
    let kiva_cut_dir = data_dir.join("KivaCut");

    // Create directory if it doesn't exist
    if !kiva_cut_dir.exists() {
        fs::create_dir_all(&kiva_cut_dir)
            .map_err(|e| format!("Failed to create KivaCut directory: {}", e))?;
    }

    Ok(kiva_cut_dir)
}

/// Get projects directory path
pub fn get_projects_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let kiva_cut_dir = get_kiva_cut_dir(app)?;
    let projects_dir = kiva_cut_dir.join("projects");

    if !projects_dir.exists() {
        fs::create_dir_all(&projects_dir)
            .map_err(|e| format!("Failed to create projects directory: {}", e))?;
    }

    Ok(projects_dir)
}

/// Get histories.json file path
pub fn get_histories_file(app: &AppHandle) -> Result<PathBuf, String> {
    let kiva_cut_dir = get_kiva_cut_dir(app)?;
    Ok(kiva_cut_dir.join("histories.json"))
}
