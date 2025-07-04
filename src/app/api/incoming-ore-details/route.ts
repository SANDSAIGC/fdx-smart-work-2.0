import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate, dataSource } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    // 根据数据源选择表名
    const tableName = dataSource === 'fdx' ? '进厂原矿-FDX' : '进厂原矿-JDXY';
    
    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?select=*`;
    
    // 添加日期范围筛选
    if (startDate && endDate) {
      queryUrl += `&计量日期=gte.${startDate}&计量日期=lte.${endDate}`;
    }
    
    // 添加排序
    queryUrl += `&order=计量日期.desc`;

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`获取${tableName}数据失败: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('获取进厂原矿详情数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, dataSource, data } = await request.json();
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    // 根据数据源选择表名
    const tableName = dataSource === 'fdx' ? '进厂原矿-FDX' : '进厂原矿-JDXY';
    
    // 构建更新URL
    const updateUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?id=eq.${encodeURIComponent(id)}`;
    
    // 准备更新数据
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    };

    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`更新${tableName}数据失败: ${response.statusText}`);
    }

    const updatedData = await response.json();

    return NextResponse.json({
      success: true,
      data: updatedData
    });

  } catch (error) {
    console.error('更新进厂原矿数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dataSource = searchParams.get('dataSource');
    
    if (!id || !dataSource) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, error: '数据库配置错误' },
        { status: 500 }
      );
    }

    // 根据数据源选择表名
    const tableName = dataSource === 'fdx' ? '进厂原矿-FDX' : '进厂原矿-JDXY';
    
    // 构建删除URL
    const deleteUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?id=eq.${encodeURIComponent(id)}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`删除${tableName}数据失败: ${response.statusText}`);
    }

    return NextResponse.json({
      success: true,
      message: '数据删除成功'
    });

  } catch (error) {
    console.error('删除进厂原矿数据失败:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
