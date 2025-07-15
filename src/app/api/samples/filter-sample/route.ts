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
        console.log('✅ [压滤样API] 成功获取当前用户:', result.data.name);
        return { name: result.data.name };
      }
    }

    console.warn('⚠️ [压滤样API] 无法获取当前用户，使用默认化验人员');
    return { name: '系统用户' };
  } catch (error) {
    console.error('❌ [压滤样API] 获取当前用户失败:', error);
    return { name: '系统用户' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 接收前端数据
    const requestData = await request.json();
    console.log('🔬 [压滤样API] 收到数据:', requestData);

    // 获取当前用户信息
    const currentUser = await getCurrentUser(request);
    const 化验人员 = currentUser?.name || '系统用户';
    console.log('👤 [压滤样API] 化验人员:', 化验人员);

    // 数据字段映射和验证
    const {
      开始时间,
      结束时间,
      水份,
      铅品位,
      锌品位,
      备注
    } = requestData;

    // 验证必填字段
    if (!开始时间 || !结束时间) {
      return NextResponse.json({
        success: false,
        message: '开始时间和结束时间为必填字段'
      }, { status: 400 });
    }

    // 将日期字符串转换为时间戳格式
    const startTimestamp = new Date(开始时间).toISOString();
    const endTimestamp = new Date(结束时间).toISOString();

    // 检查是否已存在相同时间段的记录
    const checkUrl = `${supabaseUrl}/rest/v1/压滤样化验记录?开始时间=eq.${encodeURIComponent(startTimestamp)}&结束时间=eq.${encodeURIComponent(endTimestamp)}`;
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
    console.log('🔍 [压滤样API] 查询现有记录:', existingRecords);

    // 准备要提交的数据
    const submitData = {
      化验人员, // 自动添加当前用户作为化验人员
      开始时间: startTimestamp,
      结束时间: endTimestamp,
      水份: 水份 ? parseFloat(水份) : null,
      铅品位: 铅品位 ? parseFloat(铅品位) : null,
      锌品位: 锌品位 ? parseFloat(锌品位) : null,
      备注: 备注 || null,
      updated_at: new Date().toISOString()
    };

    let response;
    let operation = '';

    if (existingRecords.length > 0) {
      // 更新现有记录
      operation = 'UPDATE';
      const recordId = existingRecords[0].id;
      response = await fetch(`${supabaseUrl}/rest/v1/压滤样化验记录?id=eq.${recordId}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(submitData)
      });
    } else {
      // 创建新记录
      operation = 'INSERT';
      response = await fetch(`${supabaseUrl}/rest/v1/压滤样化验记录`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(submitData)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [压滤样API] Supabase错误:', errorText);
      throw new Error(`数据库操作失败: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [压滤样API] 操作成功:', { operation, result });

    return NextResponse.json({
      success: true,
      message: `压滤样数据${operation === 'INSERT' ? '提交' : '更新'}成功！`,
      data: result,
      operation
    });

  } catch (error) {
    console.error('❌ [压滤样API] 处理失败:', error);
    return NextResponse.json({
      success: false,
      message: `操作失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}
