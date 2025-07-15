# GitHub MCP Server 使用指南

## 1. 概述

- **服务名称**: `github.com/modelcontextprotocol/servers/tree/main/src/github`
- **一句话描述**: 一个功能全面的MCP服务，用于通过API与GitHub进行交互，涵盖了仓库、文件、Issues、Pull Requests等多种核心资源的自动化管理。
- **主要维护者**: Model Context Protocol
- **版本**: v1.0.0

## 2. 核心功能

- **仓库管理**: 搜索、创建和Fork仓库。
- **文件操作**: 创建、更新和获取仓库中的文件内容。
- **代码提交**: 以单个或多个文件的形式向指定分支推送提交。
- **分支管理**: 创建新分支。
- **Issue管理**: 创建、更新、搜索和评论Issue。
- **Pull Request管理**: 创建、获取、列出、合并和审查Pull Request。

## 3. 配置文件详解 (`mcp-config.json`)

### 3.1 基本配置

- **`type`**: `stdio`
- **`command`**: `node`
- **`args`**: `["<path_to_script>"]`
- **`timeout`**: `60`
- **`disabled`**: `false`
- **`env`**:
  - `GITHUB_PERSONAL_ACCESS_TOKEN`: 你的GitHub个人访问令牌。

### 3.2 自动批准的工具 (`autoApprove`)

建议对只读和搜索类工具进行自动批准，对写入、创建、合并等具有破坏性或重要影响的操作保持谨慎。
- `search_repositories`
- `get_file_contents`
- `list_commits`
- `list_issues`
- `search_code`
- `search_issues`
- `search_users`
- `get_issue`
- `get_pull_request`
- `list_pull_requests`

### 3.3 完整JSON配置示例

```json
{
  "mcpServers": {
    "github.com/modelcontextprotocol/servers/tree/main/src/github": {
      "autoApprove": [
        "search_repositories",
        "get_file_contents",
        "list_issues",
        "get_issue"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "C:/Users/花小生/AppData/Roaming/npm/node_modules/@modelcontextprotocol/server-github/dist/index.js"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN",
        "NODE_PATH": "C:/Users/花小生/AppData/Roaming/npm/node_modules"
      }
    }
  }
}
```
**安全警告**: `GITHUB_PERSONAL_ACCESS_TOKEN` 是高度敏感的凭证。请确保为其授予完成任务所需的最小权限，并使用安全的方式进行存储，切勿硬编码或提交到版本控制系统。

## 4. 工具 (Tools) 详细说明

### 4.1 仓库与文件

#### **`create_repository`**

- **功能描述**: 在你的GitHub账户下创建一个新的仓库。
- **输入参数**:
  - `name` (`string`, **必需**): 新仓库的名称。
  - `description` (`string`, 可选): 仓库描述。
  - `private` (`boolean`, 可选): 是否设为私有仓库。
- **使用场景**: 为一个新项目自动创建远程代码仓库。

#### **`create_or_update_file`**

- **功能描述**: 在指定的仓库和分支中创建新文件或更新现有文件。
- **输入参数**:
  - `owner`, `repo`, `path`, `content`, `message`, `branch` (**必需**)
  - `sha` (`string`, 可选): 更新文件时必需，为文件的blob SHA。
- **使用场景**: 自动生成或修改CI/CD配置文件、文档或源代码。

### 4.2 Issues 与 Pull Requests

#### **`create_issue`**

- **功能描述**: 在指定的仓库中创建一个新的Issue。
- **输入参数**:
  - `owner`, `repo`, `title` (**必需**)
  - `body`, `labels`, `assignees` (可选)
- **使用场景**: 根据代码分析结果或测试失败报告，自动创建Bug或任务Issue。

#### **`create_pull_request`**

- **功能描述**: 创建一个新的Pull Request，请求将一个分支的更改合并到另一个分支。
- **输入参数**:
  - `owner`, `repo`, `title`, `head`, `base` (**必需**)
  - `body` (可选)
- **使用场景**: 在功能开发分支完成后，自动创建PR到主开发分支，并附上相关的变更说明。

#### **`merge_pull_request`**

- **功能描述**: 合并一个指定的Pull Request。
- **输入参数**:
  - `owner`, `repo`, `pull_number` (**必需**)
  - `merge_method` (`string`, 可选): 合并方法 (`merge`, `squash`, `rebase`)。
- **使用场景**: 在CI/CD流程中，当所有检查通过后，自动合并PR。

## 5. 典型使用场景与工作流

- **场景一：自动化发布流程**
  1.  开发完成后，调用 `push_files` 将代码推送到一个新的发布分支。
  2.  调用 `create_pull_request` 创建一个从发布分支到 `main` 分支的PR。
  3.  （外部CI系统运行测试）
  4.  在CI成功后，调用 `merge_pull_request` 自动合并该PR。
  5.  调用 `create_issue` 创建一个记录此次发布的Issue。

- **场景二：代码审查助手**
  1.  调用 `list_pull_requests` 获取所有待处理的PR。
  2.  对每个PR，调用 `get_pull_request_files` 获取变更的文件列表。
  3.  对每个变更的文件，调用 `get_file_contents` 获取其内容。
  4.  （在模型端）对代码进行静态分析或风格检查。
  5.  如果发现问题，调用 `create_pull_request_review` 提交审查评论。

## 6. 调用流程与最佳实践

1.  **明确身份**: 所有操作都将使用配置的 `GITHUB_PERSONAL_ACCESS_TOKEN` 对应的用户身份执行。
2.  **参数准确**: `owner`, `repo`, `branch`, `pull_number` 等核心参数必须准确无误。
3.  **先读后写**: 在执行 `update` 或 `merge` 等操作前，先使用 `get` 或 `list` 工具获取最新状态，避免冲突。

## 7. 错误处理指南

- **认证失败 (`401 Unauthorized`)**:
  - **可能原因**: `GITHUB_PERSONAL_ACCESS_TOKEN` 无效、已过期或权限不足。
  - **解决方案**: 检查Token是否正确，并在GitHub上确认其具备所需的操作权限（如 `repo`, `workflow` 等）。
- **资源未找到 (`404 Not Found`)**:
  - **可能原因**: `owner`, `repo` 或其他ID不正确。
  - **解决方案**: 确认资源路径和ID的拼写与大小写是否正确。
- **合并冲突 (`409 Conflict`)**:
  - **可能原因**: 在调用 `merge_pull_request` 时，目标分支与源分支存在合并冲突。
  - **解决方案**: 需要人工介入解决冲突，或尝试使用 `rebase` 等不同合并策略。

## 8. 注意事项

- **权限管理**: 务必遵循最小权限原则配置你的Personal Access Token。
- **速率限制**: GitHub API有速率限制。在高频率调用时，需注意处理限制，避免被临时封禁。
- **破坏性操作**: `merge_pull_request`, `create_or_update_file` 等是具有重要影响的操作，建议在自动化流程中加入人工确认环节。
