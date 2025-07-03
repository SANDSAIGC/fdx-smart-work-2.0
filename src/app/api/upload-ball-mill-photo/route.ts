import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 [球磨车间照片API] 开始处理照片上传请求');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ [球磨车间照片API] 环境变量未配置');
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 获取表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const photoType = formData.get('photoType') as string;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const userName = formData.get('userName') as string;

    if (!file || !photoType || !date || !time || !userName) {
      console.error('❌ [球磨车间照片API] 缺少必要参数');
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: file, photoType, date, time, userName'
      }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ [球磨车间照片API] 不支持的文件类型:', file.type);
      return NextResponse.json({
        success: false,
        error: '不支持的文件类型，请上传 JPEG、PNG 或 WebP 格式的图片'
      }, { status: 400 });
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('❌ [球磨车间照片API] 文件过大:', file.size);
      return NextResponse.json({
        success: false,
        error: '文件大小不能超过 10MB'
      }, { status: 400 });
    }

    // 生成文件名
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timeFormatted = time.replace(':', '-');
    let photoTypeEn = '';
    if (photoType === '一号壶称重') photoTypeEn = 'pot1-weight';
    else if (photoType === '二号壶称重') photoTypeEn = 'pot2-weight';
    else if (photoType === '二号壶细度称重') photoTypeEn = 'pot2-fineness-weight';
    else photoTypeEn = 'unknown';

    const fileName = `${date}/${photoTypeEn}/${date}_${timeFormatted}_${photoTypeEn}.${fileExt}`;
    console.log('📸 [球磨车间照片API] 生成文件名:', fileName);

    // 由于Storage服务问题，使用Base64方式存储图片
    // 将文件转换为Base64 Data URL，直接存储在数据库中
    const fileBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64String}`;

    console.log(`✅ [球磨车间照片API] 文件转换为Base64成功，大小: ${Math.round(base64String.length / 1024)}KB`);

    // 使用Base64 Data URL作为"公开URL"，可以直接在浏览器中显示
    const publicUrl = dataUrl;

    return NextResponse.json({
      success: true,
      data: {
        fileName,
        publicUrl,
        fileSize: file.size,
        fileType: file.type,
        photoType
      },
      message: `${photoType}照片上传成功`
    });

  } catch (error) {
    console.error('❌ [球磨车间照片API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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