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

    // 构建查询URL
    const fdxQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-FDX')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
    const jdxyQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;

    // 并行查询富鼎翔和金鼎锌业数据
    const [fdxResponse, jdxyResponse] = await Promise.all([
      // 查询原料累计-FDX表
      fetch(fdxQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      }),
      // 查询原料累计-JDXY表
      fetch(jdxyQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })
    ]);

    if (!fdxResponse.ok || !jdxyResponse.ok) {
      console.error('查询原料累计数据失败:', {
        fdx: { status: fdxResponse.status, statusText: fdxResponse.statusText },
        jdxy: { status: jdxyResponse.status, statusText: jdxyResponse.statusText }
      });
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const fdxData = await fdxResponse.json();
    const jdxyData = await jdxyResponse.json();

    // 检查是否有数据 - 允许部分数据存在
    if ((!fdxData || fdxData.length === 0) && (!jdxyData || jdxyData.length === 0)) {
      return NextResponse.json({
        success: false,
        message: `周期 ${cycle} 暂无原料累计数据`
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        fdx: fdxData && fdxData.length > 0 ? fdxData[0] : null,
        jdxy: jdxyData && jdxyData.length > 0 ? jdxyData[0] : null
      }
    });

  } catch (error) {
    console.error('获取原料累计数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
