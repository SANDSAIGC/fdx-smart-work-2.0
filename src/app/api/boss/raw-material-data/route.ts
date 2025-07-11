import { NextRequest, NextResponse } from 'next/server';

// 智能字段映射函数
function smartFieldMapping(data: any, targetFields: string[]) {
  const mappedFields: { [key: string]: string } = {};

  if (!data || typeof data !== 'object') return mappedFields;

  const dataFields = Object.keys(data);

  // 预定义的字段映射规则
  const fieldMappingRules: { [key: string]: string[] } = {
    '期初库存': ['期初库存', '月初库存', '年初库存', '初始库存', '起始库存'],
    '周期倒入量': ['周期倒入量', '本月倒入量', '本年倒入量', '倒入量', '入库量'],
    '周期消耗量': ['周期消耗量', '本月消耗量', '本年消耗量', '消耗量', '出库量'],
    '期末有效库存': ['期末有效库存', '有效库存', '可用库存'],
    '矿仓底部库存': ['矿仓底部库存', '底部库存', '仓底库存'],
    '期末总库存': ['期末总库存', '总库存', '库存总量']
  };

  targetFields.forEach(targetField => {
    // 直接匹配
    if (dataFields.includes(targetField)) {
      mappedFields[targetField] = targetField;
      return;
    }

    // 使用预定义规则匹配
    const possibleFields = fieldMappingRules[targetField] || [targetField];
    for (const possibleField of possibleFields) {
      if (dataFields.includes(possibleField)) {
        mappedFields[targetField] = possibleField;
        return;
      }
    }

    // 模糊匹配（作为后备方案）
    const fuzzyMatch = dataFields.find(field => {
      const normalizedField = field.replace(/[()（）]/g, '').toLowerCase();
      const normalizedTarget = targetField.replace(/[()（）]/g, '').toLowerCase();

      // 包含匹配
      if (normalizedField.includes(normalizedTarget) || normalizedTarget.includes(normalizedField)) {
        return true;
      }

      // 关键词匹配
      const fieldKeywords = normalizedField.split(/[_\-\s]/);
      const targetKeywords = normalizedTarget.split(/[_\-\s]/);

      return targetKeywords.some(keyword =>
        fieldKeywords.some(fieldKeyword =>
          fieldKeyword.includes(keyword) || keyword.includes(fieldKeyword)
        )
      );
    });

    if (fuzzyMatch) {
      mappedFields[targetField] = fuzzyMatch;
    }
  });

  return mappedFields;
}

// 聚合计算函数 - 按照业务规则进行正确的聚合
function aggregateData(dataArray: any[], fieldMapping: { [key: string]: string }) {
  if (!dataArray || dataArray.length === 0) return {};

  // 按期初日期排序，确保能正确获取最早和最晚的记录
  const sortedData = dataArray.sort((a, b) => {
    const dateA = new Date(a.期初日期 || a.created_at || 0);
    const dateB = new Date(b.期初日期 || b.created_at || 0);
    return dateA.getTime() - dateB.getTime();
  });

  const earliestRecord = sortedData[0]; // 最早一期
  const latestRecord = sortedData[sortedData.length - 1]; // 最晚一期

  const result: any = {};

  Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
    if (targetField === '期初库存') {
      // 期初库存 = 最早一期的月初库存字段值
      const value = earliestRecord[sourceField];
      result[targetField] = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
    } else if (targetField === '周期倒入量' || targetField === '周期消耗量') {
      // 周期倒入量、周期消耗量：累加所有记录的值（聚合计算）
      const values = sortedData
        .map(item => {
          const value = item[sourceField];
          return value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
        })
        .filter(value => !isNaN(value));

      result[targetField] = values.reduce((sum, value) => sum + value, 0);
    } else if (targetField === '期末有效库存' || targetField === '矿仓底部库存' || targetField === '期末总库存') {
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

    // 构建查询URL - 支持"全部周期"
    let fdxQueryUrl: string;
    let jdxyQueryUrl: string;

    if (cycle === '全部周期') {
      fdxQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-FDX')}?select=*`;
      jdxyQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-JDXY')}?select=*`;
    } else {
      fdxQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-FDX')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
      jdxyQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
    }

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
        signal: AbortSignal.timeout(60000) // 增加到60秒超时
      }),
      // 查询原料累计-JDXY表
      fetch(jdxyQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 增加到30秒超时
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

    // 定义核心字段
    const coreFields = [
      '期初库存', '周期倒入量', '周期消耗量',
      '期末有效库存', '矿仓底部库存', '期末总库存'
    ];

    let processedFdxData = null;
    let processedJdxyData = null;

    if (fdxData && fdxData.length > 0) {
      const sampleData = fdxData[0];
      const fieldMapping = smartFieldMapping(sampleData, coreFields);

      if (cycle === '全部周期') {
        // 全部周期：聚合所有数据
        processedFdxData = aggregateData(fdxData, fieldMapping);
      } else {
        // 单个周期：使用第一条记录并进行字段映射
        const remappedData: any = {};
        Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
          const value = sampleData[sourceField];
          remappedData[targetField] = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
        });
        processedFdxData = remappedData;
      }
    }

    if (jdxyData && jdxyData.length > 0) {
      const sampleData = jdxyData[0];
      const fieldMapping = smartFieldMapping(sampleData, coreFields);

      if (cycle === '全部周期') {
        // 全部周期：聚合所有数据
        processedJdxyData = aggregateData(jdxyData, fieldMapping);
      } else {
        // 单个周期：使用第一条记录并进行字段映射
        const remappedData: any = {};
        Object.entries(fieldMapping).forEach(([targetField, sourceField]) => {
          const value = sampleData[sourceField];
          remappedData[targetField] = value !== null && value !== undefined ? parseFloat(value) || 0 : 0;
        });
        processedJdxyData = remappedData;
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
    console.error('获取原料累计数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
