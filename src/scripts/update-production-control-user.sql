-- 更新 production-control 用户重定向路由
-- 由于 production-control 页面已被移除，需要更新相关用户的重定向路由

-- 查找当前使用 production-control 重定向路由的用户
SELECT 账号, 姓名, 职称, 部门, 重定向路由 
FROM "用户资料" 
WHERE 重定向路由 = '/production-control';

-- 更新陆小凤用户的重定向路由到球磨车间
UPDATE "用户资料" 
SET 重定向路由 = '/ball-mill-workshop'
WHERE 账号 = 'con001' AND 姓名 = '陆小凤';

-- 验证更新结果
SELECT 账号, 姓名, 职称, 部门, 重定向路由 
FROM "用户资料" 
WHERE 账号 = 'con001';

-- 删除工作页面表中的 production-control 记录（如果存在）
DELETE FROM "工作页面" 
WHERE 路径 = '/production-control';

-- 验证工作页面表清理结果
SELECT 路径, 页面名称, 状态 
FROM "工作页面" 
ORDER BY 排序;
