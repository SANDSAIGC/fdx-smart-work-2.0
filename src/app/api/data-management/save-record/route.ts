import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return handleSaveRecord(request, 'POST');
}

export async function PUT(request: NextRequest) {
  return handleSaveRecord(request, 'PUT');
}

async function handleSaveRecord(request: NextRequest, method: 'POST' | 'PUT') {
  try {
    const { table, record } = await request.json();

    if (!table || !record) {
      return NextResponse.json(
        { success: false, message: '表名和记录数据是必需的' },
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

    // 清理记录数据，移除空值
    const cleanRecord = Object.fromEntries(
      Object.entries(record).filter(([key, value]) => 
        value !== null && value !== undefined && value !== ''
      )
    );

    let url = `${supabaseUrl}/rest/v1/${encodeURIComponent(table)}`;
    let fetchOptions: RequestInit = {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(cleanRecord)
    };

    if (method === 'POST') {
      // 新增记录
      fetchOptions.method = 'POST';
    } else {
      // 更新记录 - 需要主键条件
      const primaryKey = record.id || record.ID;
      if (!primaryKey) {
        return NextResponse.json(
          { success: false, message: '更新记录需要主键' },
          { status: 400 }
        );
      }
      
      url += `?id=eq.${primaryKey}`;
      fetchOptions.method = 'PATCH';
      
      // 从更新数据中移除主键
      const { id, ID, ...updateData } = cleanRecord;
      fetchOptions.body = JSON.stringify(updateData);
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('保存记录失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { success: false, message: '保存失败' },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: method === 'POST' ? '记录创建成功' : '记录更新成功',
      data: result
    });

  } catch (error) {
    console.error('保存记录API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
