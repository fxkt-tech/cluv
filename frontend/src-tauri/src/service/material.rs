use anyhow::{Result, anyhow, bail};
use kiva_cut::Editor;
use std::fs;
use std::path::Path;
use std::path::PathBuf;

use crate::models::Resource;

/// get protocol.json filepath in project
pub fn get_protocol_file(project_path: &str) -> Result<PathBuf> {
    let protocol_path = PathBuf::from(project_path).join("protocol.json");
    if !protocol_path.exists() {
        bail!("合成协议不存在: {}", protocol_path.display());
    }
    Ok(protocol_path)
}

/// get protocol.json content in project
pub fn get_protocol_content(project_path: &str) -> Result<String> {
    let protocol_file = get_protocol_file(project_path)?;
    let mut editor = Editor::new();
    editor.load_from_file(&protocol_file)?;
    let json_content = editor.save_to_json()?;
    Ok(json_content)
}

/// get protocol.json content in project
pub fn save_protocol_content(project_path: &str, proto_content: &str) -> Result<()> {
    let protocol_file = get_protocol_file(project_path)?;
    let mut editor = Editor::new();
    editor.load_from_file(&protocol_file)?;
    editor.load_from_json(proto_content)?;
    let json_content = editor.save_to_json()?;
    fs::write(&protocol_file, json_content)?;
    Ok(())
}

/// get materials directory path in project
pub fn get_material_dir(project_path: &str) -> Result<PathBuf> {
    let materials_dir = PathBuf::from(project_path).join("materials");
    fs::create_dir_all(&materials_dir)?;
    Ok(materials_dir)
}

/// --

/// Import a material file to project
pub async fn import_material_from_source(
    project_path: &str,
    source_path: &str,
) -> Result<Resource> {
    let protocol_file = get_protocol_file(project_path)?;
    let mut editor = Editor::new();
    editor.load_from_file(&protocol_file)?;
    let materials_dir = get_material_dir(project_path)?;

    let source_file = PathBuf::from(source_path);

    // Copy file to materials directory
    let file_name = source_file
        .file_name()
        .ok_or_else(|| anyhow!("无效的文件地址"))?;
    let dest_file = materials_dir.join(file_name);

    fs::copy(&source_file, &dest_file)?;

    // Add to protocol
    let dest_str = dest_file.to_string_lossy().to_string();

    let material_id = editor.add_material(&dest_str).await?;

    editor.fix_materials().await?;

    editor.save_to_file(&protocol_file)?;

    Ok(Resource {
        id: material_id,
        name: Path::new(&dest_str)
            .file_name()
            .and_then(|name| name.to_str())
            .unwrap_or("unknown")
            .to_string(),
        src: dest_str,
        resource_type: "media".to_string(),
        material_type: "video".to_string(),
    })
}

/// List all materials
pub fn list_all_materials(project_path: &str) -> Result<Vec<Resource>> {
    let protocol_file = get_protocol_file(project_path)?;
    let mut editor = Editor::new();
    editor.load_from_file(&protocol_file)?;

    let materials = editor
        .list_materials()
        .into_iter()
        .map(|material| Resource {
            id: material.id().to_string(),
            name: Path::new(&material.src())
                .file_name()
                .and_then(|name| name.to_str())
                .unwrap_or("unknown")
                .to_string(),
            src: material.src().to_string(),
            resource_type: "media".to_string(),
            material_type: material.material_type().to_string(),
        })
        .collect();

    Ok(materials)
}

/// Remove a material from the protocol
pub fn remove_material(project_path: &str, material_id: &str) -> Result<()> {
    let protocol_file = get_protocol_file(project_path)?;
    let mut editor = Editor::new();
    editor.load_from_file(&protocol_file)?;

    let material = editor.query_material(material_id)?;
    println!("remove {} {}", material.id(), material.src());
    fs::remove_file(material.src())?;

    editor.delete_material(material_id)?;

    editor.save_to_file(&protocol_file)?;

    Ok(())
}
