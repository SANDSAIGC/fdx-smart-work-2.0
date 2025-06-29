# Context7 MCP Server 使用指南

## 1. 概述

- **服务名称**: `github.com/upstash/context7`
- **一句话描述**: 一个用于解析和获取各种技术库和框架文档的MCP服务，由Upstash提供支持。
- **主要维护者**: Upstash
- **版本**: v1.0.0

## 2. 核心功能

- **库ID解析**: 将用户提供的库名称（如 "react"）解析为Context7系统兼容的唯一ID（如 "/facebook/react"）。
- **文档获取**: 根据解析出的库ID，获取该库的详细文档、代码片段和描述。

## 3. 配置文件详解 (`mcp-config.json`)

### 3.1 基本配置

- **`type`**: `stdio`
- **`command`**: `cmd`
- **`args`**: `["/c", "node", "C:\\Users\\花小生\\Documents\\Cline\\MCP\\context7\\dist\\index.js"]`
- **`timeout`**: `60`
- **`disabled`**: `false`
- **`env`**:
  - `DEFAULT_MINIMUM_TOKENS`: `10000`

### 3.2 自动批准的工具 (`autoApprove`)

所有工具均为只读的数据查询工具，建议全部自动批准。
- `resolve-library-id`
- `get-library-docs`

### 3.3 完整JSON配置示例

```json
{
  "mcpServers": {
    "github.com/upstash/context7": {
      "autoApprove": [
        "resolve-library-id",
        "get-library-docs"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "cmd",
      "args": [
        "/c",
        "node",
        "C:\\Users\\花小生\\Documents\\Cline\\MCP\\context7\\dist\\index.js"
      ],
      "env": {
        "DEFAULT_MINIMUM_TOKENS": "10000"
      }
    }
  }
}
```
**安全警告**: 这是一个本地服务，不涉及外部敏感连接，但请确保Node.js环境和依赖包的安全性。

## 4. 工具 (Tools) 详细说明

#### **`resolve-library-id`**

- **功能描述**: 接收一个库的名称，返回一个或多个最匹配的、Context7兼容的库ID。它会综合考虑名称相似度、描述相关性、代码片段数量和信任分数来推荐最佳匹配项。
- **输入参数**:
  - `libraryName` (`string`, **必需**): 要查询的库的名称，例如 `"react"` 或 `"fastapi/fastapi"`。
- **使用场景**: 在调用 `get-library-docs` 之前，必须先调用此工具来获取准确的 `context7CompatibleLibraryID`。这是所有操作的第一步。
- **输出示例**: 返回一个包含多个匹配库信息的列表，每个库都包含 `Context7-compatible library ID`、`Description`、`Code Snippets` 和 `Trust Score`。

#### **`get-library-docs`**

- **功能描述**: 根据一个精确的Context7兼容库ID，获取该库的详细文档。
- **输入参数**:
  - `context7CompatibleLibraryID` (`string`, **必需**): 从 `resolve-library-id` 工具获取到的精确ID，例如 `"/tiangolo/fastapi"`。
  - `topic` (`string`, 可选): 指定要重点关注的文档主题，例如 `"hooks"` 或 `"routing"`。
  - `tokens` (`number`, 可选): 指定获取文档的最大token数量，默认为10000。
- **使用场景**: 在获取到库ID后，用此工具来拉取具体的文档内容以供分析和学习。
- **输出示例**: 返回一系列包含标题、描述、来源URL和代码片段的文档块。

## 5. 典型使用场景与工作流

- **场景一：学习一个新的JavaScript框架**
  1.  调用 `resolve-library-id`，传入 `libraryName: "Svelte"`。
  2.  从返回结果中选择信任分最高、最匹配的库ID，例如 `"/sveltejs/svelte"`。
  3.  调用 `get-library-docs`，传入上一步获取的ID，以获取Svelte的入门文档和核心概念。

- **场景二：查找特定库的API用法**
  1.  调用 `resolve-library-id`，传入 `libraryName: "axios"`。
  2.  获取到ID `"/axios/axios"`。
  3.  调用 `get-library-docs`，传入ID和 `topic: "post request"`，以精确查找关于如何发送POST请求的文档和代码示例。

## 6. 调用流程与最佳实践

1.  **两步走**: 必须遵循“先 `resolve-library-id`，后 `get-library-docs`”的两步流程。绝不能跳过第一步。
2.  **选择最佳匹配**: `resolve-library-id` 可能会返回多个结果，应优先选择信任分（Trust Score）高、代码片段（Code Snippets）多且描述最相关的库ID。
3.  **精确主题**: 在调用 `get-library-docs` 时，尽量使用 `topic` 参数来缩小范围，可以获得更精准、更相关的文档内容。

## 7. 错误处理指南

- **无法解析ID (`Failed to retrieve library...`)**:
  - **可能原因**: 提供的 `libraryName` 过于模糊、有拼写错误，或者该库尚未被Context7收录。
  - **解决方案**: 检查库名称的拼写，或尝试使用更通用、更官方的名称进行搜索。如果仍然失败，说明该库可能不受支持。
- **获取文档失败**:
  - **可能原因**: 提供的 `context7CompatibleLibraryID` 不正确或不存在。
  - **解决方案**: 确保使用的ID是直接从 `resolve-library-id` 的成功结果中复制而来的，没有手动修改。

## 8. 注意事项

- **ID格式**: `get-library-docs` 需要的ID格式是 `/org/repo`，例如 `/facebook/react`，这通常由 `resolve-library-id` 直接提供。
- **信息来源**: Context7的数据来源于公开的代码仓库和文档，其内容和更新频率依赖于上游。
