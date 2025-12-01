//! Video editing and composition module
//!
//! This module provides functionality for video editing operations including
//! track-based composition, material management, and export capabilities.

pub mod editor;
pub mod material;
pub mod protocol;
pub mod segment;
pub mod stage;
pub mod track;

// Re-export main types
pub use editor::Editor;
pub use material::{
    AudioMaterial, Dimension, ImageMaterial, Material, MaterialType, VideoMaterial,
};
pub use protocol::{CutProtocol, ExportConfig, ExportType};
pub use segment::{Position, Scale, Segment, TimeRange};
pub use stage::Stage;
pub use track::{Track, TrackType};

use crate::error::{CutError, Result};
use serde::{Deserialize, Serialize};

/// Main editing session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EditSession {
    /// Stage configuration
    pub stage: Stage,
    /// Available materials
    pub materials: Vec<Material>,
    /// Composition tracks
    pub tracks: Vec<Track>,
}

impl EditSession {
    /// Create a new editing session
    pub fn new(stage: Stage) -> Self {
        Self {
            stage,
            materials: Vec::new(),
            tracks: Vec::new(),
        }
    }

    /// Add a material to the session
    pub fn add_material(&mut self, material: Material) -> &mut Self {
        self.materials.push(material);
        self
    }

    /// Add a track to the session
    pub fn add_track(&mut self, track: Track) -> &mut Self {
        self.tracks.push(track);
        self
    }

    /// Get material by ID
    pub fn get_material(&self, id: &str) -> Option<&Material> {
        self.materials.iter().find(|m| m.id() == id)
    }

    /// Get track by ID
    pub fn get_track(&self, id: &str) -> Option<&Track> {
        self.tracks.iter().find(|t| t.id == id)
    }

    /// Get mutable track by ID
    pub fn get_track_mut(&mut self, id: &str) -> Option<&mut Track> {
        self.tracks.iter_mut().find(|t| t.id == id)
    }

    /// Validate the editing session
    pub fn validate(&self) -> Result<()> {
        // Validate stage
        if self.stage.width <= 0 || self.stage.height <= 0 {
            return Err(CutError::invalid_params(
                "Stage dimensions must be positive",
            ));
        }

        // Validate materials
        for material in &self.materials {
            material.validate()?;
        }

        // Validate tracks
        for track in &self.tracks {
            track.validate()?;

            // Check if all referenced materials exist
            for segment in &track.segments {
                if self.get_material(&segment.material_id).is_none() {
                    return Err(CutError::invalid_params(format!(
                        "Material '{}' not found",
                        segment.material_id
                    )));
                }
            }
        }

        Ok(())
    }

    /// Calculate total duration of the session
    pub fn total_duration(&self) -> u32 {
        self.tracks
            .iter()
            .map(|track| track.duration())
            .max()
            .unwrap_or(0)
    }

    /// Get all video tracks
    pub fn video_tracks(&self) -> Vec<&Track> {
        self.tracks
            .iter()
            .filter(|t| t.track_type == TrackType::Video)
            .collect()
    }

    /// Get all audio tracks
    pub fn audio_tracks(&self) -> Vec<&Track> {
        self.tracks
            .iter()
            .filter(|t| t.track_type == TrackType::Audio)
            .collect()
    }

    /// Convert to cut protocol format
    pub fn to_protocol(&self) -> CutProtocol {
        protocol::CutProtocol::from_session(self)
    }

    /// Create from cut protocol format
    pub fn from_protocol(protocol: &CutProtocol) -> Result<Self> {
        protocol::CutProtocol::to_session(protocol)
    }
}

impl Default for EditSession {
    fn default() -> Self {
        Self::new(Stage::new(1920, 1080))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        cut::{AudioMaterial, VideoMaterial},
        ffmpeg::codec::AudioCodec,
    };

    #[test]
    fn test_edit_session_creation() {
        let stage = Stage::new(1280, 720);
        let session = EditSession::new(stage);

        assert_eq!(session.stage.width, 1280);
        assert_eq!(session.stage.height, 720);
        assert!(session.materials.is_empty());
        assert!(session.tracks.is_empty());
    }

    #[test]
    fn test_add_materials_and_tracks() {
        let mut session = EditSession::new(Stage::new(1920, 1080));

        let video_material = Material::Video(VideoMaterial {
            id: "video1".to_string(),
            src: "test.mp4".to_string(),
            dimension: Dimension {
                width: 1920,
                height: 1080,
            },
            duration: Some(0),
            fps: Some(30.),
            codec: Some("h264".to_string()),
            bitrate: Some(0),
        });

        let audio_material = Material::Audio(AudioMaterial {
            id: "audio1".to_string(),
            src: "test.wav".to_string(),
            duration: Some(0),
            codec: Some(AudioCodec::PCM.to_string()),
            bitrate: Some(0),
            sample_rate: Some(44100),
            channels: Some(2),
        });

        session.add_material(video_material);
        session.add_material(audio_material);

        let video_track = Track::new("track1".to_string(), TrackType::Video);
        let audio_track = Track::new("track2".to_string(), TrackType::Audio);

        session.add_track(video_track);
        session.add_track(audio_track);

        assert_eq!(session.materials.len(), 2);
        assert_eq!(session.tracks.len(), 2);
    }

    #[test]
    fn test_get_material_by_id() {
        let mut session = EditSession::new(Stage::new(1920, 1080));

        let material = Material::Video(VideoMaterial {
            id: "video1".to_string(),
            src: "test.mp4".to_string(),
            dimension: Dimension {
                width: 1920,
                height: 1080,
            },
            duration: Some(0),
            fps: Some(30.),
            codec: Some("h264".to_string()),
            bitrate: Some(0),
        });

        session.add_material(material);

        let found = session.get_material("video1");
        assert!(found.is_some());
        assert_eq!(found.unwrap().id(), "video1");

        let not_found = session.get_material("video2");
        assert!(not_found.is_none());
    }

    #[test]
    fn test_validation() {
        let session = EditSession::new(Stage::new(1920, 1080));
        assert!(session.validate().is_ok());

        let invalid_session = EditSession::new(Stage::new(0, 1080));
        assert!(invalid_session.validate().is_err());
    }

    #[test]
    fn test_track_filtering() {
        let mut session = EditSession::new(Stage::new(1920, 1080));

        session.add_track(Track::new("video1".to_string(), TrackType::Video));
        session.add_track(Track::new("audio1".to_string(), TrackType::Audio));
        session.add_track(Track::new("video2".to_string(), TrackType::Video));

        let video_tracks = session.video_tracks();
        let audio_tracks = session.audio_tracks();

        assert_eq!(video_tracks.len(), 2);
        assert_eq!(audio_tracks.len(), 1);
    }
}
