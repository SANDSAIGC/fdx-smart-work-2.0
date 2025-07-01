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
        console.log('✅ [精矿堆摸底样API] 成功获取当前用户:', result.data.name);
        return { name: result.data.name };
      }
    }
    
    console.warn('⚠️ [精矿堆摸底样API] 无法获取当前用户，使用默认化验人员');
    return { name: '系统用户' };
  } catch (error) {
    console.error('❌ [精矿堆摸底样API] 获取当前用户失败:', error);
    return { name: '系统用户' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📥 [精矿堆摸底样API] 收到请求数据 v2.0:', body);

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ [精矿堆摸底样API] Supabase 配置缺失');
      return NextResponse.json(
        { success: false, error: 'Supabase 配置缺失' },
        { status: 500 }
      );
    }

    // 获取当前用户信息
    const currentUser = await getCurrentUser(request);
    const 化验人员 = currentUser?.name || '系统用户';
    console.log('👤 [精矿堆摸底样API] 化验人员:', 化验人员);

    // 提取关键字段用于查重
    const { 取样日期 } = body;
    if (!取样日期) {
      console.error('❌ [精矿堆摸底样API] 缺少必要字段: 取样日期');
      return NextResponse.json(
        { success: false, error: '缺少必要字段: 取样日期' },
        { status: 400 }
      );
    }

    // 检查是否已存在相同日期的记录
    const tableName = encodeURIComponent('精矿堆摸底样');
    const fieldName = encodeURIComponent('日期'); // 使用数据表中的实际字段名
    const checkUrl = `${supabaseUrl}/rest/v1/${tableName}?${fieldName}=eq.${encodeURIComponent(取样日期)}`;
    console.log('🔍 [精矿堆摸底样API] 查询URL v3.0:', checkUrl);
    console.log('🔍 [精矿堆摸底样API] 表名编码:', tableName);
    console.log('🔍 [精矿堆摸底样API] 字段名编码 v3.0:', fieldName);
    console.log('🔍 [精矿堆摸底样API] 原始字段名: 日期');

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
    console.log('🔍 [精矿堆摸底样API] 查询现有记录:', existingRecords);

    // 准备要提交的数据，进行字段映射
    const submitData = {
      日期: body.取样日期, // 字段映射：取样日期 -> 日期
      'Pb品位%': body['Pb品位%'],
      'Zn品位%': body['Zn品位%'],
      '水份%': body['水份%'],
      '湿重预估t': body['湿重预估t'],
      '干重预估t': body['干重预估t'],
      '金属量预估t': body['金属量预估t'],
      化验人员, // 自动添加当前用户作为化验人员
      updated_at: new Date().toISOString()
    };

    let response;
    let operation = '';

    if (existingRecords.length > 0) {
      // 更新现有记录
      operation = 'UPDATE';
      const recordId = existingRecords[0].id;
      response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?id=eq.${recordId}`, {
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
      response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
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
      console.error('❌ [精矿堆摸底样API] Supabase错误:', errorText);
      throw new Error(`数据库操作失败: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [精矿堆摸底样API] 操作成功:', { operation, result });

    return NextResponse.json({
      success: true,
      data: result,
      message: '精矿堆摸底样数据提交成功'
    });

  } catch (error) {
    console.error('❌ [精矿堆摸底样API] 处理请求时发生错误:', error);
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
    message: '精矿堆摸底样API端点',
    methods: ['POST'],
    description: '用于提交精矿堆摸底样数据'
  });
}
