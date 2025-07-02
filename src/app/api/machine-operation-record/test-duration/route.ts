import { NextResponse } from 'next/server';

// 测试数据
const testRecords = [
  {
    id: '1',
    日期: '2025-07-02',
    时间: '08:00',
    设备状态: '正常运行' as const,
    情况说明: '设备启动',
    操作员: '张三'
  },
  {
    id: '2',
    日期: '2025-07-02',
    时间: '12:00',
    设备状态: '正常运行' as const,
    情况说明: '继续运行',
    操作员: '李四'
  },
  {
    id: '3',
    日期: '2025-07-02',
    时间: '16:00',
    设备状态: '设备维护' as const,
    情况说明: '开始维护',
    操作员: '王五'
  },
  {
    id: '4',
    日期: '2025-07-02',
    时间: '18:30',
    设备状态: '正常运行' as const,
    情况说明: '维护完成，恢复运行',
    操作员: '赵六'
  },
  {
    id: '5',
    日期: '2025-07-03',
    时间: '08:00',
    设备状态: '正常运行' as const,
    情况说明: '新一天开始',
    操作员: '楚留香'
  }
];

interface MachineOperationRecord {
  id?: string;
  日期: string;
  时间: string;
  设备状态: '正常运行' | '设备维护';
  情况说明?: string;
  持续时长?: string | null;
  操作员: string;
}

// 格式化持续时长的辅助函数
const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
  }
};

// 计算所有记录的持续时长
const calculateAllDurations = (records: MachineOperationRecord[]): MachineOperationRecord[] => {
  if (!records || records.length === 0) return [];

  // 按日期和时间正序排列（最早的在前）
  const sortedRecords = [...records].sort((a, b) => {
    const dateComparison = new Date(a.日期).getTime() - new Date(b.日期).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    const timeA = a.时间.split(':').map(Number);
    const timeB = b.时间.split(':').map(Number);
    const timeAMinutes = timeA[0] * 60 + timeA[1];
    const timeBMinutes = timeB[0] * 60 + timeB[1];
    return timeAMinutes - timeBMinutes;
  });

  // 计算每条记录的持续时长
  const recordsWithDuration = sortedRecords.map((record, index) => {
    // 最新记录（最后一条）的持续时长为null
    if (index === sortedRecords.length - 1) {
      return { ...record, 持续时长: null };
    }

    // 获取下一条记录
    const nextRecord = sortedRecords[index + 1];
    
    // 计算当前记录到下一条记录的时间差
    const currentDateTime = new Date(`${record.日期}T${record.时间}`);
    const nextDateTime = new Date(`${nextRecord.日期}T${nextRecord.时间}`);
    
    const diffMs = nextDateTime.getTime() - currentDateTime.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    // 如果时间差为负数或过大（超过24小时），设为null
    if (diffMinutes <= 0 || diffMinutes > 1440) {
      return { ...record, 持续时长: null };
    }

    return { ...record, 持续时长: formatDuration(diffMinutes) };
  });

  // 重新按日期和时间倒序排列返回（最新的在前）
  return recordsWithDuration.sort((a, b) => {
    const dateComparison = new Date(b.日期).getTime() - new Date(a.日期).getTime();
    if (dateComparison !== 0) return dateComparison;
    
    const timeA = a.时间.split(':').map(Number);
    const timeB = b.时间.split(':').map(Number);
    const timeAMinutes = timeA[0] * 60 + timeA[1];
    const timeBMinutes = timeB[0] * 60 + timeB[1];
    return timeBMinutes - timeAMinutes;
  });
};

export async function GET() {
  try {
    const recordsWithDuration = calculateAllDurations(testRecords);
    
    return NextResponse.json({
      success: true,
      message: '持续时长计算测试',
      data: {
        original: testRecords,
        calculated: recordsWithDuration,
        expected: [
          '2025-07-03 08:00: 持续时长应为 "--" (最新记录)',
          '2025-07-02 18:30: 持续时长应为 "13小时30分钟" (到次日08:00)',
          '2025-07-02 16:00: 持续时长应为 "2小时30分钟" (到18:30)',
          '2025-07-02 12:00: 持续时长应为 "4小时" (到16:00)',
          '2025-07-02 08:00: 持续时长应为 "4小时" (到12:00)'
        ]
      }
    });
  } catch (error) {
    console.error('持续时长计算测试失败:', error);
    return NextResponse.json({
      success: false,
      message: '测试失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
