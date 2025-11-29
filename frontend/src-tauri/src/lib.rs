mod commands;
mod history;
mod models;
mod paths;
mod resources;

use commands::{
    create_project, delete_project, get_default_projects_dir, get_project_by_id, import_resource,
    list_projects_history, list_resources, open_project_dir, update_project_last_modified,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            create_project,
            list_resources,
            import_resource,
            open_project_dir,
            delete_project,
            list_projects_history,
            get_project_by_id,
            update_project_last_modified,
            get_default_projects_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
