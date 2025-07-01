// Lab API 测试脚本
// 用于验证化验数据查询功能是否正常工作

const BASE_URL = 'http://localhost:3000/api/lab-data';

// 测试数据源配置
const testCases = [
  {
    name: '班样数据测试',
    sampleType: 'shift_samples',
    expectedTable: '生产班报-FDX'
  },
  {
    name: '压滤样数据测试',
    sampleType: 'filter_samples',
    expectedTable: '压滤样化验记录'
  },
  {
    name: '进厂样数据测试',
    sampleType: 'incoming_samples',
    expectedTable: '进厂原矿-FDX'
  },
  {
    name: '出厂样数据测试',
    sampleType: 'outgoing_sample',
    expectedTable: '出厂精矿-FDX'
  }
];

// 执行测试
async function runTests() {
  console.log('🧪 开始测试 Lab API 功能...\n');

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    
    try {
      // 测试基本数据获取
      const response = await fetch(`${BASE_URL}?sampleType=${testCase.sampleType}&limit=5`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ 成功获取数据: ${result.total} 条记录`);
        console.log(`📊 数据表: ${result.tableName}`);
        console.log(`🔍 预期表名: ${testCase.expectedTable}`);
        
        if (result.tableName === testCase.expectedTable) {
          console.log('✅ 数据表映射正确');
        } else {
          console.log('❌ 数据表映射错误');
        }
        
        // 显示样本数据
        if (result.data.length > 0) {
          const sample = result.data[0];
          console.log('📝 样本数据:', {
            id: sample.id,
            元素: sample.元素,
            品位: sample.品位 || sample.出厂样品位,
            水分: sample.水分 || sample.出厂样水分
          });
        }
      } else {
        console.log(`❌ 获取数据失败: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  // 测试日期范围筛选
  console.log('📅 测试日期范围筛选功能...');
  try {
    const dateResponse = await fetch(`${BASE_URL}?sampleType=shift_samples&startDate=2025-01-14&endDate=2025-01-15&limit=10`);
    const dateResult = await dateResponse.json();
    
    if (dateResult.success) {
      console.log(`✅ 日期筛选成功: ${dateResult.total} 条记录`);
      console.log(`📅 日期范围: ${dateResult.dateRange.startDate} 到 ${dateResult.dateRange.endDate}`);
    } else {
      console.log(`❌ 日期筛选失败: ${dateResult.error}`);
    }
  } catch (error) {
    console.log(`❌ 日期筛选请求失败: ${error.message}`);
  }

  console.log('\n🎉 测试完成！');
}

// 如果在 Node.js 环境中运行
if (typeof window === 'undefined') {
  // Node.js 环境
  const fetch = require('node-fetch');
  runTests();
} else {
  // 浏览器环境
  runTests();
}
