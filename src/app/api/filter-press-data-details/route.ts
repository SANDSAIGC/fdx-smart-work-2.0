import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    console.log('压滤数据详情API调用:', { startDate, endDate });

    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: '开始日期和结束日期不能为空'
      }, { status: 400 });
    }

    // 构建查询URL
    const tableName = '压滤样化验记录';
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;

    // 添加日期范围筛选 - 使用开始时间字段
    queryUrl += `&开始时间=gte.${startDate}&开始时间=lte.${endDate}T23:59:59.999Z`;

    // 添加排序
    queryUrl += `&order=开始时间.desc`;

    console.log('查询URL:', queryUrl);

    // 发送请求
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API错误:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `数据查询失败: ${response.status} ${response.statusText}`
      }, { status: 500 });
    }

    const filterPressData = await response.json();
    console.log(`压滤数据查询成功: ${filterPressData?.length || 0} 条记录`);

    return NextResponse.json({
      success: true,
      data: filterPressData || [],
      message: `成功获取 ${filterPressData?.length || 0} 条压滤数据记录`
    });

  } catch (error) {
    console.error('压滤数据详情API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误')
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: '请使用 POST 方法调用此 API'
  }, { status: 405 });
}
