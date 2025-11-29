use crate::models::ProjectHistory;
use crate::paths::get_histories_file;
use std::fs;
use tauri::AppHandle;

/// Load project histories from file
pub fn load_histories(app: &AppHandle) -> Result<Vec<ProjectHistory>, String> {
    let histories_file = get_histories_file(app)?;

    if !histories_file.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&histories_file)
        .map_err(|e| format!("Failed to read histories file: {}", e))?;

    let histories: Vec<ProjectHistory> =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse histories: {}", e))?;

    Ok(histories)
}

/// Save project histories to file
pub fn save_histories(app: &AppHandle, histories: &[ProjectHistory]) -> Result<(), String> {
    let histories_file = get_histories_file(app)?;

    let json = serde_json::to_string_pretty(&histories)
        .map_err(|e| format!("Failed to serialize histories: {}", e))?;

    fs::write(&histories_file, json)
        .map_err(|e| format!("Failed to write histories file: {}", e))?;

    Ok(())
}
