// 测试数据表是否存在
const BASE_URL = 'http://localhost:3000';

async function testTableExists(tableName) {
  try {
    const response = await fetch(`${BASE_URL}/api/lab-data?sampleType=custom&tableName=${encodeURIComponent(tableName)}&limit=1`);
    const result = await response.json();
    
    if (response.ok) {
      console.log(`✅ 表 "${tableName}" 存在`);
      return true;
    } else {
      console.log(`❌ 表 "${tableName}" 不存在或无法访问: ${result.error || response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`💥 测试表 "${tableName}" 时发生错误: ${error.message}`);
    return false;
  }
}

async function testAllTables() {
  console.log('🔍 开始测试所有样品数据表是否存在...\n');
  
  const tables = [
    '生产班报-FDX',
    '压滤样化验记录', 
    '进厂原矿-FDX',
    '出厂精矿-FDX',
    '出厂样内部取样',
    '精矿堆摸底样'
  ];

  const results = [];
  
  for (const table of tables) {
    const exists = await testTableExists(table);
    results.push({ table, exists });
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n📊 测试结果汇总:');
  results.forEach(result => {
    console.log(`${result.exists ? '✅' : '❌'} ${result.table}`);
  });

  const existingCount = results.filter(r => r.exists).length;
  const totalCount = results.length;
  
  console.log(`\n🎯 总体结果: ${existingCount}/${totalCount} 个数据表存在`);
  
  const missingTables = results.filter(r => !r.exists).map(r => r.table);
  if (missingTables.length > 0) {
    console.log('\n⚠️ 缺失的数据表:');
    missingTables.forEach(table => {
      console.log(`   - ${table}`);
    });
  }
}

// 运行测试
testAllTables();
