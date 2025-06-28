# Filesystem MCP Server 使用指南

## 1. 概述

- **服务名称**: `github.com/modelcontextprotocol/servers/tree/main/src/filesystem`
- **一句话描述**: 一个提供核心文件系统操作能力的MCP服务，允许对指定目录下的文件和文件夹进行读、写、修改和查询。
- **主要维护者**: Model Context Protocol
- **版本**: v1.0.0

## 2. 核心功能

- **文件读写**: 读取、写入和编辑文件内容。
- **目录操作**: 创建、列出、移动和获取目录树结构。
- **文件查询**: 搜索文件和获取文件元信息。
- **权限控制**: 限制操作在预先配置的允许目录内。

## 3. 配置文件详解 (`mcp-config.json`)

### 3.1 基本配置

- **`type`**: `stdio`
- **`command`**: `node`
- **`args`**: `["<path_to_script>", "<allowed_dir_1>", "<allowed_dir_2>", ...]`
- **`timeout`**: `60`
- **`disabled`**: `false`

### 3.2 命令参数 (`args`)

- **第一个参数**: 服务的JS脚本路径。
- **后续参数**: 一系列允许该服务进行操作的目录的绝对路径。服务的所有操作都将被限制在这些目录及其子目录中。

### 3.3 自动批准的工具 (`autoApprove`)

建议自动批准只读操作，对写入和删除操作保持谨慎。
- `read_file`
- `read_multiple_files`
- `list_directory`
- `directory_tree`
- `search_files`
- `get_file_info`
- `list_allowed_directories`

### 3.4 完整JSON配置示例

```json
{
  "mcpServers": {
    "github.com/modelcontextprotocol/servers/tree/main/src/filesystem": {
      "autoApprove": [
        "read_file",
        "list_directory",
        "search_files",
        "get_file_info",
        "list_allowed_directories"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "C:/Users/花小生/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
        "C:/Users/花小生/Desktop",
        "C:/Users/花小生/Documents",
        "F:/"
      ],
      "env": {
        "NODE_PATH": "C:/Users/花小生/AppData/Roaming/npm/node_modules"
      }
    }
  }
}
```
**安全警告**: `args` 中配置的目录路径定义了此服务的能力边界。请确保只授予必要的最小权限，避免将系统根目录等敏感路径加入其中。

## 4. 工具 (Tools) 详细说明

### 4.1 文件读写

#### **`read_file`**

- **功能描述**: 读取指定路径下单个文件的全部内容。
- **输入参数**: `path` (`string`, **必需**)
- **使用场景**: 查看配置文件、源代码或其他文本文件的内容。

#### **`write_file`**

- **功能描述**: 将指定内容写入一个文件。如果文件不存在，则创建；如果文件已存在，则**完全覆盖**。
- **输入参数**:
  - `path` (`string`, **必需**)
  - `content` (`string`, **必需**)
- **使用场景**: 创建新文件、重置配置文件等。

#### **`edit_file`**

- **功能描述**: 对现有文件进行基于行的精确编辑，替换匹配到的文本块。
- **输入参数**:
  - `path` (`string`, **必需**)
  - `edits` (`array`, **必需**): 包含 `oldText` 和 `newText` 的对象数组。
- **使用场景**: 修改代码、更新文档中的特定段落，是比 `write_file` 更安全、更精确的修改方式。

### 4.2 目录操作

#### **`list_directory`**

- **功能描述**: 列出指定目录下的所有文件和子目录。
- **输入参数**: `path` (`string`, **必需**)
- **使用场景**: 探索项目结构，查找特定文件。

#### **`create_directory`**

- **功能描述**: 创建一个新目录，支持递归创建多层级目录。
- **输入参数**: `path` (`string`, **必需**)
- **使用场景**: 为新项目或新模块创建文件夹结构。

## 5. 典型使用场景与工作流

- **场景一：代码重构**
  1.  调用 `search_files` 查找所有使用了某个即将被废弃的函数的文件。
  2.  对返回的每个文件路径，调用 `read_file` 读取其内容。
  3.  （在模型端）分析代码并构建 `edit_file` 所需的 `edits` 参数。
  4.  调用 `edit_file` 将旧函数调用替换为新函数的调用。

- **场景二：创建新项目脚手架**
  1.  调用 `create_directory` 创建项目根目录和 `src`, `public`, `tests` 等子目录。
  2.  调用 `write_file` 创建 `package.json`, `.gitignore`, `README.md` 等初始配置文件。
  3.  调用 `write_file` 创建 `src/index.js` 等入口文件。

## 6. 调用流程与最佳实践

1.  **检查权限**: 在尝试操作前，可以先调用 `list_allowed_directories` 确认目标路径是否在允许的操作范围内。
2.  **优先使用 `edit_file`**: 在修改现有文件时，应优先使用 `edit_file` 而不是 `write_file`，以避免意外覆盖整个文件，降低风险。
3.  **路径准确性**: 所有 `path` 参数都应是相对于服务启动时配置的允许目录的路径，或者是绝对路径（如果该绝对路径在允许的范围内）。

## 7. 错误处理指南

- **路径不允许 (`Path not allowed`)**:
  - **可能原因**: 尝试操作的路径不在 `args` 中配置的允许目录下。
  - **解决方案**: 检查路径是否正确，或者确认是否需要修改MCP服务的启动参数来授予对新目录的访问权限。
- **文件未找到 (`File not found`)**:
  - **可能原因**: 在调用 `read_file` 或 `edit_file` 时，指定的文件不存在。
  - **解决方案**: 调用 `list_directory` 确认文件是否存在和路径是否正确。

## 8. 注意事项

- **覆盖风险**: `write_file` 是一个破坏性操作，会无警告地覆盖已存在的文件。
- **权限边界**: 此服务的所有能力都被严格限制在启动时 `args` 定义的目录中，无法操作这些目录之外的任何文件。
