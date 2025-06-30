// 测试API路由的脚本
const testData = {
  sampleType: 'shift_samples',
  id: '6-pb',
  data: {
    id: '6-pb',
    '日期': '2025-01-15',
    '班次': '白班',
    created_at: '2025-06-29T22:00:59.024106+00:00',
    updated_at: '2025-06-29T22:00:59.024106+00:00',
    '元素': 'Pb',
    '品位': 3.5,
    '水分': 8.2,
    '矿物类型': '氧化锌原矿',
    '氧化锌原矿-湿重（t）': 1111
  }
};

console.log('测试数据:', JSON.stringify(testData, null, 2));

// 模拟API路由的数据处理逻辑
const updateData = {
  ...testData.data,
  updated_at: new Date().toISOString()
};

// 移除不应该更新的字段
delete updateData.id;
delete updateData.created_at;

// 移除前端显示用的虚拟字段（这些字段在数据库中不存在）
delete updateData['元素'];
delete updateData['品位'];
delete updateData['水分'];
delete updateData['矿物类型'];
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

console.log('处理后的数据:', JSON.stringify(updateData, null, 2));
