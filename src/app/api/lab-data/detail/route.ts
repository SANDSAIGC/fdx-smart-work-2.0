import { NextRequest, NextResponse } from 'next/server';

// 数据表映射
const TABLE_MAPPING = {
  'shift_samples': '生产班报-FDX',
  'filter_samples': '压滤样化验记录',
  'incoming_samples': '进厂原矿-FDX',
  'outgoing_sample': '出厂精矿-FDX'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleType = searchParams.get('sampleType');
    const id = searchParams.get('id');

    console.log('Lab数据详情请求:', { sampleType, id });

    if (!sampleType || !id) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const tableName = TABLE_MAPPING[sampleType as keyof typeof TABLE_MAPPING];
    if (!tableName) {
      return NextResponse.json(
        { success: false, error: '无效的数据源类型' },
        { status: 400 }
      );
    }

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('Supabase 配置缺失');
      return NextResponse.json(
        { success: false, error: 'Supabase 配置缺失' },
        { status: 500 }
      );
    }

    // 获取特定记录的完整数据
    const url = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?id=eq.${encodeURIComponent(id)}`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Supabase 查询错误:', {
        status: response.status,
        statusText: response.statusText
      });
      return NextResponse.json(
        { success: false, error: `数据库查询失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ 获取详细数据成功:', data);

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, error: '未找到对应记录' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0], // 返回第一条记录（应该只有一条）
      message: '获取详细数据成功'
    });

  } catch (error) {
    console.error('Lab数据详情查询错误:', {
      message: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : error
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
