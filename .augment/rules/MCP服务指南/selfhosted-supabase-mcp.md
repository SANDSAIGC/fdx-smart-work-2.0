# Selfhosted Supabase MCP 配置信息

以下是 `selfhosted-supabase-mcp` 的配置信息，来源于 `cline_mcp_settings.json` 文件：

## 基本配置

- **名称**：selfhosted-supabase-mcp
- **类型**：stdio
- **命令**：node
- **超时时间**：60秒
- **是否禁用**：否

## 命令路径

- **路径**：c:/Users/花小生/Documents/Cline/MCP/selfhosted-supabase-mcp/dist/index.js

## 自动批准的工具

- list_auth_users
- get_auth_user
- delete_auth_user
- create_auth_user
- update_auth_user
- list_storage_buckets
- list_storage_objects
- list_realtime_publications
- list_tables
- list_extensions
- list_migrations
- apply_migration
- execute_sql
- get_database_connections
- get_database_stats
- get_project_url
- get_anon_key
- get_service_key
- generate_typescript_types
- rebuild_hooks
- verify_jwt_secret

**注意**：此文件包含敏感信息，请勿将其公开或上传至版本控制系统。确保在处理和存储此类信息时遵守安全最佳实践。

## JSON 格式配置代码

以下是 `selfhosted-supabase-mcp` 的 JSON 格式配置代码：

```json
{
  "mcpServers": {
    "selfhosted-supabase-mcp": {
      "autoApprove": [
        "list_auth_users",
        "get_auth_user",
        "delete_auth_user",
        "create_auth_user",
        "update_auth_user",
        "list_storage_buckets",
        "list_storage_objects",
        "list_realtime_publications",
        "list_extensions",
        "list_migrations",
        "apply_migration",
        "execute_sql",
        "get_database_connections",
        "get_database_stats",
        "get_project_url",
        "get_anon_key",
        "get_service_key",
        "generate_typescript_types",
        "rebuild_hooks",
        "verify_jwt_secret"
      ],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "c:/Users/花小生/Documents/Cline/MCP/selfhosted-supabase-mcp/dist/index.js",
        "--url",
        "http://132.232.143.210:28000",
        "--anon-key",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE",
        "--service-key",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q",
        "--db-url",
        "postgres://postgres:your-super-secret-and-long-postgres-password@132.232.143.210:5432/postgres",
        "--jwt-secret",
        "I8GUQLthqSETYh52ZeQ0CMIxMp5n4LsY",
        "--tools-config",
        "c:/Users/花小生/Documents/Cline/MCP/selfhosted-supabase-mcp/mcp-tools.json"
      ]
    }
  }
}
```

## 工具详细说明

### 2.1 数据库管理工具

- **`list_tables`**
  - **功能描述**：列出数据库中的所有表，显示表名、模式、类型和列信息。
  - **输入参数**：无
  - **使用场景**：当需要了解数据库结构或查找特定表时使用。
  - **输出示例**：返回一个包含表名和列信息的列表。

- **`list_extensions`**
  - **功能描述**：列出数据库中已安装的扩展。
  - **输入参数**：无
  - **使用场景**：当需要查看数据库支持的扩展功能时使用。
  - **输出示例**：返回一个包含扩展名称和版本的列表。

- **`list_migrations`**
  - **功能描述**：列出 `supabase_migrations.schema_migrations` 表中的迁移记录。
  - **输入参数**：无
  - **使用场景**：当需要查看已应用的数据库迁移记录时使用，以便于版本控制。
  - **输出示例**：返回一个包含迁移 ID 和时间的列表。

- **`apply_migration`**
  - **功能描述**：将 SQL 迁移脚本应用于数据库，并记录到 `supabase_migrations.schema_migrations` 表。
  - **输入参数**：
    - `version`（必需）：迁移版本标识符（通常是时间戳）。
    - `sql`（必需）：要执行的 SQL 迁移脚本。
  - **使用场景**：当需要更新数据库模式或应用新的迁移时使用。例如，创建新表或修改现有表结构。
  - **输出示例**：返回迁移应用成功的确认信息。

- **`execute_sql`**
  - **功能描述**：对数据库执行任意 SQL 查询，使用直接数据库连接或 RPC 函数作为备用。
  - **输入参数**：
    - `sql`（必需）：要执行的 SQL 查询。
    - `read_only`（可选，默认 false）：提示 RPC 函数查询是否为只读（尽力而为）。
  - **使用场景**：当需要执行自定义 SQL 查询（如插入、更新、删除数据或创建表）时使用。例如，插入新记录或查询特定数据。
  - **输出示例**：返回查询结果（如果是 SELECT 语句）或执行成功的确认信息。

- **`get_database_connections`**
  - **功能描述**：从 `pg_stat_activity` 获取有关活跃数据库连接的信息。
  - **输入参数**：无
  - **使用场景**：当需要监控数据库连接状态或排查连接问题时使用。
  - **输出示例**：返回一个包含连接 ID、用户、状态等信息的列表。

- **`get_database_stats`**
  - **功能描述**：从 `pg_stat_database` 和 `pg_stat_bgwriter` 获取有关数据库活动和后台写入器的统计信息。
  - **输入参数**：无
  - **使用场景**：当需要了解数据库性能和活动统计数据时使用，以便优化数据库操作。
  - **输出示例**：返回包含事务数、查询时间等统计数据的对象。

### 2.2 项目配置工具

- **`get_project_url`**
  - **功能描述**：返回为此服务器配置的 Supabase 项目 URL。
  - **输入参数**：无
  - **使用场景**：当需要确认当前连接的 Supabase 项目 URL 时使用。
  - **输出示例**：返回一个字符串，如 `http://132.232.143.210:28000`。

- **`get_anon_key`**
  - **功能描述**：返回为此服务器配置的 Supabase 匿名密钥。
  - **输入参数**：无
  - **使用场景**：当需要获取匿名密钥以进行公共访问时使用。
  - **输出示例**：返回一个包含匿名密钥的字符串。

- **`get_service_key`**
  - **功能描述**：返回为此服务器配置的 Supabase 服务角色密钥（如果可用）。
  - **输入参数**：无
  - **使用场景**：当需要获取服务角色密钥以进行特权操作时使用。
  - **输出示例**：返回一个包含服务角色密钥的字符串。

- **`verify_jwt_secret`**
  - **功能描述**：检查 Supabase JWT 密钥是否为此服务器配置，并返回预览。
  - **输入参数**：无
  - **使用场景**：当需要确认 JWT 密钥是否正确配置以进行身份验证时使用。
  - **输出示例**：返回一个包含密钥预览的确认信息。

- **`generate_typescript_types`**
  - **功能描述**：使用 Supabase CLI（`supabase gen types`）从数据库模式生成 TypeScript 类型，并将文件下载到指定路径。
  - **输入参数**：
    - `included_schemas`（可选，默认 ["public"]）：要包含在类型生成中的数据库模式。
    - `output_filename`（可选，默认 "database.types.ts"）：保存生成类型的文件名。
    - `output_path`（必需）：下载生成的 TypeScript 文件的绝对路径。
  - **使用场景**：当需要在前端开发中使用数据库类型的 TypeScript 定义时使用，以便于类型安全编码。
  - **输出示例**：返回生成的 TypeScript 文件路径和内容预览。

- **`rebuild_hooks`**
  - **功能描述**：尝试重启 pg_net 工作者。需要安装并可用 pg_net 扩展。
  - **输入参数**：无
  - **使用场景**：当需要重启 pg_net 工作者以解决网络相关问题时使用。
  - **输出示例**：返回重启成功的确认信息。

### 2.3 用户管理工具

- **`list_auth_users`**
  - **功能描述**：列出 `auth.users` 表中的用户。
  - **输入参数**：
    - `limit`（可选，默认 50）：返回的最大用户数。
    - `offset`（可选，默认 0）：跳过的用户数。
  - **使用场景**：当需要查看当前注册用户列表时使用，以便于用户管理。
  - **输出示例**：返回一个包含用户 ID、电子邮件等信息的用户列表。

- **`get_auth_user`**
  - **功能描述**：通过 ID 从 `auth.users` 获取特定用户的详细信息。
  - **输入参数**：
    - `user_id`（必需）：要获取的用户的 UUID。
  - **使用场景**：当需要查看特定用户的详细信息时使用。
  - **输出示例**：返回包含用户详细信息的对象。

- **`delete_auth_user`**
  - **功能描述**：通过 ID 从 `auth.users` 删除用户。需要服务角色密钥和直接数据库连接。
  - **输入参数**：
    - `user_id`（必需）：要删除的用户的 UUID。
  - **使用场景**：当需要从数据库中删除特定用户时使用。
  - **输出示例**：返回删除成功的确认信息。

- **`create_auth_user`**
  - **功能描述**：直接在 `auth.users` 中创建新用户。警告：需要明文密码，不安全。谨慎使用。
  - **输入参数**：
    - `email`（必需）：新用户的电子邮件地址。
    - `password`（必需）：明文密码（至少 6 个字符）。警告：不安全。
    - `role`（可选，默认 "authenticated"）：用户角色。
    - `user_metadata`（可选）：可选的用户元数据。
    - `app_metadata`（可选）：可选的应用元数据。
  - **使用场景**：当需要直接在数据库中创建新用户时使用，但应谨慎使用，因为密码是明文。
  - **输出示例**：返回新创建用户的 ID 和详细信息。

- **`update_auth_user`**
  - **功能描述**：更新 `auth.users` 中用户的信息。警告：密码处理不安全。需要服务角色密钥和直接数据库连接。
  - **输入参数**：
    - `user_id`（必需）：要更新的用户的 UUID。
    - `email`（可选）：新的电子邮件地址。
    - `password`（可选）：新的明文密码（至少 6 个字符）。警告：不安全。
    - `role`（可选）：新角色。
    - `user_metadata`（可选）：新的用户元数据（将覆盖现有数据）。
    - `app_metadata`（可选）：新的应用元数据（将覆盖现有数据）。
  - **使用场景**：当需要更新现有用户信息时使用，但应谨慎使用，因为密码是明文。
  - **输出示例**：返回更新后的用户信息。

### 2.4 存储管理工具

- **`list_storage_buckets`**
  - **功能描述**：列出项目中的所有存储桶。
  - **输入参数**：无
  - **使用场景**：当需要查看项目中可用的存储桶列表时使用，以便于文件存储管理。
  - **输出示例**：返回一个包含存储桶 ID 和名称的列表。

- **`list_storage_objects`**
  - **功能描述**：列出特定存储桶中的对象，可选按前缀过滤。
  - **输入参数**：
    - `bucket_id`（必需）：要列出对象的存储桶 ID。
    - `limit`（可选，默认 100）：返回的最大对象数。
    - `offset`（可选，默认 0）：跳过的对象数。
    - `prefix`（可选）：按路径前缀过滤对象（例如 'public/'）。
  - **使用场景**：当需要浏览特定存储桶中的文件或对象时使用，以便于文件管理。
  - **输出示例**：返回一个包含对象路径和元数据的列表。

### 2.5 实时功能工具

- **`list_realtime_publications`**
  - **功能描述**：列出 PostgreSQL 发布，通常用于 Supabase Realtime。
  - **输入参数**：无
  - **使用场景**：当需要查看数据库中配置的实时发布时使用，以便于实时数据同步管理。
  - **输出示例**：返回一个包含发布名称和表的列表。

## 3. 使用场景

`selfhosted-supabase` 服务的典型使用场景如下：

- **数据库操作**：当需要对 Supabase 数据库进行操作时，调用该服务。典型场景包括：
  - 创建、删除或修改数据表（使用 `execute_sql`）。
  - 执行自定义 SQL 查询以获取或更新数据（使用 `execute_sql`）。
  - 查看数据库结构和表信息（使用 `list_tables`）。

- **用户管理**：当需要管理 Supabase 数据库中的用户时，调用该服务。典型场景包括：
  - 列出所有用户（使用 `list_auth_users`）。
  - 创建或更新用户信息（使用 `create_auth_user` 和 `update_auth_user`）。
  - 删除用户（使用 `delete_auth_user`）。

- **存储管理**：当需要管理 Supabase 存储桶和对象时，调用该服务。典型场景包括：
  - 查看存储桶列表（使用 `list_storage_buckets`）。
  - 浏览存储桶中的文件（使用 `list_storage_objects`）。

- **数据库维护**：当需要进行数据库维护操作时，调用该服务。典型场景包括：
  - 应用数据库迁移（使用 `apply_migration`）。
  - 查看数据库连接和统计信息（使用 `get_database_connections` 和 `get_database_stats`）。
  - 生成 TypeScript 类型以便于开发（使用 `generate_typescript_types`）。

- **迁移应用**：每次生成迁移文件时，顺便调用 MCP 服务（如 `selfhosted-supabase`）来应用这些迁移到数据库是非常高效的做法。这可以确保数据库立即反映最新的模式变更，避免手动应用带来的延迟或错误。

## 4. 调用流程

调用 `selfhosted-supabase` 服务的步骤如下：

1. **确定需求**：明确当前任务的需求，选择合适的工具。例如，如果需要创建新表，选择 `execute_sql` 工具。
2. **准备参数**：根据工具的输入模式准备必要的参数。例如，`execute_sql` 需要 `sql` 参数来指定要执行的 SQL 语句。
3. **执行调用**：使用 `use_mcp_tool` 工具执行调用，传递正确的服务名称（`selfhosted-supabase`）、工具名称和参数。
4. **处理结果**：检查调用结果，确认任务是否成功完成。如果返回错误，参考错误信息进行调整。
5. **后续操作**：根据调用结果决定下一步操作，可能需要调用其他工具或调整参数重新调用。

## 5. 错误处理

在调用 `selfhosted-supabase` 服务失败时，应遵循以下错误处理策略：

- **连接错误**：如果遇到连接相关错误（如 ECONNREFUSED 或 Connection terminated unexpectedly），检查配置文件中的 `--db-url` 参数是否正确，并确认数据库服务是否正在运行。
- **超时错误**：如果请求超时，检查网络连接是否稳定，或尝试增加超时时间。
- **参数错误**：如果错误提示参数不正确，检查工具的输入模式，确保参数符合要求。例如，`execute_sql` 工具的 `sql` 参数必须是有效的 SQL 语句。
- **权限错误**：如果遇到权限相关错误，确认是否有足够的权限执行操作，可能需要检查 `--anon-key` 或 `--service-key` 是否正确配置。
- **其他错误**：对于其他类型的错误，记录错误详细信息，并根据错误提示调整调用方式或参数。如果问题无法解决，考虑使用替代方法（如直接通过 Supabase 控制台操作）。

## 注意事项

- **安全性**：在使用涉及敏感操作的工具时（如用户管理、直接 SQL 执行），应确保遵循安全最佳实践，避免潜在的安全风险。
- **错误处理**：在使用 MCP 服务工具时，应预见到可能的错误情况，并准备好相应的错误处理机制，以确保任务的顺利进行。
- **参数准确性**：在调用工具时，确保提供准确的参数值，特别是对于需要特定格式的参数（如 UUID、SQL 语句等），以避免执行失败。

## 总结

以上规则旨在提供一个清晰的框架，指导 `selfhosted-supabase` MCP 服务的调用。通过对服务功能的概述、定义使用场景、规范调用流程和制定错误处理策略，用户和开发者可以更高效地使用该服务，完成与 Supabase 数据库相关的各种任务。在实际使用中，应确保配置文件中的参数（如数据库连接字符串和密钥）准确无误，并根据具体任务需求选择合适的工具。
