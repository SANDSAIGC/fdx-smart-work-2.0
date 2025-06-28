import { NextRequest, NextResponse } from 'next/server';

// 模拟数据生成器
function generateMockData(sampleType: string, count: number = 20) {
  const elements = ['Cu', 'Fe', 'Au', 'Ag', 'Zn', 'Pb'];
  const shifts = ['早班', '中班', '晚班'];
  const mineralTypes = ['铜矿', '铁矿', '金矿', '银矿'];
  const suppliers = ['供应商A', '供应商B', '供应商C', '供应商D'];
  const purchasingUnits = ['采购单位A', '采购单位B', '采购单位C'];

  return Array.from({ length: count }, (_, index) => {
    const baseData = {
      id: `${sampleType}-${index + 1}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 生成随机日期（最近30天内）
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
    const dateStr = randomDate.toISOString().split('T')[0];

    switch (sampleType) {
      case 'shift_samples':
        return {
          ...baseData,
          日期: dateStr,
          班次: shifts[Math.floor(Math.random() * shifts.length)],
          矿物类型: mineralTypes[Math.floor(Math.random() * mineralTypes.length)],
          元素: elements[Math.floor(Math.random() * elements.length)],
          品位: (Math.random() * 50 + 10).toFixed(2),
          水分: (Math.random() * 15 + 5).toFixed(2),
        };

      case 'filter_samples':
        return {
          ...baseData,
          日期: dateStr,
          元素: elements[Math.floor(Math.random() * elements.length)],
          品位: (Math.random() * 60 + 15).toFixed(2),
          水分: (Math.random() * 12 + 3).toFixed(2),
          压滤机编号: `PF-${Math.floor(Math.random() * 10) + 1}`,
        };

      case 'incoming_samples':
        return {
          ...baseData,
          日期: dateStr,
          元素: elements[Math.floor(Math.random() * elements.length)],
          品位: (Math.random() * 40 + 5).toFixed(2),
          水分: (Math.random() * 20 + 8).toFixed(2),
          供应商: suppliers[Math.floor(Math.random() * suppliers.length)],
        };

      case 'outgoing_sample':
        return {
          ...baseData,
          出厂日期: dateStr,
          采购单位: purchasingUnits[Math.floor(Math.random() * purchasingUnits.length)],
          化验元素: elements[Math.floor(Math.random() * elements.length)],
          出厂样品位: (Math.random() * 70 + 20).toFixed(2),
          出厂样水分: (Math.random() * 8 + 2).toFixed(2),
        };

      default:
        return baseData;
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sampleType = searchParams.get('sampleType') || 'shift_samples';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');

    console.log('Lab API 请求参数:', {
      sampleType,
      startDate,
      endDate,
      limit
    });

    // 生成模拟数据
    const mockData = generateMockData(sampleType, limit);

    // 如果提供了日期范围，过滤数据
    let filteredData = mockData;
    if (startDate && endDate) {
      filteredData = mockData.filter(item => {
        const itemDate = item.日期 || item.出厂日期;
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length,
      sampleType,
      dateRange: { startDate, endDate }
    });

  } catch (error) {
    console.error('Lab API 错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
