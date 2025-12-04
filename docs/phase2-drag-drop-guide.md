# Phase 2 拖拽功能使用指南

本指南介绍如何使用 Timeline 的拖拽功能。

## 📦 功能概览

Phase 2 实现了完整的拖放系统：

- ✅ 从资源面板拖拽媒体到时间轴
- ✅ 片段在时间轴内拖拽
- ✅ 片段跨轨道拖拽
- ✅ 智能吸附对齐
- ✅ 可视化拖拽预览

## 🎯 基本操作

### 1. 从资源面板添加媒体

**步骤：**
1. 在左侧资源面板中找到要添加的媒体
2. 点击并按住鼠标左键
3. 拖拽到目标轨道上
4. 释放鼠标添加片段

**提示：**
- 拖拽时会显示蓝色预览框
- 轨道会高亮显示 "Drop here to add clip"
- 片段会添加到鼠标释放的时间位置

**示例：**
```typescript
// 系统会自动：
// 1. 识别媒体类型（video/audio/image）
// 2. 计算拖放时间位置
// 3. 设置默认时长（视频3秒，音频5秒）
// 4. 创建新片段
```

### 2. 调整片段时间位置

**同轨道内移动：**
1. 点击片段并按住
2. 水平拖拽到新位置
3. 释放鼠标

**跨轨道移动：**
1. 点击片段并按住
2. 垂直拖拽到目标轨道
3. 释放鼠标

**提示：**
- 拖拽时片段会变半透明
- 实时显示拖拽位置
- 自动限制不能拖到时间0之前

### 3. 使用吸附对齐

**开启/关闭吸附：**
- 点击工具栏的 "Snap" 按钮
- 紫色 = 开启，灰色 = 关闭

**吸附点类型：**
- 🎯 播放头位置
- 📌 其他片段的起点
- 📌 其他片段的终点
- 📌 时间轴起点（0秒）

**吸附行为：**
- 当拖拽的片段接近吸附点时（默认5像素内）
- 片段会自动"吸附"到该位置
- 帮助精确对齐

## 🔧 高级用法

### 自定义吸附阈值

```typescript
import { useTimelineStore } from '@/app/editor/stores/timelineStore';

function MyComponent() {
  const setSnapThreshold = useTimelineStore((state) => state.setSnapThreshold);
  
  // 设置吸附范围为10像素
  setSnapThreshold(10);
}
```

### 程序化控制吸附

```typescript
const toggleSnapping = useTimelineStore((state) => state.toggleSnapping);
const snappingEnabled = useTimelineStore((state) => state.snappingEnabled);

// 切换吸附
toggleSnapping();

// 检查状态
if (snappingEnabled) {
  console.log('吸附已启用');
}
```

### 监听拖拽事件

```typescript
// Timeline 组件内部处理
const handleDragStart = (event: DragStartEvent) => {
  // 拖拽开始
  console.log('开始拖拽:', event.active.id);
};

const handleDragEnd = (event: DragEndEvent) => {
  // 拖拽结束
  console.log('拖拽结束:', event.over?.id);
};
```

## 📋 拖拽数据结构

### 资源拖拽数据

```typescript
interface DragData {
  resourceId: string;      // 资源ID
  resourceName: string;    // 资源名称
  resourceType: MediaType; // 'video' | 'audio' | 'image' | 'text'
  resourceSrc: string;     // 资源路径
}
```

### 片段拖拽数据

```typescript
{
  type: "clip",
  clipId: string,    // 片段ID
  trackId: string,   // 所属轨道ID
}
```

### 轨道放置数据

```typescript
{
  type: "track",
  trackId: string,        // 轨道ID
  trackType: "video" | "audio",  // 轨道类型
}
```

## 🎨 视觉反馈

### 拖拽状态指示

| 状态 | 视觉效果 |
|------|----------|
| 正常 | 正常显示 |
| 拖拽中 | 半透明（opacity: 0.5） |
| 悬停在轨道上 | 蓝色边框 + 提示文字 |
| 锁定轨道 | 无法放置，无高亮 |

### 光标变化

- 👆 正常：默认光标
- ✊ 悬停：`cursor-grab`
- 🤏 拖拽中：`cursor-grabbing`

## 🚫 限制与约束

### 轨道限制

- ❌ 无法拖放到锁定的轨道
- ⚠️ 当前允许跨类型拖拽（可能需要限制）

### 时间限制

- ❌ 片段不能拖到时间0之前
- ✅ 片段可以重叠（碰撞检测待实现）

### 性能限制

- 建议片段数量 < 100（大量片段可能影响性能）
- 使用吸附时计算开销略增

## 💡 最佳实践

### 1. 使用吸附提高精度

```typescript
// 推荐：开启吸附进行精确编辑
// 1. 点击 Snap 按钮开启
// 2. 拖拽片段会自动对齐
// 3. 完成后可关闭吸附进行自由移动
```

### 2. 合理组织轨道

```typescript
// 推荐的轨道顺序（从上到下）：
// - Video Track 1（主视频）
// - Video Track 2（画中画/特效）
// - Audio Track 1（主音频）
// - Audio Track 2（背景音乐）
```

### 3. 利用吸附点对齐

```typescript
// 技巧：
// 1. 将片段拖到播放头位置 → 从当前位置开始
// 2. 对齐到前一片段末尾 → 无缝衔接
// 3. 对齐到时间轴起点 → 从头开始
```

## 🐛 常见问题

### Q1: 拖拽没有反应？

**可能原因：**
- 轨道被锁定
- 拖拽距离太小（需要 > 8px）

**解决方法：**
```typescript
// 检查轨道状态
const track = useTimelineStore.getState().getTrackById(trackId);
console.log('Locked:', track?.locked);

// 解锁轨道
updateTrack(trackId, { locked: false });
```

### Q2: 吸附太灵敏或不灵敏？

**调整吸附阈值：**
```typescript
// 默认：5像素
// 更灵敏：设置更大值
setSnapThreshold(10);

// 不太灵敏：设置更小值
setSnapThreshold(3);
```

### Q3: 拖拽预览位置不准？

**检查滚动偏移：**
```typescript
// 系统会自动考虑滚动位置
const startTime = pixelsToTime(x + scrollLeft, pixelsPerSecond);
```

### Q4: 片段拖拽后消失？

**可能原因：**
- 拖到了时间轴可见范围外
- 轨道被隐藏

**解决方法：**
```typescript
// 显示轨道
updateTrack(trackId, { visible: true });

// 滚动到片段位置
const clip = getClipById(clipId);
setScrollLeft(timeToPixels(clip.startTime, pixelsPerSecond));
```

## 📊 性能优化建议

### 1. 大量片段场景

```typescript
// 如果有 > 50 个片段：
// - 考虑临时关闭吸附
// - 减少同时可见的轨道数
// - 使用缩小视图（zoom out）
```

### 2. 拖拽卡顿

```typescript
// 检查：
// 1. 浏览器性能
// 2. 片段数量
// 3. 是否开启了硬件加速

// Chrome DevTools > Performance 录制拖拽操作
```

## 🔗 相关 API

### Store 方法

```typescript
// 片段操作
addClip(trackId, clipData)      // 添加片段
moveClip(clipId, trackId, time) // 移动片段
updateClip(clipId, updates)     // 更新片段

// 吸附控制
toggleSnapping()                 // 切换吸附
setSnapThreshold(threshold)      // 设置阈值

// 查询
getClipById(clipId)             // 获取片段
getTrackById(trackId)           // 获取轨道
```

### 工具函数

```typescript
// 位置计算
timeToPixels(time, pps)         // 时间转像素
pixelsToTime(pixels, pps)       // 像素转时间

// 吸附计算
collectSnapPoints(clips, time)   // 收集吸附点
calculateSnappedTime(...)        // 计算吸附
```

## 🎓 学习路径

### 初学者
1. ✅ 尝试拖拽资源到时间轴
2. ✅ 练习移动片段位置
3. ✅ 开启吸附，感受对齐效果

### 进阶用户
1. ✅ 跨轨道拖拽片段
2. ✅ 调整吸附阈值
3. ✅ 使用键盘 + 鼠标组合操作

### 开发者
1. ✅ 了解 DragData 结构
2. ✅ 自定义拖拽处理
3. ✅ 扩展吸附点类型

## 📚 参考资料

- [DnD Kit 官方文档](https://docs.dndkit.com/)
- [Timeline 实现计划](./timeline-implementation-plan.md)
- [Phase 2 完成报告](./PHASE2_COMPLETE.md)
- [Timeline 使用指南](./timeline-usage-guide.md)

## 🎬 下一步

完成 Phase 2 后，你可以：
- ✅ 自由添加和排列媒体片段
- ✅ 精确控制片段时间位置
- ✅ 使用吸附实现专业级对齐

接下来：
- 📺 Phase 3: 播放同步 - 实时预览编辑效果
- ✂️ Phase 4: 编辑功能 - 片段裁剪和快捷键
- 🎨 Phase 5: 高级功能 - 缩略图和波形

---

**Happy Dragging! 🎉**