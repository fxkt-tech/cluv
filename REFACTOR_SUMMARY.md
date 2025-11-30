# KivaCut 项目系统改进 - 总结

## 改进完成 ✅

根据您的需求，已经完成了 KivaCut 项目创建和素材管理系统的全面改进。

## 核心变化

### 1. 项目结构改进

**旧的结构：**
```
~/projects/MyProject/
├── project.json      # 项目元数据
├── protocol.json     # 协议（不规范）
├── resources/        # 资源文件
├── assets/
└── output/
```

**新的结构：**
```
~/projects/
└── <uuid>/           # 项目ID作为目录名
    ├── protocol.json # 遵循kiva-cut Editor格式
    ├── materials/    # 导入的媒体文件
    └── output/       # 输出文件
```

**关键改进：**
- 项目ID（UUID）作为顶级目录名称
- 统一使用 `materials/` 目录存放所有导入的文件
- 移除冗余的 `project.json` 和 `assets/` 目录
- `protocol.json` 遵循 kiva-cut 标准格式

### 2. 新增 Material 管理系统

#### 后端新增模块

| 文件 | 说明 |
|------|------|
| `src-tauri/src/material_manager.rs` | Material 核心管理逻辑 |
| `src-tauri/src/commands/material.rs` | Tauri IPC 命令接口 |

#### 新增后端命令

```rust
import_material(project_path, source_path)      // 导入素材
delete_material(project_path, material_id)      // 删除素材
list_materials(project_path)                    // 列出素材
get_material(project_path, material_id)         // 获取单个素材
add_material_by_path(project_path, path, type)  // 按路径添加（不复制）
```

#### 前端新增 Hook 方法

```typescript
importMaterial(projectPath, sourcePath)
deleteMaterial(projectPath, materialId)
listMaterials(projectPath)
getMaterial(projectPath, materialId)
addMaterialByPath(projectPath, materialPath, materialType)
```

### 3. 协议格式规范化

`protocol.json` 现在完全遵循 kiva-cut Editor 格式：

```json
{
  "stage": {
    "width": 1920,
    "height": 1080
  },
  "materials": {
    "videos": [...],
    "audios": [...],
    "images": [...]
  },
  "tracks": []
}
```

### 4. 工作流改进

**创建项目流程：**
```
用户输入: 项目名称
    ↓
后端生成: UUID
    ↓
创建目录: basePath/UUID
    ↓
初始化: protocol.json + materials/ + output/
    ↓
返回: ProjectHistory { id, name, path, ... }
```

**素材管理流程：**
```
导入素材: importMaterial()
    ↓
检测类型 + 复制文件
    ↓
添加到 protocol.json
    ↓
返回 Resource 对象

删除素材: deleteMaterial()
    ↓
从 protocol.json 移除
    ↓
删除物理文件
    ↓
保存更新

读取素材: listMaterials()
    ↓
从 protocol.json 读取
    ↓
返回 Resource[]
```

## 修改的文件

### 后端文件修改

1. **创建** `frontend/src-tauri/src/material_manager.rs`
   - 新增 Material 管理核心模块
   - 实现 protocol.json 的读写
   - 实现 Material 的 CRUD 操作

2. **创建** `frontend/src-tauri/src/commands/material.rs`
   - 新增 Material 相关 Tauri 命令
   - 导出给前端调用

3. **修改** `frontend/src-tauri/src/commands/project.rs`
   - 改进 `create_project()` 函数
   - 使用 UUID 作为项目目录名称
   - 创建规范化的 protocol.json

4. **修改** `frontend/src-tauri/src/commands/mod.rs`
   - 导出新的 material 命令

5. **修改** `frontend/src-tauri/src/lib.rs`
   - 注册新的 material 命令到 Tauri handler

### 前端文件修改

1. **修改** `frontend/app/hooks/useTauriCommands.ts`
   - 新增 5 个 Material 相关方法
   - 保持向后兼容

2. **修改** `frontend/app/projects/components/CreateProjectModal.tsx`
   - 调整项目创建逻辑
   - 适应新的目录结构

## 代码编译验证

✅ **Rust 后端**
- `cargo check` 通过
- 仅有无关紧要的 dead code 警告

✅ **TypeScript 前端**
- ESLint 检查通过
- 无类型错误

## 功能特性

### 自动文件类型识别

系统自动识别以下文件类型：

| 类型 | 支持的格式 |
|------|----------|
| 视频 | mp4, avi, mov, mkv, flv, wmv, webm |
| 音频 | mp3, wav, aac, flac, wma, m4a, ogg |
| 图片 | jpg, jpeg, png, gif, bmp, webp, svg |

### Material 数据结构

**视频素材**
```json
{
  "id": "uuid",
  "src": "/path/to/materials/video.mp4",
  "dimension": { "width": 0, "height": 0 },
  "duration": null,
  "fps": null,
  "codec": null,
  "bitrate": null
}
```

**音频素材**
```json
{
  "id": "uuid",
  "src": "/path/to/materials/audio.mp3",
  "duration": null,
  "sample_rate": null,
  "channels": null,
  "codec": null,
  "bitrate": null
}
```

**图片素材**
```json
{
  "id": "uuid",
  "src": "/path/to/materials/image.png",
  "dimension": { "width": 0, "height": 0 },
  "format": null
}
```

## 兼容性

- ✅ 与现有的 `listResources()` 和 `importResource()` 命令并存
- ✅ 两套系统互不干扰，可独立使用
- ✅ 历史记录完全兼容
- ✅ 前端代码向后兼容

## 后续工作建议

### 短期（必需）
1. 创建前端 Material 管理 UI 组件
2. 集成到编辑器页面
3. 实现素材预览功能

### 中期（推荐）
1. 从 protocol.json 读取并显示 materials
2. 实现素材拖放到时间轴
3. 实现素材时间范围编辑

### 长期（优化）
1. 素材元数据编辑（自动检测分辨率、帧率）
2. 素材缓存和预加载
3. 大文件断点续传
4. 素材版本管理

## 文档资源

- **IMPROVEMENTS.md** - 详细的改进说明文档
- **MATERIAL_USAGE_GUIDE.md** - Material 系统使用指南和代码示例

## 快速开始

### 创建项目

```typescript
const { createProject, getDefaultProjectsDir } = useTauriCommands();

const dir = await getDefaultProjectsDir();
const project = await createProject("我的项目", dir);
// 返回: { id: "uuid-xxx", name: "我的项目", path: "/path/to/uuid-xxx", ... }
```

### 导入素材

```typescript
const { importMaterial } = useTauriCommands();

const material = await importMaterial(project.path, "/path/to/video.mp4");
// 返回: { id: "uuid-yyy", name: "video.mp4", path: "/path/to/materials/video.mp4", resource_type: "video" }
```

### 列出素材

```typescript
const { listMaterials } = useTauriCommands();

const materials = await listMaterials(project.path);
// 返回: Resource[] 包含所有导入的素材
```

### 删除素材

```typescript
const { deleteMaterial } = useTauriCommands();

await deleteMaterial(project.path, material.id);
// 素材从 protocol.json 中移除，文件也被删除
```

## 验证清单

- [x] 项目ID作为目录名称
- [x] protocol.json 遵循 kiva-cut 格式
- [x] 创建 materials 目录
- [x] Material 增删改查 API
- [x] 自动文件类型检测
- [x] 前端 Hook 集成
- [x] 代码编译验证
- [x] 文档编写
- [x] 使用示例提供
