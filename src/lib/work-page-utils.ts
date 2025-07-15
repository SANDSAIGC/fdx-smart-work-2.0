/**
 * 工作页面路由工具函数
 * 实现简化的直接路由查找逻辑（架构优化版本）
 */

/**
 * 根据用户信息获取重定向路由
 * 简化版本：直接从用户资料表的"重定向路由"字段获取路由值
 * @param user 用户信息对象
 * @returns 重定向路由
 */
export function getUserRedirectRoute(user: any): string {
  try {
    console.log('🎯 [用户重定向] 开始处理用户重定向:', user.姓名 || user.name);
    console.log('🔍 [用户重定向] 用户完整信息:', JSON.stringify(user, null, 2));

    // 直接获取用户的重定向路由
    const redirectRoute = user.重定向路由 || user.redirectRoute;
    console.log('📋 [用户重定向] 提取的重定向路由:', redirectRoute);

    if (!redirectRoute || redirectRoute === '' || redirectRoute === 'demo') {
      console.log('⚠️ [用户重定向] 用户无有效重定向路由，使用默认路由');
      return '/lab';
    }

    console.log('✅ [用户重定向] 最终重定向路由:', redirectRoute);
    return redirectRoute;

  } catch (error) {
    console.error('❌ [用户重定向] 处理异常:', error);
    return '/lab';
  }
}

/**
 * 智能重定向函数
 * 简化版本：直接从用户资料表获取重定向路由，无需复杂的数据库查询
 * @param user 用户信息
 * @returns 重定向路由
 */
export function getSmartRedirectRoute(user: any): string {
  try {
    console.log('🎯 [智能重定向] 开始处理用户重定向:', user.姓名 || user.name);
    console.log('🔍 [智能重定向] 用户完整信息:', JSON.stringify(user, null, 2));

    // 直接获取用户的重定向路由
    const redirectRoute = user.重定向路由 || user.redirectRoute;
    console.log('📋 [智能重定向] 提取的重定向路由:', redirectRoute);

    if (!redirectRoute || redirectRoute === '' || redirectRoute === 'demo') {
      console.log('⚠️ [智能重定向] 用户无有效重定向路由，使用默认路由');
      return '/lab';
    }

    console.log('✅ [智能重定向] 最终重定向路由:', redirectRoute);
    return redirectRoute;

  } catch (error) {
    console.error('❌ [智能重定向] 处理异常:', error);
    return '/lab';
  }
}
