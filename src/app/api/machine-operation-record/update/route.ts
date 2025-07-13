import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 1. 环境变量验证
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !anonKey) {
      console.error('❌ [机器运行记录API] 环境变量未配置');
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 2. 请求数据解析和验证
    const requestData = await request.json();
    console.log('🔧 [机器运行记录API] 收到更新请求:', requestData);

    const { id, 日期, 时间, 设备状态, 情况说明, 操作员 } = requestData;

    // 3. 必填字段验证
    if (!id) {
      return NextResponse.json({
        success: false,
        error: '记录ID不能为空'
      }, { status: 400 });
    }

    if (!日期 || !时间) {
      return NextResponse.json({
        success: false,
        error: '请填写完整的日期和时间'
      }, { status: 400 });
    }

    if (!设备状态 || !['正常运行', '设备维护'].includes(设备状态)) {
      return NextResponse.json({
        success: false,
        error: '设备状态必须是"正常运行"或"设备维护"'
      }, { status: 400 });
    }

    // 4. 构建更新数据
    const updateData = {
      日期,
      时间,
      设备状态,
      情况说明: 情况说明 || null,
      操作员: 操作员 || '未知用户',
      updated_at: new Date().toISOString()
    };

    console.log('📤 [机器运行记录API] 准备更新数据:', updateData);

    // 5. 数据库更新操作
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [机器运行记录API] 数据库更新失败:', response.status, errorText);
      
      if (response.status === 404) {
        return NextResponse.json({
          success: false,
          error: '记录不存在或已被删除'
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        error: `数据库更新失败: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    // 6. 处理成功响应
    const updatedRecord = await response.json();
    console.log('✅ [机器运行记录API] 更新成功:', updatedRecord);

    return NextResponse.json({
      success: true,
      data: updatedRecord,
      message: '机器运行记录更新成功'
    });

  } catch (error) {
    console.error('❌ [机器运行记录API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器内部错误: ' + (error instanceof Error ? error.message : '未知错误')
    }, { status: 500 });
  }
}
