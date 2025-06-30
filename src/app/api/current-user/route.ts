import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [当前用户API] 收到获取当前用户请求');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 从请求头或查询参数获取用户ID
    const { searchParams } = new URL(request.url);
    let userId = searchParams.get('userId');
    
    // 如果没有提供用户ID，尝试从Authorization头获取
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // 这里可以解析JWT token获取用户ID
        // 暂时使用默认用户ID
        userId = "4dd00d94-1c91-4dc9-990d-1abcfd52dcee"; // 默认用户：陈鴅
      }
    }

    // 如果仍然没有用户ID，使用默认用户
    if (!userId) {
      userId = "4dd00d94-1c91-4dc9-990d-1abcfd52dcee"; // 默认用户：陈鴅
      console.log('⚠️ [当前用户API] 未提供用户ID，使用默认用户:', userId);
    }

    // 构建查询URL
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('用户资料')}?select=id,账号,姓名,职称,部门,联系电话,微信号,avatar_url,created_at,updated_at&id=eq.${userId}`;

    console.log('🔍 [当前用户API] 查询用户ID:', userId);

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const user = data.length > 0 ? data[0] : null;

      if (!user) {
        console.error('❌ [当前用户API] 用户不存在:', userId);
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
        points: 0, // 暂无对应字段
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      console.log('✅ [当前用户API] 成功获取用户信息:', mappedUser.name);
      return NextResponse.json({ 
        success: true, 
        data: mappedUser,
        message: `成功获取用户信息: ${mappedUser.name}`
      });
    } else {
      const errorText = await response.text();
      console.error('❌ [当前用户API] Supabase查询失败:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Query failed',
        details: errorText 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('❌ [当前用户API] 服务器错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [当前用户API] 收到POST请求 - 通过会话获取用户');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    const { sessionToken, userId } = await request.json();

    // 验证会话token（这里简化处理，实际应该验证JWT）
    if (!sessionToken && !userId) {
      return NextResponse.json({
        success: false,
        error: 'Session token or user ID is required'
      }, { status: 400 });
    }

    // 使用提供的用户ID或默认用户ID
    const targetUserId = userId || "4dd00d94-1c91-4dc9-990d-1abcfd52dcee";

    // 构建查询URL
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('用户资料')}?select=id,账号,姓名,职称,部门,联系电话,微信号,avatar_url,created_at,updated_at&id=eq.${targetUserId}`;

    console.log('🔍 [当前用户API] 通过会话查询用户ID:', targetUserId);

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      const user = data.length > 0 ? data[0] : null;

      if (!user) {
        console.error('❌ [当前用户API] 会话对应的用户不存在:', targetUserId);
        return NextResponse.json({
          success: false,
          error: 'User not found for session'
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
        points: 0, // 暂无对应字段
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      console.log('✅ [当前用户API] 通过会话成功获取用户信息:', mappedUser.name);
      return NextResponse.json({ 
        success: true, 
        data: mappedUser,
        message: `通过会话成功获取用户信息: ${mappedUser.name}`
      });
    } else {
      const errorText = await response.text();
      console.error('❌ [当前用户API] 会话查询失败:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Session query failed',
        details: errorText 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('❌ [当前用户API] 会话处理错误:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Session processing error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
