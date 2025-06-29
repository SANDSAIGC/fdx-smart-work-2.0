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
    const status = searchParams.get('status');
    const applicant = searchParams.get('applicant');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/采购申请?select=*`;

    // 添加筛选条件
    if (id) {
      queryUrl += `&id=eq.${id}`;
    }
    if (status && status !== 'all') {
      queryUrl += `&完成状态=eq.${encodeURIComponent(status)}`;
    }
    if (applicant && applicant !== 'all') {
      queryUrl += `&申请者=eq.${encodeURIComponent(applicant)}`;
    }
    if (search) {
      queryUrl += `&or=(品名.ilike.%${encodeURIComponent(search)}%,用途.ilike.%${encodeURIComponent(search)}%,申请者.ilike.%${encodeURIComponent(search)}%)`;
    }

    // 添加排序和分页
    queryUrl += `&order=created_at.desc`;
    const offset = (page - 1) * limit;
    queryUrl += `&limit=${limit}&offset=${offset}`;

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // 映射中文字段到英文接口
      const mappedData = data.map((item: any) => ({
        id: item.id,
        date: item.日期,
        applicant: item.申请者,
        itemName: item.品名,
        quantity: item.数量,
        purpose: item.用途,
        expectedDate: item.期望完成日期,
        status: item.完成状态,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      return NextResponse.json({ success: true, data: mappedData });
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
    console.error('Get purchase requests error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    const requestData = await request.json();

    // 映射英文字段到中文字段
    const chineseData = {
      日期: requestData.date,
      申请者: requestData.applicant,
      品名: requestData.itemName,
      数量: requestData.quantity,
      用途: requestData.purpose,
      期望完成日期: requestData.expectedDate || null,
      完成状态: requestData.status || '待处理',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const response = await fetch(`${supabaseUrl}/rest/v1/采购申请`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(chineseData)
    });

    if (response.ok) {
      const data = await response.json();
      const createdItem = data[0];
      
      // 映射返回数据
      const mappedItem = {
        id: createdItem.id,
        date: createdItem.日期,
        applicant: createdItem.申请者,
        itemName: createdItem.品名,
        quantity: createdItem.数量,
        purpose: createdItem.用途,
        expectedDate: createdItem.期望完成日期,
        status: createdItem.完成状态,
        created_at: createdItem.created_at,
        updated_at: createdItem.updated_at
      };

      return NextResponse.json({ success: true, data: mappedItem });
    } else {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Create failed',
        details: errorText 
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Create purchase request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID is required'
      }, { status: 400 });
    }

    // 映射英文字段到中文字段
    const chineseUpdateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updateData.date) chineseUpdateData.日期 = updateData.date;
    if (updateData.applicant) chineseUpdateData.申请者 = updateData.applicant;
    if (updateData.itemName) chineseUpdateData.品名 = updateData.itemName;
    if (updateData.quantity !== undefined) chineseUpdateData.数量 = updateData.quantity;
    if (updateData.purpose) chineseUpdateData.用途 = updateData.purpose;
    if (updateData.expectedDate !== undefined) chineseUpdateData.期望完成日期 = updateData.expectedDate;
    if (updateData.status) chineseUpdateData.完成状态 = updateData.status;

    const response = await fetch(`${supabaseUrl}/rest/v1/采购申请?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(chineseUpdateData)
    });

    if (response.ok) {
      const data = await response.json();
      const updatedItem = data[0];

      // 映射返回数据
      const mappedItem = {
        id: updatedItem.id,
        date: updatedItem.日期,
        applicant: updatedItem.申请者,
        itemName: updatedItem.品名,
        quantity: updatedItem.数量,
        purpose: updatedItem.用途,
        expectedDate: updatedItem.期望完成日期,
        status: updatedItem.完成状态,
        created_at: updatedItem.created_at,
        updated_at: updatedItem.updated_at
      };

      return NextResponse.json({ success: true, data: mappedItem });
    } else {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Update failed',
        details: errorText
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Update purchase request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({
        success: false,
        error: 'Environment variables not configured'
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID is required'
      }, { status: 400 });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/采购申请?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorText = await response.text();
      console.error('Supabase error:', errorText);
      return NextResponse.json({
        success: false,
        error: 'Delete failed',
        details: errorText
      }, { status: response.status });
    }
  } catch (error) {
    console.error('Delete purchase request error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
