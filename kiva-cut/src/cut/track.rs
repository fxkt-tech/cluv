//! Track management for video editing

use crate::cut::segment::Segment;
use crate::error::{CluvError, Result};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Track type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TrackType {
    /// Video track
    Video,
    /// Audio track
    Audio,
    /// Image track
    Image,
    /// Text/Title track
    Text,
    /// Subtitle track
    Subtitle,
}

/// Track represents a timeline track containing segments
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    /// Unique track identifier
    pub id: String,
    /// Track type
    #[serde(rename = "type")]
    pub track_type: TrackType,
    /// Track segments
    pub segments: Vec<Segment>,
    /// Track is enabled
    pub enabled: bool,
    /// Track is muted (for audio tracks)
    pub muted: bool,
    /// Track volume (0.0 to 1.0, for audio tracks)
    pub volume: f32,
    /// Track opacity (0.0 to 1.0, for video tracks)
    pub opacity: f32,
    /// Track blend mode (for video tracks)
    pub blend_mode: Option<String>,
}

impl Track {
    /// Create a new track
    pub fn new<S: Into<String>>(id: S, track_type: TrackType) -> Self {
        Self {
            id: id.into(),
            track_type,
            segments: Vec::new(),
            enabled: true,
            muted: false,
            volume: 1.0,
            opacity: 1.0,
            blend_mode: None,
        }
    }

    pub fn id(&self) -> &str {
        &self.id
    }

    /// Create a video track
    pub fn video() -> Self {
        Self::new(Uuid::new_v4(), TrackType::Video)
    }

    /// Create an audio track
    pub fn audio() -> Self {
        Self::new(Uuid::new_v4(), TrackType::Audio)
    }

    /// Create an image track
    pub fn image() -> Self {
        Self::new(Uuid::new_v4(), TrackType::Image)
    }

    /// Create a text track
    pub fn text() -> Self {
        Self::new(Uuid::new_v4(), TrackType::Text)
    }

    /// Create a subtitle track
    pub fn subtitle() -> Self {
        Self::new(Uuid::new_v4(), TrackType::Subtitle)
    }

    /// Add a segment to the track
    pub fn add_segment(&mut self, segment: Segment) -> &mut Self {
        self.segments.push(segment);
        self
    }

    /// Add multiple segments to the track
    pub fn add_segments(&mut self, segments: Vec<Segment>) -> &mut Self {
        self.segments.extend(segments);
        self
    }

    /// Remove a segment by ID
    pub fn remove_segment(&mut self, segment_id: &str) -> bool {
        if let Some(pos) = self.segments.iter().position(|s| s.id == segment_id) {
            self.segments.remove(pos);
            true
        } else {
            false
        }
    }

    /// Get segment by ID
    pub fn get_segment(&self, segment_id: &str) -> Option<&Segment> {
        self.segments.iter().find(|s| s.id == segment_id)
    }

    /// Get mutable segment by ID
    pub fn get_segment_mut(&mut self, segment_id: &str) -> Option<&mut Segment> {
        self.segments.iter_mut().find(|s| s.id == segment_id)
    }

    /// Set track enabled state
    pub fn set_enabled(&mut self, enabled: bool) -> &mut Self {
        self.enabled = enabled;
        self
    }

    /// Set track muted state
    pub fn set_muted(&mut self, muted: bool) -> &mut Self {
        self.muted = muted;
        self
    }

    /// Set track volume (0.0 to 1.0)
    pub fn set_volume(&mut self, volume: f32) -> &mut Self {
        self.volume = volume.clamp(0.0, 1.0);
        self
    }

    /// Set track opacity (0.0 to 1.0)
    pub fn set_opacity(&mut self, opacity: f32) -> &mut Self {
        self.opacity = opacity.clamp(0.0, 1.0);
        self
    }

    /// Set blend mode
    pub fn set_blend_mode<S: Into<String>>(&mut self, blend_mode: S) -> &mut Self {
        self.blend_mode = Some(blend_mode.into());
        self
    }

    /// Clear blend mode
    pub fn clear_blend_mode(&mut self) -> &mut Self {
        self.blend_mode = None;
        self
    }

    /// Get track duration (end time of last segment)
    pub fn duration(&self) -> u32 {
        self.segments
            .iter()
            .map(|s| s.target_timerange.start + s.target_timerange.duration)
            .max()
            .unwrap_or(0)
    }

    /// Get track start time (start time of first segment)
    pub fn start_time(&self) -> u32 {
        self.segments
            .iter()
            .map(|s| s.target_timerange.start)
            .min()
            .unwrap_or(0)
    }

    /// Check if track has any segments
    pub fn is_empty(&self) -> bool {
        self.segments.is_empty()
    }

    /// Get number of segments
    pub fn segment_count(&self) -> usize {
        self.segments.len()
    }

    /// Sort segments by start time
    pub fn sort_segments(&mut self) {
        self.segments.sort_by_key(|s| s.target_timerange.start);
    }

    /// Check if segments overlap
    pub fn has_overlapping_segments(&self) -> bool {
        if self.segments.len() < 2 {
            return false;
        }

        let mut sorted_segments = self.segments.clone();
        sorted_segments.sort_by_key(|s| s.target_timerange.start);

        for i in 0..sorted_segments.len() - 1 {
            let current_end = sorted_segments[i].target_timerange.start
                + sorted_segments[i].target_timerange.duration;
            let next_start = sorted_segments[i + 1].target_timerange.start;

            if current_end > next_start {
                return true;
            }
        }

        false
    }

    /// Get segments at a specific time
    pub fn segments_at_time(&self, time: u32) -> Vec<&Segment> {
        self.segments
            .iter()
            .filter(|s| {
                let start = s.target_timerange.start;
                let end = start + s.target_timerange.duration;
                time >= start && time < end
            })
            .collect()
    }

    /// Validate the track
    pub fn validate(&self) -> Result<()> {
        if self.id.is_empty() {
            return Err(CluvError::invalid_params("Track ID cannot be empty"));
        }

        // Validate volume range
        if !(0.0..=1.0).contains(&self.volume) {
            return Err(CluvError::invalid_params(
                "Volume must be between 0.0 and 1.0",
            ));
        }

        // Validate opacity range
        if !(0.0..=1.0).contains(&self.opacity) {
            return Err(CluvError::invalid_params(
                "Opacity must be between 0.0 and 1.0",
            ));
        }

        // Validate all segments
        for (i, segment) in self.segments.iter().enumerate() {
            segment.validate().map_err(|e| {
                CluvError::invalid_params(format!("Segment {} validation failed: {}", i, e))
            })?;
        }

        Ok(())
    }

    /// Check if track type supports the given operation
    pub fn supports_volume(&self) -> bool {
        matches!(self.track_type, TrackType::Audio)
    }

    /// Check if track type supports opacity
    pub fn supports_opacity(&self) -> bool {
        matches!(
            self.track_type,
            TrackType::Video | TrackType::Image | TrackType::Text
        )
    }

    /// Check if track type supports blend modes
    pub fn supports_blend_mode(&self) -> bool {
        matches!(
            self.track_type,
            TrackType::Video | TrackType::Image | TrackType::Text
        )
    }

    /// Clone track with new ID
    pub fn clone_with_id<S: Into<String>>(&self, new_id: S) -> Self {
        let mut cloned = self.clone();
        cloned.id = new_id.into();
        cloned
    }

    /// Clear all segments
    pub fn clear_segments(&mut self) {
        self.segments.clear();
    }

    /// Get segments in time range
    pub fn segments_in_range(&self, start: u32, end: u32) -> Vec<&Segment> {
        self.segments
            .iter()
            .filter(|s| {
                let seg_start = s.target_timerange.start;
                let seg_end = seg_start + s.target_timerange.duration;
                // Check for any overlap with the range
                seg_start < end && seg_end > start
            })
            .collect()
    }
}

impl Default for Track {
    fn default() -> Self {
        Self::new("default", TrackType::Video)
    }
}

impl std::fmt::Display for TrackType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            TrackType::Video => write!(f, "video"),
            TrackType::Audio => write!(f, "audio"),
            TrackType::Image => write!(f, "image"),
            TrackType::Text => write!(f, "text"),
            TrackType::Subtitle => write!(f, "subtitle"),
        }
    }
}

impl std::fmt::Display for Track {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "Track(id={}, type={}, segments={})",
            self.id,
            self.track_type,
            self.segments.len()
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        Dimension,
        cut::segment::{Position, Segment, TimeRange},
    };

    fn create_test_segment(id: &str, start: u32, duration: u32) -> Segment {
        Segment {
            id: id.to_string(),
            segment_type: crate::cut::segment::SegmentType::Video,
            material_id: "test_material".to_string(),
            target_timerange: TimeRange { start, duration },
            source_timerange: TimeRange { start: 0, duration },
            scale: Some(Dimension {
                width: 1920,
                height: 1080,
            }),
            position: Some(Position { x: 0, y: 0 }),
        }
    }

    #[test]
    fn test_track_creation() {
        let track = Track::new("track1", TrackType::Video);
        assert_eq!(track.id, "track1");
        assert_eq!(track.track_type, TrackType::Video);
        assert!(track.segments.is_empty());
        assert!(track.enabled);
        assert!(!track.muted);
        assert_eq!(track.volume, 1.0);
        assert_eq!(track.opacity, 1.0);
        assert!(track.blend_mode.is_none());
    }

    #[test]
    fn test_track_convenience_constructors() {
        let video_track = Track::video();
        assert_eq!(video_track.track_type, TrackType::Video);

        let audio_track = Track::audio();
        assert_eq!(audio_track.track_type, TrackType::Audio);

        let image_track = Track::image();
        assert_eq!(image_track.track_type, TrackType::Image);

        let text_track = Track::text();
        assert_eq!(text_track.track_type, TrackType::Text);

        let subtitle_track = Track::subtitle();
        assert_eq!(subtitle_track.track_type, TrackType::Subtitle);
    }

    #[test]
    fn test_add_segments() {
        let mut track = Track::new("track1", TrackType::Video);
        let segment1 = create_test_segment("seg1", 0, 1000);
        let segment2 = create_test_segment("seg2", 1000, 2000);

        track.add_segment(segment1);
        track.add_segment(segment2);

        assert_eq!(track.segments.len(), 2);
        assert_eq!(track.segments[0].id, "seg1");
        assert_eq!(track.segments[1].id, "seg2");
    }

    #[test]
    fn test_remove_segment() {
        let mut track = Track::new("track1", TrackType::Video);
        let segment = create_test_segment("seg1", 0, 1000);
        track.add_segment(segment);

        assert_eq!(track.segments.len(), 1);

        let removed = track.remove_segment("seg1");
        assert!(removed);
        assert_eq!(track.segments.len(), 0);

        let not_removed = track.remove_segment("nonexistent");
        assert!(!not_removed);
    }

    #[test]
    fn test_get_segment() {
        let mut track = Track::new("track1", TrackType::Video);
        let segment = create_test_segment("seg1", 0, 1000);
        track.add_segment(segment);

        let found = track.get_segment("seg1");
        assert!(found.is_some());
        assert_eq!(found.unwrap().id, "seg1");

        let not_found = track.get_segment("seg2");
        assert!(not_found.is_none());
    }

    #[test]
    fn test_track_duration() {
        let mut track = Track::new("track1", TrackType::Video);
        assert_eq!(track.duration(), 0);

        track.add_segment(create_test_segment("seg1", 0, 1000));
        assert_eq!(track.duration(), 1000);

        track.add_segment(create_test_segment("seg2", 1000, 2000));
        assert_eq!(track.duration(), 3000);

        track.add_segment(create_test_segment("seg3", 500, 1000));
        assert_eq!(track.duration(), 3000); // Still 3000 because seg2 ends at 3000
    }

    #[test]
    fn test_track_start_time() {
        let mut track = Track::new("track1", TrackType::Video);
        assert_eq!(track.start_time(), 0);

        track.add_segment(create_test_segment("seg1", 500, 1000));
        assert_eq!(track.start_time(), 500);

        track.add_segment(create_test_segment("seg2", 200, 1000));
        assert_eq!(track.start_time(), 200);
    }

    #[test]
    fn test_sort_segments() {
        let mut track = Track::new("track1", TrackType::Video);
        track.add_segment(create_test_segment("seg2", 1000, 1000));
        track.add_segment(create_test_segment("seg1", 0, 1000));
        track.add_segment(create_test_segment("seg3", 500, 1000));

        track.sort_segments();

        assert_eq!(track.segments[0].id, "seg1");
        assert_eq!(track.segments[1].id, "seg3");
        assert_eq!(track.segments[2].id, "seg2");
    }

    #[test]
    fn test_overlapping_segments() {
        let mut track = Track::new("track1", TrackType::Video);

        // Non-overlapping segments
        track.add_segment(create_test_segment("seg1", 0, 1000));
        track.add_segment(create_test_segment("seg2", 1000, 1000));
        assert!(!track.has_overlapping_segments());

        // Add overlapping segment
        track.add_segment(create_test_segment("seg3", 500, 1000));
        assert!(track.has_overlapping_segments());
    }

    #[test]
    fn test_segments_at_time() {
        let mut track = Track::new("track1", TrackType::Video);
        track.add_segment(create_test_segment("seg1", 0, 1000));
        track.add_segment(create_test_segment("seg2", 500, 1000));
        track.add_segment(create_test_segment("seg3", 2000, 1000));

        let segments_at_750 = track.segments_at_time(750);
        assert_eq!(segments_at_750.len(), 2);

        let segments_at_2500 = track.segments_at_time(2500);
        assert_eq!(segments_at_2500.len(), 1);
        assert_eq!(segments_at_2500[0].id, "seg3");

        let segments_at_5000 = track.segments_at_time(5000);
        assert_eq!(segments_at_5000.len(), 0);
    }

    #[test]
    fn test_track_properties() {
        let mut track = Track::new("track1", TrackType::Video);

        track.set_enabled(false);
        assert!(!track.enabled);

        track.set_muted(true);
        assert!(track.muted);

        track.set_volume(0.5);
        assert_eq!(track.volume, 0.5);

        track.set_opacity(0.8);
        assert_eq!(track.opacity, 0.8);

        track.set_blend_mode("multiply");
        assert_eq!(track.blend_mode, Some("multiply".to_string()));

        track.clear_blend_mode();
        assert!(track.blend_mode.is_none());
    }

    #[test]
    fn test_track_capabilities() {
        let video_track = Track::video();
        assert!(!video_track.supports_volume());
        assert!(video_track.supports_opacity());
        assert!(video_track.supports_blend_mode());

        let audio_track = Track::audio();
        assert!(audio_track.supports_volume());
        assert!(!audio_track.supports_opacity());
        assert!(!audio_track.supports_blend_mode());
    }

    #[test]
    fn test_validation() {
        let track = Track::new("track1", TrackType::Video);
        assert!(track.validate().is_ok());

        let empty_id_track = Track::new("", TrackType::Video);
        assert!(empty_id_track.validate().is_err());

        let mut invalid_volume_track = Track::new("track1", TrackType::Audio);
        invalid_volume_track.volume = 2.0;
        assert!(invalid_volume_track.validate().is_err());

        let mut invalid_opacity_track = Track::new("track1", TrackType::Video);
        invalid_opacity_track.opacity = -0.5;
        assert!(invalid_opacity_track.validate().is_err());
    }

    #[test]
    fn test_segments_in_range() {
        let mut track = Track::new("track1", TrackType::Video);
        track.add_segment(create_test_segment("seg1", 0, 1000)); // 0-1000
        track.add_segment(create_test_segment("seg2", 500, 1000)); // 500-1500
        track.add_segment(create_test_segment("seg3", 2000, 1000)); // 2000-3000

        // Range 200-800 should include seg1 and seg2
        let range_segments = track.segments_in_range(200, 800);
        assert_eq!(range_segments.len(), 2);

        // Range 1200-1800 should include seg2
        let range_segments2 = track.segments_in_range(1200, 1800);
        assert_eq!(range_segments2.len(), 1);
        assert_eq!(range_segments2[0].id, "seg2");

        // Range 3500-4000 should include nothing
        let range_segments3 = track.segments_in_range(3500, 4000);
        assert_eq!(range_segments3.len(), 0);
    }

    #[test]
    fn test_display() {
        let track_type = TrackType::Video;
        assert_eq!(format!("{}", track_type), "video");

        let track = Track::new("track1", TrackType::Video);
        assert!(format!("{}", track).contains("Track(id=track1"));
    }
}
