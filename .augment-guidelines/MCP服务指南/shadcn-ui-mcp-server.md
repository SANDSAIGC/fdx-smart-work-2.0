# shadcn/ui MCP Server 使用指南

## 1. 概述

- **服务名称**: `shadcn-ui-mcp-server`
- **一句话描述**: 一个用于查询和获取 shadcn/ui 组件信息的MCP服务。
- **主要维护者**: 未知
- **版本**: v1.0.0

## 2. 核心功能

- **组件列表**: 获取所有可用的 shadcn/ui 组件。
- **组件详情**: 获取特定组件的详细信息。
- **使用示例**: 获取特定组件的代码使用示例。
- **组件搜索**: 根据关键词搜索相关的 shadcn/ui 组件。

## 3. 配置文件详解 (`mcp-config.json`)

### 3.1 基本配置

- **`type`**: `stdio`
- **`command`**: `node`
- **`args`**: `["C:\\Users\\花小生\\Documents\\Cline\\MCP\\shadcn-ui-mcp-server\\build\\index.js"]`
- **`timeout`**: `60`
- **`disabled`**: `false`

### 3.2 自动批准的工具 (`autoApprove`)

所有工具均为只读的数据查询工具，建议全部自动批准。
- `list_shadcn_components`
- `get_component_details`
- `get_component_examples`
- `search_components`

### 3.3 完整JSON配置示例

```json
{
  "mcpServers": {
    "shadcn-ui-mcp-server": {
      "autoApprove": [
        "list_shadcn_components",
        "get_component_details",
        "get_component_examples",
        "search_components"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "C:\\Users\\花小生\\Documents\\Cline\\MCP\\shadcn-ui-mcp-server\\build\\index.js"
      ]
    }
  }
}
```
**安全警告**: 这是一个本地服务，不涉及外部敏感连接，但请确保Node.js环境和依赖包的安全性。

## 4. 工具 (Tools) 详细说明

#### **`list_shadcn_components`**

- **功能描述**: 获取所有可用的 shadcn/ui 组件的列表。
- **输入参数**: 无
- **使用场景**: 当需要了解 shadcn/ui 提供了哪些组件时，作为探索的起点。
- **输出示例**: 返回一个包含所有组件名称的字符串数组。

#### **`get_component_details`**

- **功能描述**: 获取指定组件的详细信息，如其用途、属性等。
- **输入参数**:
  - `componentName` (`string`, **必需**): 组件名称，例如 `"button"`。
- **使用场景**: 在决定使用某个组件前，详细了解其功能和配置。
- **输出示例**: 返回一个包含组件详细描述的对象。

#### **`get_component_examples`**

- **功能描述**: 获取指定组件的React代码使用示例。
- **输入参数**:
  - `componentName` (`string`, **必需**): 组件名称，例如 `"accordion"`。
- **使用场景**: 在项目中集成某个组件时，快速获取可复制粘贴的模板代码。
- **输出示例**: 返回一个包含React代码示例的字符串。

#### **`search_components`**

- **功能描述**: 根据关键词搜索相关的 shadcn/ui 组件。
- **输入参数**:
  - `query` (`string`, **必需**): 搜索关键词，例如 `"input"` 或 `"form"`。
- **使用场景**: 当不确定具体组件名称，但知道其功能时，用此工具进行查找。
- **输出示例**: 返回一个与关键词匹配的组件名称列表。

## 5. 典型使用场景与工作流

- **场景一：为项目寻找并使用一个日期选择器**
  1.  调用 `search_components`，传入 `query: "date picker"` 或 `query: "calendar"`。
  2.  从返回结果中找到 `calendar` 和 `datepicker` 等相关组件。
  3.  调用 `get_component_details`，传入 `componentName: "datepicker"`，了解其功能。
  4.  调用 `get_component_examples`，传入 `componentName: "datepicker"`，获取其用法示例。
  5.  将示例代码集成到你的React项目中。

- **场景二：快速搭建一个表单页面**
  1.  调用 `list_shadcn_components` 查看所有可用组件。
  2.  识别出构建表单所需的组件，如 `input`, `button`, `select`, `checkbox`, `label`。
  3.  对每个组件，调用 `get_component_examples` 获取其代码。
  4.  组合这些代码片段，快速构建出表单的UI框架。

## 6. 调用流程与最佳实践

1.  **从搜索或列表开始**: 如果不确定组件名称，使用 `search_components` 或 `list_shadcn_components` 作为起点。
2.  **先看详情，再看示例**: 在获取代码示例前，先用 `get_component_details` 了解组件的用途和props，有助于更好地理解示例代码。
3.  **结合 `npx shadcn-ui`**: 获取到组件信息和用法后，通常需要配合 `npx shadcn-ui@latest add [componentName]` 命令将组件的源代码实际安装到你的项目中。

## 7. 错误处理指南

- **组件未找到**:
  - **可能原因**: `componentName` 拼写错误，或该组件不存在于 shadcn/ui 中。
  - **解决方案**: 检查组件名称的拼写，或使用 `list_shadcn_components` 确认组件是否存在。
- **服务未启动**:
  - **可能原因**: `node` 命令执行失败或 `shadcn-ui-mcp-server` 的构建文件不存在。
  - **解决方案**: 检查Node.js环境，并确保MCP服务已正确编译和放置在指定路径。

## 8. 注意事项

- **信息来源**: 此服务的数据来源于对 shadcn/ui 官方文档和组件库的解析，其内容更新可能滞后于官方。
- **非安装工具**: 此服务仅用于查询信息和获取代码示例，它**不会**自动将组件安装到你的项目中。安装仍需手动执行 `npx` 命令。
