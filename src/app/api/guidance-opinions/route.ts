import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('Supabase配置缺失');
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { date, subject, content } = body;

    // 数据验证
    if (!date || !subject || !content) {
      return NextResponse.json(
        { success: false, message: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, message: '日期格式不正确' },
        { status: 400 }
      );
    }

    // 验证主题长度
    if (subject.trim().length === 0 || subject.length > 255) {
      return NextResponse.json(
        { success: false, message: '主题长度应在1-255个字符之间' },
        { status: 400 }
      );
    }

    // 验证正文长度
    if (content.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: '正文内容不能为空' },
        { status: 400 }
      );
    }

    // 构建插入数据
    const insertData = {
      日期: date,
      主题: subject.trim(),
      正文: content.trim(),
      状态: 'active'
    };

    // 构建Supabase API URL
    const insertUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('科力指导意见')}`;

    // 发送插入请求到Supabase
    const response = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(insertData),
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase插入失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { success: false, message: '数据保存失败，请重试' },
        { status: 500 }
      );
    }

    const result = await response.json();
    
    console.log('指导意见提交成功:', {
      id: result[0]?.id,
      date: result[0]?.日期,
      subject: result[0]?.主题
    });

    return NextResponse.json({
      success: true,
      message: '指导意见提交成功',
      data: result[0]
    });

  } catch (error) {
    console.error('API路由错误:', error);
    
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: '请求数据格式错误' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 可选：添加GET方法来获取指导意见列表
export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';
    const offset = searchParams.get('offset') || '0';

    // 构建查询URL
    const queryUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('科力指导意见')}?select=*&order=创建时间.desc&limit=${limit}&offset=${offset}`;

    const response = await fetch(queryUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error('查询指导意见失败:', response.status, response.statusText);
      return NextResponse.json(
        { success: false, message: '查询失败' },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      total: data.length
    });

  } catch (error) {
    console.error('GET API路由错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
