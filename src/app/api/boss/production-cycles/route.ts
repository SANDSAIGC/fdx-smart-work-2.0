import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Environment variables not configured' },
        { status: 500 }
      );
    }

    // 查询生产计划-JDXY表获取所有生产周期
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产计划-JDXY')}?select=生产周期&order=生产周期.asc`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    if (!response.ok) {
      console.error('查询生产周期失败:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 提取唯一的生产周期
    const cycles = [...new Set(data.map((item: any) => item.生产周期).filter(Boolean))];
    
    // 添加"全部周期"选项
    const cyclesWithAll = ['全部周期', ...cycles];

    return NextResponse.json({
      success: true,
      data: cyclesWithAll
    });

  } catch (error) {
    console.error('获取生产周期失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
