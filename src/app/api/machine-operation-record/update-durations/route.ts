import { NextResponse } from 'next/server';

// POST - 更新所有记录的持续时长
export async function POST() {
  try {
    console.log('🔄 [持续时长更新API] 开始更新持续时长');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        message: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 调用数据库函数更新持续时长
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/update_all_durations`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ [持续时长更新API] 更新成功，影响记录数:', result);
      
      return NextResponse.json({
        success: true,
        message: '持续时长更新成功',
        data: { updatedRecords: result }
      });
    } else {
      const errorText = await response.text();
      console.error('❌ [持续时长更新API] 更新失败:', errorText);
      
      return NextResponse.json({
        success: false,
        message: '持续时长更新失败',
        error: errorText
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [持续时长更新API] 系统错误:', error);
    
    return NextResponse.json({
      success: false,
      message: '系统错误',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
