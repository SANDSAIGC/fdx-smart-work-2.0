/**
 * 机器运行记录表初始化脚本
 * 用于FDX SMART WORK 2.0项目
 */

// 机器运行记录数据接口
interface MachineOperationRecord {
  日期: string;
  时间: string;
  设备状态: '正常运行' | '设备维护';
  情况说明?: string;
  持续时长?: string;
  操作员: string;
}

async function initMachineOperationRecordTable() {
  try {
    console.log('🚀 [机器运行记录] 开始初始化数据表...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase环境变量未配置');
    }

    // 1. 检查表是否存在
    console.log('🔍 [机器运行记录] 检查数据表是否存在...');
    
    const checkTableUrl = `${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}?select=*&limit=1`;
    const checkResponse = await fetch(checkTableUrl, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (checkResponse.ok) {
      console.log('✅ [机器运行记录] 数据表已存在');
      
      // 检查是否有数据
      const data = await checkResponse.json();
      console.log(`📊 [机器运行记录] 当前记录数: ${data.length}`);
      
      if (data.length === 0) {
        console.log('📝 [机器运行记录] 表为空，准备插入示例数据...');
        await insertSampleData(supabaseUrl, anonKey);
      } else {
        console.log('ℹ️ [机器运行记录] 表中已有数据，跳过示例数据插入');
      }
    } else {
      console.log('❌ [机器运行记录] 数据表不存在，请先运行SQL初始化脚本');
      console.log('💡 [机器运行记录] 请执行: src/scripts/init-machine-operation-record-table.sql');
    }

    console.log('🎉 [机器运行记录] 初始化完成！');

  } catch (error) {
    console.error('❌ [机器运行记录] 初始化失败:', error);
  }
}

async function insertSampleData(supabaseUrl: string, anonKey: string) {
  try {
    console.log('📝 [机器运行记录] 插入示例数据...');

    // 示例数据
    const sampleRecords: MachineOperationRecord[] = [
      {
        日期: '2025-07-02',
        时间: '08:00',
        设备状态: '正常运行',
        情况说明: '设备运行平稳，各项指标正常',
        持续时长: '4小时',
        操作员: '张三'
      },
      {
        日期: '2025-07-02',
        时间: '12:00',
        设备状态: '正常运行',
        情况说明: '生产效率良好，无异常情况',
        持续时长: '4小时',
        操作员: '李四'
      },
      {
        日期: '2025-07-02',
        时间: '16:00',
        设备状态: '设备维护',
        情况说明: '定期保养维护，更换滤芯',
        持续时长: '2小时',
        操作员: '王五'
      },
      {
        日期: '2025-07-01',
        时间: '08:00',
        设备状态: '正常运行',
        情况说明: '设备启动正常，温度稳定',
        持续时长: '6小时',
        操作员: '张三'
      },
      {
        日期: '2025-07-01',
        时间: '14:00',
        设备状态: '正常运行',
        情况说明: '运行状态良好，产量达标',
        持续时长: '4小时',
        操作员: '赵六'
      },
      {
        日期: '2025-06-30',
        时间: '09:00',
        设备状态: '正常运行',
        情况说明: '设备运行稳定',
        持续时长: '6小时',
        操作员: '楚留香'
      },
      {
        日期: '2025-06-30',
        时间: '15:00',
        设备状态: '设备维护',
        情况说明: '例行检修，清洁设备',
        持续时长: '3小时',
        操作员: '陆小凤'
      }
    ];

    // 批量插入数据
    for (const record of sampleRecords) {
      const recordData = {
        ...record,
        创建时间: new Date().toISOString()
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/${encodeURIComponent('机器运行记录')}`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(recordData)
      });

      if (response.ok) {
        console.log(`✅ [机器运行记录] 插入记录成功: ${record.日期} ${record.时间} - ${record.操作人员}`);
      } else {
        console.error(`❌ [机器运行记录] 插入记录失败: ${record.日期} ${record.时间}`, response.statusText);
      }

      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('✅ [机器运行记录] 示例数据插入完成');

  } catch (error) {
    console.error('❌ [机器运行记录] 插入示例数据失败:', error);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initMachineOperationRecordTable();
}

export { initMachineOperationRecordTable };
