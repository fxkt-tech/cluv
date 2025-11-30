use crate::history::{load_histories, save_histories};
use crate::models::ProjectHistory;
use crate::paths::get_projects_dir;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

/// Create a new project directory structure
#[tauri::command]
pub fn create_project(
    app: AppHandle,
    project_name: String,
    project_path: String,
) -> Result<ProjectHistory, String> {
    // Generate project ID from UUID
    let project_id = uuid::Uuid::new_v4().to_string();

    // Project directory is named using the project ID
    let base_path = PathBuf::from(&project_path).join(&project_id);

    // Create main project directory
    fs::create_dir_all(&base_path)
        .map_err(|e| format!("Failed to create project directory: {}", e))?;

    // Create materials directory for imported files
    let materials_dir = base_path.join("materials");
    fs::create_dir_all(&materials_dir)
        .map_err(|e| format!("Failed to create materials directory: {}", e))?;

    // Create output directory
    let output_dir = base_path.join("output");
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Create protocol file following kiva-cut Editor protocol structure
    let protocol_path = base_path.join("protocol.json");
    let protocol_template = serde_json::json!({
        "stage": {
            "width": 1920,
            "height": 1080
        },
        "materials": {
            "videos": [],
            "images": [],
            "audios": []
        },
        "tracks": []
    });

    fs::write(
        &protocol_path,
        serde_json::to_string_pretty(&protocol_template).unwrap(),
    )
    .map_err(|e| format!("Failed to write protocol file: {}", e))?;

    // Add to histories with the actual project path
    let now = chrono::Local::now().to_rfc3339();
    let mut histories = load_histories(&app)?;

    let history = ProjectHistory {
        id: project_id,
        name: project_name,
        path: base_path.to_string_lossy().to_string(),
        create_time: now.clone(),
        last_modified: now,
    };

    histories.push(history.clone());
    save_histories(&app, &histories)?;

    Ok(history)
}

/// Delete project and remove from history
#[tauri::command]
pub fn delete_project(app: AppHandle, project_id: String) -> Result<(), String> {
    let mut histories = load_histories(&app)?;

    if let Some(pos) = histories.iter().position(|h| h.id == project_id) {
        let project_path = histories[pos].path.clone();
        histories.remove(pos);
        save_histories(&app, &histories)?;

        // Delete project directory
        fs::remove_dir_all(&project_path)
            .map_err(|e| format!("Failed to delete project directory: {}", e))?;
    }

    Ok(())
}

/// List all projects from history
#[tauri::command]
pub fn list_projects_history(app: AppHandle) -> Result<Vec<ProjectHistory>, String> {
    let mut histories = load_histories(&app)?;

    // Filter out projects that no longer exist
    histories.retain(|h| PathBuf::from(&h.path).exists());

    // Update history file if any were removed
    if histories.len() < load_histories(&app).unwrap_or_default().len() {
        save_histories(&app, &histories)?;
    }

    // Sort by last_modified in descending order (newest first)
    histories.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));

    Ok(histories)
}

/// Get project info by ID
#[tauri::command]
pub fn get_project_by_id(app: AppHandle, id: String) -> Result<ProjectHistory, String> {
    let histories = load_histories(&app)?;

    histories
        .into_iter()
        .find(|h| h.id == id)
        .ok_or_else(|| "Project not found".to_string())
}

/// Get default projects directory
#[tauri::command]
pub fn get_default_projects_dir(app: AppHandle) -> Result<String, String> {
    let projects_dir = get_projects_dir(&app)?;
    Ok(projects_dir.to_string_lossy().to_string())
}

/// Open project directory
#[tauri::command]
pub fn open_project_dir(project_path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&project_path)
            .spawn()
            .map_err(|e| format!("Failed to open directory: {}", e))?;
    }

    Ok(())
}
