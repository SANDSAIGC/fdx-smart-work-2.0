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
        console.log('✅ [出厂样内部取样API] 成功获取当前用户:', result.data.name);
        return { name: result.data.name };
      }
    }
    
    console.warn('⚠️ [出厂样内部取样API] 无法获取当前用户，使用默认化验人员');
    return { name: '系统用户' };
  } catch (error) {
    console.error('❌ [出厂样内部取样API] 获取当前用户失败:', error);
    return { name: '系统用户' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 [出厂样内部取样API] 收到请求数据:', body);

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ [出厂样内部取样API] Supabase 配置缺失');
      return NextResponse.json(
        { success: false, error: 'Supabase 配置缺失' },
        { status: 500 }
      );
    }

    // 获取当前用户信息
    const currentUser = await getCurrentUser(request);
    const 化验人员 = currentUser?.name || '系统用户';
    console.log('👤 [出厂样内部取样API] 化验人员:', 化验人员);

    // 提取关键字段用于查重
    const { 计量日期 } = body;
    if (!计量日期) {
      console.error('❌ [出厂样内部取样API] 缺少必要字段: 计量日期');
      return NextResponse.json(
        { success: false, error: '缺少必要字段: 计量日期' },
        { status: 400 }
      );
    }

    // 检查是否已存在相同日期的记录
    const checkUrl = `${supabaseUrl}/rest/v1/出厂样内部取样?计量日期=eq.${计量日期}`;
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
    console.log('🔍 [出厂样内部取样API] 查询现有记录:', existingRecords);

    // 准备要提交的数据
    const submitData = {
      ...body,
      化验人员, // 自动添加当前用户作为化验人员
      updated_at: new Date().toISOString()
    };

    let response;
    let operation = '';

    if (existingRecords.length > 0) {
      // 更新现有记录
      operation = 'UPDATE';
      const recordId = existingRecords[0].id;
      response = await fetch(`${supabaseUrl}/rest/v1/出厂样内部取样?id=eq.${recordId}`, {
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
      submitData.created_at = new Date().toISOString();
      response = await fetch(`${supabaseUrl}/rest/v1/出厂样内部取样`, {
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
      console.error('❌ [出厂样内部取样API] Supabase错误:', errorText);
      throw new Error(`数据库操作失败: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [出厂样内部取样API] 操作成功:', { operation, result });

    return NextResponse.json({
      success: true,
      data: result,
      message: '出厂样内部取样数据提交成功'
    });

  } catch (error) {
    console.error('❌ [出厂样内部取样API] 处理请求时发生错误:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: '出厂样内部取样API端点',
    methods: ['POST'],
    description: '用于提交出厂样内部取样数据'
  });
}
