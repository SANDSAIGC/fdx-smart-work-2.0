import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = searchParams.get('limit') || '50';
    const offset = searchParams.get('offset') || '0';

    // 构建查询条件
    let queryConditions = '状态=eq.active';
    
    if (category !== 'all') {
      queryConditions += `&分类ID=eq.${encodeURIComponent(category)}`;
    }

    if (search) {
      queryConditions += `&文件名=ilike.*${encodeURIComponent(search)}*`;
    }

    // 构建排序条件
    let orderBy = '';
    switch (sortBy) {
      case 'name':
        orderBy = `文件名.${sortOrder}`;
        break;
      case 'date':
        orderBy = `更新时间.${sortOrder}`;
        break;
      case 'size':
        orderBy = `文件大小.${sortOrder}`;
        break;
      default:
        orderBy = `文件名.${sortOrder}`;
    }

    // 构建查询URL
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件管理')}?select=*&${queryConditions}&order=${orderBy}&limit=${limit}&offset=${offset}`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('查询文件列表失败:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const files = await response.json();

    // 转换数据格式以匹配前端需求
    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      name: file.原始文件名 || file.文件名,
      type: file.文件类型,
      size: file.文件大小,
      mimeType: file.MIME类型,
      createdAt: file.创建时间,
      updatedAt: file.更新时间,
      category: file.分类ID,
      tags: file.标签 || [],
      description: file.描述,
      url: file.存储URL,
      downloadCount: file.下载次数 || 0,
      lastAccessTime: file.最后访问时间
    }));

    return NextResponse.json({
      success: true,
      data: formattedFiles,
      total: formattedFiles.length,
      category,
      search,
      sortBy,
      sortOrder
    });

  } catch (error) {
    console.error('文件列表API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 删除文件
export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    const { fileId } = await request.json();

    if (!fileId) {
      return NextResponse.json(
        { success: false, message: '文件ID是必需的' },
        { status: 400 }
      );
    }

    // 软删除：更新状态为deleted
    const updateUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件管理')}?id=eq.${fileId}`;
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 状态: 'deleted' }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('删除文件失败:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, message: '删除失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '文件删除成功'
    });

  } catch (error) {
    console.error('删除文件API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
