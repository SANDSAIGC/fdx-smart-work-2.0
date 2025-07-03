import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { tableName, startDate, endDate } = await request.json();

    if (!tableName || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: '表名、开始日期和结束日期是必需的' },
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

    // 构建查询URL - 根据表名选择日期字段
    let dateField = '日期';
    if (tableName.includes('进厂原矿')) {
      dateField = '日期';
    }

    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*&${dateField}=gte.${startDate}&${dateField}=lte.${endDate}&order=${dateField}.asc`;

    // 发送HTTP请求到Supabase，增加重试机制
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (response.ok) {
          break; // 成功，跳出重试循环
        }
      } catch (error) {
        console.log(`获取趋势数据第${retryCount + 1}次尝试失败:`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          throw error; // 达到最大重试次数，抛出错误
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!response || !response.ok) {
      console.error('获取趋势数据失败:', response?.status, response?.statusText);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const data = await response.json();

    // 字段映射：将数据表字段映射到前端期望的字段
    const mappedData = data?.map((item: any) => ({
      ...item,
      湿重: item['湿重(t)'] || item['湿重'] || 0,
      水份: item['水份(%)'] || item['水份'] || 0,
      Pb品位: item['Pb'] || item['Pb品位'] || 0,
      Zn品位: item['Zn'] || item['Zn品位'] || 0,
    })) || [];

    return NextResponse.json({
      success: true,
      data: mappedData
    });

  } catch (error) {
    console.error('获取趋势数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
