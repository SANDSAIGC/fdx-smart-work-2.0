import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const { email }: ForgotPasswordRequest = await request.json();

    console.log('🔄 [忘记密码API] 收到重置请求:', { email });

    if (!email) {
      return NextResponse.json({
        success: false,
        message: '请输入账号或邮箱'
      } as ForgotPasswordResponse);
    }

    // 创建Supabase客户端
    const supabase = createClient();

    // 查询用户是否存在
    const { data: users, error } = await supabase
      .from('用户资料')
      .select('账号, 姓名, 电话')
      .eq('账号', email)
      .limit(1);

    if (error) {
      console.error('❌ [忘记密码API] 数据库查询错误:', error);
      return NextResponse.json({
        success: false,
        message: '系统错误，请稍后重试'
      } as ForgotPasswordResponse);
    }

    if (!users || users.length === 0) {
      console.log('❌ [忘记密码API] 账号不存在');
      // 为了安全考虑，即使账号不存在也返回成功消息
      return NextResponse.json({
        success: true,
        message: '如果该账号存在，密码重置链接已发送到您的邮箱'
      } as ForgotPasswordResponse);
    }

    const user = users[0];
    console.log('✅ [忘记密码API] 找到用户:', { 
      账号: user.账号, 
      姓名: user.姓名 
    });

    // TODO: 实际项目中需要实现以下功能：
    // 1. 生成密码重置令牌
    // 2. 将令牌存储到数据库（带过期时间）
    // 3. 发送包含重置链接的邮件
    // 4. 创建密码重置页面处理令牌验证和密码更新

    // 模拟邮件发送成功
    console.log('📧 [忘记密码API] 模拟发送重置邮件');

    return NextResponse.json({
      success: true,
      message: '密码重置链接已发送到您的邮箱，请查收'
    } as ForgotPasswordResponse);

  } catch (error) {
    console.error('❌ [忘记密码API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    } as ForgotPasswordResponse);
  }
}
