mod commands;
mod history;
mod material_manager;
mod models;
mod paths;

use commands::{
    create_project, delete_material, delete_project, get_default_projects_dir, get_project_by_id,
    import_material, list_materials, list_projects_history, open_project_dir,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
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
            open_project_dir,
            delete_project,
            list_projects_history,
            get_project_by_id,
            get_default_projects_dir,
            import_material,
            list_materials,
            delete_material,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
