import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, dataSource } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    console.log('浓细度监控API调用:', { startDate, endDate, dataSource });

    if (!startDate || !endDate || !dataSource) {
      return NextResponse.json({
        success: false,
        error: '开始日期、结束日期和数据源不能为空'
      }, { status: 400 });
    }

    // 数据源路由
    let tableName: string;
    switch (dataSource) {
      case 'fdx':
        tableName = '浓细度记录-FDX';
        break;
      case 'kl':
        tableName = '浓细度记录-KL';
        break;
      default:
        return NextResponse.json(
          { success: false, error: '无效的数据源' },
          { status: 400 }
        );
    }

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
    
    // 添加日期范围筛选
    queryUrl += `&日期=gte.${startDate}&日期=lte.${endDate}`;
    
    // 添加排序
    queryUrl += `&order=日期.desc,时间.desc`;

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

    const data = await response.json();
    console.log(`浓细度数据查询成功: ${data?.length || 0} 条记录`);

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `成功获取 ${data?.length || 0} 条浓细度记录`
    });

  } catch (error) {
    console.error('浓细度监控API错误:', error);
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
