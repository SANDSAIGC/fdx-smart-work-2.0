import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 使用标准的JSON解析方法
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

    // 构建查询URL - 查询产品累计表
    const fdxQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-FDX')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
    const jdxyQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;

    // 并行查询两个表
    const [fdxResponse, jdxyResponse] = await Promise.all([
      fetch(fdxQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      }),
      fetch(jdxyQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })
    ]);

    if (!fdxResponse.ok || !jdxyResponse.ok) {
      console.error('查询产品数据失败:', fdxResponse.status, jdxyResponse.status);
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
        message: `周期 ${cycle} 暂无产品累计数据`
      });
    }

    // 合并两个表的数据
    const allData = [...(fdxData || []), ...(jdxyData || [])];

    // 按项目类型汇总数据
    const productSummary = allData.reduce((acc: any, item: any) => {
      const project = item.项目 || '未知项目';
      if (!acc[project]) {
        acc[project] = {
          月初库存: 0,
          本月产量: 0,
          本月出厂量: 0,
          期末总库存: 0,
          期末有效库存: 0,
          矿仓底部库存: 0,
          count: 0
        };
      }

      acc[project].月初库存 += parseFloat(item.月初库存 || 0);
      acc[project].本月产量 += parseFloat(item.本月产量 || 0);
      acc[project].本月出厂量 += parseFloat(item.本月出厂量 || 0);
      acc[project].期末总库存 += parseFloat(item.期末总库存 || 0);
      acc[project].期末有效库存 += parseFloat(item.期末有效库存 || 0);
      acc[project].矿仓底部库存 += parseFloat(item.矿仓底部库存 || 0);
      acc[project].count += 1;

      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        fdx: fdxData && fdxData.length > 0 ? fdxData : null,
        jdxy: jdxyData && jdxyData.length > 0 ? jdxyData : null,
        summary: productSummary,
        totalRecords: allData.length
      }
    });

  } catch (error) {
    console.error('获取产品数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
