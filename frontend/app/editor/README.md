# NLE Timeline 编辑器

这是一个基于 React + Next.js + Zustand 的非线性编辑（NLE）时间轴实现。

## 🚀 快速开始

### 1. 安装依赖

```bash
cd cluv/frontend
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

### 3. 在浏览器中打开

导航到编辑器页面并传入项目 ID：
```
http://localhost:3000/editor?id=your-project-id
```

## 📦 技术栈

- **React 19** - UI 框架
- **Next.js 16** - React 框架
- **TypeScript** - 类型安全
- **Zustand** - 状态管理
- **Immer** - 不可变数据更新
- **@dnd-kit** - 拖拽功能 ✅
- **Framer Motion** - 动画（Phase 5+）
- **Tailwind CSS** - 样式

## 🗂️ 项目结构

```
app/editor/
├── types/
│   ├── timeline.ts          # Timeline 核心类型
│   └── editor.ts            # 编辑器类型
├── stores/
│   └── timelineStore.ts     # Timeline 状态管理
├── utils/
│   └── timeline.ts          # Timeline 工具函数
├── components/
│   ├── Timeline.tsx         # 主时间轴容器
│   ├── TimelineRuler.tsx    # 时间标尺
│   ├── Playhead.tsx         # 播放指针
│   ├── TimelineClip.tsx     # 时间轴片段
│   ├── TimelineTrack.tsx    # 轨道组件
│   ├── TrackHeader.tsx      # 轨道控制面板
│   ├── TimelineDemo.tsx     # 演示/测试组件
│   ├── Header.tsx           # 顶部栏
│   ├── ResourcePanel.tsx    # 资源面板
│   ├── PlayerArea.tsx       # 播放器区域
│   └── PropertiesPanel.tsx  # 属性面板
├── hooks/
│   ├── useEditorState.ts    # 编辑器状态钩子
│   ├── useProjectById.ts    # 项目数据钩子
│   └── useProjectResources.ts # 资源管理钩子
└── page.tsx                 # 编辑器主页面
```

## 🎯 核心功能

### Phase 1: 基础架构 ✅

- [x] 完整的类型系统
- [x] Zustand 状态管理（29 个 API）
- [x] 工具函数库（15+ 函数）
- [x] 核心 UI 组件（6 个）
- [x] 轨道添加/删除/更新
- [x] 时间轴缩放和滚动
- [x] 播放指针拖拽
- [x] 片段选择（单选/多选）

### Phase 2: 拖拽功能 ✅

- [x] 从资源面板拖拽媒体
- [x] 片段在时间轴内拖拽
- [x] 跨轨道拖拽
- [x] 拖拽预览
- [x] 智能吸附对齐
- [x] 拖拽视觉反馈

### Phase 3: 播放同步 ✅

- [x] Timeline 与 Player 双向同步
- [x] 播放时自动更新 Playhead
- [x] Playhead 拖拽控制播放位置
- [x] 播放/暂停控制
- [x] 时间精确同步
- [x] PlayerArea ref 接口

### Phase 4: 编辑功能 ✅

- [x] 片段边缘拖拽（Trim）
- [x] 左右边缘独立调整
- [x] 键盘快捷键系统（20+ 快捷键）
- [x] 撤销/重做功能
- [x] 复制/粘贴片段
- [x] 快捷键帮助面板

### Phase 5: 高级功能 ⏳

- [ ] 吸附对齐
- [ ] 缩略图预览
- [ ] 音频波形
- [ ] 轨道管理工具

### Phase 6: 性能优化 ⏳

- [ ] 防抖/节流
- [ ] 虚拟滚动
- [ ] 渲染优化

## 💻 使用示例

### 基本使用

```tsx
import { Timeline } from './components';
import { useTimelineStore } from './stores/timelineStore';

function EditorPage() {
  const addTrack = useTimelineStore((state) => state.addTrack);

  useEffect(() => {
    // 初始化默认轨道
    addTrack('video');
    addTrack('audio');
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* 其他组件 */}
      <Timeline className="h-80" />
    </div>
  );
}
```

### 添加片段

```tsx
const addClip = useTimelineStore((state) => state.addClip);
const tracks = useTimelineStore((state) => state.tracks);

// 添加视频片段
const videoTrack = tracks.find(t => t.type === 'video');
if (videoTrack) {
  addClip(videoTrack.id, {
    name: 'My Video',
    type: 'video',
    startTime: 0,
    duration: 5,
    resourceSrc: '/video.mp4',
    trimStart: 0,
    trimEnd: 5,
    position: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    opacity: 1,
    volume: 1,
  });
}
```

### 操作轨道

```tsx
const updateTrack = useTimelineStore((state) => state.updateTrack);
const removeTrack = useTimelineStore((state) => state.removeTrack);

// 隐藏轨道
updateTrack('track_id', { visible: false });

// 锁定轨道
updateTrack('track_id', { locked: true });

// 删除轨道
removeTrack('track_id');
```

### 时间轴控制

```tsx
const setCurrentTime = useTimelineStore((state) => state.setCurrentTime);
const zoomIn = useTimelineStore((state) => state.zoomIn);
const zoomOut = useTimelineStore((state) => state.zoomOut);

// 跳转到指定时间
setCurrentTime(5.5);

// 缩放
zoomIn();   // 放大
zoomOut();  // 缩小
```

### 拖拽功能（Phase 2）

```tsx
// 从资源面板拖拽媒体到时间轴
// 1. 点击资源项
// 2. 拖拽到目标轨道
// 3. 释放即可添加片段

// 片段在时间轴内拖拽
// 1. 点击片段
// 2. 拖拽到新位置或新轨道
// 3. 释放即可移动

// 吸附对齐
const toggleSnapping = useTimelineStore((state) => state.toggleSnapping);
const setSnapThreshold = useTimelineStore((state) => state.setSnapThreshold);

toggleSnapping();      // 切换吸附开关
setSnapThreshold(10);  // 设置吸附阈值（像素）
```

### 播放同步（Phase 3）

```tsx
import { useRef } from 'react';
import type { PlayerAreaRef } from './components/PlayerArea';
import type { TimelineRef } from './components/Timeline';

function EditorPage() {
  const playerRef = useRef<PlayerAreaRef>(null);
  const timelineRef = useRef<TimelineRef>(null);

  // 播放控制
  timelineRef.current?.play();    // 播放
  timelineRef.current?.pause();   // 暂停
  
  // Player 控制
  playerRef.current?.seekTo(5.0); // 跳转到 5 秒
  playerRef.current?.play();       // 播放
  
  // 获取状态
  const time = playerRef.current?.getCurrentTime();
  const playing = playerRef.current?.isPlaying();
  
  return (
    <>
      <PlayerArea 
        ref={playerRef}
        externalTime={timelineCurrentTime}
        onTimeUpdate={handleTimeUpdate}
      />
      <Timeline 
        ref={timelineRef}
        onPlayPauseChange={handlePlayPauseChange}
      />
    </>
  );
}
```

### 编辑功能（Phase 4）

```tsx
// 片段边缘调整
// 用户操作：
// 1. 悬停在片段左/右边缘
// 2. 边缘显示白色高亮
// 3. 拖拽调整片段长度和裁剪点

// 键盘快捷键
useKeyboardShortcuts({
  enabled: true,
  onPlayPause: () => timelineRef.current?.togglePlayPause(),
  onStepForward: () => playerRef.current?.seekTo(time + 1/30),
  onStepBackward: () => playerRef.current?.seekTo(time - 1/30),
});

// 用户可以使用：
// - Space: 播放/暂停
// - Delete: 删除选中片段
// - Ctrl+Z: 撤销
// - Ctrl+Shift+Z: 重做
// - Ctrl+C/V: 复制粘贴
// - Ctrl+D: 复制片段
// - ←/→: 帧级别导航
// - Ctrl+A: 全选

// 撤销/重做
const undo = useTimelineStore(state => state.undo);
const redo = useTimelineStore(state => state.redo);
const canUndo = useTimelineStore(state => state.canUndo);
const canRedo = useTimelineStore(state => state.canRedo);

undo();  // 撤销
redo();  // 重做
```

## 🔧 配置

### Timeline 配置常量

在 `types/timeline.ts` 中定义：

```typescript
export const TIMELINE_CONFIG = {
  TRACK_HEIGHT: 80,              // 轨道高度
  TRACK_HEADER_WIDTH: 180,       // 轨道头部宽度
  MIN_CLIP_WIDTH: 10,            // 最小片段宽度
  BASE_PIXELS_PER_SECOND: 50,    // 基础缩放级别
  MIN_ZOOM: 0.1,                 // 最小缩放
  MAX_ZOOM: 10,                  // 最大缩放
  SNAP_THRESHOLD: 5,             // 吸附阈值
  RULER_HEIGHT: 30,              // 标尺高度
  MAJOR_TICK_INTERVAL: 1,        // 主刻度间隔
  MINOR_TICK_COUNT: 5,           // 次刻度数量
};
```

## 📚 API 参考

### Store 方法

**轨道操作：**
- `addTrack(type)` - 添加轨道
- `removeTrack(trackId)` - 删除轨道
- `updateTrack(trackId, updates)` - 更新轨道
- `reorderTracks(trackIds)` - 重新排序

**片段操作：**
- `addClip(trackId, clip)` - 添加片段
- `removeClip(clipId)` - 删除片段
- `updateClip(clipId, updates)` - 更新片段
- `moveClip(clipId, trackId, time)` - 移动片段
- `duplicateClip(clipId)` - 复制片段

**选择操作：**
- `selectClip(clipId, add?)` - 选择片段
- `deselectClip(clipId)` - 取消选择
- `clearSelection()` - 清除所有选择
- `selectTrack(trackId)` - 选择轨道

**时间轴操作：**
- `setCurrentTime(time)` - 设置当前时间
- `setDuration(duration)` - 设置总时长
- `setZoomLevel(level)` - 设置缩放级别
- `zoomIn()` - 放大
- `zoomOut()` - 缩小

**查询方法：**
- `getClipById(clipId)` - 获取片段
- `getTrackById(trackId)` - 获取轨道
- `getClipsAtTime(time)` - 获取指定时间的片段

详细 API 文档请查看 [timeline-usage-guide.md](../../docs/timeline-usage-guide.md)

## 🎨 主题和样式

Timeline 使用 Tailwind CSS，主要颜色：

- **视频片段**: 蓝色 (`bg-blue-600`)
- **音频片段**: 绿色 (`bg-green-600`)
- **图片片段**: 紫色 (`bg-purple-600`)
- **文字片段**: 黄色 (`bg-yellow-600`)
- **背景**: 深灰色 (`bg-gray-900`)
- **选中**: 白色边框 (`ring-white`)

## ⌨️ 快捷键（计划中）

| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放/暂停 |
| `Delete` | 删除选中 |
| `Cmd/Ctrl + Z` | 撤销 |
| `Cmd/Ctrl + Shift + Z` | 重做 |
| `Cmd/Ctrl + D` | 复制片段 |
| `←` `→` | 移动播放头 |
| `Cmd/Ctrl + +` | 放大 |
| `Cmd/Ctrl + -` | 缩小 |

## 🐛 调试

### 启用 Debug 面板

```tsx
import { TimelineDemo } from './components/TimelineDemo';

function EditorPage() {
  return (
    <>
      <Timeline />
      <TimelineDemo /> {/* 显示调试面板 */}
    </>
  );
}
```

调试面板会显示：
- 轨道数量
- 片段总数
- 当前时间
- 总时长
- 缩放级别
- 选中片段数

并提供快捷按钮添加测试片段。

### 日志状态

```tsx
// 在控制台查看当前状态
console.log(useTimelineStore.getState());

// 监听状态变化
useTimelineStore.subscribe(console.log);
```

## 📖 文档

- [完整实现计划](../../docs/timeline-implementation-plan.md)
- [Phase 1 完成报告](../../docs/PHASE1_COMPLETE.md)
- [Phase 2 完成报告](../../docs/PHASE2_COMPLETE.md)
- [Phase 2 拖拽指南](../../docs/phase2-drag-drop-guide.md)
- [Phase 3 完成报告](../../docs/PHASE3_COMPLETE.md)
- [Phase 3 播放同步指南](../../docs/phase3-playback-sync-guide.md)
- [Phase 4 完成报告](../../docs/PHASE4_COMPLETE.md)
- [Timeline 使用指南](../../docs/timeline-usage-guide.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

请查看项目根目录的 LICENSE 文件。

---

**当前版本**: Phase 4 ✅  
**下一步**: Phase 5 - 高级功能 🚧

## 🎉 最新功能

### Phase 4: 编辑功能
- ✂️ 片段边缘拖拽调整（Trim）
- ⌨️ 完整的键盘快捷键系统（20+ 快捷键）
- ↩️ 撤销/重做功能（最多50条历史）
- 📋 复制/粘贴片段
- 🔤 快捷键帮助面板
- 🎯 帧级别精确编辑

### Phase 3: 播放同步
- 🎬 Timeline 播放控制按钮
- 📺 Timeline 与 PlayerArea 双向同步
- 📍 Playhead 实时跟随播放
- ⏯️ 拖拽 Playhead 控制播放位置
- 🎯 帧级别精确控制
- ⚡ 高性能播放动画循环

### Phase 2: 拖拽系统
- 📎 从资源面板拖拽媒体文件到时间轴
- 🎬 片段在时间轴内自由拖拽调整位置
- 🔄 片段跨轨道拖拽
- 🎨 实时拖拽预览和视觉反馈

### 智能吸附
- 🧲 自动吸附到播放头位置
- 📍 吸附到其他片段的起止点
- 📌 吸附到时间轴起点
- ⚙️ 可配置的吸附阈值和开关

### 用户体验
- ✨ 流畅的拖拽动画
- 🎯 精确的位置计算
- 🔒 锁定轨道保护
- 💡 智能放置提示

## ⌨️ 键盘快捷键

### 播放控制
- `Space`: 播放/暂停
- `←/→`: 后退/前进一帧
- `Shift + ←/→`: 后退/前进 1 秒
- `Ctrl/Cmd + ←/→`: 跳到开始/结束

### 编辑操作
- `Delete/Backspace`: 删除选中片段
- `Ctrl/Cmd + C`: 复制片段
- `Ctrl/Cmd + V`: 粘贴片段
- `Ctrl/Cmd + D`: 复制片段
- `Ctrl/Cmd + A`: 全选片段
- `Escape`: 取消选择

### 撤销/重做
- `Ctrl/Cmd + Z`: 撤销
- `Ctrl/Cmd + Shift + Z`: 重做

### 视图控制
- `Ctrl/Cmd + +`: 放大时间轴
- `Ctrl/Cmd + -`: 缩小时间轴

点击 Timeline 工具栏的 `?` 按钮查看完整快捷键列表。