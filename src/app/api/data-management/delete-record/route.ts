import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const { table, record } = await request.json();

    if (!table || !record) {
      return NextResponse.json(
        { success: false, message: '表名和记录数据是必需的' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 获取主键
    const primaryKey = record.id || record.ID;
    if (!primaryKey) {
      return NextResponse.json(
        { success: false, message: '删除记录需要主键' },
        { status: 400 }
      );
    }

    const url = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?id=eq.${primaryKey}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('删除记录失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { success: false, message: '删除失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '记录删除成功'
    });

  } catch (error) {
    console.error('删除记录API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
