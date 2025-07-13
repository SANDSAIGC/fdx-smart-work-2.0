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

    // 智能排序生产周期
    const sortedCycles = cycles.sort((a: string, b: string) => {
      // 提取周期中的数字进行排序
      const extractNumber = (cycle: string): number => {
        const match = cycle.match(/第(\d+)期|第([一二三四五六七八九十]+)期/);
        if (match) {
          if (match[1]) {
            return parseInt(match[1], 10);
          } else if (match[2]) {
            // 中文数字转换
            const chineseNumbers: { [key: string]: number } = {
              '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
              '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
            };
            return chineseNumbers[match[2]] || 0;
          }
        }
        return 0;
      };

      const numA = extractNumber(a);
      const numB = extractNumber(b);

      // 按数字降序排列（第三期、第二期、第一期）
      return numB - numA;
    });

    // 添加"全部周期"选项在最前面
    const cyclesWithAll = ['全部周期', ...sortedCycles];

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
