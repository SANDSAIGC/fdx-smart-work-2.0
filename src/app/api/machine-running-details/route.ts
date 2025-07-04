import { NextRequest, NextResponse } from 'next/server';

// 机器运行记录数据接口
interface MachineRunningRecord {
  id: number;
  操作员: string;
  日期: string;
  时间: string;
  设备状态: '正常运行' | '设备维护';
  持续时长?: string;
  情况说明?: string;
  created_at?: string;
  updated_at?: string;
}

// 聚合统计数据接口
interface StatusAggregation {
  status: string;
  count: number;
  totalDuration: number; // 总持续时间（小时）
  percentage: number; // 占比
}

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, action } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    console.log('机器运行详情API调用:', { startDate, endDate, action });

    // 根据action类型处理不同的请求
    switch (action) {
      case 'getRecords':
        return await getRecords(supabaseUrl, anonKey, startDate, endDate);
      case 'getAggregation':
        return await getStatusAggregation(supabaseUrl, anonKey, startDate, endDate);
      case 'getCurrentStatus':
        return await getCurrentStatus(supabaseUrl, anonKey);
      default:
        return NextResponse.json(
          { success: false, error: '无效的操作类型' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('机器运行详情API错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误')
    }, { status: 500 });
  }
}

// 获取记录列表
async function getRecords(supabaseUrl: string, anonKey: string, startDate?: string, endDate?: string) {
  try {
    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?select=*`;
    
    // 添加日期范围筛选
    if (startDate && endDate) {
      queryUrl += `&日期=gte.${startDate}&日期=lte.${endDate}`;
    }
    
    // 添加排序
    queryUrl += `&order=日期.desc,时间.desc`;

    console.log('查询URL:', queryUrl);

    // 发送请求
    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API错误:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `数据查询失败: ${response.status} ${response.statusText}`
      }, { status: 500 });
    }

    const data = await response.json();
    console.log(`机器运行记录查询成功: ${data?.length || 0} 条记录`);

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `成功获取 ${data?.length || 0} 条机器运行记录`
    });

  } catch (error) {
    console.error('获取记录错误:', error);
    return NextResponse.json({
      success: false,
      error: '获取记录失败'
    }, { status: 500 });
  }
}

// 获取状态聚合统计
async function getStatusAggregation(supabaseUrl: string, anonKey: string, startDate?: string, endDate?: string) {
  try {
    // 先获取原始数据
    const recordsResponse = await getRecords(supabaseUrl, anonKey, startDate, endDate);
    const recordsData = await recordsResponse.json();
    
    if (!recordsData.success) {
      return recordsData;
    }

    const records: MachineRunningRecord[] = recordsData.data;
    
    // 计算状态聚合
    const statusMap = new Map<string, { count: number; totalHours: number }>();
    
    records.forEach(record => {
      const status = record.设备状态;
      const duration = parseDuration(record.持续时长);

      console.log('处理记录:', {
        设备状态: status,
        持续时长: record.持续时长,
        解析后时长: duration
      });

      if (!statusMap.has(status)) {
        statusMap.set(status, { count: 0, totalHours: 0 });
      }

      const current = statusMap.get(status)!;
      current.count += 1;
      current.totalHours += duration;
    });

    // 计算总时间用于百分比计算
    const totalHours = Array.from(statusMap.values()).reduce((sum, item) => sum + item.totalHours, 0);

    console.log('状态映射结果:', Array.from(statusMap.entries()));
    console.log('总时长:', totalHours);

    // 构建聚合结果 - 确保顺序稳定，正常运行在前，设备维护在后
    const statusOrder = ['正常运行', '设备维护'];
    const aggregation: StatusAggregation[] = statusOrder
      .filter(status => statusMap.has(status))
      .map(status => {
        const data = statusMap.get(status)!;
        const result = {
          status,
          count: data.count,
          totalDuration: data.totalHours,
          percentage: totalHours > 0 ? (data.totalHours / totalHours) * 100 : 0
        };
        console.log('聚合结果项:', result);
        return result;
      });

    console.log('最终聚合结果:', aggregation);

    return NextResponse.json({
      success: true,
      data: aggregation,
      totalRecords: records.length,
      totalHours: totalHours,
      message: '状态聚合统计获取成功'
    });

  } catch (error) {
    console.error('状态聚合错误:', error);
    return NextResponse.json({
      success: false,
      error: '状态聚合统计失败'
    }, { status: 500 });
  }
}

// 获取当前运行状态
async function getCurrentStatus(supabaseUrl: string, anonKey: string) {
  try {
    // 获取最新的一条记录
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?select=*&order=日期.desc,时间.desc&limit=1`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: '获取当前状态失败'
      }, { status: 500 });
    }

    const data = await response.json();
    const latestRecord = data[0];

    if (!latestRecord) {
      return NextResponse.json({
        success: true,
        data: null,
        message: '暂无运行记录'
      });
    }

    // 计算当前状态持续时间
    const recordDateTime = new Date(`${latestRecord.日期} ${latestRecord.时间}`);
    const now = new Date();
    const durationMs = now.getTime() - recordDateTime.getTime();
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    return NextResponse.json({
      success: true,
      data: {
        ...latestRecord,
        currentDuration: `${durationHours}小时${durationMinutes}分钟`,
        durationHours,
        durationMinutes
      },
      message: '当前状态获取成功'
    });

  } catch (error) {
    console.error('获取当前状态错误:', error);
    return NextResponse.json({
      success: false,
      error: '获取当前状态失败'
    }, { status: 500 });
  }
}

// 解析持续时长字符串为小时数
function parseDuration(durationStr?: string): number {
  if (!durationStr) return 0;
  
  // 匹配格式如 "8小时", "1小时34分钟", "737小时45分钟"
  const hourMatch = durationStr.match(/(\d+)小时/);
  const minuteMatch = durationStr.match(/(\d+)分钟/);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  return hours + (minutes / 60);
}

export async function GET() {
  return NextResponse.json({
    success: false,
    error: '请使用 POST 方法调用此 API'
  }, { status: 405 });
}
