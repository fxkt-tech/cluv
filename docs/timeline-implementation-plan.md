# NLE Timeline 功能实现技术方案

> 基于调研报告的可执行实施方案  
> 项目：CLUV 视频编辑器  
> 版本：v1.0  
> 更新时间：2024年

## 目录

- [一、概述](#一概述)
- [二、技术栈确认](#二技术栈确认)
- [三、数据结构设计](#三数据结构设计)
- [四、实施步骤](#四实施步骤)
  - [Phase 1: 基础架构](#phase-1-基础架构2-3天)
  - [Phase 2: 拖拽功能](#phase-2-拖拽功能3-4天)
  - [Phase 3: 播放同步](#phase-3-播放同步2-3天)
  - [Phase 4: 编辑功能](#phase-4-编辑功能4-5天)
  - [Phase 5: 高级功能](#phase-5-高级功能5-7天)
  - [Phase 6: 性能优化](#phase-6-性能优化3-4天)
- [五、测试方案](#五测试方案)
- [六、部署检查清单](#六部署检查清单)

---

## 一、概述

### 1.1 目标

将当前静态的 Timeline 组件改造为功能完整的 NLE 时间线编辑器，实现：
- ✅ 从 ResourcePanel 拖拽素材到 Timeline
- ✅ Timeline 与 PlayerArea 双向同步
- ✅ Clip 的拖拽、缩放、裁剪
- ✅ 多轨道管理
- ✅ 状态持久化

### 1.2 技术选型

| 技术 | 用途 | 版本 |
|------|------|------|
| @dnd-kit/core | 拖拽核心库 | ^6.1.0 |
| @dnd-kit/sortable | 排序功能 | ^8.0.0 |
| zustand | 全局状态管理 | ^4.5.0 |
| immer | 不可变数据更新 | ^10.0.0 |
| uuid | 唯一ID生成 | ^9.0.0 |
| lodash-es | 工具函数 | ^4.17.21 |

---

## 二、技术栈确认

### 2.1 安装依赖

**步骤 1**: 进入前端目录
```bash
cd cluv/frontend
```

**步骤 2**: 安装NPM包
```bash
pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand immer uuid lodash-es
```

**步骤 3**: 安装类型定义
```bash
pnpm add -D @types/uuid @types/lodash-es
```

**步骤 4**: 验证安装
```bash
pnpm list @dnd-kit/core zustand
```

---

## 三、数据结构设计

### 3.1 类型定义增强

**文件**: `frontend/app/editor/types/editor.ts`

**步骤**: 替换或扩展现有类型定义

```typescript
// ==================== 核心数据结构 ====================

export interface Clip {
  id: string;
  name: string;
  type: "video" | "audio" | "image" | "text";
  
  // 时间信息（单位：秒）
  startTime: number;        // Timeline上的开始时间
  duration: number;         // Clip的显示时长
  
  // 素材信息
  resourceId: string;       // 关联的Resource ID
  resourceSrc: string;      // 素材文件路径
  
  // 裁剪信息（单位：秒）
  trimStart: number;        // 素材的裁剪起点
  trimEnd: number;          // 素材的裁剪终点
  
  // 视觉属性
  position?: { x: number; y: number };  // 画面位置（视频/图片）
  scale?: number;           // 缩放比例
  rotation?: number;        // 旋转角度
  opacity?: number;         // 透明度 0-1
  
  // 音频属性
  volume?: number;          // 音量 0-1
  
  // 元数据
  thumbnailUrl?: string;    // 缩略图URL
  waveformData?: number[];  // 音频波形数据
}

export interface Track {
  id: string;
  name: string;
  type: "video" | "audio";
  clips: Clip[];
  
  // 轨道状态
  visible: boolean;         // 是否可见
  locked: boolean;          // 是否锁定
  muted?: boolean;          // 是否静音（音频轨道）
  
  // 轨道顺序（数字越大越靠上，渲染优先级越高）
  order: number;
}

// ==================== Timeline 状态 ====================

export interface TimelineState {
  // 轨道数据
  tracks: Track[];
  
  // 时间信息
  currentTime: number;      // 当前播放时间（秒）
  duration: number;         // 总时长（秒）
  
  // 视图配置
  pixelsPerSecond: number;  // 每秒对应的像素数（基础值）
  zoomLevel: number;        // 缩放倍数 (0.5 - 3.0)
  scrollLeft: number;       // 水平滚动位置
  
  // 选择状态
  selectedClipIds: string[];
  selectedTrackId: string | null;
  
  // 拖拽状态
  isDragging: boolean;
  draggedClipId: string | null;
  
  // 吸附配置
  snappingEnabled: boolean;
  snapThreshold: number;    // 吸附阈值（像素）
}

// ==================== 配置常量 ====================

export const TIMELINE_CONFIG = {
  // 轨道配置
  TRACK_HEIGHT: 64,           // 单个轨道高度（像素）
  TRACK_HEADER_WIDTH: 160,    // 轨道标题宽度（像素）
  MIN_CLIP_WIDTH: 20,         // Clip最小宽度（像素）
  
  // 时间配置
  BASE_PIXELS_PER_SECOND: 100, // 基础比例：1秒=100像素
  MIN_ZOOM: 0.5,              // 最小缩放
  MAX_ZOOM: 3.0,              // 最大缩放
  
  // 吸附配置
  SNAP_THRESHOLD: 8,          // 吸附阈值（像素）
  
  // 时间刻度配置
  RULER_HEIGHT: 32,           // 时间刻度尺高度
  MAJOR_TICK_INTERVAL: 1,     // 主刻度间隔（秒）
  MINOR_TICK_COUNT: 4,        // 次刻度数量
};

// ==================== 工具函数类型 ====================

export interface TimelineUtils {
  timeToPixels: (timeInSeconds: number, zoomLevel: number) => number;
  pixelsToTime: (pixels: number, zoomLevel: number) => number;
  snapTime: (time: number, threshold: number) => number;
  formatTime: (seconds: number) => string;
}
```

### 3.2 Zustand Store 结构

**文件**: `frontend/app/editor/stores/timelineStore.ts` (新建)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import { Track, Clip, TimelineState, TIMELINE_CONFIG } from '../types/editor';

interface TimelineStore extends TimelineState {
  // ==================== Track 操作 ====================
  addTrack: (type: 'video' | 'audio') => void;
  removeTrack: (trackId: string) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  reorderTracks: (trackIds: string[]) => void;
  
  // ==================== Clip 操作 ====================
  addClip: (trackId: string, clip: Omit<Clip, 'id'>) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  moveClip: (clipId: string, targetTrackId: string, newStartTime: number) => void;
  duplicateClip: (clipId: string) => void;
  
  // ==================== 选择操作 ====================
  selectClip: (clipId: string, multi?: boolean) => void;
  deselectClip: (clipId: string) => void;
  clearSelection: () => void;
  selectTrack: (trackId: string | null) => void;
  
  // ==================== 时间操作 ====================
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  
  // ==================== 视图操作 ====================
  setZoomLevel: (zoom: number) => void;
  setScrollLeft: (scroll: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  
  // ==================== 拖拽操作 ====================
  startDrag: (clipId: string) => void;
  endDrag: () => void;
  
  // ==================== 吸附操作 ====================
  toggleSnapping: () => void;
  setSnapThreshold: (threshold: number) => void;
  
  // ==================== 工具方法 ====================
  getClipById: (clipId: string) => Clip | undefined;
  getTrackById: (trackId: string) => Track | undefined;
  getClipsAtTime: (time: number) => Clip[];
  
  // ==================== 批量操作 ====================
  deleteSelectedClips: () => void;
  
  // ==================== 重置 ====================
  reset: () => void;
}

const initialState: TimelineState = {
  tracks: [],
  currentTime: 0,
  duration: 0,
  pixelsPerSecond: TIMELINE_CONFIG.BASE_PIXELS_PER_SECOND,
  zoomLevel: 1,
  scrollLeft: 0,
  selectedClipIds: [],
  selectedTrackId: null,
  isDragging: false,
  draggedClipId: null,
  snappingEnabled: true,
  snapThreshold: TIMELINE_CONFIG.SNAP_THRESHOLD,
};

export const useTimelineStore = create<TimelineStore>()(
  immer((set, get) => ({
    ...initialState,
    
    // Track 操作实现会在后续步骤中添加
    addTrack: (type) => set((state) => {
      const newTrack: Track = {
        id: uuidv4(),
        name: `${type === 'video' ? '视频' : '音频'}轨道 ${state.tracks.length + 1}`,
        type,
        clips: [],
        visible: true,
        locked: false,
        muted: false,
        order: state.tracks.length,
      };
      state.tracks.push(newTrack);
    }),
    
    // 其他方法实现将在后续步骤中完善
    // ... (占位)
  }))
);
```

---

## 四、实施步骤

## Phase 1: 基础架构（2-3天）

### Step 1.1: 创建工具函数

**文件**: `frontend/app/editor/utils/timeline.ts` (新建)

**任务**: 实现时间-像素转换和格式化函数

```typescript
import { TIMELINE_CONFIG } from '../types/editor';

/**
 * 将时间（秒）转换为像素位置
 */
export function timeToPixels(timeInSeconds: number, zoomLevel: number = 1): number {
  return timeInSeconds * TIMELINE_CONFIG.BASE_PIXELS_PER_SECOND * zoomLevel;
}

/**
 * 将像素位置转换为时间（秒）
 */
export function pixelsToTime(pixels: number, zoomLevel: number = 1): number {
  return pixels / (TIMELINE_CONFIG.BASE_PIXELS_PER_SECOND * zoomLevel);
}

/**
 * 格式化时间为 HH:MM:SS.mmm
 */
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * 格式化时间为简洁格式 MM:SS
 */
export function formatTimeSimple(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 计算吸附时间（对齐到最近的整秒或其他clip）
 */
export function snapTime(
  time: number,
  otherTimes: number[],
  threshold: number,
  pixelsPerSecond: number,
  zoomLevel: number
): number {
  const thresholdInSeconds = pixelsToTime(threshold, zoomLevel);
  
  // 对齐到整秒
  const roundedTime = Math.round(time);
  if (Math.abs(time - roundedTime) < thresholdInSeconds) {
    return roundedTime;
  }
  
  // 对齐到其他时间点
  for (const otherTime of otherTimes) {
    if (Math.abs(time - otherTime) < thresholdInSeconds) {
      return otherTime;
    }
  }
  
  return time;
}

/**
 * 计算时间刻度（根据缩放级别动态调整）
 */
export function calculateTimeMarks(
  duration: number,
  zoomLevel: number,
  viewportWidth: number
): { time: number; label: string; isMajor: boolean }[] {
  const marks: { time: number; label: string; isMajor: boolean }[] = [];
  
  // 根据缩放级别确定刻度间隔
  let interval: number;
  if (zoomLevel >= 2) {
    interval = 0.5; // 0.5秒
  } else if (zoomLevel >= 1) {
    interval = 1; // 1秒
  } else if (zoomLevel >= 0.5) {
    interval = 5; // 5秒
  } else {
    interval = 10; // 10秒
  }
  
  const maxTime = Math.ceil(duration / interval) * interval;
  
  for (let time = 0; time <= maxTime; time += interval) {
    const isMajor = time % (interval * 5) === 0;
    marks.push({
      time,
      label: formatTimeSimple(time),
      isMajor,
    });
  }
  
  return marks;
}

/**
 * 检测Clip碰撞
 */
export function detectClipCollision(
  clip: { startTime: number; duration: number },
  otherClips: { startTime: number; duration: number }[]
): boolean {
  const clipEnd = clip.startTime + clip.duration;
  
  for (const other of otherClips) {
    const otherEnd = other.startTime + other.duration;
    
    // 检测时间重叠
    if (
      (clip.startTime >= other.startTime && clip.startTime < otherEnd) ||
      (clipEnd > other.startTime && clipEnd <= otherEnd) ||
      (clip.startTime <= other.startTime && clipEnd >= otherEnd)
    ) {
      return true;
    }
  }
  
  return false;
}

/**
 * 限制数值在范围内
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
```

**验证**: 创建测试文件验证工具函数

```typescript
// frontend/app/editor/utils/__tests__/timeline.test.ts
import { timeToPixels, pixelsToTime, formatTime } from '../timeline';

console.log('Test 1:', timeToPixels(10, 1)); // 应输出 1000
console.log('Test 2:', pixelsToTime(1000, 1)); // 应输出 10
console.log('Test 3:', formatTime(125.5)); // 应输出 "02:05.500"
```

---

### Step 1.2: 完善 Zustand Store

**文件**: `frontend/app/editor/stores/timelineStore.ts`

**任务**: 实现所有 Store 方法

```typescript
// 接续前面的 create 调用，完善所有方法

export const useTimelineStore = create<TimelineStore>()(
  immer((set, get) => ({
    ...initialState,
    
    // ==================== Track 操作 ====================
    addTrack: (type) => set((state) => {
      const newTrack: Track = {
        id: uuidv4(),
        name: `${type === 'video' ? '视频' : '音频'}轨道 ${state.tracks.filter(t => t.type === type).length + 1}`,
        type,
        clips: [],
        visible: true,
        locked: false,
        muted: false,
        order: state.tracks.length,
      };
      state.tracks.push(newTrack);
    }),
    
    removeTrack: (trackId) => set((state) => {
      state.tracks = state.tracks.filter(t => t.id !== trackId);
      // 重新排序
      state.tracks.forEach((track, index) => {
        track.order = index;
      });
    }),
    
    updateTrack: (trackId, updates) => set((state) => {
      const track = state.tracks.find(t => t.id === trackId);
      if (track) {
        Object.assign(track, updates);
      }
    }),
    
    reorderTracks: (trackIds) => set((state) => {
      const trackMap = new Map(state.tracks.map(t => [t.id, t]));
      state.tracks = trackIds.map((id, index) => {
        const track = trackMap.get(id)!;
        track.order = index;
        return track;
      });
    }),
    
    // ==================== Clip 操作 ====================
    addClip: (trackId, clipData) => set((state) => {
      const track = state.tracks.find(t => t.id === trackId);
      if (!track) return;
      
      const newClip: Clip = {
        id: uuidv4(),
        trimStart: 0,
        trimEnd: clipData.duration,
        position: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        opacity: 1,
        volume: 1,
        ...clipData,
      };
      
      track.clips.push(newClip);
      
      // 更新总时长
      const maxEnd = Math.max(
        ...state.tracks.flatMap(t => 
          t.clips.map(c => c.startTime + c.duration)
        ),
        state.duration
      );
      state.duration = maxEnd;
    }),
    
    removeClip: (clipId) => set((state) => {
      for (const track of state.tracks) {
        track.clips = track.clips.filter(c => c.id !== clipId);
      }
      state.selectedClipIds = state.selectedClipIds.filter(id => id !== clipId);
    }),
    
    updateClip: (clipId, updates) => set((state) => {
      for (const track of state.tracks) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          Object.assign(clip, updates);
          return;
        }
      }
    }),
    
    moveClip: (clipId, targetTrackId, newStartTime) => set((state) => {
      // 找到原轨道和clip
      let clip: Clip | undefined;
      let sourceTrack: Track | undefined;
      
      for (const track of state.tracks) {
        const foundClip = track.clips.find(c => c.id === clipId);
        if (foundClip) {
          clip = foundClip;
          sourceTrack = track;
          break;
        }
      }
      
      if (!clip || !sourceTrack) return;
      
      // 找到目标轨道
      const targetTrack = state.tracks.find(t => t.id === targetTrackId);
      if (!targetTrack) return;
      
      // 从原轨道移除
      sourceTrack.clips = sourceTrack.clips.filter(c => c.id !== clipId);
      
      // 更新时间并添加到目标轨道
      clip.startTime = Math.max(0, newStartTime);
      targetTrack.clips.push(clip);
    }),
    
    duplicateClip: (clipId) => set((state) => {
      for (const track of state.tracks) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) {
          const newClip: Clip = {
            ...clip,
            id: uuidv4(),
            startTime: clip.startTime + clip.duration + 0.1,
          };
          track.clips.push(newClip);
          return;
        }
      }
    }),
    
    // ==================== 选择操作 ====================
    selectClip: (clipId, multi = false) => set((state) => {
      if (multi) {
        if (!state.selectedClipIds.includes(clipId)) {
          state.selectedClipIds.push(clipId);
        }
      } else {
        state.selectedClipIds = [clipId];
      }
    }),
    
    deselectClip: (clipId) => set((state) => {
      state.selectedClipIds = state.selectedClipIds.filter(id => id !== clipId);
    }),
    
    clearSelection: () => set((state) => {
      state.selectedClipIds = [];
    }),
    
    selectTrack: (trackId) => set((state) => {
      state.selectedTrackId = trackId;
    }),
    
    // ==================== 时间操作 ====================
    setCurrentTime: (time) => set((state) => {
      state.currentTime = Math.max(0, Math.min(time, state.duration));
    }),
    
    setDuration: (duration) => set((state) => {
      state.duration = duration;
    }),
    
    // ==================== 视图操作 ====================
    setZoomLevel: (zoom) => set((state) => {
      state.zoomLevel = clamp(zoom, TIMELINE_CONFIG.MIN_ZOOM, TIMELINE_CONFIG.MAX_ZOOM);
    }),
    
    setScrollLeft: (scroll) => set((state) => {
      state.scrollLeft = Math.max(0, scroll);
    }),
    
    zoomIn: () => set((state) => {
      state.zoomLevel = Math.min(state.zoomLevel + 0.2, TIMELINE_CONFIG.MAX_ZOOM);
    }),
    
    zoomOut: () => set((state) => {
      state.zoomLevel = Math.max(state.zoomLevel - 0.2, TIMELINE_CONFIG.MIN_ZOOM);
    }),
    
    // ==================== 拖拽操作 ====================
    startDrag: (clipId) => set((state) => {
      state.isDragging = true;
      state.draggedClipId = clipId;
    }),
    
    endDrag: () => set((state) => {
      state.isDragging = false;
      state.draggedClipId = null;
    }),
    
    // ==================== 吸附操作 ====================
    toggleSnapping: () => set((state) => {
      state.snappingEnabled = !state.snappingEnabled;
    }),
    
    setSnapThreshold: (threshold) => set((state) => {
      state.snapThreshold = threshold;
    }),
    
    // ==================== 工具方法 ====================
    getClipById: (clipId) => {
      const state = get();
      for (const track of state.tracks) {
        const clip = track.clips.find(c => c.id === clipId);
        if (clip) return clip;
      }
      return undefined;
    },
    
    getTrackById: (trackId) => {
      return get().tracks.find(t => t.id === trackId);
    },
    
    getClipsAtTime: (time) => {
      const state = get();
      const clips: Clip[] = [];
      for (const track of state.tracks) {
        for (const clip of track.clips) {
          if (time >= clip.startTime && time < clip.startTime + clip.duration) {
            clips.push(clip);
          }
        }
      }
      return clips;
    },
    
    // ==================== 批量操作 ====================
    deleteSelectedClips: () => set((state) => {
      const selectedIds = new Set(state.selectedClipIds);
      for (const track of state.tracks) {
        track.clips = track.clips.filter(c => !selectedIds.has(c.id));
      }
      state.selectedClipIds = [];
    }),
    
    // ==================== 重置 ====================
    reset: () => set(initialState),
  }))
);

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
```

---

### Step 1.3: 重构 TimelineRuler 组件

**文件**: `frontend/app/editor/components/Timeline/TimelineRuler.tsx`

**任务**: 实现动态时间刻度生成

```typescript
"use client";

import { useMemo } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { calculateTimeMarks, timeToPixels } from '../../utils/timeline';

interface TimelineRulerProps {
  width: number;  // 时间线总宽度
}

export function TimelineRuler({ width }: TimelineRulerProps) {
  const { duration, zoomLevel } = useTimelineStore();
  
  const marks = useMemo(() => {
    return calculateTimeMarks(duration || 60, zoomLevel, width);
  }, [duration, zoomLevel, width]);
  
  return (
    <div className="h-8 border-b border-editor-border flex items-end pb-1 sticky top-0 bg-editor-bg z-10">
      <div className="relative w-full h-full">
        {marks.map(({ time, label, isMajor }) => {
          const left = timeToPixels(time, zoomLevel);
          
          return (
            <div
              key={time}
              className="absolute bottom-0 flex flex-col items-center"
              style={{ left: `${left}px`, transform: 'translateX(-50%)' }}
            >
              {/* 刻度线 */}
              <div
                className={`w-px ${
                  isMajor
                    ? 'h-3 bg-text-secondary'
                    : 'h-2 bg-text-muted'
                }`}
              />
              
              {/* 时间标签（仅主刻度显示） */}
              {isMajor && (
                <span className="text-[10px] text-text-muted mt-0.5 whitespace-nowrap">
                  {label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### Step 1.4: 重构 Playhead 组件

**文件**: `frontend/app/editor/components/Timeline/Playhead.tsx`

**任务**: 支持拖拽和时间同步

```typescript
"use client";

import { useState, useEffect, useRef } from 'react';
import { useTimelineStore } from '../../stores/timelineStore';
import { timeToPixels, pixelsToTime } from '../../utils/timeline';

interface PlayheadProps {
  onSeek?: (time: number) => void;
}

export function Playhead({ onSeek }: PlayheadProps) {
  const { currentTime, zoomLevel } = useTimelineStore();
  const [isDragging, setIsDragging] = useState(false);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);
  
  const position = timeToPixels(currentTime, zoomLevel);
  
  useEffect(() => {
    // 获取时间线容器的引用
    timelineRef.current = playheadRef.current?.closest('.timeline-tracks-area') as HTMLDivElement;
  }, []);
  
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = Math.max(0, pixelsToTime(x, zoomLevel));
      
      onSeek?.(time);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoomLevel, onSeek]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  return (
    <div
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-px z-20 bg-accent-cyan"
      style={{ left: `${position}px` }}
    >
      {/* Playhead 头部（可拖拽） */}
      <div
        className="absolute top-0 -left-1.5 w-3 h-3 cursor-ew-resize"
        onMouseDown={handleMouseDown}
      >
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-8 border-t-accent-cyan" />
      </div>
      
      {/* 拖拽中的样式 */}
      {isDragging && (
        <div className="absolute top-3 left-2 bg-accent-cyan text-editor-bg text-xs px-1 py-0.5 rounded whitespace-nowrap">
          {currentTime.toFixed(2)}s
        </div>
      )}
    </div>
  );
}
```

---

### Step 1.5: 初始化默认轨道

**文件**: `frontend/app/editor/page.tsx`

**任务**: 在页面加载时初始化默认轨道

```typescript
// 在 EditorPage 组件中添加

import { useTimelineStore } from './stores/timelineStore';
import { useEffect } from 'react';

export default function EditorPage() {
  // ... 现有代码
  
  const { tracks, addTrack } = useTimelineStore();
  
  // 初始化默认轨道
  useEffect(() => {
    if (tracks.length === 0) {
      // 添加一个视频轨道和一个音频轨道
      addTrack('video');
      addTrack('audio');
    }
  }, [tracks.length, addTrack]);
  
  // ... 其余代码
}
```

---

## Phase 2: 拖拽功能（3-4天）

### Step 2.1: 配置 DndContext

**文件**: `frontend/app/editor/components/Timeline/Timeline.tsx`

**任务**: 集成 @dnd-kit

```typescript
"use client";

import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { useState } from 'react';
import { Track } from '../../types/editor';
import { TimelineToolbar } from './TimelineToolbar';
import { TimelineContent } from './TimelineContent';
import { TimelineClip } from './TimelineClip';
import { useTimelineStore } from '../../stores/timelineStore';

interface TimelineProps {
  onSeek?: (time: number) => void;
}

export function Timeline({ onSeek }: TimelineProps) {
  const { 
    tracks, 
    zoomLevel, 
    setZoomLevel,
    draggedClipId,
    getClipById,
    endDrag 
  } = useTimelineStore();
  
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = (event: any) => {
    setActiveId(null);
    endDrag();
    // 拖拽结束逻辑将在 TimelineContent 中处理
  };
  
  const draggedClip = activeId ? getClipById(activeId) : null;
  
  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="h-timeline border-t border-editor-border flex flex-col shrink-0 bg-editor-bg">
        <TimelineToolbar 
          zoomLevel={zoomLevel} 
          onZoomChange={setZoomLevel} 
        />
        <TimelineContent 
          tracks={tracks}
          onSeek={onSeek}
        />
      </div>
      
      {/* 拖拽预览 */}
      <DragOverlay>
        {draggedClip && (
          <div className="opacity-80">
            <TimelineClip clip={draggedClip} isSelected={false} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
```

---

### Step 2.2: ResourceGrid 添加拖拽源

**文件**: `frontend/app/editor/components/ResourceGrid.tsx`

**任务**: 使资源卡片可拖拽

```typescript
// 在现有的 ResourceGrid 组件中修改

interface ResourceItemProps {
  resource: BackendResource;
  onSelect: (resource: BackendResource | null) => void;
  onDragStart?: (resource: BackendResource) => void;
}

function ResourceItem({ resource, onSelect, onDragStart }: ResourceItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    // 设置拖拽数据
    const dragData = {
      resourceId: resource.id,
      resourceName: resource.name,
      resourceType: resource.resource_type,
      resourceSrc: resource.src,
    };
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    
    onDragStart?.(resource);
  };
  
  return (
    <div
      draggable={true}
      onDragStart={handleDragStart}
      onClick={() => onSelect(resource)}
      className="cursor-move hover:opacity-80 transition-opacity"
    >
      {/* 现有的资源卡片内容 */}
      <div className="aspect-video bg-editor-hover rounded overflow-hidden">
        {/* 缩略图或图标 */}
      </div>
      <p className="text-xs mt-1 truncate">{resource.name}</p>
    </div>
  );
}
```

---

### Step 2.3: TimelineContent 添加放置区域

**文件**: `frontend/app/editor/components/Timeline/TimelineContent.tsx`

**任务**: 接收资源拖拽并创建Clip

```typescript
"use client";

import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Track } from '../../types/editor';
import { TimelineRuler } from './TimelineRuler';
import { TimelineClip } from './TimelineClip';
import { Playhead } from './Playhead';
import { useTimelineStore } from '../../stores/timelineStore';
import { timeToPixels, pixelsToTime } from '../../utils/timeline';
import { TIMELINE_CONFIG } from '../../types/editor';

interface TimelineContentProps {
  tracks: Track[];
  onSeek?: (time: number) => void;
}

export function TimelineContent({ tracks, onSeek }: TimelineContentProps) {
  const { 
    zoomLevel, 
    duration, 
    selectedClipIds,
    selectClip,
    clearSelection,
    addClip,
    setCurrentTime 
  } = useTimelineStore();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dropPreview, setDropPreview] = useState<{
    trackId: string;
    startTime: number;
  } | null>(null);
  
  // 计算时间线总宽度
  const timelineWidth = Math.max(
    timeToPixels(duration || 60, zoomLevel),
    2000
  );
  
  // 处理从 ResourcePanel 拖拽进来的素材
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top - TIMELINE_CONFIG.RULER_HEIGHT;
    
    const startTime = Math.max(0, pixelsToTime(x, zoomLevel));
    const trackIndex = Math.floor(y / TIMELINE_CONFIG.TRACK_HEIGHT);
    
    if (trackIndex >= 0 && trackIndex < tracks.length) {
      setDropPreview({
        trackId: tracks[trackIndex].id,
        startTime,
      });
    }
  };
  
  const handleDragLeave = () => {
    setDropPreview(null);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDropPreview(null);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (!containerRef.current || !data.resourceId) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top - TIMELINE_CONFIG.RULER_HEIGHT;
      
      const startTime = Math.max(0, pixelsToTime(x, zoomLevel));
      const trackIndex = Math.floor(y / TIMELINE_CONFIG.TRACK_HEIGHT);
      
      if (trackIndex < 0 || trackIndex >= tracks.length) return;
      
      const targetTrack = tracks[trackIndex];
      
      // TODO: 从后端获取实际的媒体时长
      // 目前使用默认值 5 秒
      const defaultDuration = 5;
      
      addClip(targetTrack.id, {
        name: data.resourceName,
        type: data.resourceType === 'video' ? 'video' : 'audio',
        startTime,
        duration: defaultDuration,
        resourceId: data.resourceId,
        resourceSrc: data.resourceSrc,
        trimStart: 0,
        trimEnd: defaultDuration,
      });
    } catch (error) {
      console.error('Failed to add clip:', error);
    }
  };
  
  // 点击时间轴跳转
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    // 只在点击空白区域时跳转
    if ((e.target as HTMLElement).closest('.timeline-clip')) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, pixelsToTime(x, zoomLevel));
    
    setCurrentTime(time);
    onSeek?.(time);
    clearSelection();
  };
  
  return (
    <div className="flex-1 flex relative overflow-hidden">
      {/* Track Headers */}
      <div className="w-track-header border-r border-editor-border z-10 flex flex-col pt-8 bg-editor-bg">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="h-16 px-2 flex items-center text-xs bg-editor-panel text-text-secondary border-b border-editor-border"
          >
            <div className="flex-1 truncate">{track.name}</div>
            <div className="flex gap-1">
              {/* 可见性切换 */}
              <button
                className={`text-xs ${track.visible ? 'text-accent-blue' : 'text-text-muted'}`}
                title={track.visible ? '隐藏' : '显示'}
              >
                👁
              </button>
              {/* 锁定切换 */}
              <button
                className={`text-xs ${track.locked ? 'text-accent-orange' : 'text-text-muted'}`}
                title={track.locked ? '已锁定' : '未锁定'}
              >
                🔒
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tracks Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-x-auto overflow-y-hidden bg-editor-dark timeline-tracks-area"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleTimelineClick}
      >
        {/* Ruler */}
        <TimelineRuler width={timelineWidth} />

        {/* Playhead */}
        <Playhead onSeek={onSeek} />

        {/* Clips */}
        <div 
          className="relative" 
          style={{ width: `${timelineWidth}px`, minHeight: `${tracks.length * TIMELINE_CONFIG.TRACK_HEIGHT}px` }}
        >
          {tracks.map((track, trackIndex) => (
            <div
              key={track.id}
              className="absolute left-0 right-0 border-b border-editor-border/30"
              style={{
                top: `${trackIndex * TIMELINE_CONFIG.TRACK_HEIGHT}px`,
                height: `${TIMELINE_CONFIG.TRACK_HEIGHT}px`,
              }}
            >
              {track.clips.map((clip) => (
                <TimelineClip
                  key={clip.id}
                  clip={clip}
                  trackIndex={trackIndex}
                  isSelected={selectedClipIds.includes(clip.id)}
                  onSelect={(id) => selectClip(id, false)}
                />
              ))}
            </div>
          ))}
          
          {/* Drop Preview */}
          {dropPreview && (
            <div
              className="absolute bg-accent-blue/20 border-2 border-dashed border-accent-blue rounded pointer-events-none"
              style={{
                left: `${timeToPixels(dropPreview.startTime, zoomLevel)}px`,
                top: `${tracks.findIndex(t => t.id === dropPreview.trackId) * TIMELINE_CONFIG.TRACK_HEIGHT + 8}px`,
                width: `${timeToPixels(5, zoomLevel)}px`, // 默认5秒
                height: `${TIMELINE_CONFIG.TRACK_HEIGHT - 16}px`,
              }}
            >
              <div className="flex items-center justify-center h-full text-xs text-accent-blue">
                放置在此
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

### Step 2.4: TimelineClip 支持拖拽

**文件**: `frontend/app/editor/components/Timeline/TimelineClip.tsx`

**任务**: 使Clip可拖拽和调整大小

```typescript
"use client";

import { useState, useRef } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Clip, TIMELINE_CONFIG } from '../../types/editor';
import { timeToPixels } from '../../utils/timeline';
import { useTimelineStore } from '../../stores/timelineStore';

interface TimelineClipProps {
  clip: Clip;
  trackIndex: number;
  isSelected: boolean;
  onSelect: (clipId: string) => void;
}

export function TimelineClip({
  clip,
  trackIndex,
  isSelected,
  onSelect,
}: TimelineClipProps) {
  const { zoomLevel, updateClip, startDrag, endDrag } = useTimelineStore();
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: clip.id,
    data: { type: 'clip', clip, trackIndex },
  });
  
  const width = timeToPixels(clip.duration, zoomLevel);
  const left = timeToPixels(clip.startTime, zoomLevel);
  const top = trackIndex * TIMELINE_CONFIG.TRACK_HEIGHT + 8;
  
  const style = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${Math.max(width, TIMELINE_CONFIG.MIN_CLIP_WIDTH)}px`,
    height: `${TIMELINE_CONFIG.TRACK_HEIGHT - 16}px`,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
  };
  
  // 边缘拖拽调整时长
  const handleEdgeDragStart = (e: React.MouseEvent, edge: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(edge);
  };
  
  const isVideo = clip.type === 'video' || clip.type === 'image';
  const isAudio = clip.type === 'audio';
  
  return (
    <div
      ref={setNodeRef}
      className={`absolute rounded-sm overflow-hidden cursor-move transition-opacity select-none timeline-clip ${
        isVideo
          ? 'bg-accent-blue/25 border-2 border-accent-blue text-accent-blue'
          : 'bg-accent-green/25 border-2 border-accent-green text-accent-green'
      } ${isSelected ? 'outline outline-2 outline-accent-orange outline-offset-1' : ''}`}
      style={style}
      onClick={handleClick}
      {...listeners}
      {...attributes}
    >
      {/* Clip Content */}
      <div className="h-full flex items-center px-2">
        <span className="text-xs truncate flex-1">{clip.name}</span>
      </div>
      
      {/* Left Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent-cyan z-10"
        onMouseDown={(e) => handleEdgeDragStart(e, 'left')}
      />
      
      {/* Right Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-accent-cyan z-10"
        onMouseDown={(e) => handleEdgeDragStart(e, 'right')}
      />
    </div>
  );
}
```

---

## Phase 3: 播放同步（2-3天）

### Step 3.1: 连接 Timeline 和 PlayerArea

**文件**: `frontend/app/editor/page.tsx`

**任务**: 实现双向时间同步

```typescript
// 在 EditorPage 中修改

export default function EditorPage() {
  // ... 现有代码
  
  const { currentTime, setCurrentTime } = useTimelineStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // PlayerArea 时间更新 -> Timeline
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };
  
  // Timeline 跳转 -> PlayerArea
  const handleTimelineSeek = (time: number) => {
    setCurrentTime(time);
    
    // 控制video元素跳转
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };
  
  return (
    // ... JSX
    <PlayerArea
      ref={videoRef}  // 需要修改 PlayerArea 使其支持 ref
      videoSrc={selectedVideoSrc}
      playbackTime={formatTimeWithDuration(currentTime, duration)}
      onTimeUpdate={handleTimeUpdate}
      onSeek={handleTimelineSeek}  // 新增
    />
    
    <Timeline
      onSeek={handleTimelineSeek}
    />
  );
}
```

---

### Step 3.2: 修改 PlayerArea 支持外部控制

**文件**: `frontend/app/editor/components/PlayerArea.tsx`

**任务**: 暴露视频控制方法

```typescript
"use client";

import { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
// ... 其他导入

export interface PlayerAreaRef {
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface PlayerAreaProps {
  // ... 现有 props
  onSeek?: (time: number) => void;  // 新增：外部跳转请求
}

export const PlayerArea = forwardRef<PlayerAreaRef, PlayerAreaProps>(
  function PlayerArea(
    {
      playbackTime,
      onPlayPause,
      onPrevious,
      onNext,
      videoSrc,
      onTimeUpdate,
      onDurationChange,
      onSeek,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // 暴露控制方法给父组件
    useImperativeHandle(ref, () => ({
      play: () => {
        videoRef.current?.play();
      },
      pause: () => {
        videoRef.current?.pause();
      },
      seekTo: (time: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      getCurrentTime: () => {
        return videoRef.current?.currentTime || 0;
      },
      getDuration: () => {
        return videoRef.current?.duration || 0;
      },
    }));
    
    // 响应外部跳转请求
    useEffect(() => {
      if (onSeek && videoRef.current) {
        // 注意：这里不直接设置 currentTime，而是通过事件处理
        // 实际的跳转会在父组件调用 ref.seekTo() 时完成
      }
    }, [onSeek]);
    
    // ... 其余现有代码保持不变
    
    return (
      <main className="flex-1 flex flex-col relative min-w-0 bg-editor-bg">
        {/* ... 现有 JSX */}
      </main>
    );
  }
);
```

---

## Phase 4: 编辑功能（4-5天）

### Step 4.1: 实现Clip边缘拖拽调整

**文件**: `frontend/app/editor/components/Timeline/TimelineClip.tsx`

**任务**: 完善边缘拖拽逻辑

```typescript
// 在 TimelineClip 组件中添加

import { useEffect } from 'react';
import { pixelsToTime } from '../../utils/timeline';

export function TimelineClip({ /* ... props */ }) {
  // ... 现有代码
  
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, startTime: 0, duration: 0 });
  
  // 边缘拖拽开始
  const handleEdgeMouseDown = (e: React.MouseEvent, edge: 'left' | 'right') => {
    e.stopPropagation();
    setIsResizing(edge);
    setResizeStart({
      x: e.clientX,
      startTime: clip.startTime,
      duration: clip.duration,
    });
  };
  
  // 边缘拖拽过程
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaTime = pixelsToTime(Math.abs(deltaX), zoomLevel);
      
      if (isResizing === 'left') {
        // 左边缘：调整 startTime 和 duration
        const newStartTime = deltaX > 0
          ? resizeStart.startTime + deltaTime
          : resizeStart.startTime - deltaTime;
        const newDuration = resizeStart.duration - (newStartTime - resizeStart.startTime);
        
        if (newDuration >= 0.1) { // 最小0.1秒
          updateClip(clip.id, {
            startTime: Math.max(0, newStartTime),
            duration: newDuration,
            trimStart: clip.trimStart + (newStartTime - resizeStart.startTime),
          });
        }
      } else if (isResizing === 'right') {
        // 右边缘：只调整 duration
        const newDuration = deltaX > 0
          ? resizeStart.duration + deltaTime
          : resizeStart.duration - deltaTime;
        
        if (newDuration >= 0.1) {
          updateClip(clip.id, {
            duration: newDuration,
            trimEnd: clip.trimStart + newDuration,
          });
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, clip, updateClip, zoomLevel]);
  
  // ... JSX 中的边缘拖拽区域
  return (
    <div /* ... */>
      {/* Left Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-accent-cyan/50 z-10"
        onMouseDown={(e) => handleEdgeMouseDown(e, 'left')}
      />
      
      {/* Right Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-accent-cyan/50 z-10"
        onMouseDown={(e) => handleEdgeMouseDown(e, 'right')}
      />
    </div>
  );
}
```

---

### Step 4.2: 实现键盘快捷键

**文件**: `frontend/app/editor/hooks/useKeyboardShortcuts.ts` (新建)

**任务**: 处理常用快捷键

```typescript
import { useEffect } from 'react';
import { useTimelineStore } from '../stores/timelineStore';

export function useKeyboardShortcuts(playerRef: React.RefObject<any>) {
  const {
    selectedClipIds,
    deleteSelectedClips,
    clearSelection,
    currentTime,
    setCurrentTime,
  } = useTimelineStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if ((e.target as HTMLElement).tagName === 'INPUT' || 
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }
      
      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          // 删除选中的clips
          if (selectedClipIds.length > 0) {
            e.preventDefault();
            deleteSelectedClips();
          }
          break;
          
        case 'Escape':
          // 取消选择
          clearSelection();
          break;
          
        case ' ':
          // 空格：播放/暂停
          e.preventDefault();
          if (playerRef.current) {
            const video = playerRef.current;
            if (video.paused) {
              video.play();
            } else {
              video.pause();
            }
          }
          break;
          
        case 'ArrowLeft':
          // 左箭头：后退1秒（Shift：后退5秒）
          e.preventDefault();
          setCurrentTime(Math.max(0, currentTime - (e.shiftKey ? 5 : 1)));
          if (playerRef.current) {
            playerRef.current.currentTime = currentTime - (e.shiftKey ? 5 : 1);
          }
          break;
          
        case 'ArrowRight':
          // 右箭头：前进1秒（Shift：前进5秒）
          e.preventDefault();
          setCurrentTime(currentTime + (e.shiftKey ? 5 : 1));
          if (playerRef.current) {
            playerRef.current.currentTime = currentTime + (e.shiftKey ? 5 : 1);
          }
          break;
          
        case 'Home':
          // Home：跳到开始
          e.preventDefault();
          setCurrentTime(0);
          if (playerRef.current) {
            playerRef.current.currentTime = 0;
          }
          break;
          
        case 'End':
          // End：跳到结束
          e.preventDefault();
          if (playerRef.current?.duration) {
            setCurrentTime(playerRef.current.duration);
            playerRef.current.currentTime = playerRef.current.duration;
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedClipIds, deleteSelectedClips, clearSelection, currentTime, setCurrentTime, playerRef]);
}
```

**使用方式**:

```typescript
// 在 page.tsx 中
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function EditorPage() {
  const playerRef = useRef<PlayerAreaRef>(null);
  
  // 启用快捷键
  useKeyboardShortcuts(playerRef);
  
  // ... 其他代码
}
```

---

### Step 4.3: 实现撤销/重做功能

**文件**: `frontend/app/editor/stores/historyStore.ts` (新建)

**任务**: 管理操作历史

```typescript
import { create } from 'zustand';
import { TimelineState } from '../types/editor';

interface HistoryState {
  past: TimelineState[];
  future: TimelineState[];
}

interface HistoryStore extends HistoryState {
  addToHistory: (state: TimelineState) => void;
  undo: () => TimelineState | null;
  redo: () => TimelineState | null;
  clearHistory: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],
  
  addToHistory: (state) => set((prev) => ({
    past: [...prev.past.slice(-MAX_HISTORY + 1), state],
    future: [], // 新操作会清空重做历史
  })),
  
  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return null;
    
    const previous = past[past.length - 1];
    
    set({
      past: past.slice(0, -1),
      future: [previous, ...future],
    });
    
    return previous;
  },
  
  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return null;
    
    const next = future[0];
    
    set({
      past: [...past, next],
      future: future.slice(1),
    });
    
    return next;
  },
  
  clearHistory: () => set({ past: [], future: [] }),
}));
```

---

## Phase 5: 高级功能（5-7天）

### Step 5.1: 实现吸附对齐

**文件**: `frontend/app/editor/utils/snapping.ts` (新建)

**任务**: 计算吸附点

```typescript
import { Clip, Track } from '../types/editor';
import { pixelsToTime } from './timeline';

export interface SnapPoint {
  time: number;
  type: 'clip-start' | 'clip-end' | 'playhead' | 'second';
  clipId?: string;
}

/**
 * 收集所有可能的吸附点
 */
export function collectSnapPoints(
  tracks: Track[],
  currentClipId: string | null,
  currentTime: number,
  duration: number
): SnapPoint[] {
  const snapPoints: SnapPoint[] = [];
  
  // 收集其他clips的起点和终点
  for (const track of tracks) {
    for (const clip of track.clips) {
      if (clip.id === currentClipId) continue;
      
      snapPoints.push({
        time: clip.startTime,
        type: 'clip-start',
        clipId: clip.id,
      });
      
      snapPoints.push({
        time: clip.startTime + clip.duration,
        type: 'clip-end',
        clipId: clip.id,
      });
    }
  }
  
  // 添加playhead位置
  snapPoints.push({
    time: currentTime,
    type: 'playhead',
  });
  
  // 添加整秒刻度
  for (let i = 0; i <= Math.ceil(duration); i++) {
    snapPoints.push({
      time: i,
      type: 'second',
    });
  }
  
  return snapPoints;
}

/**
 * 计算吸附后的时间
 */
export function calculateSnappedTime(
  targetTime: number,
  snapPoints: SnapPoint[],
  threshold: number,
  zoomLevel: number
): { time: number; snapped: boolean; snapPoint?: SnapPoint } {
  const thresholdInSeconds = pixelsToTime(threshold, zoomLevel);
  
  let closestPoint: SnapPoint | undefined;
  let minDistance = Infinity;
  
  for (const point of snapPoints) {
    const distance = Math.abs(targetTime - point.time);
    
    if (distance < thresholdInSeconds && distance < minDistance) {
      minDistance = distance;
      closestPoint = point;
    }
  }
  
  if (closestPoint) {
    return {
      time: closestPoint.time,
      snapped: true,
      snapPoint: closestPoint,
    };
  }
  
  return {
    time: targetTime,
    snapped: false,
  };
}
```

---

### Step 5.2: 实现缩略图预览

**文件**: `frontend/app/editor/components/Timeline/TimelineClipThumbnail.tsx` (新建)

**任务**: 显示视频缩略图

```typescript
"use client";

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

interface TimelineClipThumbnailProps {
  videoPath: string;
  startTime: number;
  width: number;
  height: number;
}

export function TimelineClipThumbnail({
  videoPath,
  startTime,
  width,
  height,
}: TimelineClipThumbnailProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let cancelled = false;
    
    const loadThumbnail = async () => {
      try {
        setIsLoading(true);
        
        // 调用后端生成缩略图
        const thumbnailPath = await invoke<string>('generate_thumbnail', {
          videoPath,
          time: startTime,
        });
        
        if (!cancelled) {
          const url = convertFileSrc(thumbnailPath);
          setThumbnailUrl(url);
        }
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    
    loadThumbnail();
    
    return () => {
      cancelled = true;
    };
  }, [videoPath, startTime]);
  
  if (isLoading) {
    return (
      <div
        className="bg-editor-hover animate-pulse"
        style={{ width, height }}
      />
    );
  }
  
  if (!thumbnailUrl) {
    return (
      <div
        className="bg-editor-hover flex items-center justify-center text-text-muted text-xs"
        style={{ width, height }}
      >
        无预览
      </div>
    );
  }
  
  return (
    <img
      src={thumbnailUrl}
      alt="Thumbnail"
      className="object-cover"
      style={{ width, height }}
    />
  );
}
```

---

### Step 5.3: 实现音频波形显示

**文件**: `frontend/app/editor/components/Timeline/AudioWaveform.tsx` (新建)

**任务**: 渲染音频波形

```typescript
"use client";

import { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  waveformData: number[];  // 归一化的波形数据 [-1, 1]
  width: number;
  height: number;
  color?: string;
}

export function AudioWaveform({
  waveformData,
  width,
  height,
  color = '#4ade80',
}: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData.length) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 设置样式
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    
    const centerY = height / 2;
    const samplesPerPixel = Math.ceil(waveformData.length / width);
    
    // 绘制波形
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, waveformData.length);
      
      // 取该像素范围内的最大振幅
      let max = 0;
      for (let i = startSample; i < endSample; i++) {
        max = Math.max(max, Math.abs(waveformData[i]));
      }
      
      const barHeight = max * (height / 2);
      
      // 绘制上半部分
      ctx.lineTo(x, centerY - barHeight);
    }
    
    // 绘制下半部分（镜像）
    for (let x = width - 1; x >= 0; x--) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(startSample + samplesPerPixel, waveformData.length);
      
      let max = 0;
      for (let i = startSample; i < endSample; i++) {
        max = Math.max(max, Math.abs(waveformData[i]));
      }
      
      const barHeight = max * (height / 2);
      ctx.lineTo(x, centerY + barHeight);
    }
    
    ctx.closePath();
    ctx.fill();
  }, [waveformData, width, height, color]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0"
    />
  );
}
```

---

### Step 5.4: 添加轨道管理工具栏

**文件**: `frontend/app/editor/components/Timeline/TrackManager.tsx` (新建)

**任务**: 管理轨道的添加、删除、重排序

```typescript
"use client";

import { useTimelineStore } from '../../stores/timelineStore';

export function TrackManager() {
  const { tracks, addTrack, removeTrack } = useTimelineStore();
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-editor-border bg-editor-panel">
      <span className="text-xs text-text-secondary">轨道:</span>
      
      <button
        onClick={() => addTrack('video')}
        className="px-2 py-1 text-xs rounded bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-colors"
      >
        + 视频轨道
      </button>
      
      <button
        onClick={() => addTrack('audio')}
        className="px-2 py-1 text-xs rounded bg-accent-green/20 text-accent-green hover:bg-accent-green/30 transition-colors"
      >
        + 音频轨道
      </button>
      
      <div className="flex-1" />
      
      <span className="text-xs text-text-muted">
        {tracks.length} 个轨道
      </span>
    </div>
  );
}
```

---

## Phase 6: 性能优化（3-4天）

### Step 6.1: 实现防抖和节流

**文件**: `frontend/app/editor/hooks/useThrottle.ts` (新建)

```typescript
import { useRef, useCallback } from 'react';

export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback(
    ((...args) => {
      const now = Date.now();
      
      if (now - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = now;
      }
    }) as T,
    [callback, delay]
  );
}

export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback(
    ((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}
```

**使用示例**:

```typescript
// 在需要的组件中
import { useThrottle } from '../../hooks/useThrottle';

const handleDrag = useThrottle((e: MouseEvent) => {
  // 拖拽处理逻辑
}, 16); // 约60fps
```

---

### Step 6.2: 优化Clip渲染

**文件**: `frontend/app/editor/components/Timeline/TimelineClip.tsx`

**任务**: 使用React.memo优化

```typescript
import { memo } from 'react';

export const TimelineClip = memo(function TimelineClip({
  clip,
  trackIndex,
  isSelected,
  onSelect,
}: TimelineClipProps) {
  // ... 组件实现
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return (
    prevProps.clip.id === nextProps.clip.id &&
    prevProps.clip.startTime === nextProps.clip.startTime &&
    prevProps.clip.duration === nextProps.clip.duration &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.trackIndex === nextProps.trackIndex
  );
});
```

---

## 五、测试方案

### 5.1 单元测试

**文件**: `frontend/app/editor/utils/__tests__/timeline.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { timeToPixels, pixelsToTime, formatTime, snapTime } from '../timeline';

describe('Timeline Utils', () => {
  describe('timeToPixels', () => {
    it('should convert time to pixels correctly', () => {
      expect(timeToPixels(1, 1)).toBe(100);
      expect(timeToPixels(5, 2)).toBe(1000);
      expect(timeToPixels(0.5, 1)).toBe(50);
    });
  });
  
  describe('pixelsToTime', () => {
    it('should convert pixels to time correctly', () => {
      expect(pixelsToTime(100, 1)).toBe(1);
      expect(pixelsToTime(1000, 2)).toBe(5);
      expect(pixelsToTime(50, 1)).toBe(0.5);
    });
  });
  
  describe('formatTime', () => {
    it('should format time correctly', () => {
      expect(formatTime(65.5)).toBe('01:05.500');
      expect(formatTime(3665)).toBe('01:01:05.000');
      expect(formatTime(0)).toBe('00:00.000');
    });
  });
});
```

### 5.2 集成测试场景

**测试清单**:

- [ ] 从ResourcePanel拖拽素材到Timeline
- [ ] Clip在Timeline中拖拽移动
- [ ] Clip调整大小（左右边缘）
- [ ] 点击Timeline跳转播放
- [ ] Playhead跟随视频播放
- [ ] 拖拽Playhead跳转
- [ ] 删除选中的Clip
- [ ] 缩放Timeline
- [ ] 多选Clip
- [ ] 键盘快捷键（空格、Delete等）

### 5.3 性能测试

**测试指标**:

| 指标 | 目标值 | 测试方法 |
|------|--------|----------|
| 初始渲染时间 | < 100ms | Chrome DevTools Performance |
| 拖拽流畅度 | 60fps | 监控requestAnimationFrame |
| 100个Clip渲染 | < 500ms | 压力测试 |
| 缩放响应时间 | < 50ms | 用户交互测试 |

---

## 六、部署检查清单

### 6.1 代码检查

- [ ] 所有TypeScript类型错误已解决
- [ ] ESLint无警告和错误
- [ ] 所有console.log已移除或改为适当的日志
- [ ] 未使用的导入已清理
- [ ] 组件已添加适当的注释

### 6.2 功能检查

- [ ] 拖拽功能在所有浏览器中正常工作
- [ ] Timeline和PlayerArea同步准确
- [ ] 缩放功能平滑无卡顿
- [ ] 快捷键在Windows和Mac上都有效
- [ ] Clip编辑操作可撤销/重做
- [ ] 状态持久化正常（刷新页面后恢复）

### 6.3 性能检查

- [ ] 无内存泄漏（长时间使用后）
- [ ] 拖拽时CPU使用率合理（< 50%）
- [ ] 大型项目（50+ clips）加载流畅
- [ ] 滚动和缩放无明显延迟

### 6.4 用户体验检查

- [ ] 拖拽时有视觉反馈
- [ ] 错误操作有提示信息
- [ ] Loading状态有加载指示器
- [ ] 吸附对齐有视觉提示
- [ ] 快捷键有工具提示说明

---

## 七、后端Tauri命令实现

### 7.1 获取媒体信息

**文件**: `frontend/src-tauri/src/commands/material.rs`

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct MediaInfo {
    pub duration: f64,
    pub width: i32,
    pub height: i32,
    pub fps: f64,
    pub has_audio: bool,
    pub has_video: bool,
}

#[tauri::command]
pub async fn get_media_info(path: String) -> Result<MediaInfo, String> {
    // TODO: 使用FFprobe获取媒体信息
    // 这里需要调用kiva-cut库中的FFprobe功能
    
    Ok(MediaInfo {
        duration: 10.0,
        width: 1920,
        height: 1080,
        fps: 30.0,
        has_audio: true,
        has_video: true,
    })
}
```

### 7.2 生成缩略图

**文件**: `frontend/src-tauri/src/commands/material.rs`

```rust
#[tauri::command]
pub async fn generate_thumbnail(
    video_path: String,
    time: f64,
) -> Result<String, String> {
    // TODO: 使用FFmpeg生成缩略图
    // 1. 在项目cache目录创建thumbnails文件夹
    // 2. 使用FFmpeg截取指定时间的帧
    // 3. 返回缩略图路径
    
    Err("Not implemented yet".to_string())
}
```

### 7.3 保存Timeline状态

**文件**: `frontend/src-tauri/src/commands/project.rs`

```rust
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn save_timeline(
    project_path: String,
    timeline_data: String,
) -> Result<(), String> {
    let mut path = PathBuf::from(project_path);
    path.push("cut.json");
    
    fs::write(&path, timeline_data)
        .map_err(|e| format!("Failed to save timeline: {}", e))?;
    
    Ok(())
}

#[tauri::command]
pub async fn load_timeline(project_path: String) -> Result<String, String> {
    let mut path = PathBuf::from(project_path);
    path.push("cut.json");
    
    if !path.exists() {
        return Ok("{}".to_string());
    }
    
    fs::read_to_string(&path)
        .map_err(|e| format!("Failed to load timeline: {}", e))
}
```

---

## 八、实施时间表

### Week 1-2: 基础架构
- Day 1-2: 安装依赖、创建类型定义
- Day 3-4: 实现工具函数、Zustand Store
- Day 5-7: 重构TimelineRuler、Playhead组件
- Day 8-10: 集成测试基础功能

### Week 3-4: 拖拽功能
- Day 1-3: 配置DndContext、ResourceGrid拖拽
- Day 4-6: TimelineContent放置区域
- Day 7-9: TimelineClip拖拽和调整
- Day 10: 测试拖拽功能

### Week 5: 播放同步
- Day 1-2: Timeline ↔ PlayerArea连接
- Day 3-4: Playhead拖拽和同步
- Day 5: 测试同步功能

### Week 6-7: 编辑功能
- Day 1-3: Clip边缘拖拽调整
- Day 4-5: 键盘快捷键
- Day 6-7: 撤销/重做
- Day 8-10: 综合测试

### Week 8-9: 高级功能
- Day 1-2: 吸附对齐
- Day 3-4: 缩略图预览
- Day 5-6: 音频波形
- Day 7-9: 轨道管理
- Day 10: 功能测试

### Week 10: 性能优化和收尾
- Day 1-3: 性能优化（防抖、memo）
- Day 4-5: 后端命令实现
- Day 6-7: 完整测试
- Day 8-10: Bug修复、文档完善

---

## 九、常见问题解决

### Q1: 拖拽时Clip位置闪烁

**原因**: 状态更新频率过高

**解决**: 使用throttle限制更新频率

```typescript
const handleDrag = useThrottle((e) => {
  updateClipPosition(e);
}, 16); // 60fps
```

### Q2: Timeline缩放时性能下降

**原因**: 大量组件重新渲染

**解决**: 
1. 使用React.memo优化Clip组件
2. 虚拟化渲染（只渲染可视区域）
3. 使用CSS transform代替重新计算位置

### Q3: 时间同步不准确

**原因**: 浮点数精度问题

**解决**: 统一时间精度到毫秒或使用整数表示

```typescript
const timeInMs = Math.round(timeInSeconds * 1000);
```

### Q4: 拖拽到其他轨道时类型不匹配

**原因**: 未验证轨道类型

**解决**: 添加类型检查

```typescript
if (targetTrack.type !== clip.type && clip.type !== 'audio') {
  // 视频clip不能拖到音频轨道（反之可以）
  return;
}
```

---

## 十、参考资料

### 官方文档
- [@dnd-kit Documentation](https://docs.dndkit.com/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Tauri API Reference](https://tauri.app/v1/api/js/)

### 相关项目
- [OpenShot (Python)](https://github.com/OpenShot/openshot-qt)
- [Kdenlive (C++)](https://github.com/KDE/kdenlive)
- [Shotcut (C++)](https://github.com/mltframework/shotcut)

### 设计参考
- Adobe Premiere Pro
- DaVinci Resolve
- Final Cut Pro

---

## 附录：完整的文件结构

```
frontend/app/editor/
├── components/
│   ├── Timeline/
│   │   ├── Timeline.tsx                 # ✅ 重构
│   │   ├── TimelineContent.tsx          # ✅ 重构
│   │   ├── TimelineToolbar.tsx          # 保持
│   │   ├── TimelineRuler.tsx            # ✅ 重构
│   │   ├── TimelineClip.tsx             # ✅ 重构
│   │   ├── Playhead.tsx                 # ✅ 重构
│   │   ├── TimelineClipThumbnail.tsx    # ✨ 新建
│   │   ├── AudioWaveform.tsx            # ✨ 新建
│   │   └── TrackManager.tsx             # ✨ 新建
│   ├── ResourcePanel.tsx                # ✅ 修改
│   ├── ResourceGrid.tsx                 # ✅ 修改
│   └── PlayerArea.tsx                   # ✅ 修改
├── stores/
│   ├── timelineStore.ts                 # ✨ 新建
│   └── historyStore.ts                  # ✨ 新建
├── hooks/
│   ├── useKeyboardShortcuts.ts          # ✨ 新建
│   ├── useThrottle.ts                   # ✨ 新建
│   └── useDebounce.ts                   # ✨ 新建
├── utils/
│   ├── timeline.ts                      # ✨ 新建
│   ├── snapping.ts                      # ✨ 新建
│   └── __tests__/
│       └── timeline.test.ts             # ✨ 新建
├── types/
│   └── editor.ts                        # ✅ 扩展
└── page.tsx                             # ✅ 修改
```

---

**方案完成日期**: 2024年  
**预计总工时**: 8-10周  
**优先级**: P0 (核心功能)

**下一步行动**: 
1. Review本方案并确认技术选型
2. 创建开发分支 `feature/timeline-implementation`
3. 按照Phase 1开始实施
4. 每个Phase完成后进行Code Review