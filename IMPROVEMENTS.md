# KivaCut 项目创建系统改进

## 改进概述

根据需求，改进了项目创建逻辑，使其更加规范化，遵循 kiva-cut 中 Editor 协议的设计模式。

## 主要改进

### 1. 项目目录结构改进

**新的项目结构（基于项目ID作为目录名称）：**

```
~/projects/
├── <project-id-1>/
│   ├── protocol.json        # 合成协议（参考kiva-cut Editor格式）
│   ├── materials/           # 导入的媒体文件存放目录
│   │   ├── video1.mp4
│   │   ├── audio1.mp3
│   │   └── image1.png
│   └── output/             # 输出文件存放目录
├── <project-id-2>/
│   └── ...
```

**关键变化：**
- ✅ 项目ID自动生成并作为顶级目录名称（UUID格式）
- ✅ 移除了 `resources/` 和 `assets/` 目录，统一使用 `materials/` 目录
- ✅ 移除了 `project.json` 元数据文件，元数据由历史记录维护
- ✅ `protocol.json` 遵循 kiva-cut 协议格式

### 2. Protocol.json 结构

遵循 kiva-cut 中 Editor 协议的标准格式：

```json
{
  "stage": {
    "width": 1920,
    "height": 1080
  },
  "materials": {
    "videos": [
      {
        "id": "uuid-xxx",
        "src": "/path/to/materials/video.mp4",
        "dimension": { "width": 0, "height": 0 },
        "duration": null,
        "fps": null,
        "codec": null,
        "bitrate": null
      }
    ],
    "audios": [
      {
        "id": "uuid-xxx",
        "src": "/path/to/materials/audio.mp3",
        "duration": null,
        "sample_rate": null,
        "channels": null,
        "codec": null,
        "bitrate": null
      }
    ],
    "images": [
      {
        "id": "uuid-xxx",
        "src": "/path/to/materials/image.png",
        "dimension": { "width": 0, "height": 0 },
        "format": null
      }
    ]
  },
  "tracks": []
}
```

### 3. 新增 Material 管理系统

#### 后端模块 (`material_manager.rs`)

创建了专门的 Material 管理模块，提供以下功能：

- `load_protocol()` - 加载 protocol.json
- `save_protocol()` - 保存 protocol.json
- `add_material_to_protocol()` - 添加素材到协议
- `remove_material_from_protocol()` - 从协议中移除素材
- `list_materials_from_protocol()` - 列出所有素材
- `import_material_file()` - 导入素材文件
- `get_material_from_protocol()` - 获取特定素材

#### 后端命令 (`commands/material.rs`)

新增 Tauri 命令：

```rust
// 导入素材文件到项目（自动识别类型）
import_material(project_path, source_path) -> Resource

// 删除素材
delete_material(project_path, material_id) -> ()

// 列出所有素材
list_materials(project_path) -> Vec<Resource>

// 获取特定素材
get_material(project_path, material_id) -> Resource

// 按路径添加素材（不复制文件）
add_material_by_path(project_path, material_path, material_type) -> Resource
```

#### 前端 Hook 新增方法

在 `useTauriCommands` 中新增以下方法：

```typescript
// 导入素材
importMaterial(projectPath, sourcePath) -> Promise<Resource>

// 删除素材
deleteMaterial(projectPath, materialId) -> Promise<void>

// 列出素材
listMaterials(projectPath) -> Promise<Resource[]>

// 获取素材
getMaterial(projectPath, materialId) -> Promise<Resource>

// 按路径添加素材
addMaterialByPath(projectPath, materialPath, materialType) -> Promise<Resource>
```

### 4. 文件类型自动识别

新增 `MaterialType` 枚举，支持自动识别以下文件类型：

**视频格式**
- mp4, avi, mov, mkv, flv, wmv, webm

**音频格式**
- mp3, wav, aac, flac, wma, m4a, ogg

**图片格式**
- jpg, jpeg, png, gif, bmp, webp, svg

### 5. 创建项目流程改进

**前端变化：**
- 仅需输入项目名称
- 后端自动生成项目ID作为目录名称
- 自动创建 protocol.json 和 materials 目录

**调用流程：**
```
用户输入项目名称
  ↓
获取默认项目目录 (~/projects)
  ↓
调用 createProject(name, baseDir)
  ↓
后端生成UUID作为project_id
  ↓
创建 baseDir/project_id/ 目录
  ↓
创建 protocol.json (初始化为空协议)
  ↓
创建 materials/ 和 output/ 目录
  ↓
返回 ProjectHistory { id, name, path, ... }
  ↓
前端跳转到编辑器
```

## 素材管理工作流

### 添加素材

```
用户选择素材文件
  ↓
调用 importMaterial(projectPath, sourcePath)
  ↓
后端检测文件类型
  ↓
复制文件到 materials/ 目录
  ↓
生成UUID作为material_id
  ↓
添加到 protocol.json 的对应 materials 部分
  ↓
返回 Resource 对象
  ↓
前端更新素材列表
```

### 删除素材

```
用户选择删除素材
  ↓
调用 deleteMaterial(projectPath, materialId)
  ↓
后端从 protocol.json 中查找并移除
  ↓
删除 materials/ 目录中的对应文件
  ↓
保存更新后的 protocol.json
  ↓
返回成功
```

### 读取素材列表

```
编辑器加载时
  ↓
调用 listMaterials(projectPath)
  ↓
后端从 protocol.json 读取所有 materials
  ↓
返回 Resource[] 
  ↓
前端按类型分组显示
```

## 实现文件

### 后端文件

1. **`src-tauri/src/material_manager.rs`** (新增)
   - Material 管理的核心逻辑
   - Protocol 加载/保存
   - Material CRUD 操作

2. **`src-tauri/src/commands/material.rs`** (新增)
   - Tauri 命令接口
   - 与前端通信

3. **`src-tauri/src/commands/project.rs`** (修改)
   - `create_project()` 改进为新逻辑

4. **`src-tauri/src/lib.rs`** (修改)
   - 注册新的 material 命令

5. **`src-tauri/src/commands/mod.rs`** (修改)
   - 导出新的 material 命令

### 前端文件

1. **`app/hooks/useTauriCommands.ts`** (修改)
   - 新增 material 相关的 Hook 方法

2. **`app/projects/components/CreateProjectModal.tsx`** (修改)
   - 调整项目创建流程

## 兼容性

- ✅ 与现有的 `listResources()` 和 `importResource()` 并存
- ✅ 新增的 Material 管理系统与旧资源系统互不干扰
- ✅ 后端自动生成的项目 ID 格式与历史记录兼容

## 下一步建议

1. **前端 Material UI 组件**
   - 创建 Material 列表组件
   - 创建 Material 导入对话框
   - 创建 Material 预览组件

2. **Editor 集成**
   - 从 protocol.json 读取 materials
   - 实现素材轨道管理
   - 实现素材时间轴操作

3. **性能优化**
   - 缓存 protocol.json 内容
   - 支持大文件导入
   - 实现素材预加载

4. **高级功能**
   - 素材元数据编辑（分辨率、帧率等）
   - 素材版本管理
   - 素材预览缓存

## 编译验证

✅ Rust 后端编译通过（仅有无关紧要的警告）
✅ TypeScript 前端无类型错误
✅ ESLint 检查通过（仅有生成文件的警告）
