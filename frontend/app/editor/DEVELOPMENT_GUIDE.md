# KivaCut 编辑器 - 快速开发指南

## 📚 如何使用各个模块

### 1. 使用状态管理 Hook

```tsx
import { useEditorState } from "@/app/editor/hooks/useEditorState";

export function MyComponent() {
  const {
    state,
    updateProperty,
    setActiveTab,
    selectClip,
    setZoomLevel,
  } = useEditorState();

  return (
    <div>
      <p>当前缩放: {state.zoomLevel}</p>
      <p>选中片段: {state.selectedClipId}</p>
    </div>
  );
}
```

### 2. 访问主题和常量

```tsx
// 使用主题颜色
import { COLORS, SIZES } from "@/app/editor/constants/theme";

<div style={{ backgroundColor: COLORS.editor.bg }}>
  <header className={SIZES.header}>...</header>
</div>

// 使用数据常量
import { RESOURCE_TABS, TIMELINE_TOOLS } from "@/app/editor/constants/data";

{RESOURCE_TABS.map(tab => <button key={tab}>{tab}</button>)}
```

### 3. 创建新组件

```tsx
// 在 components/ 中创建新文件，如 TransitionPanel.tsx
import { COLORS } from "@/app/editor/constants/theme";

interface TransitionPanelProps {
  onSelect?: (transitionId: string) => void;
}

export function TransitionPanel({ onSelect }: TransitionPanelProps) {
  return (
    <div style={{ backgroundColor: COLORS.editor.panel }}>
      {/* 组件内容 */}
    </div>
  );
}

// 在 components/index.ts 中导出
export { TransitionPanel } from "./TransitionPanel";

// 在 page.tsx 中使用
import { TransitionPanel } from "./components";
```

### 4. 添加新的编辑器属性

```tsx
// 1. 更新 types/editor.ts 中的 Properties 接口
export interface Properties {
  scale: number;
  posX: number;
  posY: number;
  rotation: number;
  opacity: number;
  blur: number;  // ← 新增
}

// 2. 更新 useEditorState.ts 中的初始值
const INITIAL_PROPERTIES: Properties = {
  // ... 其他属性
  blur: 0,  // ← 新增
};

// 3. 在 PropertiesPanel.tsx 中添加滑块
<PropertySlider
  label="Blur"
  value={properties.blur}
  min={0}
  max={100}
  unit="%"
  onChange={(value) => onPropertyChange("blur", value)}
/>
```

### 5. 扩展时间轴功能

```tsx
// 在 Timeline/TimelineClip.tsx 中添加拖拽
export function TimelineClip({ clip, isSelected, onSelect }: TimelineClipProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => {
    setIsDragging(true);
    // 实现拖拽逻辑
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ left: `${clip.position.x}px` }}
    >
      {clip.name}
    </div>
  );
}
```

## 🎨 主题定制

### 更改全局颜色主题

在 `constants/theme.ts` 中修改：

```typescript
export const COLORS = {
  editor: {
    bg: "#2d2d2d",        // ← 改为你的颜色
    border: "#3a3a3a",
    dark: "#1a1a1a",
    // ... 其他颜色
  },
};
```

### 更改布局尺寸

在 `tailwind.config.ts` 中修改：

```typescript
height: {
  header: "60px",        // ← 改为你的高度
  // ... 其他尺寸
},
```

## 🔍 调试技巧

### 检查状态

```tsx
const { state } = useEditorState();
console.log("编辑器状态:", state);
```

### React DevTools

1. 安装 React DevTools 浏览器插件
2. 查看 Hook 调用：`useEditorState`
3. 实时查看状态变化

### 检查类型错误

```bash
# 在 frontend 目录运行
npm run type-check
```

## 📦 文件导入路径参考

```tsx
// 类型定义
import type { EditorState, Clip, Track, Properties } from "@/app/editor/types/editor";

// Hook
import { useEditorState } from "@/app/editor/hooks/useEditorState";

// 常量
import { COLORS, SIZES, TRANSITIONS } from "@/app/editor/constants/theme";
import { RESOURCE_TABS, TIMELINE_TOOLS, MOCK_TRACKS } from "@/app/editor/constants/data";

// 组件
import { Header, ResourcePanel, Timeline } from "@/app/editor/components";
import { TimelineClip, Playhead } from "@/app/editor/components/Timeline";
```

## 🧪 组件测试示例

```tsx
// __tests__/ResourcePanel.test.tsx
import { render, screen } from "@testing-library/react";
import { ResourcePanel } from "@/app/editor/components";

describe("ResourcePanel", () => {
  it("should render resource tabs", () => {
    render(
      <ResourcePanel
        activeTab="media"
        onTabChange={() => {}}
      />
    );
    expect(screen.getByText("Media")).toBeInTheDocument();
  });
});
```

## 🚀 性能优化建议

### 1. 使用 React.memo 包装组件

```tsx
import React from "react";

const MemoizedTimelineClip = React.memo(TimelineClip, (prevProps, nextProps) => {
  return prevProps.clip.id === nextProps.clip.id;
});
```

### 2. 使用 useCallback 优化回调

```tsx
const handleSelectClip = useCallback((clipId: string) => {
  selectClip(clipId);
}, [selectClip]);
```

### 3. 使用 useMemo 缓存计算结果

```tsx
const visibleClips = useMemo(
  () => tracks.flatMap(track => track.clips),
  [tracks]
);
```

## 📋 常见任务清单

- [ ] 添加新的资源类型？→ 更新 `data.ts` 中的 `RESOURCE_TABS`
- [ ] 改变编辑器配色？→ 修改 `theme.ts` 中的 `COLORS`
- [ ] 添加新的工具按钮？→ 更新 `data.ts` 中的 `TIMELINE_TOOLS`
- [ ] 实现拖拽功能？→ 在 `TimelineClip.tsx` 中添加鼠标事件
- [ ] 添加快捷键？→ 创建 `hooks/useKeyboard.ts`
- [ ] 添加撤销/重做？→ 使用 `useReducer` 替换 `useState`

## 💡 最佳实践

1. **始终使用类型**：所有 props 都应有 TypeScript 接口
2. **集中常量**：不要硬编码颜色、尺寸等
3. **单一职责**：每个组件只做一件事
4. **可复用性**：将通用逻辑提取为 Hook
5. **文档化**：为复杂组件添加 JSDoc 注释
6. **测试优先**：为重要功能编写单元测试

## 🆘 故障排除

**问题**：组件不显示
- 检查：是否在 `components/index.ts` 中导出？
- 检查：在 `page.tsx` 中是否导入？

**问题**：样式不应用
- 检查：Tailwind 类名拼写？
- 检查：是否使用了 `style` 属性覆盖？

**问题**：状态不更新
- 检查：是否调用了正确的 setter 方法？
- 检查：是否在 React DevTools 中看到了状态变化？

## 📞 快速参考

| 需求 | 文件 | 函数/接口 |
|------|------|---------|
| 改变颜色 | `constants/theme.ts` | `COLORS` |
| 改变尺寸 | `tailwind.config.ts` | `theme.height/width` |
| 管理状态 | `hooks/useEditorState.ts` | `useEditorState()` |
| 定义类型 | `types/editor.ts` | `EditorState`, `Track` 等 |
| 访问数据 | `constants/data.ts` | `RESOURCE_TABS`, `MOCK_TRACKS` 等 |

---

祝你开发愉快！🎉
