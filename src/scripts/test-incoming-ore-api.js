// 测试进厂原矿详情API的脚本
const BASE_URL = 'http://localhost:3000';

async function testIncomingOreAPI() {
  console.log('🧪 开始测试进厂原矿详情API...\n');

  try {
    // 测试获取富鼎翔数据
    console.log('📊 测试获取富鼎翔数据...');
    const fdxResponse = await fetch(`${BASE_URL}/api/lab/fdx-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
    });

    if (fdxResponse.ok) {
      const fdxData = await fdxResponse.json();
      console.log('✅ 富鼎翔数据获取成功');
      console.log(`   - 进厂原矿记录数: ${fdxData.data?.incoming?.length || 0}`);
      if (fdxData.data?.incoming?.length > 0) {
        const sample = fdxData.data.incoming[0];
        console.log(`   - 示例记录: ${sample.计量日期} - 湿重:${sample.进厂湿重}t`);
      }
    } else {
      console.log('❌ 富鼎翔数据获取失败:', fdxResponse.status);
    }

    // 测试获取金鼎数据
    console.log('\n📊 测试获取金鼎数据...');
    const jdxyResponse = await fetch(`${BASE_URL}/api/lab/jdxy-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      })
    });

    if (jdxyResponse.ok) {
      const jdxyData = await jdxyResponse.json();
      console.log('✅ 金鼎数据获取成功');
      console.log(`   - 进厂原矿记录数: ${jdxyData.data?.incoming?.length || 0}`);
      if (jdxyData.data?.incoming?.length > 0) {
        const sample = jdxyData.data.incoming[0];
        console.log(`   - 示例记录: ${sample.计量日期} - 湿重:${sample.进厂湿重}t`);
      }
    } else {
      console.log('❌ 金鼎数据获取失败:', jdxyResponse.status);
    }

    // 测试新的进厂原矿详情API
    console.log('\n📊 测试进厂原矿详情API...');
    const detailsResponse = await fetch(`${BASE_URL}/api/incoming-ore-details`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        dataSource: 'fdx'
      })
    });

    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      console.log('✅ 进厂原矿详情API测试成功');
      console.log(`   - 返回记录数: ${detailsData.data?.length || 0}`);
    } else {
      console.log('❌ 进厂原矿详情API测试失败:', detailsResponse.status);
    }

    console.log('\n🎉 API测试完成！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

// 运行测试
testIncomingOreAPI();
