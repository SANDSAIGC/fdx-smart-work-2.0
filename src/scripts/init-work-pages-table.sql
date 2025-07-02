-- FDX SMART WORK 2.0 工作页面数据表初始化脚本
-- 创建工作页面管理表和相关配置

-- 1. 创建工作页面表（使用中文字段名）
CREATE TABLE IF NOT EXISTS "工作页面" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "路径" VARCHAR(255) UNIQUE NOT NULL,
    "页面名称" VARCHAR(100) NOT NULL,
    "描述" TEXT,
    "图标" VARCHAR(50),
    "排序" INTEGER DEFAULT 0,
    "状态" VARCHAR(10) DEFAULT '启用' CHECK ("状态" IN ('启用', '禁用')),
    "创建时间" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "更新时间" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建更新时间戳触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."更新时间" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. 为工作页面表添加更新时间戳触发器
DROP TRIGGER IF EXISTS "update_工作页面_updated_at" ON "工作页面";
CREATE TRIGGER "update_工作页面_updated_at"
    BEFORE UPDATE ON "工作页面"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS "idx_工作页面_路径" ON "工作页面" ("路径");
CREATE INDEX IF NOT EXISTS "idx_工作页面_状态" ON "工作页面" ("状态");
CREATE INDEX IF NOT EXISTS "idx_工作页面_排序" ON "工作页面" ("排序");

-- 5. 插入默认工作页面数据
INSERT INTO "工作页面" ("路径", "页面名称", "描述", "图标", "排序", "状态") VALUES
('/ball-mill-workshop', '球磨车间', '球磨机操作和监控工作台', 'Settings', 1, '启用'),
('/boss', '总指挥工作台', '总指挥管理和决策支持系统', 'Crown', 2, '启用'),
('/filter-press-workshop', '压滤车间', '压滤机操作和数据管理工作台', 'Filter', 3, '启用'),
('/manager', '管理员工作台', '部门管理和流程监控系统', 'UserCheck', 4, '启用'),
('/purchase-management', '采购管理', '采购申请和订单管理系统', 'ShoppingCart', 5, '启用'),
('/purchase-request', '采购申请', '采购需求申请和审批流程', 'FileText', 6, '启用'),
('/machine-operation-record', '机器运行记录', '机器设备运行状态记录和管理', 'Settings', 7, '启用')
ON CONFLICT ("路径") DO UPDATE SET
    "页面名称" = EXCLUDED."页面名称",
    "描述" = EXCLUDED."描述",
    "图标" = EXCLUDED."图标",
    "排序" = EXCLUDED."排序",
    "状态" = EXCLUDED."状态",
    "更新时间" = NOW();

-- 6. 设置行级安全策略（RLS）
ALTER TABLE "工作页面" ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取工作页面信息
CREATE POLICY "Allow read access for all users" ON "工作页面"
    FOR SELECT USING (true);

-- 允许认证用户更新工作页面信息
CREATE POLICY "Allow authenticated users to update work pages" ON "工作页面"
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 允许认证用户插入新工作页面
CREATE POLICY "Allow authenticated users to insert work pages" ON "工作页面"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允许认证用户删除工作页面
CREATE POLICY "Allow authenticated users to delete work pages" ON "工作页面"
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. 创建视图用于安全查询
CREATE OR REPLACE VIEW "工作页面视图" AS
SELECT 
    id,
    "路径",
    "页面名称",
    "描述",
    "图标",
    "排序",
    "状态",
    "创建时间",
    "更新时间"
FROM "工作页面"
WHERE "状态" = '启用'
ORDER BY "排序" ASC;

-- 8. 授权访问视图
GRANT SELECT ON "工作页面视图" TO anon, authenticated;
GRANT ALL ON "工作页面" TO authenticated;

-- 9. 创建工作页面统计视图
CREATE OR REPLACE VIEW "工作页面统计" AS
SELECT 
    COUNT(*) as "总数",
    COUNT(CASE WHEN "状态" = '启用' THEN 1 END) as "启用数量",
    COUNT(CASE WHEN "状态" = '禁用' THEN 1 END) as "禁用数量",
    MAX("更新时间") as "最后更新时间"
FROM "工作页面";

-- 授权访问统计视图
GRANT SELECT ON "工作页面统计" TO anon, authenticated;

-- 10. 创建工作页面路径验证函数
CREATE OR REPLACE FUNCTION validate_work_page_path(path_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- 检查路径格式：必须以 / 开头，只包含字母、数字、连字符和斜杠
    IF path_input !~ '^/[a-zA-Z0-9\-/]+$' THEN
        RETURN FALSE;
    END IF;
    
    -- 检查路径长度
    IF LENGTH(path_input) < 2 OR LENGTH(path_input) > 255 THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 11. 添加路径验证约束
ALTER TABLE "工作页面" 
ADD CONSTRAINT "check_valid_path" 
CHECK (validate_work_page_path("路径"));

-- 完成初始化
SELECT 
    '工作页面数据表初始化完成' as "状态",
    COUNT(*) as "页面数量",
    COUNT(CASE WHEN "状态" = '启用' THEN 1 END) as "启用页面",
    COUNT(CASE WHEN "状态" = '禁用' THEN 1 END) as "禁用页面"
FROM "工作页面";
