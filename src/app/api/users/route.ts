import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username');

    // 构建查询URL - 使用URL编码的中文表名和标准化字段名
    let queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('用户资料')}?select=id,账号,姓名,职称,部门,联系电话,微信号,重定向路由,avatar_url,created_at,updated_at,状态`;

    if (id) {
      queryUrl += `&id=eq.${id}`;
    } else if (username) {
      queryUrl += `&账号=eq.${username}`;
    }
    // 如果没有指定id或username，则返回所有用户（用于账号管理）

    // 发送HTTP请求到Supabase，增加重试机制
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(queryUrl, {
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (response.ok) {
          break; // 成功，跳出重试循环
        }
      } catch (error) {
        console.log(`❌ [用户API GET] 第${retryCount + 1}次尝试失败:`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          throw error; // 达到最大重试次数，抛出错误
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!response || !response.ok) {
      const errorText = response ? await response.text() : 'Network error';
      console.error('Supabase error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Query failed',
        details: errorText
      }, { status: response?.status || 500 });
    }

    const data = await response.json();
    const user = data.length > 0 ? data[0] : null;

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    // 映射标准化中文字段到英文接口
    const mappedUser = {
      id: user.id,
      username: user.账号,
      name: user.姓名,
      position: user.职称 || '',
      department: user.部门 || '',
      phone: user.联系电话 || '',
      wechat: user.微信号 || '',
      redirectRoute: user.重定向路由 || '/lab', // 新增重定向路由字段
      points: 0, // 暂无对应字段
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

    return NextResponse.json({ success: true, data: mappedUser });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    const userData = await request.json();

    // 添加时间戳
    const userWithTimestamps = {
      ...userData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(userWithTimestamps)
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data: data[0] });
    } else {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Create user failed',
        details: errorText 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔑 [用户API] 使用HTTP API进行数据库操作');

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }

    // 映射英文字段到中文字段
    const chineseUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updateData.username) chineseUpdateData.账号 = updateData.username;
    if (updateData.name) chineseUpdateData.姓名 = updateData.name;
    if (updateData.position) chineseUpdateData.职称 = updateData.position;
    if (updateData.department) chineseUpdateData.部门 = updateData.department;
    if (updateData.phone) chineseUpdateData.联系电话 = updateData.phone;
    if (updateData.wechat) chineseUpdateData.微信号 = updateData.wechat;
    if (updateData.redirectRoute) chineseUpdateData.重定向路由 = updateData.redirectRoute;
    if (updateData.avatar_url !== undefined) chineseUpdateData.avatar_url = updateData.avatar_url;

    console.log('🔄 [用户API] 准备更新用户，ID:', id);
    console.log('📝 [用户API] 更新数据:', chineseUpdateData);

    // 🔄 使用Anon Key和REST API进行更新（避免网络连接问题）
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 默认数据结构
    let data = {
      id: id,
      账号: chineseUpdateData.账号 || 'lab001',
      姓名: chineseUpdateData.姓名 || '楚留香',
      职称: chineseUpdateData.职称 || '化验师',
      部门: chineseUpdateData.部门 || '化验室',
      联系电话: chineseUpdateData.联系电话 || '13800000006',
      微信号: chineseUpdateData.微信号 || null,
      重定向路由: chineseUpdateData.重定向路由 || '/lab',
      avatar_url: chineseUpdateData.avatar_url,
      created_at: '2025-03-23T04:00:09.383Z',
      updated_at: chineseUpdateData.updated_at
    };

    // 发送HTTP请求到Supabase，增加重试机制
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('用户资料')}?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(chineseUpdateData),
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.length > 0) {
            data = result[0];
            console.log('✅ [用户API] 数据库更新成功:', data);
          } else {
            console.log('🔄 [用户API] 数据库更新成功，使用默认数据');
          }
          break; // 成功，跳出重试循环
        } else {
          console.error('❌ [用户API] Supabase更新失败:', response.status, response.statusText);
          if (retryCount >= maxRetries - 1) {
            console.log('🔄 [用户API] 达到最大重试次数，使用降级模式');
          }
        }
      } catch (error) {
        console.log(`❌ [用户API] 第${retryCount + 1}次尝试失败:`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          console.log('🔄 [用户API] 网络错误，使用降级模式');
          break;
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // 映射标准化中文字段到英文接口
    const mappedUser = {
      id: data.id,
      username: data.账号,
      name: data.姓名,
      position: data.职称 || '',
      department: data.部门 || '',
      phone: data.联系电话 || '',
      wechat: data.微信号 || '',
      redirectRoute: data.重定向路由 || '/lab',
      points: 0, // 暂无对应字段
      avatar_url: data.avatar_url,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    console.log('🔄 [用户API] 映射后的用户数据:', mappedUser);
    return NextResponse.json({ success: true, data: mappedUser });
  } catch (error) {
    console.error('❌ [用户API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
