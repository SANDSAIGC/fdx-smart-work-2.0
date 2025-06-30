import { NextRequest, NextResponse } from 'next/server';

// 数据表映射
const TABLE_MAPPING = {
  'shift_samples': '生产日报-FDX',
  'filter_samples': '压滤样化验记录',
  'incoming_samples': '进厂原矿-FDX',
  'outgoing_sample': '出厂精矿-FDX'
};

// 获取当前用户信息的辅助函数
async function getCurrentUser(request: NextRequest): Promise<{ name: string } | null> {
  try {
    // 从请求头获取用户ID（如果有的话）
    const authHeader = request.headers.get('authorization');
    const userIdHeader = request.headers.get('x-user-id');

    // 构建当前用户API请求
    const baseUrl = request.nextUrl.origin;
    let currentUserUrl = `${baseUrl}/api/current-user`;

    if (userIdHeader) {
      currentUserUrl += `?userId=${userIdHeader}`;
    }

    const response = await fetch(currentUserUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      }
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.data) {
        console.log('✅ [Lab更新API] 成功获取当前用户:', result.data.name);
        return { name: result.data.name };
      }
    }

    console.warn('⚠️ [Lab更新API] 无法获取当前用户，使用默认化验人员');
    return { name: '系统用户' };
  } catch (error) {
    console.error('❌ [Lab更新API] 获取当前用户失败:', error);
    return { name: '系统用户' };
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { sampleType, id, data } = body;

    console.log('Lab数据更新请求:', { sampleType, id, data });

    if (!sampleType || !data) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    const tableName = TABLE_MAPPING[sampleType as keyof typeof TABLE_MAPPING];
    if (!tableName) {
      return NextResponse.json(
        { success: false, error: '无效的数据源类型' },
        { status: 400 }
      );
    }

    // 获取环境变量
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('Supabase 配置缺失');
      return NextResponse.json(
        { success: false, error: 'Supabase 配置缺失' },
        { status: 500 }
      );
    }

    // 获取当前用户信息
    const currentUser = await getCurrentUser(request);
    const 化验人员 = currentUser?.name || '系统用户';
    console.log('👤 [Lab更新API] 化验人员:', 化验人员);

    // 准备更新数据，添加更新时间和化验人员
    let updateData = {
      ...data,
      化验人员, // 自动添加当前用户作为化验人员
      updated_at: new Date().toISOString()
    };

    // 移除不应该更新的字段
    delete updateData.id;
    delete updateData.created_at;

    // 处理虚拟字段到实际数据库字段的映射
    if (sampleType === 'shift_samples') {
      // 班样数据：需要将虚拟字段映射回实际数据库字段
      const 元素 = updateData['元素'];
      const 品位 = updateData['品位'];
      const 水分 = updateData['水分'];
      const 矿物类型 = updateData['矿物类型'];

      // 根据元素和矿物类型映射到正确的数据库字段
      if (元素 === 'Zn') {
        if (矿物类型 === '氧化锌原矿') {
          updateData['氧化锌原矿-Zn全品位（%）'] = 品位;
          updateData['氧化锌原矿-水份（%）'] = 水分;
        } else if (矿物类型 === '氧化锌精矿') {
          updateData['氧化锌精矿-Zn品位（%）'] = 品位;
        }
      } else if (元素 === 'Pb') {
        if (矿物类型 === '氧化锌原矿') {
          updateData['氧化锌原矿-Pb全品位（%）'] = 品位;
          updateData['氧化锌原矿-水份（%）'] = 水分;
        } else if (矿物类型 === '氧化锌精矿') {
          updateData['氧化锌精矿-Pb品位（%）'] = 品位;
        }
      }

      // 移除虚拟字段
      delete updateData['元素'];
      delete updateData['品位'];
      delete updateData['水分'];
      delete updateData['矿物类型'];
    } else if (sampleType === 'filter_samples') {
      // 压滤样数据：映射虚拟字段
      const 元素 = updateData['元素'];
      const 品位 = updateData['品位'];
      const 水分 = updateData['水分'];

      if (元素 === 'Zn') {
        updateData['锌品位'] = 品位;
        updateData['水份'] = 水分;
      } else if (元素 === 'Pb') {
        updateData['铅品位'] = 品位;
        updateData['水份'] = 水分;
      }

      // 移除虚拟字段
      delete updateData['元素'];
      delete updateData['品位'];
      delete updateData['水分'];
    } else {
      // 其他数据类型：移除所有虚拟字段
      delete updateData['元素'];
      delete updateData['品位'];
      delete updateData['水分'];
      delete updateData['矿物类型'];
    }

    // 移除其他前端显示用的虚拟字段
    delete updateData['湿重'];
    delete updateData['干重'];
    delete updateData['氧化率'];
    delete updateData['金属量'];
    delete updateData['精矿数量'];
    delete updateData['精矿品位'];
    delete updateData['精矿金属量'];
    delete updateData['尾矿数量'];
    delete updateData['尾矿品位'];
    delete updateData['尾矿金属量'];
    delete updateData['理论回收率'];
    delete updateData['实际回收率'];
    delete updateData['回收率差异'];
    delete updateData['处理量'];
    delete updateData['作业率'];
    delete updateData['设备状态'];
    delete updateData['备注'];

    console.log('准备更新的数据:', updateData);

    // 实现UPSERT逻辑
    let response;
    let operation = '';

    if (sampleType === 'shift_samples') {
      // 班样数据：基于日期+班次的UPSERT逻辑
      const { 日期, 班次 } = updateData;

      if (!日期 || !班次) {
        return NextResponse.json(
          { success: false, error: '班样数据缺少日期或班次信息' },
          { status: 400 }
        );
      }

      // 检查是否已存在相同日期和班次的记录
      const checkUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?日期=eq.${日期}&班次=eq.${班次}`;
      const checkResponse = await fetch(checkUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!checkResponse.ok) {
        throw new Error(`查询失败: ${checkResponse.statusText}`);
      }

      const existingRecords = await checkResponse.json();
      console.log('🔍 [Lab更新API] 查询现有记录:', existingRecords);

      if (existingRecords.length > 0) {
        // 更新现有记录
        operation = 'UPDATE';
        const recordId = existingRecords[0].id;
        response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?id=eq.${recordId}`, {
          method: 'PATCH',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });
      } else {
        // 插入新记录
        operation = 'INSERT';
        response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}`, {
          method: 'POST',
          headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(updateData)
        });
      }
    } else {
      // 其他数据类型：使用ID进行更新
      if (!id) {
        return NextResponse.json(
          { success: false, error: '缺少记录ID' },
          { status: 400 }
        );
      }

      // 处理合成ID（如 "8-pb" -> "8"）
      const actualId = id.includes('-') ? id.split('-')[0] : id;
      console.log('原始ID:', id, '实际数据库ID:', actualId);

      operation = 'UPDATE';
      response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent(tableName)}?id=eq.${encodeURIComponent(actualId)}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updateData)
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase 操作错误:', {
        operation,
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return NextResponse.json(
        { success: false, error: `数据库${operation === 'UPDATE' ? '更新' : '插入'}失败: ${response.statusText}` },
        { status: response.status }
      );
    }

    const resultData = await response.json();
    console.log(`✅ 数据${operation === 'UPDATE' ? '更新' : '插入'}成功:`, resultData);

    return NextResponse.json({
      success: true,
      data: resultData,
      operation,
      message: `数据${operation === 'UPDATE' ? '更新' : '插入'}成功`
    });

  } catch (error) {
    console.error('Lab数据更新错误:', {
      message: error instanceof Error ? error.message : '未知错误',
      details: error instanceof Error ? error.stack : error
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '服务器内部错误' 
      },
      { status: 500 }
    );
  }
}
