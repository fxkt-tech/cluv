//! Segment management for video editing tracks

use crate::{
    error::{CluvError, Result},
    Dimension,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Time range specification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TimeRange {
    /// Start time in milliseconds
    pub start: u32,
    /// Duration in milliseconds
    pub duration: u32,
}

/// Position specification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Position {
    /// X coordinate in pixels
    pub x: i32,
    /// Y coordinate in pixels
    pub y: i32,
}

/// Scale specification
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Scale {
    /// Width in pixels
    pub width: i32,
    /// Height in pixels
    pub height: i32,
}

/// Segment type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SegmentType {
    /// Video segment
    Video,
    /// Audio segment
    Audio,
    /// Image segment
    Image,
    /// Text segment
    Text,
    /// Subtitle segment
    Subtitle,
}

/// Segment represents a clip of material on a track
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Segment {
    /// Unique segment identifier
    pub id: String,
    /// Segment type
    #[serde(rename = "type")]
    pub segment_type: SegmentType,
    /// Referenced material ID
    pub material_id: String,
    /// Time range on the timeline (target)
    pub target_timerange: TimeRange,
    /// Time range in the source material
    pub source_timerange: TimeRange,
    /// Scale/size of the segment (optional)
    pub scale: Option<Dimension>,
    /// Position on the stage (optional)
    pub position: Option<Position>,
}

impl Segment {
    /// Create a new segment
    pub fn new<S1: Into<String>, S2: Into<String>>(
        id: S1,
        segment_type: SegmentType,
        material_id: S2,
        target_timerange: TimeRange,
        source_timerange: TimeRange,
    ) -> Self {
        Self {
            id: id.into(),
            segment_type,
            material_id: material_id.into(),
            target_timerange,
            source_timerange,
            scale: None,
            position: None,
        }
    }

    /// Create a video segment
    pub fn video<S: Into<String>>(
        material_id: S,
        target_timerange: TimeRange,
        source_timerange: TimeRange,
    ) -> Self {
        Self::new(
            Uuid::new_v4(),
            SegmentType::Video,
            material_id,
            target_timerange,
            source_timerange,
        )
    }

    /// Create an audio segment
    pub fn audio<S1: Into<String>, S2: Into<String>>(
        id: S1,
        material_id: S2,
        target_timerange: TimeRange,
        source_timerange: TimeRange,
    ) -> Self {
        Self::new(
            id,
            SegmentType::Audio,
            material_id,
            target_timerange,
            source_timerange,
        )
    }

    /// Create an image segment
    pub fn image<S1: Into<String>, S2: Into<String>>(
        id: S1,
        material_id: S2,
        target_timerange: TimeRange,
        source_timerange: TimeRange,
    ) -> Self {
        Self::new(
            id,
            SegmentType::Image,
            material_id,
            target_timerange,
            source_timerange,
        )
    }

    /// Create a text segment
    pub fn text<S1: Into<String>, S2: Into<String>>(
        id: S1,
        material_id: S2,
        target_timerange: TimeRange,
        source_timerange: TimeRange,
    ) -> Self {
        Self::new(
            id,
            SegmentType::Text,
            material_id,
            target_timerange,
            source_timerange,
        )
    }

    /// Set segment scale
    pub fn scale(mut self, scale: Dimension) -> Self {
        self.scale = Some(scale);
        self
    }

    /// Set segment position
    pub fn position(mut self, position: Position) -> Self {
        self.position = Some(position);
        self
    }

    /// Get end time on the timeline
    pub fn target_end_time(&self) -> u32 {
        self.target_timerange.start + self.target_timerange.duration
    }

    /// Get end time in the source material
    pub fn source_end_time(&self) -> u32 {
        self.source_timerange.start + self.source_timerange.duration
    }

    /// Check if segment contains a specific time on the timeline
    pub fn contains_time(&self, time: u32) -> bool {
        time >= self.target_timerange.start && time < self.target_end_time()
    }

    /// Check if segment overlaps with another segment on the timeline
    pub fn overlaps_with(&self, other: &Segment) -> bool {
        let self_start = self.target_timerange.start;
        let self_end = self.target_end_time();
        let other_start = other.target_timerange.start;
        let other_end = other.target_end_time();

        self_start < other_end && other_start < self_end
    }

    /// Get the playback speed (source duration / target duration)
    pub fn playback_speed(&self) -> f64 {
        if self.target_timerange.duration == 0 {
            1.0
        } else {
            self.source_timerange.duration as f64 / self.target_timerange.duration as f64
        }
    }

    /// Check if segment needs speed adjustment
    pub fn needs_speed_adjustment(&self) -> bool {
        self.source_timerange.duration != self.target_timerange.duration
    }

    /// Validate the segment
    pub fn validate(&self) -> Result<()> {
        if self.id.is_empty() {
            return Err(CluvError::invalid_params("Segment ID cannot be empty"));
        }

        if self.material_id.is_empty() {
            return Err(CluvError::invalid_params("Material ID cannot be empty"));
        }

        if self.target_timerange.duration == 0 {
            return Err(CluvError::invalid_params(
                "Target duration must be positive",
            ));
        }

        if self.source_timerange.duration == 0 {
            return Err(CluvError::invalid_params(
                "Source duration must be positive",
            ));
        }

        // Validate scale if present
        if let Some(scale) = self.scale {
            if scale.width <= 0 || scale.height <= 0 {
                return Err(CluvError::invalid_params(
                    "Scale dimensions must be positive",
                ));
            }
        }

        Ok(())
    }

    /// Clone segment with new ID
    pub fn clone_with_id<S: Into<String>>(&self, new_id: S) -> Self {
        let mut cloned = self.clone();
        cloned.id = new_id.into();
        cloned
    }

    /// Move segment to new timeline position
    pub fn move_to(&mut self, new_start: u32) {
        self.target_timerange.start = new_start;
    }

    /// Resize segment duration
    pub fn resize(&mut self, new_duration: u32) {
        self.target_timerange.duration = new_duration;
    }

    /// Trim segment from the start
    pub fn trim_start(&mut self, trim_amount: u32) {
        if trim_amount >= self.target_timerange.duration {
            self.target_timerange.duration = 1; // Keep at least 1ms
            return;
        }

        self.target_timerange.start += trim_amount;
        self.target_timerange.duration -= trim_amount;

        // Also adjust source timerange proportionally
        let speed = self.playback_speed();
        let source_trim = (trim_amount as f64 * speed) as u32;
        self.source_timerange.start += source_trim;
        if source_trim < self.source_timerange.duration {
            self.source_timerange.duration -= source_trim;
        } else {
            self.source_timerange.duration = 1;
        }
    }

    /// Trim segment from the end
    pub fn trim_end(&mut self, trim_amount: u32) {
        if trim_amount >= self.target_timerange.duration {
            self.target_timerange.duration = 1; // Keep at least 1ms
            return;
        }

        self.target_timerange.duration -= trim_amount;

        // Also adjust source timerange proportionally
        let speed = self.playback_speed();
        let source_trim = (trim_amount as f64 * speed) as u32;
        if source_trim < self.source_timerange.duration {
            self.source_timerange.duration -= source_trim;
        } else {
            self.source_timerange.duration = 1;
        }
    }

    /// Split segment at a specific time
    pub fn split_at(&self, time: u32) -> Result<(Segment, Segment)> {
        if !self.contains_time(time) {
            return Err(CluvError::invalid_params(
                "Split time is not within segment",
            ));
        }

        let offset = time - self.target_timerange.start;
        let first_duration = offset;
        let second_duration = self.target_timerange.duration - offset;

        let speed = self.playback_speed();
        let source_offset = (offset as f64 * speed) as u32;

        // First segment
        let first = Segment {
            id: format!("{}_part1", self.id),
            segment_type: self.segment_type,
            material_id: self.material_id.clone(),
            target_timerange: TimeRange {
                start: self.target_timerange.start,
                duration: first_duration,
            },
            source_timerange: TimeRange {
                start: self.source_timerange.start,
                duration: source_offset,
            },
            scale: self.scale,
            position: self.position,
        };

        // Second segment
        let second = Segment {
            id: format!("{}_part2", self.id),
            segment_type: self.segment_type,
            material_id: self.material_id.clone(),
            target_timerange: TimeRange {
                start: time,
                duration: second_duration,
            },
            source_timerange: TimeRange {
                start: self.source_timerange.start + source_offset,
                duration: self.source_timerange.duration - source_offset,
            },
            scale: self.scale,
            position: self.position,
        };

        Ok((first, second))
    }
}

impl TimeRange {
    /// Create a new time range
    pub fn new(start: u32, duration: u32) -> Self {
        Self { start, duration }
    }

    /// Get end time
    pub fn end(&self) -> u32 {
        self.start + self.duration
    }

    /// Check if time range contains a specific time
    pub fn contains(&self, time: u32) -> bool {
        time >= self.start && time < self.end()
    }

    /// Check if time range overlaps with another
    pub fn overlaps(&self, other: &TimeRange) -> bool {
        self.start < other.end() && other.start < self.end()
    }

    /// Get intersection with another time range
    pub fn intersection(&self, other: &TimeRange) -> Option<TimeRange> {
        let start = self.start.max(other.start);
        let end = self.end().min(other.end());

        if start < end {
            Some(TimeRange::new(start, end - start))
        } else {
            None
        }
    }

    /// Check if range is valid
    pub fn is_valid(&self) -> bool {
        self.duration > 0
    }
}

// impl Into<TimeRange> for (u32, u32) {
//     fn into(self) -> TimeRange {
//         TimeRange::new(self.0, self.1)
//     }
// }

impl Position {
    /// Create a new position
    pub fn new(x: i32, y: i32) -> Self {
        Self { x, y }
    }

    /// Create position at origin
    pub fn origin() -> Self {
        Self::new(0, 0)
    }

    /// Create centered position for given stage size
    pub fn center(stage_width: i32, stage_height: i32, item_width: i32, item_height: i32) -> Self {
        Self::new(
            (stage_width - item_width) / 2,
            (stage_height - item_height) / 2,
        )
    }

    /// Offset position by delta
    pub fn offset(&self, dx: i32, dy: i32) -> Self {
        Self::new(self.x + dx, self.y + dy)
    }

    /// Check if position is within bounds
    pub fn within_bounds(&self, width: i32, height: i32) -> bool {
        self.x >= 0 && self.y >= 0 && self.x < width && self.y < height
    }
}

impl Scale {
    /// Create a new scale
    pub fn new(width: i32, height: i32) -> Self {
        Self { width, height }
    }

    /// Get aspect ratio
    pub fn aspect_ratio(&self) -> f64 {
        if self.height == 0 {
            0.0
        } else {
            self.width as f64 / self.height as f64
        }
    }

    /// Scale by factor
    pub fn scale_by(&self, factor: f64) -> Self {
        Self::new(
            (self.width as f64 * factor).round() as i32,
            (self.height as f64 * factor).round() as i32,
        )
    }

    /// Fit within bounds while maintaining aspect ratio
    pub fn fit_within(&self, max_width: i32, max_height: i32) -> Self {
        let width_ratio = max_width as f64 / self.width as f64;
        let height_ratio = max_height as f64 / self.height as f64;
        let scale_factor = width_ratio.min(height_ratio);

        if scale_factor >= 1.0 {
            *self
        } else {
            self.scale_by(scale_factor)
        }
    }

    /// Check if scale is valid
    pub fn is_valid(&self) -> bool {
        self.width > 0 && self.height > 0
    }
}

impl Default for Position {
    fn default() -> Self {
        Self::origin()
    }
}

impl From<(i32, i32)> for Position {
    fn from(tuple: (i32, i32)) -> Self {
        Self::new(tuple.0, tuple.1)
    }
}

impl From<Position> for (i32, i32) {
    fn from(pos: Position) -> Self {
        (pos.x, pos.y)
    }
}

impl From<(i32, i32)> for Scale {
    fn from(tuple: (i32, i32)) -> Self {
        Self::new(tuple.0, tuple.1)
    }
}

impl From<Scale> for (i32, i32) {
    fn from(scale: Scale) -> Self {
        (scale.width, scale.height)
    }
}

impl From<(u32, u32)> for TimeRange {
    fn from(tuple: (u32, u32)) -> Self {
        Self::new(tuple.0, tuple.1)
    }
}

impl From<TimeRange> for (u32, u32) {
    fn from(range: TimeRange) -> Self {
        (range.start, range.duration)
    }
}

impl std::fmt::Display for SegmentType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SegmentType::Video => write!(f, "video"),
            SegmentType::Audio => write!(f, "audio"),
            SegmentType::Image => write!(f, "image"),
            SegmentType::Text => write!(f, "text"),
            SegmentType::Subtitle => write!(f, "subtitle"),
        }
    }
}

impl std::fmt::Display for TimeRange {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}ms-{}ms", self.start, self.end())
    }
}

impl std::fmt::Display for Position {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

impl std::fmt::Display for Scale {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}x{}", self.width, self.height)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_time_range() {
        let range = TimeRange::new(1000, 2000);
        assert_eq!(range.start, 1000);
        assert_eq!(range.duration, 2000);
        assert_eq!(range.end(), 3000);

        assert!(range.contains(1500));
        assert!(range.contains(1000));
        assert!(!range.contains(3000));
        assert!(!range.contains(500));

        let other = TimeRange::new(2500, 1000);
        assert!(range.overlaps(&other));

        let intersection = range.intersection(&other);
        assert!(intersection.is_some());
        let intersection = intersection.unwrap();
        assert_eq!(intersection.start, 2500);
        assert_eq!(intersection.duration, 500);
    }

    #[test]
    fn test_position() {
        let pos = Position::new(100, 200);
        assert_eq!(pos.x, 100);
        assert_eq!(pos.y, 200);

        let origin = Position::origin();
        assert_eq!(origin.x, 0);
        assert_eq!(origin.y, 0);

        let center = Position::center(1920, 1080, 640, 480);
        assert_eq!(center.x, 640);
        assert_eq!(center.y, 300);

        let offset = pos.offset(50, -100);
        assert_eq!(offset.x, 150);
        assert_eq!(offset.y, 100);

        assert!(pos.within_bounds(1920, 1080));
        assert!(!pos.within_bounds(50, 50));
    }

    #[test]
    fn test_scale() {
        let scale = Scale::new(1920, 1080);
        assert_eq!(scale.width, 1920);
        assert_eq!(scale.height, 1080);
        assert!((scale.aspect_ratio() - (16.0 / 9.0)).abs() < 0.001);
        assert!(scale.is_valid());

        let scaled = scale.scale_by(0.5);
        assert_eq!(scaled.width, 960);
        assert_eq!(scaled.height, 540);

        let fitted = scale.fit_within(1280, 720);
        assert!(fitted.width <= 1280);
        assert!(fitted.height <= 720);
        assert!((fitted.aspect_ratio() - scale.aspect_ratio()).abs() < 0.01);
    }

    #[test]
    fn test_segment_creation() {
        let target = TimeRange::new(0, 1000);
        let source = TimeRange::new(500, 2000);
        let segment = Segment::video("mat1", target, source);

        assert_eq!(segment.id, "seg1");
        assert_eq!(segment.segment_type, SegmentType::Video);
        assert_eq!(segment.material_id, "mat1");
        assert_eq!(segment.target_timerange, target);
        assert_eq!(segment.source_timerange, source);
    }

    #[test]
    fn test_segment_with_scale_and_position() {
        let target = TimeRange::new(0, 1000);
        let source = TimeRange::new(0, 1000);
        let segment = Segment::video("mat1", target, source)
            .scale(Dimension::new(1920, 1080))
            .position(Position::new(100, 200));

        assert!(segment.scale.is_some());
        assert!(segment.position.is_some());
        assert_eq!(segment.scale.unwrap().width, 1920);
        assert_eq!(segment.position.unwrap().x, 100);
    }

    #[test]
    fn test_segment_timing() {
        let target = TimeRange::new(1000, 2000);
        let source = TimeRange::new(0, 1000);
        let segment = Segment::video("mat1", target, source);

        assert_eq!(segment.target_end_time(), 3000);
        assert_eq!(segment.source_end_time(), 1000);
        assert!(segment.contains_time(1500));
        assert!(!segment.contains_time(500));
        assert_eq!(segment.playback_speed(), 0.5);
        assert!(segment.needs_speed_adjustment());
    }

    #[test]
    fn test_segment_overlap() {
        let seg1 = Segment::video("mat1", TimeRange::new(0, 1000), TimeRange::new(0, 1000));
        let seg2 = Segment::video("mat2", TimeRange::new(500, 1000), TimeRange::new(0, 1000));
        let seg3 = Segment::video("mat3", TimeRange::new(2000, 1000), TimeRange::new(0, 1000));

        assert!(seg1.overlaps_with(&seg2));
        assert!(!seg1.overlaps_with(&seg3));
    }

    #[test]
    fn test_segment_validation() {
        let valid_segment =
            Segment::video("mat1", TimeRange::new(0, 1000), TimeRange::new(0, 1000));
        assert!(valid_segment.validate().is_ok());

        let empty_id = Segment::video("mat1", TimeRange::new(0, 1000), TimeRange::new(0, 1000));
        assert!(empty_id.validate().is_err());

        let zero_duration = Segment::video("mat1", TimeRange::new(0, 0), TimeRange::new(0, 1000));
        assert!(zero_duration.validate().is_err());
    }

    #[test]
    fn test_segment_trimming() {
        let mut segment =
            Segment::video("mat1", TimeRange::new(1000, 3000), TimeRange::new(0, 3000));

        // Trim 500ms from start
        segment.trim_start(500);
        assert_eq!(segment.target_timerange.start, 1500);
        assert_eq!(segment.target_timerange.duration, 2500);

        // Trim 500ms from end
        segment.trim_end(500);
        assert_eq!(segment.target_timerange.duration, 2000);
    }

    #[test]
    fn test_segment_split() {
        let segment = Segment::video("mat1", TimeRange::new(0, 2000), TimeRange::new(0, 2000));

        let result = segment.split_at(800);
        assert!(result.is_ok());

        let (first, second) = result.unwrap();
        assert_eq!(first.target_timerange.duration, 800);
        assert_eq!(second.target_timerange.start, 800);
        assert_eq!(second.target_timerange.duration, 1200);
    }

    #[test]
    fn test_conversions() {
        let pos: (i32, i32) = Position::new(100, 200).into();
        assert_eq!(pos, (100, 200));

        let scale: (i32, i32) = Scale::new(1920, 1080).into();
        assert_eq!(scale, (1920, 1080));

        let range: (u32, u32) = TimeRange::new(1000, 2000).into();
        assert_eq!(range, (1000, 2000));
    }

    #[test]
    fn test_display() {
        let segment_type = SegmentType::Video;
        assert_eq!(format!("{}", segment_type), "video");

        let range = TimeRange::new(1000, 2000);
        assert_eq!(format!("{}", range), "1000ms-3000ms");

        let pos = Position::new(100, 200);
        assert_eq!(format!("{}", pos), "(100, 200)");

        let scale = Scale::new(1920, 1080);
        assert_eq!(format!("{}", scale), "1920x1080");
    }
}
