import { NextRequest, NextResponse } from 'next/server';

// 产品累计数据字段映射配置
const PRODUCT_FIELD_MAPPING = {
  '期初库存': '月初库存',
  '周期产量': '本月产量',
  '周期出厂量': '本月出厂量',
  '期末有效库存': '期末有效库存',
  '期末总库存': '期末总库存'
};

// 聚合产品累计数据的函数
function aggregateProductData(records: any[]): any {
  if (!records || records.length === 0) {
    return null;
  }

  // 按日期排序，确保能正确获取最早和最晚的记录
  const sortedRecords = records.sort((a, b) => {
    const dateA = new Date(a.期初日期 || a.生产周期);
    const dateB = new Date(b.期初日期 || b.生产周期);
    return dateA.getTime() - dateB.getTime();
  });

  const earliestRecord = sortedRecords[0];
  const latestRecord = sortedRecords[sortedRecords.length - 1];

  const result: any = {};

  // 处理每个目标字段
  Object.entries(PRODUCT_FIELD_MAPPING).forEach(([targetField, sourceField]) => {
    if (targetField === '期初库存') {
      // 期初库存 = 最早一期的月初库存
      const value = earliestRecord[sourceField];
      result[targetField] = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
    } else if (targetField === '周期产量' || targetField === '周期出厂量') {
      // 周期产量/出厂量 = 所有期的本月产量/出厂量累加
      const values = sortedRecords
        .map(record => parseFloat(record[sourceField]) || 0)
        .filter(value => !isNaN(value));

      result[targetField] = values.reduce((sum, value) => sum + value, 0);
    } else if (targetField === '期末有效库存' || targetField === '期末总库存') {
      // 期末相关值 = 最晚一期的对应字段值
      const value = latestRecord[sourceField];
      result[targetField] = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
    } else {
      // 其他字段也使用最晚一期的值
      const value = latestRecord[sourceField];
      result[targetField] = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
    }
  });

  return result;
}

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
    let fdxQueryUrl, jdxyQueryUrl;

    if (cycle === '全部周期') {
      // 全部周期：查询所有数据，按日期排序
      fdxQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-FDX')}?select=*&order=期初日期.asc`;
      jdxyQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-JDXY')}?select=*&order=期初日期.asc`;
    } else {
      // 特定周期：按生产周期筛选
      fdxQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-FDX')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
      jdxyQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
    }

    // 并行查询富鼎翔和金鼎锌业数据
    const [fdxResponse, jdxyResponse] = await Promise.all([
      // 查询产品累计-FDX表
      fetch(fdxQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30秒超时
      }),
      // 查询产品累计-JDXY表
      fetch(jdxyQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30秒超时
      })
    ]);

    if (!fdxResponse.ok || !jdxyResponse.ok) {
      console.error('查询产品累计数据失败:', fdxResponse.status, jdxyResponse.status);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const fdxData = await fdxResponse.json();
    const jdxyData = await jdxyResponse.json();

    // 处理数据聚合
    let processedFdxData = null;
    let processedJdxyData = null;

    if (cycle === '全部周期') {
      // 全部周期时进行聚合计算
      processedFdxData = aggregateProductData(fdxData);
      processedJdxyData = aggregateProductData(jdxyData);
    } else {
      // 特定周期时直接使用查询结果
      if (fdxData && fdxData.length > 0) {
        const fdxRecord = fdxData[0];
        processedFdxData = {
          '期初库存': parseFloat(fdxRecord.月初库存) || 0,
          '周期产量': parseFloat(fdxRecord.本月产量) || 0,
          '周期出厂量': parseFloat(fdxRecord.本月出厂量) || 0,
          '期末有效库存': parseFloat(fdxRecord.期末有效库存) || 0,
          '期末总库存': parseFloat(fdxRecord.期末总库存) || 0
        };
      }

      if (jdxyData && jdxyData.length > 0) {
        const jdxyRecord = jdxyData[0];
        processedJdxyData = {
          '期初库存': parseFloat(jdxyRecord.月初库存) || 0,
          '周期产量': parseFloat(jdxyRecord.本月产量) || 0,
          '周期出厂量': parseFloat(jdxyRecord.本月出厂量) || 0,
          '期末有效库存': parseFloat(jdxyRecord.期末有效库存) || 0,
          '期末总库存': parseFloat(jdxyRecord.期末总库存) || 0
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        fdx: processedFdxData,
        jdxy: processedJdxyData
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
