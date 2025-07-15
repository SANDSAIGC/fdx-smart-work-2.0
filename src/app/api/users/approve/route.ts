import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: '用户ID不能为空' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Supabase配置缺失' },
        { status: 500 }
      );
    }

    // 更新用户状态为"正常"
    const updateUrl = `${supabaseUrl}/rest/v1/用户资料?id=eq.${userId}`;
    
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        状态: '正常'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('审核用户失败:', errorText);
      return NextResponse.json(
        { error: '审核用户失败' },
        { status: response.status }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: '用户审核成功' 
    });

  } catch (error) {
    console.error('审核用户API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}
