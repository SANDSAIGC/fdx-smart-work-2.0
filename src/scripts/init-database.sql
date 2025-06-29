-- FDX SMART WORK 2.0 数据库初始化脚本
-- 创建用户表和相关配置

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    wechat VARCHAR(100),
    points INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建更新时间戳触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. 为用户表添加更新时间戳触发器
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. 创建存储桶（需要在 Supabase 控制台中手动创建）
-- 存储桶名称: avatars
-- 访问策略: 公开读取，认证用户写入

-- 5. 插入默认用户数据
INSERT INTO users (id, username, name, position, department, phone, wechat, points) VALUES
('user_001', 'zhangsan', '张三', '高级化验员', '化验室', '138-8888-8888', 'zhangsan_fdx', 1250),
('user_002', 'lisi', '李四', '生产主管', '生产部', '139-9999-9999', 'lisi_fdx', 980),
('user_003', 'wangwu', '王五', '设备工程师', '设备部', '137-7777-7777', 'wangwu_fdx', 1450),
('user_004', 'zhaoliu', '赵六', '质量检验员', '质检部', '136-6666-6666', 'zhaoliu_fdx', 750),
('user_005', 'sunqi', '孙七', '安全员', '安全部', '135-5555-5555', 'sunqi_fdx', 1100)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    name = EXCLUDED.name,
    position = EXCLUDED.position,
    department = EXCLUDED.department,
    phone = EXCLUDED.phone,
    wechat = EXCLUDED.wechat,
    points = EXCLUDED.points,
    updated_at = NOW();

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_position ON users(position);

-- 7. 添加注释
COMMENT ON TABLE users IS 'FDX SMART WORK 2.0 用户信息表';
COMMENT ON COLUMN users.id IS '用户唯一标识符';
COMMENT ON COLUMN users.username IS '用户名（登录用）';
COMMENT ON COLUMN users.name IS '真实姓名';
COMMENT ON COLUMN users.position IS '职位';
COMMENT ON COLUMN users.department IS '部门';
COMMENT ON COLUMN users.phone IS '联系电话';
COMMENT ON COLUMN users.wechat IS '微信号';
COMMENT ON COLUMN users.points IS '积分';
COMMENT ON COLUMN users.avatar_url IS '头像URL';
COMMENT ON COLUMN users.created_at IS '创建时间';
COMMENT ON COLUMN users.updated_at IS '更新时间';

-- 8. 设置行级安全策略（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 允许所有用户读取用户信息
CREATE POLICY "Allow read access for all users" ON users
    FOR SELECT USING (true);

-- 允许用户更新自己的信息
CREATE POLICY "Allow users to update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- 允许插入新用户（注册功能）
CREATE POLICY "Allow insert for new users" ON users
    FOR INSERT WITH CHECK (true);

-- 9. 创建视图用于安全查询
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    username,
    name,
    position,
    department,
    phone,
    wechat,
    points,
    avatar_url,
    created_at,
    updated_at
FROM users;

-- 10. 授权访问视图
GRANT SELECT ON user_profiles TO anon, authenticated;
GRANT ALL ON users TO authenticated;

-- 完成初始化
SELECT 'FDX SMART WORK 2.0 数据库初始化完成' AS status;
