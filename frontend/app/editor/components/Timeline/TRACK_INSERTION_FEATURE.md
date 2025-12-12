# Track Insertion Feature

## Overview

This feature allows users to drag files from the material library and drop them **between existing tracks** to create a new track at that specific position, rather than only at the end of the track list.

## Changes Made

### 1. New Component: `TrackDropZone.tsx`

A new component that creates drop zones above and below each track:

- **Location**: `frontend/app/editor/components/Timeline/TrackDropZone.tsx`
- **Purpose**: Provides visual feedback and handles drops for track insertion
- **Props**:
  - `position`: "above" | "below" - determines drop zone placement
  - `trackIndex`: number - the index of the associated track
  - `isActive`: boolean - whether a drag operation is in progress
  - `activeDragType`: "video" | "audio" | "image" - type of resource being dragged

**Features**:
- Only visible during drag operations
- Shows visual feedback on hover with blue dashed border
- Displays tooltip indicating where new track will be inserted
- Calculates correct insertion index based on position

### 2. Updated: `TimelineTrack.tsx`

Modified to wrap each track with drop zones:

- Added `TrackDropZone` components above and below each track
- Added new props: `isResourceDragging` and `activeDragResourceType`
- Drop zones become visible when dragging resources from material library

### 3. Updated: `TimelinePanel.tsx`

Modified to pass drag state to track components:

- Detects when a resource is being dragged (not a clip)
- Passes `isResourceDragging` and `activeDragResourceType` to each `TimelineTrack`
- Filters resource types to only valid ones (video, audio, image)

### 4. Updated: `timelineStore.ts`

Added new method for inserting tracks at specific positions:

```typescript
insertTrackAt: (index: number, type: "video" | "audio") => void
```

**Behavior**:
- Inserts new track at specified index
- Updates order property for all tracks after insertion
- Saves state to history for undo/redo

### 5. Updated: `page.tsx` (Editor)

Added handler for track-drop-zone drop events:

- Imports `insertTrackAt` from timeline store
- Handles drop event type "track-drop-zone" in `handleDragEnd`
- Calculates start time for clip based on drop position
- Creates new track at specified index
- Adds clip to newly created track

## User Experience

### Before
- Users could only:
  1. Drop files on existing tracks (adds clip to that track)
  2. Drop files in empty area below all tracks (creates track at end)

### After
- Users can now also:
  3. **Drop files between any two tracks** (creates new track at that position)
  4. **Drop files above the first track** (inserts track at beginning)
  5. **Drop files below any track** (inserts track after that track)

## Visual Feedback

1. **During Drag**: Drop zones appear as transparent areas above/below each track
2. **On Hover**: Drop zone highlights with blue dashed border
3. **Tooltip**: Shows message "Insert new [video/audio] track here"

## Technical Details

### Drop Zone Sizing
- Height: 16px (collapsed), 24px (on hover)
- Positioned absolutely relative to parent track
- Z-index: 50 (above track content but below playhead)

### Insertion Logic
- **Above position**: `insertIndex = trackIndex`
- **Below position**: `insertIndex = trackIndex + 1`

### Track Type Detection
- Video/Image resources → video track
- Audio resources → audio track

## Implementation Notes

1. Drop zones only appear when dragging resources (not when dragging clips)
2. Uses dnd-kit's `useDroppable` hook for drop detection
3. Maintains track order consistency through `order` property
4. Integrates with existing snapping and history system
5. Uses `setTimeout` to ensure track is created before adding clip

## Future Enhancements

Potential improvements:
- Drag to reorder existing tracks (not just insert new ones)
- Preview of track being inserted while dragging
- Animation when track is inserted
- Keyboard shortcuts for track insertion