-- FDX SMART WORK 2.0 Supabase Storage 配置脚本
-- 创建头像存储桶和相关策略

-- 1. 创建 avatars 存储桶
-- 注意：这个操作需要在 Supabase 控制台中手动执行，或使用 Supabase CLI
-- 存储桶配置：
-- 名称: avatars
-- 公开访问: true (允许公开读取)
-- 文件大小限制: 5MB
-- 允许的文件类型: image/*

-- 2. 创建存储桶策略
-- 允许所有用户读取头像文件
CREATE POLICY "Allow public read access on avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

-- 允许认证用户上传头像文件
CREATE POLICY "Allow authenticated users to upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 允许用户更新自己的头像文件
CREATE POLICY "Allow users to update own avatars" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 允许用户删除自己的头像文件
CREATE POLICY "Allow users to delete own avatars" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- 3. 创建存储桶（如果不存在）
-- 这个操作通常需要超级用户权限，建议在 Supabase 控制台中手动创建
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. 创建头像管理函数
CREATE OR REPLACE FUNCTION get_avatar_upload_url(file_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_folder TEXT;
    full_path TEXT;
BEGIN
    -- 获取当前用户ID作为文件夹名
    user_folder := auth.uid()::text;
    
    -- 构建完整文件路径
    full_path := user_folder || '/' || file_name;
    
    -- 返回上传路径
    RETURN full_path;
END;
$$;

-- 5. 创建清理旧头像的函数
CREATE OR REPLACE FUNCTION cleanup_old_avatars(user_id TEXT, keep_latest INTEGER DEFAULT 3)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER := 0;
    old_file RECORD;
BEGIN
    -- 删除用户文件夹中除最新几个文件外的所有文件
    FOR old_file IN
        SELECT name
        FROM storage.objects
        WHERE bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = user_id
        ORDER BY created_at DESC
        OFFSET keep_latest
    LOOP
        DELETE FROM storage.objects
        WHERE bucket_id = 'avatars' AND name = old_file.name;
        
        deleted_count := deleted_count + 1;
    END LOOP;
    
    RETURN deleted_count;
END;
$$;

-- 6. 创建获取用户头像列表的函数
CREATE OR REPLACE FUNCTION get_user_avatars(user_id TEXT DEFAULT NULL)
RETURNS TABLE(
    name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    metadata JSONB,
    public_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id TEXT;
BEGIN
    -- 如果没有指定用户ID，使用当前认证用户ID
    target_user_id := COALESCE(user_id, auth.uid()::text);
    
    RETURN QUERY
    SELECT 
        o.name,
        o.created_at,
        o.updated_at,
        o.last_accessed_at,
        o.metadata,
        CONCAT(
            current_setting('app.settings.supabase_url', true),
            '/storage/v1/object/public/avatars/',
            o.name
        ) as public_url
    FROM storage.objects o
    WHERE o.bucket_id = 'avatars'
    AND (storage.foldername(o.name))[1] = target_user_id
    ORDER BY o.created_at DESC;
END;
$$;

-- 7. 授权函数访问权限
GRANT EXECUTE ON FUNCTION get_avatar_upload_url(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_avatars(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_avatars(TEXT) TO authenticated;

-- 8. 创建触发器自动清理旧头像
CREATE OR REPLACE FUNCTION auto_cleanup_avatars()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    user_folder TEXT;
BEGIN
    -- 获取用户文件夹
    user_folder := (storage.foldername(NEW.name))[1];
    
    -- 异步清理旧文件（保留最新5个）
    PERFORM cleanup_old_avatars(user_folder, 5);
    
    RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS trigger_auto_cleanup_avatars ON storage.objects;
CREATE TRIGGER trigger_auto_cleanup_avatars
    AFTER INSERT ON storage.objects
    FOR EACH ROW
    WHEN (NEW.bucket_id = 'avatars')
    EXECUTE FUNCTION auto_cleanup_avatars();

-- 完成配置
SELECT 'Supabase Storage avatars 存储桶配置完成' AS status;
