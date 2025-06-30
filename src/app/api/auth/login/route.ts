import { NextRequest, NextResponse } from 'next/server';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    账号: string;
    姓名: string;
    部门: string;
    重定向路由: string;
    职称: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { email, password }: LoginRequest = await request.json();

    console.log('🔐 [登录API] 收到登录请求:', { email, password: '***' });

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: '请填写账号和密码'
      } as LoginResponse);
    }

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      } as LoginResponse);
    }

    // 构建查询URL - 查询用户资料表进行身份验证
    const queryUrl = `${supabaseUrl}/rest/v1/用户资料?select=*&账号=eq.${encodeURIComponent(email)}&密码=eq.${encodeURIComponent(password)}&limit=1`;

    // 发送HTTP请求到Supabase，增加重试机制
    let response;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(queryUrl, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          // 添加超时设置
          signal: AbortSignal.timeout(10000) // 10秒超时
        });

        if (response.ok) {
          break; // 成功，跳出重试循环
        }
      } catch (error) {
        console.log(`❌ [登录API] 第${retryCount + 1}次尝试失败:`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          throw error; // 达到最大重试次数，抛出错误
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    if (!response || !response.ok) {
      console.error('❌ [登录API] Supabase请求失败:', response?.status, response?.statusText);
      return NextResponse.json({
        success: false,
        message: '登录验证失败，请重试'
      } as LoginResponse);
    }

    const users = await response.json();

    if (!users || users.length === 0) {
      console.log('❌ [登录API] 账号或密码错误');
      return NextResponse.json({
        success: false,
        message: '账号或密码错误'
      } as LoginResponse);
    }

    const user = users[0];
    console.log('✅ [登录API] 登录成功:', {
      账号: user.账号,
      姓名: user.姓名,
      部门: user.部门,
      重定向路由: user.重定向路由,
      职称: user.职称
    });

    // 返回登录成功响应
    const responseUser = {
      id: user.id,
      账号: user.账号,
      姓名: user.姓名,
      部门: user.部门,
      重定向路由: user.重定向路由 || '/lab',
      职称: user.职称 || '化验师'
    };

    console.log('📤 [登录API] 返回用户信息:', responseUser);

    return NextResponse.json({
      success: true,
      message: '登录成功',
      user: responseUser
    } as LoginResponse);

  } catch (error) {
    console.error('❌ [登录API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    } as LoginResponse);
  }
}
