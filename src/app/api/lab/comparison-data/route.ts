import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    console.log(`🔄 [数据对比分析API] 请求参数:`, { startDate, endDate });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ [数据对比分析API] 数据库配置错误');
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    // 定义重试函数
    const fetchWithRetry = async (url: string, description: string, retries = 2): Promise<any> => {
      for (let i = 0; i <= retries; i++) {
        try {
          console.log(`🔍 [数据对比分析API] ${description} - 第${i + 1}次尝试:`, url);

          const response = await fetch(url, {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(30000) // 30秒超时
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log(`✅ [数据对比分析API] ${description} 查询成功:`, { recordCount: data.length });
          return data;
        } catch (error) {
          console.error(`❌ [数据对比分析API] ${description} - 第${i + 1}次尝试失败:`, error);

          if (i === retries) {
            // 最后一次重试失败，返回空数组而不是抛出错误
            console.log(`⚠️ [数据对比分析API] ${description} - 所有重试失败，返回空数据`);
            return [];
          }

          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return [];
    };

    // 获取进厂原矿对比数据
    const incomingUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('进厂原矿对比')}?select=*&计量日期=gte.${startDate}&计量日期=lte.${endDate}&order=计量日期.asc`;
    const incomingData = await fetchWithRetry(incomingUrl, '进厂原矿对比数据');

    // 获取出厂精矿对比数据
    const outgoingUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('出厂精矿对比')}?select=*&计量日期=gte.${startDate}&计量日期=lte.${endDate}&order=计量日期.asc`;
    const outgoingData = await fetchWithRetry(outgoingUrl, '出厂精矿对比数据');

    // 获取生产班报对比-富金数据
    const productionUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报对比-富金')}?select=*&日期=gte.${startDate}&日期=lte.${endDate}&order=日期.asc`;
    const productionData = await fetchWithRetry(productionUrl, '生产班报对比-富金数据');

    const result = {
      incoming: incomingData,
      outgoing: outgoingData,
      production: productionData
    };

    console.log(`✅ [数据对比分析API] 数据汇总:`, {
      incoming: incomingData.length,
      outgoing: outgoingData.length,
      production: productionData.length,
      dateRange: `${startDate} 至 ${endDate}`
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ [数据对比分析API] 获取对比数据失败:', error);

    // 即使出错也返回空数据结构，避免前端崩溃
    return NextResponse.json({
      success: true,
      data: {
        incoming: [],
        outgoing: [],
        production: []
      }
    });
  }
}
