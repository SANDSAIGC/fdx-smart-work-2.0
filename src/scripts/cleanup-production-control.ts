/**
 * 清理 production-control 相关配置的脚本
 * 用于移除已删除页面的所有引用
 */

// import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function cleanupProductionControl() {
  try {
    console.log('🧹 [清理] 开始清理 production-control 相关配置...');

    // 1. 查找使用 production-control 重定向的用户
    console.log('🔍 [清理] 查找使用 production-control 重定向的用户...');
    
    const queryUrl = `${supabaseUrl}/rest/v1/用户资料?select=*&重定向路由=eq./production-control`;
    const response = await fetch(queryUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const users = await response.json();
      console.log('📋 [清理] 找到使用 production-control 的用户:', users);

      // 2. 更新用户重定向路由
      for (const user of users) {
        console.log(`🔄 [清理] 更新用户 ${user.姓名}(${user.账号}) 的重定向路由...`);
        
        // 根据用户职称分配合适的重定向路由
        let newRedirectRoute = '/lab'; // 默认路由
        
        if (user.职称 === '师傅') {
          newRedirectRoute = '/ball-mill-workshop'; // 师傅重定向到球磨车间
        } else if (user.职称 === '总指挥') {
          newRedirectRoute = '/boss';
        } else if (user.职称 === '经理' || user.职称 === '管理员') {
          newRedirectRoute = '/manager';
        } else if (user.职称 === '化验师') {
          newRedirectRoute = '/lab';
        }

        // 更新用户重定向路由
        const updateUrl = `${supabaseUrl}/rest/v1/用户资料?id=eq.${user.id}`;
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            重定向路由: newRedirectRoute
          })
        });

        if (updateResponse.ok) {
          console.log(`✅ [清理] 用户 ${user.姓名} 重定向路由已更新为: ${newRedirectRoute}`);
        } else {
          console.error(`❌ [清理] 更新用户 ${user.姓名} 失败:`, updateResponse.statusText);
        }
      }
    }

    // 3. 清理工作页面表中的 production-control 记录
    console.log('🗑️ [清理] 清理工作页面表中的 production-control 记录...');
    
    const deleteUrl = `${supabaseUrl}/rest/v1/工作页面?路径=eq./production-control`;
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (deleteResponse.ok) {
      console.log('✅ [清理] 工作页面表中的 production-control 记录已删除');
    } else {
      console.log('ℹ️ [清理] 工作页面表中未找到 production-control 记录或删除失败');
    }

    console.log('🎉 [清理] production-control 清理完成！');

  } catch (error) {
    console.error('❌ [清理] 清理过程中发生错误:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanupProductionControl();
}

export { cleanupProductionControl };
