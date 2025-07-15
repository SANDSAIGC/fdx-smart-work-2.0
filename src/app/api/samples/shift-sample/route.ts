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
        console.log('✅ [班样API] 成功获取当前用户:', result.data.name);
        return { name: result.data.name };
      }
    }

    console.warn('⚠️ [班样API] 无法获取当前用户，使用默认化验人员');
    return { name: '系统用户' };
  } catch (error) {
    console.error('❌ [班样API] 获取当前用户失败:', error);
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
    console.log('🔬 [班样API] 收到数据:', requestData);

    // 注意：生产班报-FDX表中没有化验人员字段，所以不需要获取当前用户信息

    // 数据字段映射和验证
    const {
      日期,
      班次,
      '氧化锌原矿-水份（%）': originalMoisture,
      '氧化锌原矿-Pb全品位（%）': originalPbGrade,
      '氧化锌原矿-Zn全品位（%）': originalZnGrade,
      '氧化锌精矿-Pb品位（%）': concentratePbGrade,
      '氧化锌精矿-Zn品位（%）': concentrateZnGrade,
      '尾矿-Pb全品位（%）': tailingsPbGrade,
      '尾矿-Zn全品位（%）': tailingsZnGrade
    } = requestData;

    // 验证必填字段
    if (!日期 || !班次) {
      return NextResponse.json({
        success: false,
        message: '日期和班次为必填字段'
      }, { status: 400 });
    }

    // 检查是否已存在相同日期和班次的记录
    const checkUrl = `${supabaseUrl}/rest/v1/生产班报-FDX?日期=eq.${日期}&班次=eq.${encodeURIComponent(班次)}`;
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
    console.log('🔍 [班样API] 查询现有记录:', existingRecords);

    // 准备要提交的数据
    const submitData = {
      日期,
      班次,
      // 注意：生产班报-FDX表中没有化验人员字段，所以不添加化验人员信息
      '氧化锌原矿-水份（%）': originalMoisture ? parseFloat(originalMoisture) : null,
      '氧化锌原矿-Pb全品位（%）': originalPbGrade ? parseFloat(originalPbGrade) : null,
      '氧化锌原矿-Zn全品位（%）': originalZnGrade ? parseFloat(originalZnGrade) : null,
      '氧化锌精矿-Pb品位（%）': concentratePbGrade ? parseFloat(concentratePbGrade) : null,
      '氧化锌精矿-Zn品位（%）': concentrateZnGrade ? parseFloat(concentrateZnGrade) : null,
      '尾矿-Pb全品位（%）': tailingsPbGrade ? parseFloat(tailingsPbGrade) : null,
      '尾矿-Zn全品位（%）': tailingsZnGrade ? parseFloat(tailingsZnGrade) : null,
      updated_at: new Date().toISOString()
    };

    let response;
    let operation = '';

    if (existingRecords.length > 0) {
      // 更新现有记录
      operation = 'UPDATE';
      const recordId = existingRecords[0].id;
      response = await fetch(`${supabaseUrl}/rest/v1/生产班报-FDX?id=eq.${recordId}`, {
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
      response = await fetch(`${supabaseUrl}/rest/v1/生产班报-FDX`, {
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
      console.error('❌ [班样API] Supabase错误:', errorText);
      throw new Error(`数据库操作失败: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ [班样API] 操作成功:', { operation, result });

    return NextResponse.json({
      success: true,
      message: `班样数据${operation === 'INSERT' ? '提交' : '更新'}成功！`,
      data: result,
      operation
    });

  } catch (error) {
    console.error('❌ [班样API] 处理失败:', error);
    return NextResponse.json({
      success: false,
      message: `操作失败: ${error instanceof Error ? error.message : '未知错误'}`
    }, { status: 500 });
  }
}
