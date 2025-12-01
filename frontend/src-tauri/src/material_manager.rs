//! Material management based on protocol.json
//! Manages materials (videos, audios, images) by reading/writing to protocol.json
//! Following the kiva-cut Editor protocol structure

use kiva_cut::Editor;
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

/// Material type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MaterialType {
    Video,
    Audio,
    Image,
}

impl MaterialType {
    #[allow(dead_code)]
    pub fn as_str(&self) -> &str {
        match self {
            MaterialType::Video => "videos",
            MaterialType::Audio => "audios",
            MaterialType::Image => "images",
        }
    }

    /// Detect material type from file extension
    pub fn from_extension(ext: &str) -> Option<Self> {
        match ext.to_lowercase().as_str() {
            "mp4" | "avi" | "mov" | "mkv" | "flv" | "wmv" | "webm" => Some(MaterialType::Video),
            "mp3" | "wav" | "aac" | "flac" | "wma" | "m4a" | "ogg" => Some(MaterialType::Audio),
            "jpg" | "jpeg" | "png" | "gif" | "bmp" | "webp" | "svg" => Some(MaterialType::Image),
            _ => None,
        }
    }
}

/// Protocol material structure
#[derive(Debug, Clone)]
pub struct ProtocolMaterial {
    pub id: String,
    pub src: String,
    pub material_type: MaterialType,
}

/// Load protocol.json file
pub fn load_protocol(project_path: &str) -> Result<String, String> {
    let protocol_path = PathBuf::from(project_path).join("protocol.json");

    if !protocol_path.exists() {
        return Err(format!(
            "Protocol file not found: {}",
            protocol_path.display()
        ));
    }

    let content = fs::read_to_string(&protocol_path)
        .map_err(|e| format!("Failed to read protocol file: {}", e))?;

    Ok(content)

    // serde_json::from_str(&content).map_err(|e| format!("Failed to parse protocol file: {}", e))
}

/// Save protocol.json file
pub fn save_protocol(project_path: &str, protocol_json: &str) -> Result<(), String> {
    let protocol_path = PathBuf::from(project_path).join("protocol.json");

    fs::write(&protocol_path, protocol_json)
        .map_err(|e| format!("Failed to write protocol file: {}", e))
}

/// Add a material to the protocol
pub async fn add_material_to_protocol(
    project_path: &str,
    material_src: &str,
    material_type: MaterialType,
) -> Result<ProtocolMaterial, String> {
    let protocol = load_protocol(project_path)?;
    let mut editor = Editor::new();
    editor
        .load_from_json(protocol.as_str())
        .map_err(|e| format!("Failed to load protocol: {}", e))?;

    let material_id = match material_type {
        MaterialType::Video => editor
            .add_material(material_src)
            .await
            .map_err(|e| format!("Failed to add video material: {}", e))?,
        MaterialType::Audio => editor
            .add_material(material_src)
            .await
            .map_err(|e| format!("Failed to add audio material: {}", e))?,
        MaterialType::Image => editor
            .add_material(material_src)
            .await
            .map_err(|e| format!("Failed to add image material: {}", e))?,
    };

    let new_protocol = editor
        .save_to_json()
        .map_err(|e| format!("Failed to load protocol: {}", e))?;

    save_protocol(project_path, &new_protocol)?;

    Ok(ProtocolMaterial {
        id: material_id,
        src: material_src.to_string(),
        material_type,
    })
}

/// Remove a material from the protocol
pub fn remove_material_from_protocol(project_path: &str, material_id: &str) -> Result<(), String> {
    let protocol_str = load_protocol(project_path)?;
    let mut protocol: Value = serde_json::from_str(&protocol_str)
        .map_err(|e| format!("Failed to parse protocol: {}", e))?;

    // Try to find and remove the material from all sections
    let material_types = ["videos", "audios", "images"];
    let mut found = false;

    for material_type in &material_types {
        if let Some(materials) = protocol["materials"][material_type].as_array_mut() {
            if let Some(pos) = materials
                .iter()
                .position(|m| m.get("id").and_then(|id| id.as_str()) == Some(material_id))
            {
                materials.remove(pos);
                found = true;
                break;
            }
        }
    }

    if !found {
        return Err(format!("Material not found: {}", material_id));
    }

    // Save the updated protocol
    let updated_json = serde_json::to_string_pretty(&protocol)
        .map_err(|e| format!("Failed to serialize protocol: {}", e))?;
    save_protocol(project_path, &updated_json)?;

    // Remove the actual file from materials directory if it exists
    let materials_dir = PathBuf::from(project_path).join("materials");
    if materials_dir.exists() {
        let protocol_materials = &protocol["materials"];
        for material_type in &material_types {
            if let Some(materials) = protocol_materials[material_type].as_array() {
                for material in materials {
                    if let Some(src) = material.get("src").and_then(|s| s.as_str()) {
                        let file_path = PathBuf::from(src);
                        if file_path.exists() && file_path.parent() == Some(&materials_dir) {
                            let _ = fs::remove_file(&file_path);
                        }
                    }
                }
            }
        }
    }

    Ok(())
}

/// List all materials from protocol
pub fn list_materials_from_protocol(project_path: &str) -> Result<Vec<ProtocolMaterial>, String> {
    let protocol_str = load_protocol(project_path)?;
    println!("Protocol string: {}", protocol_str);
    let protocol: Value = serde_json::from_str(&protocol_str)
        .map_err(|e| format!("Failed to parse protocol: {}", e))?;
    let mut materials = Vec::new();

    println!("Protocol JSON: {:?}", protocol["materials"]);

    let material_types = [
        (MaterialType::Video, "videos"),
        (MaterialType::Audio, "audios"),
        (MaterialType::Image, "images"),
    ];

    for (mat_type, section_name) in &material_types {
        if let Some(materials_array) = protocol["materials"][section_name].as_array() {
            for material in materials_array {
                if let (Some(id), Some(src)) = (
                    material.get("id").and_then(|v| v.as_str()),
                    material.get("src").and_then(|v| v.as_str()),
                ) {
                    materials.push(ProtocolMaterial {
                        id: id.to_string(),
                        src: src.to_string(),
                        material_type: *mat_type,
                    });
                }
            }
        }
    }

    Ok(materials)
}

/// Import a material file to project
pub async fn import_material_file(
    project_path: &str,
    source_path: &str,
) -> Result<ProtocolMaterial, String> {
    let source = PathBuf::from(source_path);
    if !source.exists() {
        return Err("Source file does not exist".to_string());
    }

    // Detect material type from extension
    let ext = source
        .extension()
        .ok_or_else(|| "Cannot determine file type".to_string())?
        .to_string_lossy()
        .to_string();

    let material_type = MaterialType::from_extension(&ext)
        .ok_or_else(|| format!("Unsupported file type: {}", ext))?;

    // Create materials directory if not exists
    let materials_dir = PathBuf::from(project_path).join("materials");
    fs::create_dir_all(&materials_dir)
        .map_err(|e| format!("Failed to create materials directory: {}", e))?;

    // Copy file to materials directory
    let file_name = source
        .file_name()
        .ok_or_else(|| "Invalid source path".to_string())?;
    let dest_path = materials_dir.join(file_name);

    fs::copy(&source, &dest_path).map_err(|e| format!("Failed to copy material file: {}", e))?;

    // Add to protocol
    let dest_str = dest_path.to_string_lossy().to_string();
    add_material_to_protocol(project_path, &dest_str, material_type)
        .await
        .map_err(|e| format!("{}", e))
}

/// Get material by ID from protocol
#[allow(dead_code)]
pub fn get_material_from_protocol(
    project_path: &str,
    material_id: &str,
) -> Result<ProtocolMaterial, String> {
    let protocol_str = load_protocol(project_path)?;
    let protocol: Value = serde_json::from_str(&protocol_str)
        .map_err(|e| format!("Failed to parse protocol: {}", e))?;

    let material_types = [
        (MaterialType::Video, "videos"),
        (MaterialType::Audio, "audios"),
        (MaterialType::Image, "images"),
    ];

    for (mat_type, section_name) in &material_types {
        if let Some(materials_array) = protocol["materials"][section_name].as_array() {
            for material in materials_array {
                if material.get("id").and_then(|v| v.as_str()) == Some(material_id) {
                    if let Some(src) = material.get("src").and_then(|v| v.as_str()) {
                        return Ok(ProtocolMaterial {
                            id: material_id.to_string(),
                            src: src.to_string(),
                            material_type: *mat_type,
                        });
                    }
                }
            }
        }
    }

    Err(format!("Material not found: {}", material_id))
}
