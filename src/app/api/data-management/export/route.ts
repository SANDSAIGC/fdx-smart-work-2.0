import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { table, format } = await request.json();

    if (!table || !format) {
      return NextResponse.json(
        { success: false, message: '表名和格式是必需的' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 获取表数据
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}?select=*`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('查询表数据失败');
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.length === 0) {
      return NextResponse.json(
        { success: false, message: '表中没有数据可导出' },
        { status: 400 }
      );
    }

    let content: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        content = convertToCSV(data);
        contentType = 'text/csv';
        filename = `${table}.csv`;
        break;
      
      case 'json':
        content = JSON.stringify(data, null, 2);
        contentType = 'application/json';
        filename = `${table}.json`;
        break;
      
      case 'excel':
        // 简化的Excel格式（实际上是CSV）
        content = convertToCSV(data);
        contentType = 'application/vnd.ms-excel';
        filename = `${table}.xlsx`;
        break;
      
      default:
        return NextResponse.json(
          { success: false, message: '不支持的导出格式' },
          { status: 400 }
        );
    }

    // 返回文件内容
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('数据导出API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 转换为CSV格式
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // 处理包含逗号、引号或换行符的值
      if (value === null || value === undefined) {
        return '';
      }
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}
