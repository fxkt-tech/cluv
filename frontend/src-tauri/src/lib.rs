mod commands;
mod history;
mod material_manager;
mod models;
mod paths;
mod resources;

use commands::{
    add_material_by_path, create_project, delete_material, delete_project,
    get_default_projects_dir, get_material, get_project_by_id, import_material, import_resource,
    import_resource_file, list_materials, list_projects_history, list_resources, open_project_dir,
    update_project_last_modified,
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
            import_resource_file,
            open_project_dir,
            delete_project,
            list_projects_history,
            get_project_by_id,
            update_project_last_modified,
            get_default_projects_dir,
            import_material,
            delete_material,
            list_materials,
            get_material,
            add_material_by_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
