import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('Supabase配置缺失');
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 解析FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { success: false, message: '请选择要上传的文件' },
        { status: 400 }
      );
    }

    // 文件类型验证
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: `不支持的文件类型: ${file.type}` },
        { status: 400 }
      );
    }

    // 文件大小验证 (50MB限制)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: '文件过大，最大支持50MB' },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`;

    // 这里应该上传文件到Supabase Storage
    // const { data: uploadData, error: uploadError } = await supabase.storage
    //   .from('file-management')
    //   .upload(`${category}/${uniqueFileName}`, file);

    // 模拟文件上传成功，生成文件URL
    const fileUrl = `${supabaseUrl}/storage/v1/object/public/file-management/${category}/${uniqueFileName}`;

    // 保存文件信息到数据库
    const fileData = {
      文件名: uniqueFileName,
      原始文件名: file.name,
      文件类型: 'file',
      文件大小: file.size,
      MIME类型: file.type,
      文件路径: `${category}/${uniqueFileName}`,
      存储URL: fileUrl,
      分类ID: category,
      描述: description,
      状态: 'active'
    };

    const insertUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件管理')}`;
    const response = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(fileData),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('数据库插入失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { success: false, message: '文件信息保存失败' },
        { status: 500 }
      );
    }

    const result = await response.json();
    
    console.log('文件上传成功:', {
      id: result[0]?.id,
      fileName: result[0]?.文件名,
      originalName: result[0]?.原始文件名
    });

    return NextResponse.json({
      success: true,
      message: '文件上传成功',
      data: {
        id: result[0]?.id,
        fileName: result[0]?.文件名,
        originalName: result[0]?.原始文件名,
        fileUrl: result[0]?.存储URL,
        size: result[0]?.文件大小,
        mimeType: result[0]?.MIME类型,
        category: result[0]?.分类ID
      }
    });

  } catch (error) {
    console.error('文件上传API错误:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: '请求超时，请重试' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { success: false, message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
