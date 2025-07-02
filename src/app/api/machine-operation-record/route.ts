import { NextRequest, NextResponse } from 'next/server';

// 机器运行记录数据接口
interface MachineOperationRecord {
  id?: string;
  日期: string;
  时间: string;
  设备状态: '正常运行' | '设备维护';
  情况说明?: string;
  持续时长?: string;
  操作员: string;
  创建时间?: string;
}

// GET - 获取机器运行记录
export async function GET(request: NextRequest) {
  try {
    console.log('📋 [机器运行记录API] 收到获取记录请求');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 构建查询URL - 按日期和时间倒序排列
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?select=*&order=日期.desc,时间.desc`;

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ [机器运行记录API] Supabase请求失败:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: '获取记录失败'
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('✅ [机器运行记录API] 成功获取记录:', data.length, '条');

    return NextResponse.json({
      success: true,
      data: data || [],
      message: `成功获取 ${data.length} 条记录`
    });

  } catch (error) {
    console.error('❌ [机器运行记录API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}

// POST - 创建新的机器运行记录
export async function POST(request: NextRequest) {
  try {
    console.log('📝 [机器运行记录API] 收到创建记录请求');

    const body = await request.json();
    const { 日期, 时间, 设备状态, 情况说明, 持续时长, 操作员 }: MachineOperationRecord = body;

    // 验证必填字段
    if (!日期 || !时间 || !设备状态 || !操作员) {
      return NextResponse.json({
        success: false,
        message: '请填写所有必填字段'
      }, { status: 400 });
    }

    // 验证设备状态值
    if (!['正常运行', '设备维护'].includes(设备状态)) {
      return NextResponse.json({
        success: false,
        message: '设备状态值无效'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 准备数据
    const recordData = {
      日期,
      时间,
      设备状态,
      情况说明: 情况说明 || null,
      持续时长: null, // 持续时长在前端动态计算，数据库不存储
      操作员,
      创建时间: new Date().toISOString()
    };

    console.log('📤 [机器运行记录API] 准备插入数据:', recordData);

    // 插入数据到Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(recordData)
    });

    if (!response.ok) {
      console.error('❌ [机器运行记录API] Supabase插入失败:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: '创建记录失败'
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('✅ [机器运行记录API] 记录创建成功:', result);

    return NextResponse.json({
      success: true,
      data: result[0] || recordData,
      message: '记录创建成功'
    });

  } catch (error) {
    console.error('❌ [机器运行记录API] 创建记录错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}

// PUT - 更新机器运行记录
export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 [机器运行记录API] 收到更新记录请求');

    const body = await request.json();
    const { id, 日期, 时间, 设备状态, 情况说明, 持续时长, 操作员 }: MachineOperationRecord = body;

    // 验证必填字段
    if (!id || !日期 || !时间 || !设备状态 || !操作员) {
      return NextResponse.json({
        success: false,
        message: '请填写所有必填字段'
      }, { status: 400 });
    }

    // 验证设备状态值
    if (!['正常运行', '设备维护'].includes(设备状态)) {
      return NextResponse.json({
        success: false,
        message: '设备状态值无效'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 准备更新数据
    const updateData = {
      日期,
      时间,
      设备状态,
      情况说明: 情况说明 || null,
      持续时长: null, // 持续时长在前端动态计算，数据库不存储
      操作员
    };

    console.log('🔄 [机器运行记录API] 准备更新数据:', updateData);

    // 更新数据到Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?id=eq.${id}`, {
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
      console.error('❌ [机器运行记录API] Supabase更新失败:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: '更新记录失败'
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('✅ [机器运行记录API] 记录更新成功:', result);

    return NextResponse.json({
      success: true,
      data: result[0] || updateData,
      message: '记录更新成功'
    });

  } catch (error) {
    console.error('❌ [机器运行记录API] 更新记录错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}

// DELETE - 删除机器运行记录
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ [机器运行记录API] 收到删除记录请求');

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: '缺少记录ID'
      }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    console.log('🗑️ [机器运行记录API] 准备删除记录ID:', id);

    // 从Supabase删除数据
    const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ [机器运行记录API] Supabase删除失败:', response.status, response.statusText);
      return NextResponse.json({
        success: false,
        message: '删除记录失败'
      }, { status: 500 });
    }

    console.log('✅ [机器运行记录API] 记录删除成功');

    return NextResponse.json({
      success: true,
      message: '记录删除成功'
    });

  } catch (error) {
    console.error('❌ [机器运行记录API] 删除记录错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器内部错误'
    }, { status: 500 });
  }
}
