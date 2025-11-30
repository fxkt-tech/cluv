//! Material management based on protocol.json
//! Manages materials (videos, audios, images) by reading/writing to protocol.json
//! Following the kiva-cut Editor protocol structure

use serde_json::{Value, json};
use std::fs;
use std::path::PathBuf;
use uuid::Uuid;

/// Material type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MaterialType {
    Video,
    Audio,
    Image,
}

impl MaterialType {
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
pub fn load_protocol(project_path: &str) -> Result<Value, String> {
    let protocol_path = PathBuf::from(project_path).join("protocol.json");

    if !protocol_path.exists() {
        return Err(format!(
            "Protocol file not found: {}",
            protocol_path.display()
        ));
    }

    let content = fs::read_to_string(&protocol_path)
        .map_err(|e| format!("Failed to read protocol file: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse protocol file: {}", e))
}

/// Save protocol.json file
pub fn save_protocol(project_path: &str, protocol: &Value) -> Result<(), String> {
    let protocol_path = PathBuf::from(project_path).join("protocol.json");

    let content = serde_json::to_string_pretty(protocol)
        .map_err(|e| format!("Failed to serialize protocol: {}", e))?;

    fs::write(&protocol_path, content).map_err(|e| format!("Failed to write protocol file: {}", e))
}

/// Add a material to the protocol
pub fn add_material_to_protocol(
    project_path: &str,
    material_src: &str,
    material_type: MaterialType,
) -> Result<ProtocolMaterial, String> {
    let mut protocol = load_protocol(project_path)?;

    // Ensure materials section exists
    if protocol["materials"].is_null() {
        protocol["materials"] = json!({
            "videos": [],
            "images": [],
            "audios": []
        });
    }

    let material_id = Uuid::new_v4().to_string();
    let material_section = material_type.as_str();

    // Create material object based on type (following kiva-cut protocol structure)
    let material_obj = match material_type {
        MaterialType::Video => json!({
            "id": material_id,
            "src": material_src,
            "dimension": {
                "width": 0,
                "height": 0
            }
        }),
        MaterialType::Audio => json!({
            "id": material_id,
            "src": material_src
        }),
        MaterialType::Image => json!({
            "id": material_id,
            "src": material_src,
            "dimension": {
                "width": 0,
                "height": 0
            }
        }),
    };

    // Add to protocol
    protocol["materials"][material_section]
        .as_array_mut()
        .ok_or_else(|| format!("Materials {} is not an array", material_section))?
        .push(material_obj);

    save_protocol(project_path, &protocol)?;

    Ok(ProtocolMaterial {
        id: material_id,
        src: material_src.to_string(),
        material_type,
    })
}

/// Remove a material from the protocol
pub fn remove_material_from_protocol(project_path: &str, material_id: &str) -> Result<(), String> {
    let mut protocol = load_protocol(project_path)?;

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

    save_protocol(project_path, &protocol)?;

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
    let protocol = load_protocol(project_path)?;
    let mut materials = Vec::new();

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
pub fn import_material_file(
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
}

/// Get material by ID from protocol
pub fn get_material_from_protocol(
    project_path: &str,
    material_id: &str,
) -> Result<ProtocolMaterial, String> {
    let protocol = load_protocol(project_path)?;

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

/// Import a material from base64 content
pub fn import_material_from_base64(
    project_path: &str,
    file_name: &str,
    base64_content: &str,
) -> Result<ProtocolMaterial, String> {
    use base64::engine::Engine;

    // Create materials directory if not exists
    let materials_dir = PathBuf::from(project_path).join("materials");
    fs::create_dir_all(&materials_dir)
        .map_err(|e| format!("Failed to create materials directory: {}", e))?;

    let dest_path = materials_dir.join(file_name);

    // Decode base64 content
    let decoded = base64::engine::general_purpose::STANDARD
        .decode(base64_content)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    fs::write(&dest_path, decoded).map_err(|e| format!("Failed to write material file: {}", e))?;

    // Detect material type from file name extension
    let ext = PathBuf::from(file_name)
        .extension()
        .ok_or_else(|| "Cannot determine file type".to_string())?
        .to_string_lossy()
        .to_string();

    let material_type = MaterialType::from_extension(&ext)
        .ok_or_else(|| format!("Unsupported file type: {}", ext))?;

    // Add to protocol
    let dest_str = dest_path.to_string_lossy().to_string();
    add_material_to_protocol(project_path, &dest_str, material_type)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_material_type_from_extension() {
        assert_eq!(
            MaterialType::from_extension("mp4"),
            Some(MaterialType::Video)
        );
        assert_eq!(
            MaterialType::from_extension("mp3"),
            Some(MaterialType::Audio)
        );
        assert_eq!(
            MaterialType::from_extension("jpg"),
            Some(MaterialType::Image)
        );
        assert_eq!(MaterialType::from_extension("unknown"), None);
    }

    #[test]
    fn test_material_type_as_str() {
        assert_eq!(MaterialType::Video.as_str(), "videos");
        assert_eq!(MaterialType::Audio.as_str(), "audios");
        assert_eq!(MaterialType::Image.as_str(), "images");
    }
}
