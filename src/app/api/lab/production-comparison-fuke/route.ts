import { NextRequest, NextResponse } from 'next/server';

// 按照最佳实践使用REST API而非客户端直连

export async function POST(request: NextRequest) {
  try {
    // 1. 环境变量验证（按照最佳实践）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ [生产班报对比-富科API] 环境变量未配置');
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 2. 请求数据解析和验证
    const { startDate, endDate } = await request.json();
    console.log('🔄 [生产班报对比-富科API] 请求参数:', { startDate, endDate });

    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        message: '缺少必要的日期参数'
      }, { status: 400 });
    }

    // 3. 构建查询URL（使用REST API）
    const tableName = '生产班报对比-富科';
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
    queryUrl += `&日期=gte.${startDate}&日期=lte.${endDate}`;
    queryUrl += `&order=日期.asc`;

    console.log('🔍 [生产班报对比-富科API] 查询URL:', queryUrl);

    // 4. 执行查询
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ [生产班报对比-富科API] HTTP错误:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: `查询失败: ${response.statusText}`,
        error: `HTTP ${response.status}`
      }, { status: 500 });
    }

    const data = await response.json();

    console.log('✅ [生产班报对比-富科API] 查询成功:', {
      recordCount: data?.length || 0,
      dateRange: `${startDate} 至 ${endDate}`
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `成功获取 ${data?.length || 0} 条生产班报对比数据`
    });

  } catch (error) {
    console.error('❌ [生产班报对比-富科API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
