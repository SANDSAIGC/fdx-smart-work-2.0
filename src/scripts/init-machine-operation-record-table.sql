-- 机器运行记录表初始化脚本
-- 用于FDX SMART WORK 2.0项目

-- 1. 创建机器运行记录表
CREATE TABLE IF NOT EXISTS "机器运行记录" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "日期" DATE NOT NULL,
    "时间" TIME NOT NULL,
    "设备状态" TEXT NOT NULL CHECK ("设备状态" IN ('正常运行', '设备维护')),
    "情况说明" TEXT, -- 情况说明字段
    "持续时长" TEXT, -- 恢复持续时长字段，格式如 "2小时30分钟"
    "操作员" TEXT NOT NULL, -- 重命名：操作人员 → 操作员
    "创建时间" TIMESTAMPTZ DEFAULT NOW(),
    "更新时间" TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_machine_operation_record_date ON "机器运行记录"("日期");
CREATE INDEX IF NOT EXISTS idx_machine_operation_record_status ON "机器运行记录"("设备状态");
CREATE INDEX IF NOT EXISTS idx_machine_operation_record_operator ON "机器运行记录"("操作人员");
CREATE INDEX IF NOT EXISTS idx_machine_operation_record_created_at ON "机器运行记录"("创建时间");

-- 3. 创建复合索引用于排序查询
CREATE INDEX IF NOT EXISTS idx_machine_operation_record_date_time ON "机器运行记录"("日期" DESC, "时间" DESC);

-- 4. 添加表注释
COMMENT ON TABLE "机器运行记录" IS 'FDX SMART WORK 2.0 机器运行记录表';
COMMENT ON COLUMN "机器运行记录".id IS '记录唯一标识符';
COMMENT ON COLUMN "机器运行记录"."日期" IS '记录日期';
COMMENT ON COLUMN "机器运行记录"."时间" IS '记录时间';
COMMENT ON COLUMN "机器运行记录"."设备状态" IS '设备状态：正常运行或设备维护';
COMMENT ON COLUMN "机器运行记录"."情况说明" IS '设备运行情况或维护详情说明';
COMMENT ON COLUMN "机器运行记录"."持续时长" IS '当前状态持续时长，如"2小时30分钟"';
COMMENT ON COLUMN "机器运行记录"."操作员" IS '操作员姓名';
COMMENT ON COLUMN "机器运行记录"."创建时间" IS '记录创建时间';
COMMENT ON COLUMN "机器运行记录"."更新时间" IS '记录最后更新时间';

-- 5. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_machine_operation_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."更新时间" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_machine_operation_record_updated_at
    BEFORE UPDATE ON "机器运行记录"
    FOR EACH ROW
    EXECUTE FUNCTION update_machine_operation_record_updated_at();

-- 6. 设置行级安全策略（RLS）
ALTER TABLE "机器运行记录" ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取机器运行记录
CREATE POLICY "Allow read access for all users" ON "机器运行记录"
    FOR SELECT USING (true);

-- 允许所有用户插入机器运行记录
CREATE POLICY "Allow insert for all users" ON "机器运行记录"
    FOR INSERT WITH CHECK (true);

-- 允许所有用户更新机器运行记录
CREATE POLICY "Allow update for all users" ON "机器运行记录"
    FOR UPDATE USING (true);

-- 允许所有用户删除机器运行记录
CREATE POLICY "Allow delete for all users" ON "机器运行记录"
    FOR DELETE USING (true);

-- 7. 插入示例数据（可选）
INSERT INTO "机器运行记录" ("日期", "时间", "设备状态", "情况说明", "持续时长", "操作员") VALUES
('2025-07-02', '08:00', '正常运行', '设备运行平稳，各项指标正常', '4小时', '张三'),
('2025-07-02', '12:00', '正常运行', '生产效率良好，无异常情况', '4小时', '李四'),
('2025-07-02', '16:00', '设备维护', '定期保养维护，更换滤芯', '2小时', '王五'),
('2025-07-01', '08:00', '正常运行', '设备启动正常，温度稳定', '6小时', '张三'),
('2025-07-01', '14:00', '正常运行', '运行状态良好，产量达标', '4小时', '赵六'),
('2025-06-30', '09:00', '正常运行', '设备运行稳定', '6小时', '楚留香'),
('2025-06-30', '15:00', '设备维护', '例行检修，清洁设备', '3小时', '陆小凤')
ON CONFLICT DO NOTHING;

-- 8. 授权访问
GRANT SELECT, INSERT, UPDATE, DELETE ON "机器运行记录" TO anon, authenticated;
GRANT USAGE ON SEQUENCE "机器运行记录_id_seq" TO anon, authenticated;

-- 9. 创建视图用于查询统计信息
CREATE OR REPLACE VIEW "机器运行记录统计" AS
SELECT 
    "日期",
    COUNT(*) as "总记录数",
    COUNT(CASE WHEN "设备状态" = '正常运行' THEN 1 END) as "正常运行次数",
    COUNT(CASE WHEN "设备状态" = '设备维护' THEN 1 END) as "设备维护次数",
    ROUND(
        COUNT(CASE WHEN "设备状态" = '正常运行' THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as "正常运行率(%)"
FROM "机器运行记录"
GROUP BY "日期"
ORDER BY "日期" DESC;

-- 授权访问统计视图
GRANT SELECT ON "机器运行记录统计" TO anon, authenticated;

-- 10. 创建最近记录视图
CREATE OR REPLACE VIEW "最近机器运行记录" AS
SELECT *
FROM "机器运行记录"
ORDER BY "日期" DESC, "时间" DESC
LIMIT 50;

-- 授权访问最近记录视图
GRANT SELECT ON "最近机器运行记录" TO anon, authenticated;

-- 完成初始化
SELECT '机器运行记录表初始化完成' AS status;
