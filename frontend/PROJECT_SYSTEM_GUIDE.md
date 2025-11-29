# KivaCut - 项目创建系统实现指南

## 📋 功能概述

已实现完整的项目创建系统，包括：

1. **前端项目创建页面** (`/project`) - 用户创建新项目
2. **Tauri 后端命令** - 处理文件系统操作
3. **资源加载系统** - 编辑器从项目自动读取素材
4. **Home 页面** - 项目入口

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────┐
│              用户界面 (Frontend - React)              │
├─────────────────────────────────────────────────────┤
│  Home Page           Project Page      Editor Page   │
│   (/)              (/project)          (/editor)     │
└────────────┬──────────────┬──────────────┬───────────┘
             │              │              │
             │ useTauriCommands Hook (IPC)
             │              │              │
┌────────────▼──────────────▼──────────────▼───────────┐
│          Tauri 后端 (Rust)                           │
├─────────────────────────────────────────────────────┤
│  create_project    list_resources    import_resource │
│  open_project_dir  delete_project                    │
└────────────┬──────────────┬──────────────┬───────────┘
             │              │              │
┌────────────▼──────────────▼──────────────▼───────────┐
│          文件系统 (Project Folders)                   │
├─────────────────────────────────────────────────────┤
│  ~/Videos/MyProject/                                │
│  ├── resources/  (媒体文件)                          │
│  ├── assets/     (资源库)                            │
│  ├── output/     (输出文件)                          │
│  ├── project.json    (项目元数据)                    │
│  └── protocol.json   (合成协议)                      │
└─────────────────────────────────────────────────────┘
```

---

## 📁 创建的文件结构

### 前端文件

```
frontend/
├── app/
│   ├── page.tsx                        (主页入口)
│   ├── project/
│   │   ├── page.tsx                    (项目创建页面)
│   │   ├── types.ts                    (类型定义)
│   │   └── hooks/
│   │       └── useProjectForm.ts       (表单状态 Hook)
│   ├── hooks/
│   │   ├── useTauriCommands.ts         (Tauri IPC 封装)
│   │   └── useProjectResources.ts      (资源加载 Hook)
│   ├── editor/
│   │   ├── page.tsx                    (已更新)
│   │   └── components/
│   │       ├── Header.tsx              (已更新，添加返回按钮)
│   │       └── ResourcePanel.tsx       (已更新，支持动态资源)
│   └── layout.tsx
├── package.json                        (已更新，添加 @tauri-apps/api)
└── tailwind.config.ts
```

### 后端文件 (Rust)

```
frontend/src-tauri/
├── src/
│   ├── main.rs                         (入口)
│   ├── lib.rs                          (已更新，注册命令)
│   └── commands.rs                     (新增，核心业务逻辑)
├── Cargo.toml                          (已更新，添加依赖)
└── tauri.conf.json                     (配置文件)
```

---

## 🔧 核心命令实现

### 1. create_project

**功能**：创建项目目录结构

**调用方式**：
```typescript
const { createProject } = useTauriCommands();
const metadata = await createProject("My Project", "C:/Videos");
```

**创建的结构**：
```
C:/Videos/My Project/
├── resources/     (存放媒体素材)
├── assets/        (资源库)
├── output/        (输出文件)
├── project.json   (项目元数据)
└── protocol.json  (合成协议模板)
```

**返回值**：
```typescript
{
  name: "My Project",
  path: "C:/Videos/My Project",
  created_at: "2025-11-29T10:00:00+08:00",
  version: "0.1.0"
}
```

### 2. list_resources

**功能**：列出项目中的所有资源

**调用方式**：
```typescript
const { listResources } = useTauriCommands();
const resources = await listResources("C:/Videos/My Project");
```

**返回值**：
```typescript
[
  {
    id: "uuid-1",
    name: "video.mp4",
    path: "C:/Videos/My Project/resources/video.mp4",
    resource_type: "video"  // video, audio, image, subtitle, unknown
  },
  {
    id: "uuid-2",
    name: "audio.mp3",
    path: "C:/Videos/My Project/resources/audio.mp3",
    resource_type: "audio"
  }
]
```

### 3. import_resource

**功能**：导入新资源到项目

**调用方式**：
```typescript
const { importResource } = useTauriCommands();
const resource = await importResource(
  "C:/Videos/My Project",
  "C:/Downloads/music.mp3"
);
```

### 4. open_project_dir

**功能**：在文件管理器中打开项目文件夹

### 5. delete_project

**功能**：删除项目文件夹

---

## 💻 使用流程

### 创建项目流程

```
用户访问 /
    ↓
点击 "Create New Project"
    ↓
跳转到 /project
    ↓
填写表单
    - 项目名称: "My Video"
    - 项目位置: "C:/Videos"
    ↓
点击 "Create Project"
    ↓
调用 Tauri 命令 create_project("My Video", "C:/Videos")
    ↓
后端创建文件夹结构
    ↓
返回成功，显示 "Project created successfully!"
    ↓
1 秒后跳转到 /editor?project=C:/Videos/My Video
```

### 编辑页面流程

```
用户访问 /editor?project=C:/Videos/My Video
    ↓
useProjectResources Hook 被触发
    ↓
调用 Tauri 命令 list_resources("C:/Videos/My Video")
    ↓
后端遍历 resources/ 文件夹
    ↓
返回资源列表
    ↓
ResourcePanel 显示资源网格
    ↓
用户可在资源网格中查看并选择素材
```

---

## 🎯 文件类型识别

系统自动识别文件类型：

| 类型 | 扩展名 |
|------|--------|
| video | mp4, avi, mov, mkv, flv |
| audio | mp3, wav, aac, flac |
| image | png, jpg, jpeg, gif, bmp |
| subtitle | srt, vtt, ass |
| unknown | 其他 |

---

## 📝 类型定义

### ProjectMetadata (后端)
```rust
struct ProjectMetadata {
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub version: String,
}
```

### Resource (后端)
```rust
struct Resource {
    pub id: String,
    pub name: String,
    pub path: String,
    pub resource_type: String,
}
```

### TypeScript 类型 (前端)

```typescript
// 项目表单
interface ProjectFormData {
  projectName: string;
  projectPath: string;
}

// 项目状态
type ProjectStatus = "idle" | "creating" | "error" | "success";

// 后端资源
interface BackendResource {
  id: string;
  name: string;
  path: string;
  resource_type: string;
}
```

---

## 🚀 运行步骤

### 1. 安装依赖

```bash
cd frontend
npm install  # 安装 @tauri-apps/api
```

### 2. 启动开发环境

```bash
# 终端 1：启动 Next.js 开发服务器
cd frontend
npm run dev

# 终端 2：启动 Tauri 开发环境
cd frontend
npm run tauri dev
```

或者使用 Tauri 直接运行（自动启动 Next.js）：

```bash
cd frontend/src-tauri
cargo tauri dev
```

### 3. 测试流程

1. 访问 `http://localhost:3000` (或 Tauri 窗口)
2. 点击 "Create New Project"
3. 填写表单：
   - 项目名: `Test Project`
   - 路径: `C:\Users\YourName\Documents` (Windows)
   或 `/Users/YourName/Documents` (Mac)
   或 `~/Documents` (Linux)
4. 点击 "Create Project"
5. 等待成功提示，自动跳转到编辑器
6. 验证项目文件夹已创建
7. 在资源面板中查看资源（如果已有文件）

---

## 📊 项目文件夹结构示例

创建项目后会得到：

```
C:/Users/YourName/Documents/Test Project/
├── resources/              # 媒体素材存放位置
│   ├── video.mp4          # (用户导入的视频)
│   ├── audio.mp3          # (用户导入的音频)
│   └── image.png          # (用户导入的图片)
├── assets/                # 资源库
│   └── (预留目录)
├── output/                # 输出文件
│   └── (合成后的视频)
├── project.json           # 项目元数据
│   ├── name: "Test Project"
│   ├── path: "C:/Users/YourName/Documents/Test Project"
│   ├── created_at: "2025-11-29T10:00:00+08:00"
│   └── version: "0.1.0"
└── protocol.json          # 合成协议
    ├── version: "1.0"
    ├── tracks: []
    └── timeline: { duration: 0, fps: 30 }
```

---

## 🔌 Tauri 命令注册

在 `src-tauri/src/lib.rs` 中：

```rust
.invoke_handler(tauri::generate_handler![
    commands::create_project,
    commands::list_resources,
    commands::import_resource,
    commands::open_project_dir,
    commands::delete_project,
])
```

---

## ✅ 功能检查清单

- ✅ 项目创建页面 (`/project`)
- ✅ 主页面 (`/`)
- ✅ 编辑器页面自动加载资源
- ✅ Tauri 后端命令完整实现
- ✅ 前端 Hook 封装完成
- ✅ 类型安全
- ✅ 错误处理
- ✅ UI 提示反馈
- ⏳ 资源导入 UI (待实现)
- ⏳ 项目管理页面 (待实现)

---

## 🐛 调试技巧

### 查看 Tauri 日志

```bash
# 在 Tauri 开发窗口中按 F12 打开开发者工具
# 查看 Console 标签页的 Tauri 命令日志
```

### 验证项目文件夹

```bash
# 命令行查看项目结构
tree "C:\Users\YourName\Documents\Test Project"

# 或 Linux/Mac
ls -la ~/Documents/Test\ Project/
```

### 测试资源加载

```typescript
// 在浏览器 Console 中测试
import { useTauriCommands } from '@/app/hooks/useTauriCommands';
const { listResources } = useTauriCommands();
const resources = await listResources("C:/path/to/project");
console.log(resources);
```

---

## 🎓 后续扩展

### 已实现
- ✅ 项目创建
- ✅ 资源列表加载
- ✅ 自动跳转到编辑器

### 待实现
- 🔲 资源导入功能 (Import 按钮)
- 🔲 项目管理页面（打开、删除、编辑）
- 🔲 最近项目列表
- 🔲 项目缩略图预览
- 🔲 协议文件编辑界面
- 🔲 资源搜索和过滤
- 🔲 项目备份和导出

---

## 📞 常见问题

### Q1: 如何手动添加资源到项目？

**A:** 创建项目后，将文件直接复制到 `<项目路径>/resources/` 文件夹，然后：
1. 在编辑器页面刷新
2. 或点击资源面板的刷新按钮（待实现）

### Q2: 为什么资源列表为空？

**A:**
1. 检查项目路径是否正确
2. 检查 `resources/` 文件夹是否存在
3. 检查浏览器控制台是否有错误
4. 在浏览器 DevTools 中检查 IPC 日志

### Q3: 支持哪些文件格式？

**A:** 支持所有文件格式，但系统会根据扩展名自动分类：
- 视频: mp4, avi, mov, mkv, flv
- 音频: mp3, wav, aac, flac
- 图片: png, jpg, jpeg, gif, bmp
- 字幕: srt, vtt, ass
- 其他: unknown

### Q4: 项目文件夹在哪里？

**A:** 项目创建时指定的位置。例如：
- Windows: `C:\Users\YourName\Videos\My Project`
- Mac/Linux: `/Users/YourName/Videos/My Project`

---

## 📚 相关文档

- [开发指南](./DEVELOPMENT_GUIDE.md)
- [优化总结](./OPTIMIZATION_SUMMARY.md)
- [优化完成报告](../OPTIMIZATION_COMPLETE.md)

---

_最后更新: 2025-11-29_  
_状态: 核心功能完成 ✅_
