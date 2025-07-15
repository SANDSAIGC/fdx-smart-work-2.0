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

    console.log(`🔄 [产品数据API] 请求参数:`, { cycle });

    if (!cycle) {
      console.error('❌ [产品数据API] 缺少生产周期参数');
      return NextResponse.json(
        { success: false, message: '生产周期是必需的' },
        { status: 400 }
      );
    }

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ [产品数据API] 数据库配置错误');
      return NextResponse.json(
        { success: false, message: 'Environment variables not configured' },
        { status: 500 }
      );
    }

    // 定义重试函数
    const fetchWithRetry = async (url: string, description: string, retries = 2): Promise<any> => {
      for (let i = 0; i <= retries; i++) {
        try {
          console.log(`🔍 [产品数据API] ${description} - 第${i + 1}次尝试:`, url);

          const response = await fetch(url, {
            method: 'GET',
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
          console.log(`✅ [产品数据API] ${description} 查询成功:`, { recordCount: data.length });
          return data;
        } catch (error) {
          console.error(`❌ [产品数据API] ${description} - 第${i + 1}次尝试失败:`, error);

          if (i === retries) {
            // 最后一次重试失败，返回空数组而不是抛出错误
            console.log(`⚠️ [产品数据API] ${description} - 所有重试失败，返回空数据`);
            return [];
          }

          // 等待1秒后重试
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      return [];
    };

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

    // 并行查询富鼎翔和金鼎锌业数据（带重试机制）
    const [fdxData, jdxyData] = await Promise.all([
      fetchWithRetry(fdxQueryUrl, '产品累计-FDX数据'),
      fetchWithRetry(jdxyQueryUrl, '产品累计-JDXY数据')
    ]);

    // 处理数据聚合
    let processedFdxData = null;
    let processedJdxyData = null;

    console.log(`📊 [产品数据API] 原始数据统计:`, {
      fdxRecords: fdxData.length,
      jdxyRecords: jdxyData.length,
      cycle
    });

    if (cycle === '全部周期') {
      // 全部周期时进行聚合计算
      processedFdxData = aggregateProductData(fdxData);
      processedJdxyData = aggregateProductData(jdxyData);
      console.log(`🔄 [产品数据API] 聚合计算完成:`, {
        fdxAggregated: !!processedFdxData,
        jdxyAggregated: !!processedJdxyData
      });
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
        console.log(`✅ [产品数据API] FDX数据处理完成:`, processedFdxData);
      } else {
        console.log(`⚠️ [产品数据API] FDX数据为空`);
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
        console.log(`✅ [产品数据API] JDXY数据处理完成:`, processedJdxyData);
      } else {
        console.log(`⚠️ [产品数据API] JDXY数据为空`);
      }
    }

    const result = {
      fdx: processedFdxData,
      jdxy: processedJdxyData
    };

    console.log(`✅ [产品数据API] 数据汇总完成:`, {
      cycle,
      hasFdxData: !!processedFdxData,
      hasJdxyData: !!processedJdxyData
    });

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('❌ [产品数据API] 获取产品数据失败:', error);

    // 即使出错也返回空数据结构，避免前端崩溃
    return NextResponse.json({
      success: true,
      data: {
        fdx: null,
        jdxy: null
      }
    });
  }
}
