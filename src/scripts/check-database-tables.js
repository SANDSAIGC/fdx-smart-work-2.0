// 检查数据库表结构
const BASE_URL = 'http://localhost:3000';

async function checkDatabaseTables() {
  console.log('🔍 检查数据库表结构...\n');

  try {
    const supabaseUrl = 'http://132.232.143.210:28000';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzUwNjk0NDAwLCJleHAiOjE5MDg0NjA4MDB9.1wMtd68DjY3b9BM82ynEuN2oi9KfS-FJvVLROVULq7w';

    // 检查进厂原矿-FDX表
    console.log('📊 检查进厂原矿-FDX表...');
    const fdxResponse = await fetch(`${supabaseUrl}/rest/v1/进厂原矿-FDX?select=*&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (fdxResponse.ok) {
      const fdxData = await fdxResponse.json();
      console.log('✅ 进厂原矿-FDX表存在');
      console.log(`   - 当前记录数: ${fdxData.length}`);
    } else {
      console.log('❌ 进厂原矿-FDX表不存在或无法访问:', fdxResponse.status);
      const errorText = await fdxResponse.text();
      console.log('   错误详情:', errorText);
    }

    // 检查进厂原矿-JDXY表
    console.log('\n📊 检查进厂原矿-JDXY表...');
    const jdxyResponse = await fetch(`${supabaseUrl}/rest/v1/进厂原矿-JDXY?select=*&limit=1`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (jdxyResponse.ok) {
      const jdxyData = await jdxyResponse.json();
      console.log('✅ 进厂原矿-JDXY表存在');
      console.log(`   - 当前记录数: ${jdxyData.length}`);
    } else {
      console.log('❌ 进厂原矿-JDXY表不存在或无法访问:', jdxyResponse.status);
      const errorText = await jdxyResponse.text();
      console.log('   错误详情:', errorText);
    }

    // 列出所有可用的表
    console.log('\n📋 尝试列出所有可用的表...');
    const tablesResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (tablesResponse.ok) {
      console.log('✅ 数据库连接正常');
    } else {
      console.log('❌ 数据库连接失败:', tablesResponse.status);
    }

  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

// 运行检查
checkDatabaseTables();
