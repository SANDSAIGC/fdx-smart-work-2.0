import { NextRequest, NextResponse } from 'next/server';

// 数据表映射配置
const TABLE_MAPPING = {
  'shift_samples': '生产班报-FDX',      // 班样 -> 生产班报-FDX
  'filter_samples': '压滤样化验记录',    // 压滤样 -> 压滤样化验记录
  'incoming_samples': '进厂原矿-FDX',   // 进厂样 -> 进厂原矿-FDX
  'outgoing_sample': '出厂精矿-FDX'     // 出厂样 -> 出厂精矿-FDX
} as const;

// 数据转换函数
function transformShiftSampleData(data: any[]) {
  return data.flatMap(item => {
    const baseItem = {
      id: item.id.toString(),
      日期: item.日期,
      班次: item.班次,
      created_at: item.created_at,
      updated_at: item.updated_at
    };

    const results = [];

    // 添加锌元素数据
    if (item['氧化锌原矿-Zn全品位（%）'] !== null || item['氧化锌精矿-Zn品位（%）'] !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-zn`,
        元素: 'Zn',
        品位: item['氧化锌原矿-Zn全品位（%）'] || item['氧化锌精矿-Zn品位（%）'] || 0,
        水分: item['氧化锌原矿-水份（%）'] || 0,
        矿物类型: item['氧化锌原矿-Zn全品位（%）'] ? '氧化锌原矿' : '氧化锌精矿'
      });
    }

    // 添加铅元素数据
    if (item['氧化锌原矿-Pb全品位（%）'] !== null || item['氧化锌精矿-Pb品位（%）'] !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-pb`,
        元素: 'Pb',
        品位: item['氧化锌原矿-Pb全品位（%）'] || item['氧化锌精矿-Pb品位（%）'] || 0,
        水分: item['氧化锌原矿-水份（%）'] || 0,
        矿物类型: item['氧化锌原矿-Pb全品位（%）'] ? '氧化锌原矿' : '氧化锌精矿'
      });
    }

    return results.length > 0 ? results : [{
      ...baseItem,
      元素: 'Zn',
      品位: 0,
      水分: 0,
      矿物类型: '氧化锌原矿'
    }];
  });
}

function transformFilterSampleData(data: any[]) {
  return data.flatMap(item => {
    const baseItem = {
      id: item.id.toString(),
      日期: item.开始时间 ? new Date(item.开始时间).toISOString().split('T')[0] : null,
      操作员: item.操作员,
      created_at: item.created_at,
      updated_at: item.updated_at
    };

    const results = [];

    // 添加锌元素数据
    if (item.锌品位 !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-zn`,
        元素: 'Zn',
        品位: item.锌品位 || 0,
        水分: item.水份 || 0
      });
    }

    // 添加铅元素数据
    if (item.铅品位 !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-pb`,
        元素: 'Pb',
        品位: item.铅品位 || 0,
        水分: item.水份 || 0
      });
    }

    return results.length > 0 ? results : [{
      ...baseItem,
      元素: 'Zn',
      品位: 0,
      水分: 0
    }];
  });
}

function transformIncomingSampleData(data: any[]) {
  return data.flatMap(item => {
    const baseItem = {
      id: item.id.toString(),
      日期: item.计量日期,
      供应商: item.发货单位名称,
      原矿类型: item.原矿类型,
      created_at: item.created_at,
      updated_at: item.updated_at
    };

    const results = [];

    // 添加锌元素数据
    if (item.Zn !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-zn`,
        元素: 'Zn',
        品位: item.Zn || 0,
        水分: item['水份(%)'] || 0
      });
    }

    // 添加铅元素数据
    if (item.Pb !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-pb`,
        元素: 'Pb',
        品位: item.Pb || 0,
        水分: item['水份(%)'] || 0
      });
    }

    return results.length > 0 ? results : [{
      ...baseItem,
      元素: 'Zn',
      品位: 0,
      水分: 0
    }];
  });
}

function transformOutgoingSampleData(data: any[]) {
  return data.flatMap(item => {
    const baseItem = {
      id: item.id.toString(),
      出厂日期: item.计量日期,
      采购单位: item.收货单位名称,
      样品编号: item.样品编号,
      created_at: item.created_at,
      updated_at: item.updated_at
    };

    const results = [];

    // 添加锌元素数据
    if (item.Zn !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-zn`,
        元素: 'Zn',
        出厂样品位: item.Zn || 0,
        出厂样水分: item['水份(%)'] || 0
      });
    }

    // 添加铅元素数据
    if (item.Pb !== null) {
      results.push({
        ...baseItem,
        id: `${item.id}-pb`,
        元素: 'Pb',
        出厂样品位: item.Pb || 0,
        出厂样水分: item['水份(%)'] || 0
      });
    }

    return results.length > 0 ? results : [{
      ...baseItem,
      元素: 'Zn',
      出厂样品位: 0,
      出厂样水分: 0
    }];
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleType = searchParams.get('sampleType') || 'shift_samples';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    console.log('Lab API 请求参数:', {
      sampleType,
      startDate,
      endDate,
      limit
    });

    // 获取对应的数据表名
    const tableName = TABLE_MAPPING[sampleType as keyof typeof TABLE_MAPPING];
    if (!tableName) {
      return NextResponse.json({
        success: false,
        error: 'Invalid sample type',
        message: `不支持的样品类型: ${sampleType}`
      }, { status: 400 });
    }

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured',
        message: 'Supabase配置缺失'
      }, { status: 500 });
    }

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;

    // 添加日期范围筛选
    if (startDate && endDate) {
      let dateField = 'created_at';
      switch (sampleType) {
        case 'shift_samples':
          dateField = '日期';
          break;
        case 'filter_samples':
          dateField = '开始时间';
          break;
        case 'incoming_samples':
          dateField = '计量日期';
          break;
        case 'outgoing_sample':
          dateField = '计量日期';
          break;
      }
      queryUrl += `&${dateField}=gte.${startDate}&${dateField}=lte.${endDate}`;
    }

    // 添加排序和限制 - 按日期字段倒序排列
    let orderField = 'created_at';
    switch (sampleType) {
      case 'shift_samples':
        orderField = '日期';
        break;
      case 'filter_samples':
        orderField = '开始时间';
        break;
      case 'incoming_samples':
        orderField = '计量日期';
        break;
      case 'outgoing_sample':
        orderField = '计量日期';
        break;
    }

    queryUrl += `&order=${orderField}.desc&limit=${limit}`;

    // 发送HTTP请求到Supabase - 添加重试机制
    let response;
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [Lab API] 尝试第 ${attempt} 次请求: ${queryUrl}`);

        response = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          // 添加超时设置
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (response.ok) {
          console.log(`✅ [Lab API] 第 ${attempt} 次请求成功`);
          break;
        } else {
          lastError = `HTTP ${response.status}: ${response.statusText}`;
          console.warn(`⚠️ [Lab API] 第 ${attempt} 次请求失败: ${lastError}`);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ [Lab API] 第 ${attempt} 次请求异常: ${lastError}`);

        // 如果不是最后一次尝试，等待一段时间再重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // 递增延迟
        }
      }
    }

    if (!response || !response.ok) {
      console.error('🚫 [Lab API] 所有重试都失败了:', lastError);
      return NextResponse.json({
        success: false,
        error: 'Database query failed',
        message: `查询失败: ${lastError}`,
        retries: maxRetries
      }, { status: 500 });
    }

    const rawData = await response.json();
    console.log(`📊 [Lab API] 获取到原始数据: ${rawData?.length || 0} 条记录`);

    // 转换数据格式
    let transformedData: any[] = [];
    switch (sampleType) {
      case 'shift_samples':
        transformedData = transformShiftSampleData(rawData || []);
        break;
      case 'filter_samples':
        transformedData = transformFilterSampleData(rawData || []);
        break;
      case 'incoming_samples':
        transformedData = transformIncomingSampleData(rawData || []);
        break;
      case 'outgoing_sample':
        transformedData = transformOutgoingSampleData(rawData || []);
        break;
    }

    console.log(`🔄 [Lab API] 转换后数据: ${transformedData.length} 条记录`);

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: transformedData.length,
      sampleType,
      tableName,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('🚫 [Lab API] 未捕获的错误:', error);

    // 更详细的错误信息
    let errorMessage = 'Unknown error';
    let errorType = 'Internal server error';

    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.name === 'AbortError') {
        errorType = 'Request timeout';
        errorMessage = '请求超时，请检查网络连接';
      } else if (error.message.includes('fetch failed')) {
        errorType = 'Network error';
        errorMessage = '网络连接失败，请检查网络状态';
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: errorType,
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
