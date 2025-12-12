# Track Insertion Visual Guide

## Feature Overview

This diagram shows how the track insertion feature works when dragging files from the material library.

## Scenario 1: Dragging a File Over Tracks

```
┌─────────────────────────────────────────────────────────────────┐
│  Material Library                                               │
│  ┌───────┐ ┌───────┐ ┌───────┐                                 │
│  │Video 1│ │Video 2│ │Audio 1│  ← User grabs file              │
│  └───────┘ └───────┘ └───────┘                                 │
└─────────────────────────────────────────────────────────────────┘

                    ↓ Drag starts

┌─────────────────────────────────────────────────────────────────┐
│  Timeline                                                       │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗ │
│  ║ Drop Zone (Above Track 1)                                 ║ │ ← INSERT HERE
│  ║ "Insert new video track here"                             ║ │
│  ╚═══════════════════════════════════════════════════════════╝ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Track 1: Video Track                                        ││
│  │ ┌──────┐  ┌────────┐                                       ││
│  │ │Clip A│  │ Clip B │                                       ││
│  │ └──────┘  └────────┘                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   Drop Zone (Between Track 1 & 2)                              │ ← OR INSERT HERE
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Track 2: Audio Track                                        ││
│  │ ┌────────────┐                                              ││
│  │ │  Clip C    │                                              ││
│  │ └────────────┘                                              ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   Drop Zone (Below Track 2)                                     │ ← OR INSERT HERE
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                                                 │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   Empty Area (Creates track at end)                            │ ← OR HERE (OLD)
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
└─────────────────────────────────────────────────────────────────┘

Legend:
  ╔═══╗  Active drop zone (hovering)
  ┌───┐  Track or clip
  ┌ ─ ┐  Inactive drop zone (visible but not hovering)
```

## Scenario 2: Result After Dropping on "Between Track 1 & 2"

```
BEFORE DROP:                          AFTER DROP:
┌───────────────────────┐            ┌───────────────────────┐
│ Track 1: Video Track  │            │ Track 1: Video Track  │
│ ┌──────┐  ┌────────┐  │            │ ┌──────┐  ┌────────┐  │
│ │Clip A│  │ Clip B │  │            │ │Clip A│  │ Clip B │  │
│ └──────┘  └────────┘  │            │ └──────┘  └────────┘  │
└───────────────────────┘            └───────────────────────┘
                                     ┌───────────────────────┐
                                     │ Track 2: Video Track  │ ← NEW!
                                     │ ┌──────────┐          │
                                     │ │ Video 2  │          │
                                     │ └──────────┘          │
                                     └───────────────────────┘
┌───────────────────────┐            ┌───────────────────────┐
│ Track 2: Audio Track  │            │ Track 3: Audio Track  │ ← Shifted down
│ ┌────────────┐        │            │ ┌────────────┐        │
│ │  Clip C    │        │            │ │  Clip C    │        │
│ └────────────┘        │            │ └────────────┘        │
└───────────────────────┘            └───────────────────────┘
```

## Drop Zone States

### 1. Hidden (No Drag in Progress)
```
┌─────────────────────────────────┐
│ Track 1: Video Track            │
│ ┌──────┐  ┌────────┐            │
│ │Clip A│  │ Clip B │            │
│ └──────┘  └────────┘            │
└─────────────────────────────────┘
(Drop zones are not visible)
```

### 2. Visible (Dragging Resource)
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  Drop Zone (subtle, 16px height)
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
┌─────────────────────────────────┐
│ Track 1: Video Track            │
│ ┌──────┐  ┌────────┐            │
│ │Clip A│  │ Clip B │            │
│ └──────┘  └────────┘            │
└─────────────────────────────────┘
```

### 3. Hovering (Mouse Over Drop Zone)
```
╔═════════════════════════════════╗
║ ┌─────────────────────────────┐ ║ ← Highlighted (24px height)
║ │ Insert new video track here │ ║ ← Tooltip shown
║ └─────────────────────────────┘ ║
╚═════════════════════════════════╝
┌─────────────────────────────────┐
│ Track 1: Video Track            │
│ ┌──────┐  ┌────────┐            │
│ │Clip A│  │ Clip B │            │
│ └──────┘  └────────┘            │
└─────────────────────────────────┘
```

## Technical Flow

```
1. User starts dragging file from Material Library
   ↓
2. TimelinePanel detects drag (useDndMonitor)
   ↓
3. activeDragData is set with resource info
   ↓
4. TimelinePanel passes isResourceDragging=true to tracks
   ↓
5. Each TimelineTrack renders TrackDropZone components
   ↓
6. Drop zones become visible (above & below each track)
   ↓
7. User hovers over a drop zone
   ↓
8. Drop zone highlights with blue dashed border
   ↓
9. User releases mouse (drops)
   ↓
10. handleDragEnd detects "track-drop-zone" type
    ↓
11. insertTrackAt(insertIndex, trackType) is called
    ↓
12. New track is created at specific position
    ↓
13. Clip is added to the new track
    ↓
14. All tracks after insertion have their order updated
```

## Code Structure

```
TimelinePanel.tsx
├── Monitors drag events (useDndMonitor)
├── Tracks activeDragData state
└── Passes drag info to TimelineTrack
    ↓
TimelineTrack.tsx
├── Receives isResourceDragging prop
├── Wraps track content with div
├── Renders TrackDropZone (above)
├── Renders Track content (middle)
└── Renders TrackDropZone (below)
    ↓
TrackDropZone.tsx
├── useDroppable hook for drop detection
├── Calculates insertIndex based on position
├── Renders drop indicator
└── Shows tooltip on hover
    ↓
page.tsx (Editor)
└── handleDragEnd()
    ├── Detects drop type: "track-drop-zone"
    ├── Gets insertIndex from dropData
    ├── Calls insertTrackAt(insertIndex, trackType)
    └── Adds clip to newly created track
```

## Key Differences from Old Behavior

| Aspect | Old Behavior | New Behavior |
|--------|--------------|--------------|
| **Drop Targets** | Only existing tracks + empty area | Tracks + drop zones + empty area |
| **Track Creation** | Only at end (empty area) | At any position |
| **Visual Feedback** | Basic hover on tracks | Dedicated drop zones with tooltips |
| **Precision** | Limited (2 options) | High (N+1 positions for N tracks) |
| **Use Case** | Simple workflows | Complex multi-track arrangements |

## Benefits

1. **Better Organization**: Insert tracks exactly where needed
2. **Efficient Workflow**: No need to reorder tracks manually after creation
3. **Clear Feedback**: Visual drop zones show exactly where track will be inserted
4. **Flexible**: Works with any number of existing tracks
5. **Non-Breaking**: Existing drag-to-track and drag-to-empty behaviors still work