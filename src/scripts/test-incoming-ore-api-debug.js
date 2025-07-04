// 测试进厂原矿详情API的脚本 - 调试版本
const BASE_URL = 'http://localhost:3000';

async function testIncomingOreAPIDebug() {
  console.log('🔍 开始调试进厂原矿详情API...\n');

  try {
    // 测试获取富鼎翔数据
    console.log('📊 测试获取富鼎翔数据...');
    const fdxResponse = await fetch(`${BASE_URL}/api/lab/fdx-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2025-12-31'
      })
    });

    console.log('FDX Response Status:', fdxResponse.status);
    
    if (fdxResponse.ok) {
      const fdxData = await fdxResponse.json();
      console.log('✅ 富鼎翔数据获取成功');
      console.log('FDX Response:', JSON.stringify(fdxData, null, 2));
      console.log(`   - 进厂原矿记录数: ${fdxData.data?.incoming?.length || 0}`);
      if (fdxData.data?.incoming?.length > 0) {
        const sample = fdxData.data.incoming[0];
        console.log(`   - 示例记录:`, sample);
      }
    } else {
      console.log('❌ 富鼎翔数据获取失败:', fdxResponse.status);
      const errorText = await fdxResponse.text();
      console.log('错误详情:', errorText);
    }

    // 测试获取金鼎数据
    console.log('\n📊 测试获取金鼎数据...');
    const jdxyResponse = await fetch(`${BASE_URL}/api/lab/jdxy-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2025-12-31'
      })
    });

    console.log('JDXY Response Status:', jdxyResponse.status);

    if (jdxyResponse.ok) {
      const jdxyData = await jdxyResponse.json();
      console.log('✅ 金鼎数据获取成功');
      console.log('JDXY Response:', JSON.stringify(jdxyData, null, 2));
      console.log(`   - 进厂原矿记录数: ${jdxyData.data?.incoming?.length || 0}`);
      if (jdxyData.data?.incoming?.length > 0) {
        const sample = jdxyData.data.incoming[0];
        console.log(`   - 示例记录:`, sample);
      }
    } else {
      console.log('❌ 金鼎数据获取失败:', jdxyResponse.status);
      const errorText = await jdxyResponse.text();
      console.log('错误详情:', errorText);
    }

    console.log('\n🎉 API调试测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testIncomingOreAPIDebug();
