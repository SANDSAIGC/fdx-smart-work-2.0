import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📸 [压滤车间照片API] 收到上传请求');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const shift = formData.get('shift') as string;
    const userName = formData.get('userName') as string;

    if (!file) {
      return NextResponse.json({
        success: false,
        error: '未找到文件'
      }, { status: 400 });
    }

    console.log('📸 [压滤车间照片API] 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type,
      date,
      time,
      shift,
      userName
    });

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        success: false,
        error: '只支持图片文件'
      }, { status: 400 });
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        error: '文件大小不能超过10MB'
      }, { status: 400 });
    }

    // 生成文件名
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timeFormatted = time.replace(':', '-');
    const fileName = `${date}/${shift}/${date}_${timeFormatted}_${shift}_压滤操作.${fileExt}`;
    console.log('📸 [压滤车间照片API] 生成文件名:', fileName);

    // 由于Storage服务问题，使用Base64方式存储图片
    // 将文件转换为Base64 Data URL，直接存储在数据库中
    const fileBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(fileBuffer).toString('base64');
    const dataUrl = `data:${file.type};base64,${base64String}`;

    console.log('✅ [压滤车间照片API] 图片转换为Base64成功，大小:', base64String.length);

    return NextResponse.json({
      success: true,
      message: '图片上传成功',
      data: {
        fileName,
        publicUrl: dataUrl,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('❌ [压滤车间照片API] 上传失败:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
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
