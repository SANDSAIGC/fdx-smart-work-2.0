import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [球磨车间照片删除API] 开始处理照片删除请求');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error('❌ [球磨车间照片删除API] 环境变量未配置');
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 获取请求数据
    const { filePath } = await request.json();

    if (!filePath) {
      console.error('❌ [球磨车间照片删除API] 缺少文件路径参数');
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: filePath'
      }, { status: 400 });
    }

    console.log(`🗑️ [球磨车间照片删除API] 删除文件:`, filePath);

    // 从 Supabase Storage 删除文件
    const deleteUrl = `${supabaseUrl}/storage/v1/object/ball-mill-photos/${filePath}`;
    
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('❌ [球磨车间照片删除API] Supabase Storage删除错误:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Failed to delete file from storage',
        details: errorText
      }, { status: deleteResponse.status });
    }

    console.log(`✅ [球磨车间照片删除API] 文件删除成功:`, filePath);

    // 可选：从数据库中删除记录
    try {
      const recordDeleteResponse = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('球磨车间照片记录')}?文件路径=eq.${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        }
      });

      if (recordDeleteResponse.ok) {
        console.log('✅ [球磨车间照片删除API] 数据库记录删除成功');
      } else {
        const recordError = await recordDeleteResponse.text();
        console.warn('⚠️ [球磨车间照片删除API] 数据库记录删除失败:', recordError);
        // 不影响主要删除流程
      }
    } catch (recordError) {
      console.warn('⚠️ [球磨车间照片删除API] 记录删除异常:', recordError);
      // 不影响主要删除流程
    }

    return NextResponse.json({
      success: true,
      message: '照片删除成功',
      data: {
        filePath
      }
    });

  } catch (error) {
    console.error('❌ [球磨车间照片删除API] 服务器错误:', error);
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
