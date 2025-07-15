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

    // 获取进厂原矿-FDX数据
    const incomingUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('进厂原矿-FDX')}?select=*&计量日期=gte.${startDate}&计量日期=lte.${endDate}&order=计量日期.asc`;
    const incomingResponse = await fetch(incomingUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!incomingResponse.ok) {
      throw new Error(`获取进厂原矿-FDX数据失败: ${incomingResponse.statusText}`);
    }

    const incomingData = await incomingResponse.json();

    // 获取出厂精矿-FDX数据
    const outgoingUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('出厂精矿-FDX')}?select=*&计量日期=gte.${startDate}&计量日期=lte.${endDate}&order=计量日期.asc`;
    const outgoingResponse = await fetch(outgoingUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!outgoingResponse.ok) {
      throw new Error(`获取出厂精矿-FDX数据失败: ${outgoingResponse.statusText}`);
    }

    const outgoingData = await outgoingResponse.json();

    // 获取生产班报-FDX数据
    const productionUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-FDX')}?select=*&日期=gte.${startDate}&日期=lte.${endDate}&order=日期.asc`;
    const productionResponse = await fetch(productionUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productionResponse.ok) {
      throw new Error(`获取生产班报-FDX数据失败: ${productionResponse.statusText}`);
    }

    const productionData = await productionResponse.json();

    // 获取出厂样内部取样数据
    const internalSampleUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('出厂样内部取样')}?select=*&计量日期=gte.${startDate}&计量日期=lte.${endDate}&order=计量日期.asc`;
    const internalSampleResponse = await fetch(internalSampleUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!internalSampleResponse.ok) {
      throw new Error(`获取出厂样内部取样数据失败: ${internalSampleResponse.statusText}`);
    }

    const internalSampleData = await internalSampleResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        incoming: incomingData,
        outgoing: outgoingData,
        production: productionData,
        internalSample: internalSampleData
      }
    });

  } catch (error) {
    console.error('获取FDX数据失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '获取数据失败' },
      { status: 500 }
    );
  }
}
