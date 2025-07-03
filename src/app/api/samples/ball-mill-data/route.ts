import { NextRequest, NextResponse } from 'next/server';

// 获取当前用户信息的辅助函数
async function getCurrentUser(request: NextRequest): Promise<{ name: string } | null> {
  try {
    // 从请求头获取用户ID（如果有的话）
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('x-user-id');

    // 构建当前用户API请求
    const baseUrl = request.nextUrl.origin;
    let currentUserUrl = `${baseUrl}/api/current-user`;

    if (userIdHeader) {
      currentUserUrl += `?userId=${userIdHeader}`;
    }

    const response = await fetch(currentUserUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ [球磨车间API] 成功获取当前用户:', result.data.name);
        return { name: result.data.name };
      }
    }

    console.warn('⚠️ [球磨车间API] 无法获取当前用户，使用默认操作员');
    return { name: '系统用户' };
  } catch (error) {
    console.error('❌ [球磨车间API] 获取当前用户失败:', error);
    return { name: '系统用户' };
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🏭 [球磨车间API] 开始处理数据提交请求');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ [球磨车间API] 环境变量未配置');
      return NextResponse.json({
        success: false,
        message: '服务器配置错误'
      }, { status: 500 });
    }

    const requestData = await request.json();
    console.log('📥 [球磨车间API] 收到数据:', requestData);

    // 获取当前用户信息
    const currentUser = await getCurrentUser(request);
    const 操作员 = currentUser?.name || requestData.操作员 || '系统用户';
    console.log('👤 [球磨车间API] 操作员:', 操作员);

    // 格式化数据以匹配数据库字段类型
    const formattedData: any = {};

    // 必填字段
    formattedData.操作员 = String(操作员);
    if (requestData.日期) formattedData.日期 = requestData.日期;
    if (requestData.时间) {
      // 确保时间格式为 HH:mm:ss
      let timeStr = requestData.时间;
      if (!timeStr.includes(':00')) {
        timeStr += ':00';
      }
      formattedData.时间 = timeStr;
    }
    
    // 数值字段 - 只有当值存在且不为空时才添加
    if (requestData.进料流量 !== null && requestData.进料流量 !== undefined && requestData.进料流量 !== '') {
      formattedData.进料流量 = Number(requestData.进料流量);
    }
    if (requestData.一号壶称重 !== null && requestData.一号壶称重 !== undefined && requestData.一号壶称重 !== '') {
      formattedData.一号壶称重 = Number(requestData.一号壶称重);
    }
    if (requestData.一号壶浓度 !== null && requestData.一号壶浓度 !== undefined && requestData.一号壶浓度 !== '') {
      formattedData.一号壶浓度 = Number(requestData.一号壶浓度);
    }
    if (requestData.二号壶称重 !== null && requestData.二号壶称重 !== undefined && requestData.二号壶称重 !== '') {
      formattedData.二号壶称重 = Number(requestData.二号壶称重);
    }
    if (requestData.二号壶浓度 !== null && requestData.二号壶浓度 !== undefined && requestData.二号壶浓度 !== '') {
      formattedData.二号壶浓度 = Number(requestData.二号壶浓度);
    }
    if (requestData.二号壶细度称重 !== null && requestData.二号壶细度称重 !== undefined && requestData.二号壶细度称重 !== '') {
      formattedData.二号壶细度称重 = Number(requestData.二号壶细度称重);
    }
    if (requestData.二号壶细度 !== null && requestData.二号壶细度 !== undefined && requestData.二号壶细度 !== '') {
      formattedData.二号壶细度 = Number(requestData.二号壶细度);
    }
    
    // 图片URL字段
    if (requestData.一号壶称重照片url) formattedData.一号壶称重照片url = String(requestData.一号壶称重照片url);
    if (requestData.二号壶称重照片url) formattedData.二号壶称重照片url = String(requestData.二号壶称重照片url);
    if (requestData.二号壶细度称重照片url) formattedData.二号壶细度称重照片url = String(requestData.二号壶细度称重照片url);

    console.log('🔄 [球磨车间API] 格式化后的数据:', formattedData);

    // 使用基于日期+班次的UPSERT逻辑
    const { 日期, 时间 } = formattedData;
    
    // 检查是否已存在相同日期和时间的记录
    const checkUrl = `${supabaseUrl}/rest/v1/浓细度记录-FDX?日期=eq.${日期}&时间=eq.${时间}`;

    const checkResponse = await fetch(checkUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      throw new Error(`查询失败: ${checkResponse.statusText}`);
    }

    const existingRecords = await checkResponse.json();
    console.log('🔍 [球磨车间API] 查询现有记录:', existingRecords);

    let response;
    let operation = '';

    if (existingRecords.length > 0) {
      // 更新现有记录
      operation = 'UPDATE';
      const recordId = existingRecords[0].id;
      response = await fetch(`${supabaseUrl}/rest/v1/浓细度记录-FDX?id=eq.${recordId}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formattedData)
      });
    } else {
      // 创建新记录
      operation = 'INSERT';
      response = await fetch(`${supabaseUrl}/rest/v1/浓细度记录-FDX`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(formattedData)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [球磨车间API] Supabase错误:', errorText);
      throw new Error(`数据库操作失败: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [球磨车间API] 操作成功:', { operation, result });

    return NextResponse.json({
      success: true,
      message: `球磨车间数据${operation === 'INSERT' ? '提交' : '更新'}成功！`,
      data: result,
      operation
    });

  } catch (error) {
    console.error('❌ [球磨车间API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      message: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: '服务器配置错误'
      }, { status: 500 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') || '50';

    let queryUrl = `${supabaseUrl}/rest/v1/浓细度记录-FDX?select=*&order=created_at.desc&limit=${limit}`;
    
    if (date) {
      queryUrl += `&日期=eq.${date}`;
    }

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data });
    } else {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        message: `查询失败: ${response.status} ${errorText}`
      }, { status: response.status });
    }
  } catch (error) {
    console.error('查询球磨车间数据错误:', error);
    return NextResponse.json({
      success: false,
      message: `服务器错误: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}
