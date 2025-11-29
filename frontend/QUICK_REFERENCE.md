# 🚀 KivaCut 项目系统快速参考

## 文件导航

| 文件 | 用途 | 位置 |
|------|------|------|
| **page.tsx** | 主页入口 | `app/page.tsx` |
| **ProjectPage** | 项目创建页 | `app/project/page.tsx` |
| **EditorPage** | 编辑器页 (已更新) | `app/editor/page.tsx` |
| **useTauriCommands** | IPC 封装 | `app/hooks/useTauriCommands.ts` |
| **useProjectForm** | 表单 Hook | `app/project/hooks/useProjectForm.ts` |
| **useProjectResources** | 资源加载 Hook | `app/editor/hooks/useProjectResources.ts` |
| **commands.rs** | Tauri 命令 (新增) | `src-tauri/src/commands.rs` |
| **lib.rs** | 后端入口 (已更新) | `src-tauri/src/lib.rs` |

## 页面导航

```
http://localhost:3000/
    ↓
主页 (选择创建或打开项目)
    ├─→ /project (创建新项目)
    │    ├─→ 填写项目名称和位置
    │    └─→ 自动跳转 /editor?project=...
    │
    └─→ /editor (打开项目)
         ├─→ 需要 ?project=路径 参数
         └─→ 自动加载资源
```

## 快速命令

```bash
# 启动开发环境
cd frontend
npm run tauri dev

# 编译后端
cd frontend/src-tauri
cargo build

# 运行 linter
npm run lint

# 构建应用
npm run tauri build
```

## 核心 Tauri 命令

```typescript
// 创建项目
createProject(name, path) → ProjectMetadata

// 列出资源
listResources(path) → Resource[]

// 导入资源
importResource(projectPath, sourcePath) → Resource

// 打开文件夹
openProjectDir(path) → void

// 删除项目
deleteProject(path) → void
```

## 类型快速查询

```typescript
// 项目元数据
interface ProjectMetadata {
  name: string
  path: string
  created_at: string
  version: string
}

// 资源对象
interface Resource {
  id: string
  name: string
  path: string
  resource_type: string  // "video"|"audio"|"image"|"subtitle"|"unknown"
}

// 表单数据
interface ProjectFormData {
  projectName: string
  projectPath: string
}
```

## 常用路径

```
项目文件夹结构:
<projectPath>/<projectName>/
├── resources/        # 素材存放处
├── assets/
├── output/           # 输出文件
├── project.json      # 项目元数据
└── protocol.json     # 合成协议
```

## 文件类型识别

| 类型 | 扩展名 |
|------|--------|
| video | mp4, avi, mov, mkv, flv |
| audio | mp3, wav, aac, flac |
| image | png, jpg, jpeg, gif, bmp |
| subtitle | srt, vtt, ass |

## 调试检查点

```javascript
// 测试 IPC 通信
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('create_project', {
  projectName: 'Test',
  projectPath: '/path'
});
console.log(result);

// 检查资源加载
const { listResources } = useTauriCommands();
const resources = await listResources('/path/to/project');
console.log(resources);
```

## 常见错误排查

| 错误 | 原因 | 解决 |
|------|------|------|
| 命令未定义 | 未注册命令 | 检查 lib.rs invoke_handler |
| 路径错误 | 路径不存在 | 验证路径格式 |
| 文件未显示 | 资源未在 resources/ | 复制文件到正确位置 |
| IPC 超时 | 后端卡住 | 查看 Tauri 日志 |

## 项目创建流程

```
用户输入: 项目名称 + 位置
       ↓
验证: 名称不为空 + 路径不为空
       ↓
后端创建: ProjectPath = Location/Name
       ↓
创建文件夹:
  - resources/
  - assets/
  - output/
       ↓
创建文件:
  - project.json (元数据)
  - protocol.json (模板)
       ↓
返回: ProjectMetadata
       ↓
UI 跳转: /editor?project=ProjectPath
```

## 资源加载流程

```
编辑器加载: /editor?project=...
       ↓
useProjectResources Hook 触发
       ↓
IPC 调用: listResources(projectPath)
       ↓
后端遍历: resources/ 文件夹
       ↓
识别类型: 通过扩展名
       ↓
返回: Resource[]
       ↓
UI 渲染: ResourceGrid 显示
       ↓
用户交互: 点击标签页过滤
```

## 关键配置

```json
// package.json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0"
  }
}

// Cargo.toml
[dependencies]
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
```

## 下一步

- [ ] 实现资源导入 UI
- [ ] 项目管理页面
- [ ] 最近项目列表
- [ ] 项目备份功能
- [ ] 协议编辑界面

---

**快速联系**: 查看详细文档
- [PROJECT_SYSTEM_GUIDE.md](./PROJECT_SYSTEM_GUIDE.md) - 完整系统说明
- [INTEGRATION_TEST_GUIDE.md](./INTEGRATION_TEST_GUIDE.md) - 测试指南
- [DEVELOPMENT_GUIDE.md](./app/editor/DEVELOPMENT_GUIDE.md) - 开发指南
