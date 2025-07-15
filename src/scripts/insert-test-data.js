// 通过API插入进厂原矿测试数据
const BASE_URL = 'http://localhost:3000';

async function insertTestData() {
  console.log('🔧 开始插入进厂原矿测试数据...\n');

  // 富鼎翔测试数据
  const fdxTestData = [
    { 计量日期: '2024-12-28', 进厂湿重: 1250.5, 水份: 8.2, Pb: 3.5, Zn: 12.8 },
    { 计量日期: '2024-12-29', 进厂湿重: 1180.3, 水份: 7.8, Pb: 3.2, Zn: 13.1 },
    { 计量日期: '2024-12-30', 进厂湿重: 1320.7, 水份: 8.5, Pb: 3.8, Zn: 12.5 },
    { 计量日期: '2024-12-31', 进厂湿重: 1290.2, 水份: 8.1, Pb: 3.6, Zn: 12.9 },
    { 计量日期: '2025-01-01', 进厂湿重: 1350.8, 水份: 7.9, Pb: 3.7, Zn: 13.2 },
    { 计量日期: '2025-01-02', 进厂湿重: 1280.4, 水份: 8.3, Pb: 3.4, Zn: 12.7 },
    { 计量日期: '2025-01-03', 进厂湿重: 1410.6, 水份: 8.0, Pb: 3.9, Zn: 13.0 }
  ];

  // 金鼎测试数据
  const jdxyTestData = [
    { 计量日期: '2024-12-28', 进厂湿重: 2150.8, 水份: 9.1, Pb: 2.8, Zn: 11.5 },
    { 计量日期: '2024-12-29', 进厂湿重: 2080.5, 水份: 8.7, Pb: 2.6, Zn: 11.8 },
    { 计量日期: '2024-12-30', 进厂湿重: 2220.3, 水份: 9.3, Pb: 3.0, Zn: 11.2 },
    { 计量日期: '2024-12-31', 进厂湿重: 2190.7, 水份: 8.9, Pb: 2.9, Zn: 11.6 },
    { 计量日期: '2025-01-01', 进厂湿重: 2250.4, 水份: 8.8, Pb: 3.1, Zn: 11.9 },
    { 计量日期: '2025-01-02', 进厂湿重: 2180.6, 水份: 9.0, Pb: 2.7, Zn: 11.4 },
    { 计量日期: '2025-01-03', 进厂湿重: 2310.2, 水份: 8.6, Pb: 3.2, Zn: 12.0 }
  ];

  try {
    // 通过Supabase API直接插入数据
    const supabaseUrl = 'http://132.232.143.210:28000';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUwNjk0NDAwLCJleHAiOjE5MDg0NjA4MDB9.1wMtd68DjY3b9BM82ynEuN2oi9KfS-FJvVLROVULq7w';

    console.log('📊 插入富鼎翔数据...');
    for (const item of fdxTestData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/进厂原矿-FDX`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          ...item,
          '水份(%)': item.水份,
          供应商: '富鼎翔矿业',
          原矿类型: '铅锌矿',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`✅ 富鼎翔 ${item.计量日期} 数据插入成功`);
      } else {
        console.log(`❌ 富鼎翔 ${item.计量日期} 数据插入失败:`, response.status);
      }
    }

    console.log('\n📊 插入金鼎数据...');
    for (const item of jdxyTestData) {
      const response = await fetch(`${supabaseUrl}/rest/v1/进厂原矿-JDXY`, {
        method: 'POST',
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          ...item,
          '水份(%)': item.水份,
          供应商: '金鼎锌业',
          原矿类型: '锌矿',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log(`✅ 金鼎 ${item.计量日期} 数据插入成功`);
      } else {
        console.log(`❌ 金鼎 ${item.计量日期} 数据插入失败:`, response.status);
      }
    }

    console.log('\n🎉 测试数据插入完成！');
    console.log('现在可以访问 http://localhost:3000/incoming-ore-details 查看页面效果');

  } catch (error) {
    console.error('❌ 插入测试数据时发生错误:', error);
  }
}

// 运行插入脚本
insertTestData();
