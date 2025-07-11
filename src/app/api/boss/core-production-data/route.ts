import { NextRequest, NextResponse } from 'next/server';

// 核心生产指标数据聚合函数
function aggregateCoreProductionData(
  rawMaterialData: any[],
  productData: any[],
  productionReportData: any[]
): any {
  // 1. 原矿干重处理量 = 原料累计-JDXY表.本月消耗量字段值
  const totalProcessing = rawMaterialData.reduce((sum, record) => {
    return sum + (parseFloat(record.本月消耗量) || 0);
  }, 0);

  // 3. Zn精矿平均品位 = 生产班报-JDXY表中"氧化锌精矿-Zn品位（%）"字段的加权平均聚合值
  let totalGradeWeight = 0;
  let totalWeight = 0;
  productionReportData.forEach(record => {
    const grade = parseFloat(record['氧化锌精矿-Zn品位（%）']) || 0;
    const weight = parseFloat(record['氧化锌精矿-重量（t）']) || 1; // 使用重量作为权重，默认为1
    totalGradeWeight += grade * weight;
    totalWeight += weight;
  });
  const avgGrade = totalWeight > 0 ? totalGradeWeight / totalWeight : 0;

  // 2. 金属产出量 = 产品累计-JDXY表.本月产量 × 同一生产周期下的Zn精矿平均品位值
  // 需要按生产周期分别计算，然后聚合求和
  const metalOutputByPeriod = new Map<string, number>();

  // 按生产周期分组计算金属产出量
  productData.forEach(productRecord => {
    const cycle = productRecord.生产周期;
    const production = parseFloat(productRecord.本月产量) || 0;

    // 找到同一生产周期的生产班报数据，计算该周期的Zn精矿平均品位
    const periodReportData = productionReportData.filter(report => report.生产周期 === cycle);

    let periodGradeWeight = 0;
    let periodWeight = 0;
    periodReportData.forEach(record => {
      const grade = parseFloat(record['氧化锌精矿-Zn品位（%）']) || 0;
      const weight = parseFloat(record['氧化锌精矿-重量（t）']) || 1;
      periodGradeWeight += grade * weight;
      periodWeight += weight;
    });

    const periodAvgGrade = periodWeight > 0 ? periodGradeWeight / periodWeight : avgGrade; // 如果该周期无数据，使用总体平均品位
    const metalOutput = production * (periodAvgGrade / 100); // 品位是百分比，需要除以100

    metalOutputByPeriod.set(cycle, (metalOutputByPeriod.get(cycle) || 0) + metalOutput);
  });

  // 聚合所有周期的金属产出量
  const totalMetalOutput = Array.from(metalOutputByPeriod.values()).reduce((sum, value) => sum + value, 0);

  // 4. 回收率 = 生产班报-JDXY表中"氧化矿Zn理论回收率（%）"字段的加权平均聚合值
  let totalRecoveryWeight = 0;
  let totalRecoveryWeightSum = 0;
  productionReportData.forEach(record => {
    const recovery = parseFloat(record['氧化矿Zn理论回收率（%）']) || 0;
    const weight = parseFloat(record['氧化锌精矿-重量（t）']) || 1; // 使用重量作为权重，默认为1
    totalRecoveryWeight += recovery * weight;
    totalRecoveryWeightSum += weight;
  });
  const avgRecovery = totalRecoveryWeightSum > 0 ? totalRecoveryWeight / totalRecoveryWeightSum : 0;

  return {
    原矿干重处理量: totalProcessing,
    Zn精矿平均品位: avgGrade,
    金属产出量: totalMetalOutput,
    回收率: avgRecovery
  };
}

// 生产计划数据聚合函数
function aggregateProductionPlanData(planData: any[]): any {
  if (!planData || planData.length === 0) {
    return {
      原矿干重处理量t: 0,
      产出精矿Zn品位: 0,
      产出精矿Zn金属量t: 0,
      回收率: 0
    };
  }

  if (planData.length === 1) {
    // 单个周期，直接返回
    const plan = planData[0];
    return {
      原矿干重处理量t: parseFloat(plan['原矿干重处理量t']) || 0,
      产出精矿Zn品位: parseFloat(plan['产出精矿Zn品位%']) || 0,
      产出精矿Zn金属量t: parseFloat(plan['产出精矿Zn金属量t']) || 0,
      回收率: parseFloat(plan['回收率%']) || 0
    };
  }

  // 多个周期，进行聚合计算
  // 累计类数据：累加求和
  const totalProcessing = planData.reduce((sum, plan) => sum + (parseFloat(plan['原矿干重处理量t']) || 0), 0);
  const totalOutput = planData.reduce((sum, plan) => sum + (parseFloat(plan['产出精矿Zn金属量t']) || 0), 0);

  // 比率类数据：加权平均（以处理量作为权重）
  let totalGradeWeight = 0;
  let totalRecoveryWeight = 0;
  let totalWeight = 0;

  planData.forEach(plan => {
    const processing = parseFloat(plan['原矿干重处理量t']) || 0;
    const grade = parseFloat(plan['产出精矿Zn品位%']) || 0;
    const recovery = parseFloat(plan['回收率%']) || 0;

    totalGradeWeight += grade * processing;
    totalRecoveryWeight += recovery * processing;
    totalWeight += processing;
  });

  const avgGrade = totalWeight > 0 ? totalGradeWeight / totalWeight : 0;
  const avgRecovery = totalWeight > 0 ? totalRecoveryWeight / totalWeight : 0;

  return {
    原矿干重处理量t: totalProcessing,
    产出精矿Zn品位: avgGrade,
    产出精矿Zn金属量t: totalOutput,
    回收率: avgRecovery
  };
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

    // 构建查询URL
    let rawMaterialQueryUrl, productQueryUrl, productionReportQueryUrl, productionPlanQueryUrl;

    if (cycle === '全部周期') {
      // 全部周期：查询所有数据，按日期排序
      rawMaterialQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-JDXY')}?select=*&order=期初日期.asc`;
      productQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-JDXY')}?select=*&order=期初日期.asc`;
      productionReportQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-JDXY')}?select=*&order=日期.asc`;
      productionPlanQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产计划-JDXY')}?select=*&order=生产周期.asc`;
    } else {
      // 特定周期：按生产周期筛选
      rawMaterialQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('原料累计-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
      productQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('产品累计-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
      productionReportQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产班报-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
      productionPlanQueryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('生产计划-JDXY')}?select=*&生产周期=eq.${encodeURIComponent(cycle)}`;
    }

    // 并行查询四个表的数据
    const [rawMaterialResponse, productResponse, productionReportResponse, productionPlanResponse] = await Promise.all([
      // 查询原料累计-JDXY表
      fetch(rawMaterialQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30秒超时
      }),
      // 查询产品累计-JDXY表
      fetch(productQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30秒超时
      }),
      // 查询生产班报-JDXY表
      fetch(productionReportQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30秒超时
      }),
      // 查询生产计划-JDXY表
      fetch(productionPlanQueryUrl, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(30000) // 30秒超时
      })
    ]);

    if (!rawMaterialResponse.ok || !productResponse.ok || !productionReportResponse.ok || !productionPlanResponse.ok) {
      console.error('查询核心生产数据失败:', rawMaterialResponse.status, productResponse.status, productionReportResponse.status, productionPlanResponse.status);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const rawMaterialData = await rawMaterialResponse.json();
    const productData = await productResponse.json();
    const productionReportData = await productionReportResponse.json();
    const productionPlanData = await productionPlanResponse.json();

    // 聚合计算核心生产指标
    const coreIndicators = aggregateCoreProductionData(
      rawMaterialData || [],
      productData || [],
      productionReportData || []
    );

    // 聚合计算生产计划标准
    const planStandards = aggregateProductionPlanData(productionPlanData || []);

    return NextResponse.json({
      success: true,
      data: {
        actual: coreIndicators,
        plan: planStandards
      }
    });

  } catch (error) {
    console.error('获取核心生产数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
