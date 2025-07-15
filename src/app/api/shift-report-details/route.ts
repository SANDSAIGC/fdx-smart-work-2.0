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

    // 根据数据源选择表名
    let tableName: string;
    switch (dataSource) {
      case 'fdx':
        tableName = '生产班报-FDX';
        break;
      case 'jdxy':
        tableName = '生产班报-JDXY';
        break;
      case 'kl':
        tableName = '生产班报-KL';
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
    if (startDate && endDate) {
      queryUrl += `&日期=gte.${startDate}&日期=lte.${endDate}`;
    }
    
    // 添加排序
    queryUrl += `&order=日期.desc,班次.asc`;

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
      return NextResponse.json(
        { success: false, error: `数据库查询失败: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`${tableName}数据查询成功:`, data.length, '条记录');

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('API错误:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
