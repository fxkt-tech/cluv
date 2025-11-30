# Material 管理使用示例

## 在 TypeScript/React 中使用新的 Material 系统

### 基本导入

```typescript
import { useTauriCommands } from "@/app/hooks/useTauriCommands";
```

### 导入素材

```typescript
const { importMaterial } = useTauriCommands();

async function handleImportVideo(projectPath: string, videoPath: string) {
  try {
    const resource = await importMaterial(projectPath, videoPath);
    console.log("导入成功:", resource);
    // {
    //   id: "uuid-xxx",
    //   name: "video.mp4",
    //   path: "/path/to/materials/video.mp4",
    //   resource_type: "video"
    // }
  } catch (error) {
    console.error("导入失败:", error);
  }
}
```

### 列出所有素材

```typescript
const { listMaterials } = useTauriCommands();

async function loadProjectMaterials(projectPath: string) {
  try {
    const materials = await listMaterials(projectPath);
    
    // 按类型分类
    const videos = materials.filter(m => m.resource_type === "video");
    const audios = materials.filter(m => m.resource_type === "audio");
    const images = materials.filter(m => m.resource_type === "image");
    
    console.log(`加载 ${videos.length} 个视频, ${audios.length} 个音频, ${images.length} 个图片`);
  } catch (error) {
    console.error("加载失败:", error);
  }
}
```

### 删除素材

```typescript
const { deleteMaterial } = useTauriCommands();

async function handleDeleteMaterial(projectPath: string, materialId: string) {
  try {
    await deleteMaterial(projectPath, materialId);
    console.log("删除成功");
    // 刷新素材列表
    await loadProjectMaterials(projectPath);
  } catch (error) {
    console.error("删除失败:", error);
  }
}
```

### 获取单个素材信息

```typescript
const { getMaterial } = useTauriCommands();

async function getVideoInfo(projectPath: string, materialId: string) {
  try {
    const material = await getMaterial(projectPath, materialId);
    console.log("素材信息:", material);
  } catch (error) {
    console.error("获取信息失败:", error);
  }
}
```

### 按路径添加素材（不复制文件）

```typescript
const { addMaterialByPath } = useTauriCommands();

async function addExternalVideo(projectPath: string, externalPath: string) {
  try {
    const resource = await addMaterialByPath(
      projectPath,
      externalPath,
      "video"
    );
    console.log("添加成功:", resource);
  } catch (error) {
    console.error("添加失败:", error);
  }
}
```

## React Hook 示例

### 素材列表组件

```typescript
import { useState, useEffect } from "react";
import { useTauriCommands, Resource } from "@/app/hooks/useTauriCommands";

interface MaterialListProps {
  projectPath: string;
}

export function MaterialList({ projectPath }: MaterialListProps) {
  const [materials, setMaterials] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { listMaterials, deleteMaterial } = useTauriCommands();

  useEffect(() => {
    loadMaterials();
  }, [projectPath]);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const data = await listMaterials(projectPath);
      setMaterials(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    if (confirm("确认删除此素材吗？")) {
      try {
        await deleteMaterial(projectPath, materialId);
        await loadMaterials();
      } catch (err) {
        setError(err instanceof Error ? err.message : "删除失败");
      }
    }
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const videos = materials.filter(m => m.resource_type === "video");
  const audios = materials.filter(m => m.resource_type === "audio");
  const images = materials.filter(m => m.resource_type === "image");

  return (
    <div className="space-y-4">
      {/* 视频素材 */}
      {videos.length > 0 && (
        <div>
          <h3 className="font-bold">视频 ({videos.length})</h3>
          <ul className="space-y-2">
            {videos.map(video => (
              <li key={video.id} className="flex justify-between p-2 bg-gray-100">
                <span>{video.name}</span>
                <button
                  onClick={() => handleDelete(video.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 音频素材 */}
      {audios.length > 0 && (
        <div>
          <h3 className="font-bold">音频 ({audios.length})</h3>
          <ul className="space-y-2">
            {audios.map(audio => (
              <li key={audio.id} className="flex justify-between p-2 bg-gray-100">
                <span>{audio.name}</span>
                <button
                  onClick={() => handleDelete(audio.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 图片素材 */}
      {images.length > 0 && (
        <div>
          <h3 className="font-bold">图片 ({images.length})</h3>
          <ul className="space-y-2">
            {images.map(image => (
              <li key={image.id} className="flex justify-between p-2 bg-gray-100">
                <span>{image.name}</span>
                <button
                  onClick={() => handleDelete(image.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  删除
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {materials.length === 0 && (
        <p className="text-gray-500">还没有素材</p>
      )}
    </div>
  );
}
```

### 素材导入组件

```typescript
import { useRef } from "react";
import { useTauriCommands } from "@/app/hooks/useTauriCommands";

interface MaterialUploadProps {
  projectPath: string;
  onSuccess?: () => void;
}

export function MaterialUpload({ projectPath, onSuccess }: MaterialUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { importMaterial } = useTauriCommands();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 在实际应用中，需要通过 Tauri 文件选择对话框获取真实路径
      // 这里仅为示例
      const result = await importMaterial(projectPath, file.path);
      console.log("导入成功:", result);
      onSuccess?.();
    } catch (error) {
      console.error("导入失败:", error);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        accept="video/*,audio/*,image/*"
        style={{ display: "none" }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        导入素材
      </button>
    </div>
  );
}
```

## Rust 后端使用示例

### 在 Rust 中管理 Material

```rust
use crate::material_manager::{
    import_material_file, list_materials_from_protocol,
    remove_material_from_protocol, MaterialType,
};

// 导入素材
pub fn import_video(project_path: &str, video_path: &str) -> Result<(), String> {
    let material = import_material_file(project_path, video_path)?;
    println!("导入视频: {} (ID: {})", material.src, material.id);
    Ok(())
}

// 列出所有素材
pub fn list_all_materials(project_path: &str) -> Result<(), String> {
    let materials = list_materials_from_protocol(project_path)?;
    
    for material in materials {
        let type_str = match material.material_type {
            MaterialType::Video => "视频",
            MaterialType::Audio => "音频",
            MaterialType::Image => "图片",
        };
        println!("{}: {} ({})", type_str, material.src, material.id);
    }
    
    Ok(())
}

// 删除素材
pub fn delete_material(project_path: &str, material_id: &str) -> Result<(), String> {
    remove_material_from_protocol(project_path, material_id)?;
    println!("已删除素材: {}", material_id);
    Ok(())
}
```

## 完整工作流示例

```typescript
async function createProjectAndAddMaterials(
  projectName: string,
  videoFiles: string[]
) {
  const { createProject, importMaterial, getDefaultProjectsDir, listMaterials } = useTauriCommands();

  try {
    // 1. 创建项目
    const projectsDir = await getDefaultProjectsDir();
    const project = await createProject(projectName, projectsDir);
    console.log("项目创建成功:", project.id);

    // 2. 导入视频素材
    for (const videoPath of videoFiles) {
      const resource = await importMaterial(project.path, videoPath);
      console.log("导入完成:", resource.name);
    }

    // 3. 列出所有素材
    const materials = await listMaterials(project.path);
    console.log("项目中共有素材:", materials.length);

    return project;
  } catch (error) {
    console.error("工作流执行失败:", error);
    throw error;
  }
}

// 使用示例
createProjectAndAddMaterials("我的视频项目", [
  "/path/to/video1.mp4",
  "/path/to/video2.mp4",
]);
```
