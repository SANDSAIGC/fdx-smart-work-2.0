import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cycle } = await request.json();

    if (!cycle) {
      return NextResponse.json(
        { success: false, message: '生产周期是必需的' },
        { status: 400 }
      );
    }

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Environment variables not configured' },
        { status: 500 }
      );
    }

    // 查询生产计划-JDXY表
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产计划-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      console.error('查询生产计划数据失败:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 检查是否有数据
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        message: `周期 ${cycle} 暂无生产计划数据`
      });
    }

    return NextResponse.json({
      success: true,
      data: data[0] // 返回第一条记录
    });

  } catch (error) {
    console.error('获取生产计划数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
