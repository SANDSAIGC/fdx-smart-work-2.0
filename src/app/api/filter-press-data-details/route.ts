import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, dataType } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    console.log('压滤数据详情API调用:', { startDate, endDate, dataType });

    if (!startDate || !endDate) {
      return NextResponse.json({
        success: false,
        error: '开始日期和结束日期不能为空'
      }, { status: 400 });
    }

    // 根据数据类型选择不同的表和字段
    let tableName: string;
    let dateField: string;
    let queryUrl: string;

    if (dataType === 'summary') {
      // 查询压滤记录汇总表
      tableName = '压滤记录汇总';
      dateField = '日期';
      queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
      queryUrl += `&${dateField}=gte.${startDate}&${dateField}=lte.${endDate}`;
      queryUrl += `&order=${dateField}.desc`;
    } else {
      // 查询压滤样化验记录表（默认）
      tableName = '压滤样化验记录';
      dateField = '开始时间';
      queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
      queryUrl += `&${dateField}=gte.${startDate}&${dateField}=lte.${endDate}T23:59:59.999Z`;
      queryUrl += `&order=${dateField}.desc`;
    }

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
      dataType: dataType || 'samples',
      tableName,
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
