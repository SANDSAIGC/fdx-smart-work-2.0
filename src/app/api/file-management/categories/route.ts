import { NextRequest, NextResponse } from 'next/server';

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

    // 查询文件分类
    const categoriesUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件分类')}?select=*&是否启用=eq.true&order=排序顺序.asc`;
    
    const categoriesResponse = await fetch(categoriesUrl, {
      method: 'GET',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!categoriesResponse.ok) {
      console.error('查询文件分类失败:', categoriesResponse.status, categoriesResponse.statusText);
      return NextResponse.json(
        { success: false, message: '查询分类失败' },
        { status: 500 }
      );
    }

    const categories = await categoriesResponse.json();

    // 查询每个分类的文件数量
    const categoriesWithCount = await Promise.all(
      categories.map(async (category: any) => {
        try {
          let countUrl;
          if (category.id === 'all') {
            // 全部文件：统计所有活跃文件
            countUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件管理')}?select=id&状态=eq.active`;
          } else {
            // 特定分类：统计该分类下的活跃文件
            countUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件管理')}?select=id&状态=eq.active&分类ID=eq.${encodeURIComponent(category.id)}`;
          }

          const countResponse = await fetch(countUrl, {
            method: 'GET',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'count=exact'
            },
            signal: AbortSignal.timeout(5000)
          });

          let count = 0;
          if (countResponse.ok) {
            const countHeader = countResponse.headers.get('content-range');
            if (countHeader) {
              const match = countHeader.match(/\/(\d+)$/);
              count = match ? parseInt(match[1]) : 0;
            }
          }

          return {
            id: category.id,
            name: category.分类名称,
            description: category.分类描述,
            icon: category.图标名称,
            color: category.颜色,
            count: count,
            parentId: category.父级分类ID,
            sortOrder: category.排序顺序,
            enabled: category.是否启用
          };
        } catch (error) {
          console.error(`获取分类 ${category.id} 文件数量失败:`, error);
          return {
            id: category.id,
            name: category.分类名称,
            description: category.分类描述,
            icon: category.图标名称,
            color: category.颜色,
            count: 0,
            parentId: category.父级分类ID,
            sortOrder: category.排序顺序,
            enabled: category.是否启用
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithCount
    });

  } catch (error) {
    console.error('文件分类API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// 创建新分类
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { success: false, message: 'Supabase配置错误' },
        { status: 500 }
      );
    }

    const { id, name, description, icon, color, parentId, sortOrder } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { success: false, message: '分类ID和名称是必需的' },
        { status: 400 }
      );
    }

    const categoryData = {
      id,
      分类名称: name,
      分类描述: description || '',
      图标名称: icon || 'Folder',
      颜色: color || 'gray',
      父级分类ID: parentId || null,
      排序顺序: sortOrder || 0,
      是否启用: true
    };

    const insertUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('文件分类')}`;
    const response = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(categoryData),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('创建分类失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { success: false, message: '创建分类失败' },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: '分类创建成功',
      data: result[0]
    });

  } catch (error) {
    console.error('创建分类API错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
}
