/**
 * 工作页面路由工具函数
 * 实现基于数据库的工作页面路由查找逻辑
 */

/**
 * 根据工作页面名称查找对应的路由
 * @param workPageName 工作页面名称（来自用户资料表）
 * @returns 对应的页面路由，如果找不到则返回默认路由 '/lab'
 */
export async function getWorkPageRoute(workPageName: string): Promise<string> {
  try {
    console.log('🔍 [工作页面查询] 查找工作页面路由:', workPageName);
    
    // 调用API查询工作页面路由
    const response = await fetch(`/api/work-pages?name=${encodeURIComponent(workPageName)}`);
    const result = await response.json();
    
    if (result.success && result.data && result.data.length > 0) {
      const route = result.data[0].页面路由;
      console.log('✅ [工作页面查询] 找到对应路由:', route);
      return route;
    } else {
      console.log('⚠️ [工作页面查询] 未找到对应路由，使用默认路由');
      return '/lab';
    }
  } catch (error) {
    console.error('❌ [工作页面查询] 查询异常:', error);
    return '/lab';
  }
}

/**
 * 根据用户信息获取重定向路由
 * 实现文档中描述的两步查询逻辑：
 * 1. 从用户资料获取工作页面名称
 * 2. 根据工作页面名称查找对应路由
 * @param user 用户信息对象
 * @returns 重定向路由
 */
export async function getUserRedirectRoute(user: any): Promise<string> {
  try {
    console.log('🎯 [用户重定向] 开始处理用户重定向:', user.姓名 || user.name);
    console.log('🔍 [用户重定向] 用户完整信息:', JSON.stringify(user, null, 2));

    // 步骤1: 获取用户的工作页面名称
    const workPageName = user.工作页面 || user.workPage;
    console.log('📋 [用户重定向] 提取的工作页面名称:', workPageName);

    if (!workPageName || workPageName === 'demo' || workPageName === 'lab') {
      console.log('⚠️ [用户重定向] 用户无有效工作页面，使用默认路由');
      return '/lab';
    }

    // 步骤2: 根据工作页面名称查找对应路由
    console.log('🔍 [用户重定向] 开始查找工作页面路由...');
    const route = await getWorkPageRoute(workPageName);

    console.log('✅ [用户重定向] 最终重定向路由:', route);
    return route;

  } catch (error) {
    console.error('❌ [用户重定向] 处理异常:', error);
    return '/lab';
  }
}

/**
 * 兼容旧版本的角色映射逻辑（已废弃）
 * @deprecated 此函数已废弃，系统现在完全基于数据库驱动的工作页面映射
 * @param position 用户职位
 * @returns 对应的路由
 */
export function getLegacyRoleRoute(position: string): string {
  console.warn('⚠️ [已废弃] getLegacyRoleRoute函数已废弃，请使用数据库驱动的工作页面映射');
  const roleMap: Record<string, string> = {
    '总指挥': '/boss',
    '管理员': '/manager',
    '球磨工': '/ball-mill-workshop',
    '压滤工': '/filter-press-workshop',
    '化验师': '/production-control',
    '组长': '/purchase-management'
  };

  return roleMap[position] || '/lab';
}

/**
 * 智能重定向函数
 * 完全基于数据库驱动的工作页面映射，移除角色映射兜底机制
 * @param user 用户信息
 * @returns 重定向路由
 */
export async function getSmartRedirectRoute(user: any): Promise<string> {
  try {
    console.log('🎯 [智能重定向] 开始处理用户重定向:', user.姓名 || user.name);
    console.log('🔍 [智能重定向] 用户完整信息:', JSON.stringify(user, null, 2));

    // 获取用户的工作页面名称
    const workPageName = user.工作页面 || user.workPage;
    console.log('📋 [智能重定向] 提取的工作页面名称:', workPageName);

    // 如果用户有有效的工作页面名称，使用数据库驱动的映射
    if (workPageName && workPageName !== 'demo') {
      console.log('🎯 [智能重定向] 使用数据库驱动映射，工作页面:', workPageName);
      const dbRoute = await getUserRedirectRoute(user);
      console.log('✅ [智能重定向] 数据库查询结果:', dbRoute);
      return dbRoute;
    }

    // 如果用户没有有效的工作页面名称，直接使用最终兜底
    console.log('⚠️ [智能重定向] 用户无有效工作页面，使用最终兜底路由: /lab');
    return '/lab';

  } catch (error) {
    console.error('❌ [智能重定向] 处理异常:', error);
    return '/lab';
  }
}
