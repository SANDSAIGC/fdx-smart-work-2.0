import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const date = searchParams.get('date');
    const limit = searchParams.get('limit') || '50';

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/your_table?select=*&order=created_at.desc&limit=${limit}`;

    if (id) queryUrl += `&id=eq.${id}`;
    if (date) queryUrl += `&date=eq.${date}`;

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({ success: true, data, count: data.length });
    } else {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Query failed',
        details: errorText 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Get data error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
