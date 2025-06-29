import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export interface RegisterRequest {
  账号: string;
  姓名: string;
  部门: string;
  电话: string;
  微信?: string;
  密码: string;
  职称?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    账号: string;
    姓名: string;
    部门: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { 账号, 姓名, 部门, 电话, 微信, 密码, 职称 }: RegisterRequest = await request.json();

    console.log('📝 [注册API] 收到注册请求:', { 账号, 姓名, 部门, 电话, 微信, 职称 });

    // 验证必填字段
    if (!账号 || !姓名 || !部门 || !电话 || !密码) {
      return NextResponse.json({
        success: false,
        message: '请填写所有必填字段'
      } as RegisterResponse);
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(电话)) {
      return NextResponse.json({
        success: false,
        message: '请输入正确的手机号码'
      } as RegisterResponse);
    }

    // 创建Supabase客户端
    const supabase = createClient();

    // 检查账号是否已存在
    const { data: existingUsers, error: checkError } = await supabase
      .from('用户资料')
      .select('账号')
      .eq('账号', 账号)
      .limit(1);

    if (checkError) {
      console.error('❌ [注册API] 检查账号存在性错误:', checkError);
      return NextResponse.json({
        success: false,
        message: '注册验证失败，请重试'
      } as RegisterResponse);
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({
        success: false,
        message: '该账号已存在，请使用其他账号'
      } as RegisterResponse);
    }

    // 插入新用户 - 使用标准化字段名
    const { data: newUser, error: insertError } = await supabase
      .from('用户资料')
      .insert([{
        账号,
        姓名,
        部门,
        联系电话: 电话,
        微信号: 微信 || '',
        密码,
        职称: 职称 || '化验师',
        工作页面: 'lab',
        状态: '正常'
      }])
      .select()
      .single();

    if (insertError) {
      console.error('❌ [注册API] 插入用户错误:', insertError);
      return NextResponse.json({
        success: false,
        message: '注册失败，请重试'
      } as RegisterResponse);
    }

    console.log('✅ [注册API] 注册成功:', { 
      账号: newUser.账号, 
      姓名: newUser.姓名,
      部门: newUser.部门 
    });

    // 返回注册成功响应
    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: newUser.id,
        账号: newUser.账号,
        姓名: newUser.姓名,
        部门: newUser.部门
      }
    } as RegisterResponse);

  } catch (error) {
    console.error('❌ [注册API] 服务器错误:', error);
    return NextResponse.json({
      success: false,
      message: '服务器错误，请稍后重试'
    } as RegisterResponse);
  }
}
