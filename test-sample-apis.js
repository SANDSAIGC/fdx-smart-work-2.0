// 测试样品管理API的脚本
const BASE_URL = 'http://localhost:3000';

// 测试数据
const testData = {
  shiftSample: {
    日期: '2025-06-30',
    班次: '白班',
    '氧化锌原矿-水份（%）': '12.5',
    '氧化锌原矿-Pb全品位（%）': '8.2',
    '氧化锌原矿-Zn全品位（%）': '15.6',
    '氧化锌精矿-Pb品位（%）': '45.8',
    '氧化锌精矿-Zn品位（%）': '52.3',
    '尾矿-Pb全品位（%）': '1.2',
    '尾矿-Zn全品位（%）': '2.8'
  },
  filterSample: {
    操作员: '测试用户',
    开始时间: '2025-06-30T08:00:00',
    结束时间: '2025-06-30T16:00:00',
    水份: '10.5',
    铅品位: '42.3',
    锌品位: '48.7',
    备注: '测试数据'
  },
  incomingSample: {
    计量日期: '2025-06-30',
    发货单位名称: '金鼎锌业',
    原矿类型: '氧化锌矿',
    '水份(%)': '11.2',
    Pb: '7.8',
    Zn: '14.5'
  },
  outgoingSample: {
    计量日期: '2025-06-30',
    收货单位名称: '金鼎锌业',
    样品编号: 'TEST-001',
    '水份(%)': '8.5',
    Pb: '46.2',
    Zn: '53.1'
  }
};

// 测试函数
async function testAPI(endpoint, data, name) {
  console.log(`\n🧪 测试 ${name}...`);
  try {
    const response = await fetch(`${BASE_URL}/api/samples/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${name} 测试成功:`, result.message);
      console.log('📊 返回数据:', result.data);
    } else {
      console.log(`❌ ${name} 测试失败:`, result.message);
    }
  } catch (error) {
    console.log(`💥 ${name} 测试异常:`, error.message);
  }
}

// 执行所有测试
async function runAllTests() {
  console.log('🚀 开始测试样品管理API...\n');
  
  await testAPI('shift-sample', testData.shiftSample, '班样数据提交');
  await testAPI('filter-sample', testData.filterSample, '压滤样数据提交');
  await testAPI('incoming-sample', testData.incomingSample, '进厂样数据提交');
  await testAPI('outgoing-sample', testData.outgoingSample, '出厂样数据提交');
  
  console.log('\n🎉 所有测试完成！');
}

// 如果是在Node.js环境中运行
if (typeof window === 'undefined') {
  // Node.js环境，需要安装node-fetch
  const fetch = require('node-fetch');
  runAllTests();
} else {
  // 浏览器环境
  runAllTests();
}
