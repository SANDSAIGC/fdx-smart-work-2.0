import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({
        success: false,
        error: 'File and userId are required'
      }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      }, { status: 400 });
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: 'File size too large. Maximum size is 5MB.'
      }, { status: 400 });
    }

    // 生成文件名
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // 将文件转换为 ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // 上传到 Supabase Storage
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': file.type,
        'Cache-Control': '3600',
      },
      body: fileBuffer
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Supabase Storage upload error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Failed to upload file to storage',
        details: errorText
      }, { status: uploadResponse.status });
    }

    // 获取公开 URL
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${fileName}`;

    // 更新用户资料表的 avatar_url
    const updateResponse = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('用户资料')}?id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update user avatar_url:', errorText);
      // 即使更新用户表失败，我们仍然返回上传成功的URL
      console.warn('Avatar uploaded but failed to update user record');
    }

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        publicUrl,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 处理 OPTIONS 请求（CORS 预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
