# Web Eval Agent 使用指南

## 1. 概述

- **服务名称**: `web-eval-agent`
- **一句话描述**: 一个用于评估Web应用用户体验（UX）和用户界面（UI）的AI Agent MCP服务。
- **主要维护者**: 未知
- **版本**: v1.0.0

## 2. 核心功能

- **自动化UX/UI评估**: 自动执行指定的测试任务（如“测试结账流程”），并对交互流程进行分析。
- **浏览器状态管理**: 支持为需要登录的网站设置和保存认证状态（Cookies, Local Storage等）。
- **生成评估报告**: 输出包含观察、发现问题和改进建议的详细评估报告，并附上评估过程中的截图。

## 3. 配置文件详解 (`mcp-config.json`)

### 3.1 基本配置

- **`type`**: `stdio`
- **`command`**: `python`
- **`args`**: `["-m", "webEvalAgent.mcp_server"]`
- **`cwd`**: `C:/Users/花小生/Documents/Cline/MCP/web-eval-agent/web-eval-agent-main` (服务的工作目录)
- **`timeout`**: `60`
- **`disabled`**: `false`
- **`env`**:
  - `OPERATIVE_API_KEY`: Operative.AI的API密钥。

### 3.2 自动批准的工具 (`autoApprove`)

建议自动批准所有工具，因为它们的核心功能是评估和状态设置，风险较低。
- `web_eval_agent`
- `setup_browser_state`

### 3.3 完整JSON配置示例

```json
{
  "mcpServers": {
    "web-eval-agent": {
      "autoApprove": [
        "web_eval_agent",
        "setup_browser_state"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "python",
      "args": [
        "-m",
        "webEvalAgent.mcp_server"
      ],
      "cwd": "C:/Users/花小生/Documents/Cline/MCP/web-eval-agent/web-eval-agent-main",
      "env": {
        "OPERATIVE_API_KEY": "YOUR_OPERATIVE_API_KEY"
      }
    }
  }
}
```
**安全警告**: `OPERATIVE_API_KEY` 是敏感凭证，请妥善保管。

## 4. 工具 (Tools) 详细说明

#### **`web_eval_agent`**

- **功能描述**: 对指定的Web应用执行一个具体的用户体验测试任务，并返回详细的评估报告。
- **输入参数**:
  - `url` (`string`, **必需**): 要评估的Web应用的本地URL（如 `http://localhost:3000`）。
  - `task` (`string`, **必需**): 详细描述要测试的UX/UI方面。描述越详细，评估结果越精准。
  - `headless_browser` (`boolean`, 可选): 是否隐藏评估过程中弹出的浏览器窗口。
- **使用场景**: 在开发或重构后，自动评估关键用户流程的易用性、导航的清晰度或表单反馈的有效性。
- **输出示例**: 返回一个包含文本观察、问题列表、改进建议和多张截图的丰富报告。

#### **`setup_browser_state`**

- **功能描述**: 启动一个浏览器，允许用户手动登录或执行其他需要认证的操作，然后将浏览器状态（Cookies, Local Storage等）保存到本地，供后续 `web_eval_agent` 使用。
- **输入参数**:
  - `url` (`string`, 可选): 启动浏览器时要导航到的初始URL。
- **使用场景**: 当需要评估一个需要登录才能访问的Web应用时，必须先调用此工具来建立认证会话。
- **输出示例**: 返回状态保存成功或失败的确认信息。

## 5. 典型使用场景与工作流

- **场景一：评估一个公共网站的注册流程**
  1.  确保网站的开发服务器正在本地运行。
  2.  调用 `web_eval_agent`，传入 `url` (例如 `http://localhost:5173`) 和 `task` (例如 "请评估这个网站的用户注册流程。检查表单字段是否清晰，错误提示是否友好，以及整个流程是否顺畅。")。
  3.  分析返回的评估报告和截图，以发现可用性问题。

- **场景二：评估一个需要登录的后台管理系统**
  1.  调用 `setup_browser_state`，传入登录页面的URL。
  2.  在弹出的浏览器中，手动完成登录操作，然后关闭浏览器。
  3.  调用 `web_eval_agent`，传入后台系统的URL和要评估的任务（例如 "评估数据看板页面的信息架构和图表可读性"）。Agent将使用已保存的登录状态执行评估。

## 6. 调用流程与最佳实践

1.  **先认证（如需）**: 如果目标网站需要登录，工作流必须以 `setup_browser_state` 开始。
2.  **明确任务**: `web_eval_agent` 的评估质量高度依赖于 `task` 参数的清晰度和详细程度。应提供具体、可执行的评估指令。
3.  **本地优先**: 此工具主要设计用于评估本地运行的开发版本，确保在部署前发现并修复问题。

## 7. 错误处理指南

- **连接失败 (`Connection refused`)**:
  - **可能原因**: `url` 参数指向的本地开发服务器未启动。
  - **解决方案**: 确保你的Web应用已在指定的端口上成功运行。
- **认证失败**:
  - **可能原因**: 在评估需要登录的页面时，未预先调用 `setup_browser_state`，或保存的会话已过期。
  - **解决方案**: 重新调用 `setup_browser_state` 以刷新认证状态。

## 8. 注意事项

- **工作目录**: 此服务的 `command` 在其配置文件中指定的 `cwd` (工作目录)下执行，请确保该路径正确。
- **依赖Operative.AI**: Agent的评估能力依赖于Operative.AI的服务，需要有效的 `OPERATIVE_API_KEY`。
