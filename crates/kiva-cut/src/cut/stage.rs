//! Stage configuration for video editing

use crate::error::{CutError, Result};
use serde::{Deserialize, Serialize};

/// Stage represents the canvas/viewport for video composition
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Stage {
    /// Stage width in pixels
    pub width: i32,
    /// Stage height in pixels
    pub height: i32,
}

impl Stage {
    /// Create a new stage with specified dimensions
    pub fn new(width: i32, height: i32) -> Self {
        Self { width, height }
    }

    /// Create a stage with 1080p resolution (1920x1080)
    pub fn hd1080() -> Self {
        Self::new(1920, 1080)
    }

    /// Create a stage with 720p resolution (1280x720)
    pub fn hd720() -> Self {
        Self::new(1280, 720)
    }

    /// Create a stage with 4K resolution (3840x2160)
    pub fn uhd4k() -> Self {
        Self::new(3840, 2160)
    }

    /// Create a stage with vertical video resolution (1080x1920)
    pub fn vertical_hd() -> Self {
        Self::new(1080, 1920)
    }

    /// Create a stage with square resolution (1080x1080)
    pub fn square() -> Self {
        Self::new(1080, 1080)
    }

    /// Get the aspect ratio of the stage
    pub fn aspect_ratio(&self) -> f64 {
        if self.height == 0 {
            0.0
        } else {
            self.width as f64 / self.height as f64
        }
    }

    /// Check if the stage is in landscape orientation
    pub fn is_landscape(&self) -> bool {
        self.width > self.height
    }

    /// Check if the stage is in portrait orientation
    pub fn is_portrait(&self) -> bool {
        self.width < self.height
    }

    /// Check if the stage is square
    pub fn is_square(&self) -> bool {
        self.width == self.height
    }

    /// Get the total pixel count
    pub fn pixel_count(&self) -> i64 {
        self.width as i64 * self.height as i64
    }

    /// Validate stage dimensions
    pub fn validate(&self) -> Result<()> {
        if self.width <= 0 {
            return Err(CutError::invalid_params("Stage width must be positive"));
        }
        if self.height <= 0 {
            return Err(CutError::invalid_params("Stage height must be positive"));
        }
        Ok(())
    }

    /// Scale the stage by a factor
    pub fn scale(&self, factor: f64) -> Self {
        let new_width = (self.width as f64 * factor).round() as i32;
        let new_height = (self.height as f64 * factor).round() as i32;
        Self::new(new_width, new_height)
    }

    /// Resize to fit within maximum dimensions while preserving aspect ratio
    pub fn fit_within(&self, max_width: i32, max_height: i32) -> Self {
        let width_ratio = max_width as f64 / self.width as f64;
        let height_ratio = max_height as f64 / self.height as f64;
        let scale_factor = width_ratio.min(height_ratio);

        if scale_factor >= 1.0 {
            *self // No need to scale down
        } else {
            self.scale(scale_factor)
        }
    }

    /// Check if coordinates are within stage bounds
    pub fn contains_point(&self, x: i32, y: i32) -> bool {
        x >= 0 && x < self.width && y >= 0 && y < self.height
    }

    /// Check if a rectangle fits within the stage
    pub fn contains_rect(&self, x: i32, y: i32, width: i32, height: i32) -> bool {
        x >= 0 && y >= 0 && (x + width) <= self.width && (y + height) <= self.height
    }

    /// Get stage center point
    pub fn center(&self) -> (i32, i32) {
        (self.width / 2, self.height / 2)
    }

    /// Convert to tuple
    pub fn as_tuple(&self) -> (i32, i32) {
        (self.width, self.height)
    }

    /// Create from tuple
    pub fn from_tuple(dimensions: (i32, i32)) -> Self {
        Self::new(dimensions.0, dimensions.1)
    }
}

impl Default for Stage {
    fn default() -> Self {
        Self::hd1080()
    }
}

impl From<(i32, i32)> for Stage {
    fn from(dimensions: (i32, i32)) -> Self {
        Self::new(dimensions.0, dimensions.1)
    }
}

impl From<Stage> for (i32, i32) {
    fn from(stage: Stage) -> Self {
        (stage.width, stage.height)
    }
}

impl std::fmt::Display for Stage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}x{}", self.width, self.height)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stage_creation() {
        let stage = Stage::new(1920, 1080);
        assert_eq!(stage.width, 1920);
        assert_eq!(stage.height, 1080);
    }

    #[test]
    fn test_preset_resolutions() {
        assert_eq!(Stage::hd1080(), Stage::new(1920, 1080));
        assert_eq!(Stage::hd720(), Stage::new(1280, 720));
        assert_eq!(Stage::uhd4k(), Stage::new(3840, 2160));
        assert_eq!(Stage::vertical_hd(), Stage::new(1080, 1920));
        assert_eq!(Stage::square(), Stage::new(1080, 1080));
    }

    #[test]
    fn test_aspect_ratio() {
        let hd = Stage::hd1080();
        assert!((hd.aspect_ratio() - (16.0 / 9.0)).abs() < 0.001);

        let square = Stage::square();
        assert_eq!(square.aspect_ratio(), 1.0);
    }

    #[test]
    fn test_orientation() {
        let landscape = Stage::hd1080();
        assert!(landscape.is_landscape());
        assert!(!landscape.is_portrait());
        assert!(!landscape.is_square());

        let portrait = Stage::vertical_hd();
        assert!(!portrait.is_landscape());
        assert!(portrait.is_portrait());
        assert!(!portrait.is_square());

        let square = Stage::square();
        assert!(!square.is_landscape());
        assert!(!square.is_portrait());
        assert!(square.is_square());
    }

    #[test]
    fn test_validation() {
        let valid_stage = Stage::new(1920, 1080);
        assert!(valid_stage.validate().is_ok());

        let invalid_width = Stage::new(0, 1080);
        assert!(invalid_width.validate().is_err());

        let invalid_height = Stage::new(1920, 0);
        assert!(invalid_height.validate().is_err());

        let negative = Stage::new(-100, -100);
        assert!(negative.validate().is_err());
    }

    #[test]
    fn test_scaling() {
        let stage = Stage::new(1920, 1080);
        let scaled = stage.scale(0.5);
        assert_eq!(scaled, Stage::new(960, 540));

        let scaled_up = stage.scale(2.0);
        assert_eq!(scaled_up, Stage::new(3840, 2160));
    }

    #[test]
    fn test_fit_within() {
        let large_stage = Stage::new(4000, 3000);
        let fitted = large_stage.fit_within(1920, 1080);

        // Should maintain aspect ratio and fit within bounds
        assert!(fitted.width <= 1920);
        assert!(fitted.height <= 1080);

        // Should preserve aspect ratio
        let original_ratio = large_stage.aspect_ratio();
        let fitted_ratio = fitted.aspect_ratio();
        assert!((original_ratio - fitted_ratio).abs() < 0.01);
    }

    #[test]
    fn test_contains_point() {
        let stage = Stage::new(1920, 1080);

        assert!(stage.contains_point(0, 0));
        assert!(stage.contains_point(960, 540));
        assert!(stage.contains_point(1919, 1079));

        assert!(!stage.contains_point(-1, 0));
        assert!(!stage.contains_point(0, -1));
        assert!(!stage.contains_point(1920, 1080));
        assert!(!stage.contains_point(2000, 1200));
    }

    #[test]
    fn test_contains_rect() {
        let stage = Stage::new(1920, 1080);

        assert!(stage.contains_rect(0, 0, 100, 100));
        assert!(stage.contains_rect(100, 100, 200, 200));
        assert!(stage.contains_rect(1820, 980, 100, 100));

        assert!(!stage.contains_rect(-10, 0, 100, 100));
        assert!(!stage.contains_rect(0, -10, 100, 100));
        assert!(!stage.contains_rect(1850, 1000, 100, 100));
        assert!(!stage.contains_rect(1000, 1050, 100, 100));
    }

    #[test]
    fn test_center() {
        let stage = Stage::new(1920, 1080);
        assert_eq!(stage.center(), (960, 540));

        let square = Stage::new(1000, 1000);
        assert_eq!(square.center(), (500, 500));
    }

    #[test]
    fn test_pixel_count() {
        let hd = Stage::hd1080();
        assert_eq!(hd.pixel_count(), 1920 * 1080);

        let uhd = Stage::uhd4k();
        assert_eq!(uhd.pixel_count(), 3840 * 2160);
    }

    #[test]
    fn test_conversions() {
        let stage = Stage::new(1920, 1080);
        let tuple: (i32, i32) = stage.into();
        assert_eq!(tuple, (1920, 1080));

        let stage_from_tuple = Stage::from((1280, 720));
        assert_eq!(stage_from_tuple, Stage::new(1280, 720));
    }

    #[test]
    fn test_display() {
        let stage = Stage::new(1920, 1080);
        assert_eq!(format!("{}", stage), "1920x1080");
    }
}
