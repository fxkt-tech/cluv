use anyhow::{Result, anyhow, bail};
use kiva_cut::Editor;
use std::fs;
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

    editor.save_to_file(&protocol_file)?;

    // Get the material info from protocol to access the name field
    let protocol = editor.save_to_protocol();

    // Find the material in protocol by ID
    let mut resource_name = String::from("unknown");
    let mut material_type = String::from("video");

    // Search in videos
    if let Some(video) = protocol
        .materials
        .videos
        .iter()
        .find(|v| v.id == material_id)
    {
        resource_name = video.name.clone();
        material_type = "video".to_string();
    }
    // Search in audios
    else if let Some(audio) = protocol
        .materials
        .audios
        .iter()
        .find(|a| a.id == material_id)
    {
        resource_name = audio.name.clone();
        material_type = "audio".to_string();
    }
    // Search in images
    else if let Some(image) = protocol
        .materials
        .images
        .iter()
        .find(|i| i.id == material_id)
    {
        resource_name = image.name.clone();
        material_type = "image".to_string();
    }

    Ok(Resource {
        id: material_id,
        name: resource_name,
        src: dest_str,
        resource_type: "media".to_string(),
        material_type,
    })
}

/// List all materials
pub fn list_all_materials(project_path: &str) -> Result<Vec<Resource>> {
    let protocol_file = get_protocol_file(project_path)?;
    let mut editor = Editor::new();
    editor.load_from_file(&protocol_file)?;

    let protocol = editor.save_to_protocol();
    let mut materials = Vec::new();

    // Get video materials from protocol
    for video in &protocol.materials.videos {
        materials.push(Resource {
            id: video.id.clone(),
            name: video.name.clone(),
            src: video.src.clone(),
            resource_type: "media".to_string(),
            material_type: "video".to_string(),
        });
    }

    // Get audio materials from protocol
    for audio in &protocol.materials.audios {
        materials.push(Resource {
            id: audio.id.clone(),
            name: audio.name.clone(),
            src: audio.src.clone(),
            resource_type: "media".to_string(),
            material_type: "audio".to_string(),
        });
    }

    // Get image materials from protocol
    for image in &protocol.materials.images {
        materials.push(Resource {
            id: image.id.clone(),
            name: image.name.clone(),
            src: image.src.clone(),
            resource_type: "media".to_string(),
            material_type: "image".to_string(),
        });
    }

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
