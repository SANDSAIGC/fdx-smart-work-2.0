import { NextRequest, NextResponse } from 'next/server';

// 生产周期日期解析函数
function parseCycleDates(cycle: string): { startDate: string; endDate: string } | null {
  console.log(`🔍 [日期解析] 开始解析生产周期: "${cycle}"`);

  if (cycle === '全部周期') {
    // 全部周期：开始日期固定为2025年4月26日，结束日期为今日
    const endDate = new Date();
    const startDate = new Date('2025-04-26');

    const result = {
      startDate: startDate.toISOString().split('T')[0], // 2025-04-26
      endDate: endDate.toISOString().split('T')[0]      // 今日
    };

    console.log(`✅ [日期解析] 全部周期解析结果:`, result);
    return result;
  }

  // 解析格式：第X期（X月X日-X月X日）
  const dateRangeMatch = cycle.match(/（(.+?)）/);
  if (!dateRangeMatch) {
    console.log(`❌ [日期解析] 未找到日期范围括号: "${cycle}"`);
    return null;
  }

  const dateRangeStr = dateRangeMatch[1]; // 例如：4月26日-5月25日
  console.log(`🔍 [日期解析] 提取的日期范围字符串: "${dateRangeStr}"`);

  // 解析日期范围：X月X日-X月X日
  const rangeMatch = dateRangeStr.match(/(\d+)月(\d+)日-(\d+)月(\d+)日/);
  if (!rangeMatch) {
    console.log(`❌ [日期解析] 日期范围格式不匹配: "${dateRangeStr}"`);
    return null;
  }

  const [, startMonth, startDay, endMonth, endDay] = rangeMatch;
  console.log(`🔍 [日期解析] 解析出的日期组件:`, { startMonth, startDay, endMonth, endDay });

  // 确定年份（假设是当前年份，如果结束月份小于开始月份，则跨年）
  const currentYear = new Date().getFullYear();
  let startYear = currentYear;
  let endYear = currentYear;

  // 如果结束月份小于开始月份，说明跨年了
  if (parseInt(endMonth) < parseInt(startMonth)) {
    endYear = currentYear + 1;
  }

  // 构造日期字符串
  const startDateStr = `${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`;
  const endDateStr = `${endYear}-${endMonth.padStart(2, '0')}-${endDay.padStart(2, '0')}`;

  // 验证日期有效性
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    console.log(`❌ [日期解析] 构造的日期无效:`, { startDateStr, endDateStr });
    return null;
  }

  const result = {
    startDate: startDateStr,
    endDate: endDateStr
  };

  console.log(`✅ [日期解析] 解析成功:`, result);
  return result;
}

export async function GET(request: NextRequest) {
  try {
    console.log(`🚀 [生产周期日期API] 开始处理请求`);

    // 从查询参数获取生产周期
    const { searchParams } = new URL(request.url);
    const cycle = searchParams.get('cycle');

    if (!cycle) {
      console.log(`❌ [生产周期日期API] 缺少生产周期参数`);
      return NextResponse.json(
        { success: false, message: '缺少生产周期参数' },
        { status: 400 }
      );
    }

    console.log(`🔍 [生产周期日期API] 处理生产周期: "${cycle}"`);

    // 使用解析函数获取日期范围
    const dateRange = parseCycleDates(cycle);

    if (!dateRange) {
      console.log(`❌ [生产周期日期API] 无法解析生产周期日期: "${cycle}"`);
      // 返回默认日期范围而不是错误
      const today = new Date();
      const defaultStart = new Date();
      defaultStart.setDate(today.getDate() - 7);

      const fallbackRange = {
        startDate: defaultStart.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      };

      console.log(`🔄 [生产周期日期API] 使用默认日期范围:`, fallbackRange);

      return NextResponse.json({
        success: true,
        data: {
          ...fallbackRange,
          cycle: cycle,
          note: '无法解析周期日期，使用默认范围'
        }
      });
    }

    console.log(`✅ [生产周期日期API] 成功解析日期范围:`, dateRange);

    return NextResponse.json({
      success: true,
      data: {
        ...dateRange,
        cycle: cycle
      }
    });
  } catch (error) {
    console.error('生产周期日期API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
