# 改动摘要 - KivaCut 项目系统改进

## 📌 核心改进

根据您的需求，已完成以下改进：

### ✅ 1. 项目ID作为目录名称
- 项目ID由后端自动生成（UUID）
- 项目目录结构：`~/projects/<UUID>/`
- 移除了冗余的 `project.json`

### ✅ 2. Protocol.json 规范化  
- 遵循 kiva-cut Editor 协议格式
- 包含 stage, materials, tracks 三部分
- Materials 分为 videos, audios, images 三类

### ✅ 3. Materials 目录
- 所有导入的文件存放在 `materials/` 目录
- 自动检测文件类型
- Material 信息保存到 protocol.json

### ✅ 4. 参考 kiva-cut Editor 设计
- Material 数据结构完全对齐
- Protocol 格式兼容 kiva-cut Editor
- 可直接用于视频合成

### ✅ 5. 从合成协议读取素材列表
- `listMaterials()` 从 protocol.json 读取
- 不扫描文件系统
- 数据源统一

## 📂 修改的文件清单

### 新增文件 (3个)
```
frontend/src-tauri/src/
├── material_manager.rs          ✨ 新增：Material 管理核心模块
└── commands/
    └── material.rs              ✨ 新增：Material 相关命令
```

### 修改的文件 (5个)
```
frontend/src-tauri/src/
├── lib.rs                       🔧 修改：注册新命令
├── commands/
│   ├── project.rs               🔧 修改：create_project 改进
│   └── mod.rs                   🔧 修改：导出新命令
└── app/
    ├── hooks/useTauriCommands.ts    🔧 修改：新增 Hook 方法
    └── projects/components/
        └── CreateProjectModal.tsx    🔧 修改：项目创建流程
```

### 新增文档 (4个)
```
├── IMPROVEMENTS.md              📖 改进说明文档
├── MATERIAL_USAGE_GUIDE.md      📖 使用示例和代码
├── REFACTOR_SUMMARY.md          📖 改进总结
└── VERIFICATION_CHECKLIST.md    📖 验证清单
```

## 🔧 新增命令详解

### 后端命令（Rust）

```rust
// 导入素材文件到 materials/ 目录
import_material(project_path: String, source_path: String) -> Resource

// 删除素材并从 protocol.json 移除
delete_material(project_path: String, material_id: String) -> ()

// 列出 protocol.json 中的所有素材
list_materials(project_path: String) -> Vec<Resource>

// 获取特定素材信息
get_material(project_path: String, material_id: String) -> Resource

// 按路径添加素材（不复制文件）
add_material_by_path(project_path: String, material_path: String, material_type: String) -> Resource
```

### 前端方法（TypeScript）

```typescript
// 在 useTauriCommands 中新增
importMaterial(projectPath, sourcePath)
deleteMaterial(projectPath, materialId)
listMaterials(projectPath)
getMaterial(projectPath, materialId)
addMaterialByPath(projectPath, materialPath, materialType)
```

## 💾 数据结构

### Protocol.json 示例

```json
{
  "stage": {
    "width": 1920,
    "height": 1080
  },
  "materials": {
    "videos": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "src": "/path/to/materials/video.mp4",
        "dimension": { "width": 1920, "height": 1080 },
        "duration": null,
        "fps": null,
        "codec": null,
        "bitrate": null
      }
    ],
    "audios": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "src": "/path/to/materials/audio.mp3",
        "duration": null,
        "sample_rate": null,
        "channels": null,
        "codec": null,
        "bitrate": null
      }
    ],
    "images": []
  },
  "tracks": []
}
```

### Resource 对象

```typescript
interface Resource {
  id: string;              // UUID
  name: string;            // 文件名
  path: string;            // 完整路径
  resource_type: string;   // "video" | "audio" | "image"
}
```

## 🎯 使用流程

### 创建项目
```typescript
const { createProject, getDefaultProjectsDir } = useTauriCommands();

const dir = await getDefaultProjectsDir();
const project = await createProject("我的视频", dir);
// 返回: { id: "uuid-xxx", name: "我的视频", path: "~/projects/uuid-xxx" }
```

### 导入素材
```typescript
const { importMaterial } = useTauriCommands();

const video = await importMaterial(project.path, "/path/to/video.mp4");
// 自动复制到 materials/ 目录
// 自动注册到 protocol.json
// 返回: { id: "uuid-yyy", name: "video.mp4", path: "~/projects/uuid-xxx/materials/video.mp4", resource_type: "video" }
```

### 列出素材
```typescript
const { listMaterials } = useTauriCommands();

const materials = await listMaterials(project.path);
// 直接从 protocol.json 读取
// 返回: Resource[]
```

## 🔍 文件类型支持

| 类型 | 格式 |
|------|------|
| 视频 | mp4, avi, mov, mkv, flv, wmv, webm |
| 音频 | mp3, wav, aac, flac, wma, m4a, ogg |
| 图片 | jpg, jpeg, png, gif, bmp, webp, svg |

## ⚙️ 编译验证

✅ **Rust 后端**: `cargo check` 成功  
✅ **TypeScript 前端**: `npm run lint` 成功  
✅ **无破坏性变更**: 向后兼容

## 📖 文档推荐阅读顺序

1. **PROJECT_IMPROVEMENTS_README.md** - 快速概览（本文件的母文档）
2. **IMPROVEMENTS.md** - 详细技术说明
3. **MATERIAL_USAGE_GUIDE.md** - 代码示例和使用方法
4. **REFACTOR_SUMMARY.md** - 完整改进清单
5. **VERIFICATION_CHECKLIST.md** - 验证清单

## 🚀 立即开始

```bash
# 1. 编译后端
cd frontend/src-tauri
cargo build

# 2. 启动前端开发
cd ..
npm run dev

# 3. 测试项目创建
# 在应用中创建新项目

# 4. 测试素材导入
# 在项目中导入视频/音频/图片文件
```

## ✨ 特色功能

- 🎬 **自动文件类型识别** - 无需手动指定类型
- 📋 **Protocol-based** - 素材列表直接来自 protocol.json
- 🔄 **向后兼容** - 旧系统仍可继续使用
- 📁 **规范化目录** - 项目结构统一清晰
- 🎯 **kiva-cut 兼容** - 可直接用于视频合成

## ⚡ 性能特点

- ⚡ 轻量级 JSON 操作
- 🎯 无不必要的文件系统扫描
- 💾 直接从 protocol 读写数据
- 🔒 无数据库依赖

## 🔐 安全性

- ✅ 文件路径验证
- ✅ 文件存在性检查
- ✅ 错误消息安全
- ✅ UUID 唯一性保证

---

**完成日期**: 2025-11-30  
**状态**: ✅ 已完成并验证  
**兼容性**: ✅ 向后兼容  
**文档**: ✅ 完整
