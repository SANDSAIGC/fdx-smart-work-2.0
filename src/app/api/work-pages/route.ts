import { NextRequest, NextResponse } from 'next/server';

// 工作页面接口定义
export interface WorkPage {
  id?: string;
  路径: string;
  页面名称: string;
  描述?: string;
  图标?: string;
  排序?: number;
  状态: '启用' | '禁用';
  创建时间?: string;
  更新时间?: string;
}

// 预定义的工作页面数据
const defaultWorkPages: Omit<WorkPage, 'id' | '创建时间' | '更新时间'>[] = [
  {
    路径: '/ball-mill-workshop',
    页面名称: '球磨车间',
    描述: '球磨机操作和监控工作台',
    图标: 'Settings',
    排序: 1,
    状态: '启用'
  },
  {
    路径: '/boss',
    页面名称: '总指挥工作台',
    描述: '总指挥管理和决策支持系统',
    图标: 'Crown',
    排序: 2,
    状态: '启用'
  },
  {
    路径: '/filter-press-workshop',
    页面名称: '压滤车间',
    描述: '压滤机操作和数据管理工作台',
    图标: 'Filter',
    排序: 3,
    状态: '启用'
  },
  {
    路径: '/manager',
    页面名称: '管理员工作台',
    描述: '部门管理和流程监控系统',
    图标: 'UserCheck',
    排序: 4,
    状态: '启用'
  },
  {
    路径: '/production-control',
    页面名称: '生产控制',
    描述: '生产流程控制和数据监控',
    图标: 'Activity',
    排序: 5,
    状态: '启用'
  },
  {
    路径: '/purchase-management',
    页面名称: '采购管理',
    描述: '采购申请和订单管理系统',
    图标: 'ShoppingCart',
    排序: 6,
    状态: '启用'
  },
  {
    路径: '/purchase-request',
    页面名称: '采购申请',
    描述: '采购需求申请和审批流程',
    图标: 'FileText',
    排序: 7,
    状态: '启用'
  }
];

// GET - 获取工作页面列表
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
    const path = searchParams.get('path');
    const status = searchParams.get('status');
    const name = searchParams.get('name'); // 新增：根据页面名称查询

    // 构建查询URL
    let queryUrl = `${supabaseUrl}/rest/v1/工作页面?select=*&order=id.asc`;

    if (path) {
      queryUrl += `&页面路由=eq.${encodeURIComponent(path)}`;
    }
    if (status) {
      queryUrl += `&状态=eq.${encodeURIComponent(status)}`;
    }
    if (name) {
      queryUrl += `&页面名称=eq.${encodeURIComponent(name)}`;
    }

    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API Error:', errorText);
      return NextResponse.json({
        success: false,
        error: `Database query failed: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      count: data.length
    });

  } catch (error) {
    console.error('Get work pages error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - 创建工作页面或批量初始化
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
    
    // 检查是否是批量初始化请求
    if (requestData.action === 'initialize') {
      console.log('🚀 [工作页面] 开始批量初始化默认工作页面');
      
      const results = [];
      for (const pageData of defaultWorkPages) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/工作页面`, {
            method: 'POST',
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${anonKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(pageData)
          });

          if (response.ok) {
            const data = await response.json();
            results.push({ success: true, data: data[0] || pageData });
            console.log(`✅ [工作页面] 成功创建: ${pageData.页面名称} (${pageData.路径})`);
          } else {
            const errorText = await response.text();
            console.error(`❌ [工作页面] 创建失败: ${pageData.页面名称}`, errorText);
            results.push({ success: false, error: errorText, data: pageData });
          }
        } catch (error) {
          console.error(`❌ [工作页面] 创建异常: ${pageData.页面名称}`, error);
          results.push({ success: false, error: error.message, data: pageData });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`🎯 [工作页面] 批量初始化完成: 成功 ${successCount} 个，失败 ${failCount} 个`);

      return NextResponse.json({
        success: true,
        message: `批量初始化完成: 成功 ${successCount} 个，失败 ${failCount} 个`,
        results: results,
        summary: {
          total: defaultWorkPages.length,
          success: successCount,
          failed: failCount
        }
      });
    }

    // 单个工作页面创建
    const response = await fetch(`${supabaseUrl}/rest/v1/工作页面`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Create work page error:', errorText);
      return NextResponse.json({
        success: false,
        error: `Failed to create work page: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data[0] || requestData,
      message: 'Work page created successfully'
    });

  } catch (error) {
    console.error('Create work page error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
