#!/usr/bin/env node

/**
 * FDX SMART WORK 2.0 工作页面数据初始化脚本
 * 
 * 功能：
 * 1. 检查工作页面表是否存在
 * 2. 批量插入默认工作页面数据
 * 3. 验证数据完整性
 * 
 * 使用方法：
 * npm run init-work-pages
 * 或
 * node src/scripts/init-work-pages.ts
 */

import { config } from 'dotenv';
import path from 'path';

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env.local') });

// 工作页面数据接口
interface WorkPageData {
  路径: string;
  页面名称: string;
  描述: string;
  图标: string;
  排序: number;
  状态: '启用' | '禁用';
}

// 默认工作页面数据
const defaultWorkPages: WorkPageData[] = [
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
    路径: '/purchase-management',
    页面名称: '采购管理',
    描述: '采购申请和订单管理系统',
    图标: 'ShoppingCart',
    排序: 5,
    状态: '启用'
  },
  {
    路径: '/purchase-request',
    页面名称: '采购申请',
    描述: '采购需求申请和审批流程',
    图标: 'FileText',
    排序: 6,
    状态: '启用'
  },
  {
    路径: '/machine-operation-record',
    页面名称: '机器运行记录',
    描述: '机器设备运行状态记录和管理',
    图标: 'Settings',
    排序: 7,
    状态: '启用'
  }
];

// 初始化工作页面数据
async function initWorkPages() {
  console.log('🚀 开始初始化工作页面数据...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    console.error('❌ 环境变量未配置，请检查 .env.local 文件');
    console.error('需要配置：NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ 环境变量配置正确');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 API Key: ${anonKey.substring(0, 20)}...`);
  console.log('');

  try {
    // 1. 检查工作页面表是否存在
    console.log('🔍 检查工作页面表是否存在...');
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/工作页面?select=count&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      console.error('❌ 工作页面表不存在或无法访问');
      console.error('请先运行 SQL 脚本创建表：src/scripts/init-work-pages-table.sql');
      process.exit(1);
    }

    console.log('✅ 工作页面表存在');

    // 2. 获取现有数据
    console.log('📊 获取现有工作页面数据...');
    const existingResponse = await fetch(`${supabaseUrl}/rest/v1/工作页面?select=路径,页面名称`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    const existingData = await existingResponse.json();
    const existingPaths = new Set(existingData.map((item: any) => item.路径));
    
    console.log(`📈 现有工作页面数量: ${existingData.length}`);
    if (existingData.length > 0) {
      console.log('现有页面路径:');
      existingData.forEach((item: any) => {
        console.log(`  - ${item.路径} (${item.页面名称})`);
      });
    }
    console.log('');

    // 3. 批量插入新数据
    console.log('📝 开始批量插入工作页面数据...');
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const pageData of defaultWorkPages) {
      try {
        if (existingPaths.has(pageData.路径)) {
          console.log(`⏭️  跳过已存在的页面: ${pageData.页面名称} (${pageData.路径})`);
          skipCount++;
          continue;
        }

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
          console.log(`✅ 成功创建: ${pageData.页面名称} (${pageData.路径})`);
          successCount++;
        } else {
          const errorText = await response.text();
          console.error(`❌ 创建失败: ${pageData.页面名称} - ${errorText}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ 创建异常: ${pageData.页面名称} - ${error.message}`);
        errorCount++;
      }
    }

    // 4. 显示结果统计
    console.log('\n📊 初始化结果统计:');
    console.log(`✅ 成功创建: ${successCount} 个`);
    console.log(`⏭️  跳过已存在: ${skipCount} 个`);
    console.log(`❌ 创建失败: ${errorCount} 个`);
    console.log(`📋 总计处理: ${defaultWorkPages.length} 个`);

    // 5. 验证最终数据
    console.log('\n🔍 验证最终数据...');
    const finalResponse = await fetch(`${supabaseUrl}/rest/v1/工作页面?select=*&order=排序.asc`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    const finalData = await finalResponse.json();
    console.log(`📈 最终工作页面数量: ${finalData.length}`);
    console.log('\n📋 所有工作页面列表:');
    finalData.forEach((item: any, index: number) => {
      console.log(`  ${index + 1}. ${item.页面名称} (${item.路径}) - ${item.状态}`);
    });

    console.log('\n🎉 工作页面数据初始化完成！');

  } catch (error) {
    console.error('\n❌ 初始化过程中发生错误:', error);
    process.exit(1);
  }
}

// 运行初始化
if (require.main === module) {
  initWorkPages().catch(console.error);
}

export { initWorkPages, defaultWorkPages };
