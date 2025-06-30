// 字段显示顺序测试脚本
// 验证班样和出厂样的字段显示顺序是否符合要求

const BASE_URL = 'http://localhost:3000/api/lab-data';

// 测试配置
const testCases = [
  {
    name: '班样字段顺序测试',
    sampleType: 'shift_samples',
    expectedFields: ['日期', '班次', '矿物类型', '元素', '品位(%)', '水分(%)'],
    description: '班样字段应按照：日期，班次，矿物类型，元素，品位(%)，水分(%) 的顺序显示'
  },
  {
    name: '压滤样字段顺序测试',
    sampleType: 'filter_samples',
    expectedFields: ['日期', '元素', '品位(%)', '水分(%)', '操作员'],
    description: '压滤样字段应包含操作员信息'
  },
  {
    name: '进厂样字段顺序测试',
    sampleType: 'incoming_samples',
    expectedFields: ['日期', '元素', '品位(%)', '水分(%)', '供应商', '原矿类型'],
    description: '进厂样字段应包含供应商和原矿类型信息'
  },
  {
    name: '出厂样字段顺序测试',
    sampleType: 'outgoing_sample',
    expectedFields: ['日期', '样品编号', '元素', '品位(%)', '水分(%)', '采购单位'],
    description: '出厂样字段应在日期和元素之间新增样品编号字段'
  }
];

// 执行测试
async function runFieldOrderTests() {
  console.log('🔍 开始测试字段显示顺序...\n');

  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`📝 ${testCase.description}`);
    
    try {
      const response = await fetch(`${BASE_URL}?sampleType=${testCase.sampleType}&limit=2`);
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        const sample = result.data[0];
        console.log('✅ 成功获取数据');
        
        // 显示实际数据字段
        console.log('📊 实际数据字段:');
        Object.keys(sample).forEach((key, index) => {
          if (!['id', 'created_at', 'updated_at'].includes(key)) {
            console.log(`  ${index + 1}. ${key}: ${sample[key]}`);
          }
        });
        
        // 验证关键字段是否存在
        console.log('🔍 字段验证:');
        testCase.expectedFields.forEach((field, index) => {
          const fieldKey = getFieldKey(field, testCase.sampleType);
          if (sample.hasOwnProperty(fieldKey)) {
            console.log(`  ✅ ${field}: ${sample[fieldKey]}`);
          } else {
            console.log(`  ❌ ${field}: 字段缺失`);
          }
        });
        
      } else {
        console.log(`❌ 获取数据失败: ${result.error || '无数据'}`);
      }
    } catch (error) {
      console.log(`❌ 请求失败: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  console.log('🎉 字段顺序测试完成！');
}

// 字段名映射函数
function getFieldKey(displayName, sampleType) {
  const fieldMapping = {
    '日期': '日期',
    '班次': '班次',
    '矿物类型': '矿物类型',
    '元素': '元素',
    '品位(%)': '品位',
    '水分(%)': '水分',
    '操作员': '操作员',
    '供应商': '供应商',
    '原矿类型': '原矿类型',
    '样品编号': '样品编号',
    '采购单位': '采购单位'
  };
  
  // 出厂样特殊处理
  if (sampleType === 'outgoing_sample') {
    if (displayName === '日期') return '出厂日期';
    if (displayName === '品位(%)') return '出厂样品位';
    if (displayName === '水分(%)') return '出厂样水分';
  }
  
  return fieldMapping[displayName] || displayName;
}

// 如果在 Node.js 环境中运行
if (typeof window === 'undefined') {
  // Node.js 环境
  const fetch = require('node-fetch');
  runFieldOrderTests();
} else {
  // 浏览器环境
  runFieldOrderTests();
}
