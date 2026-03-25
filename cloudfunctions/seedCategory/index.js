const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  // 定义分类数据
  const categories = [
    // 市场分类
    { type: 'market', name: 'A区', sort:1 },
    { type: 'market', name: 'B区', sort: 2 },
    { type: 'market', name: 'C区', sort: 3 },
    // 商铺类型
    { type: 'shop_category', name: '服装', sort:1 },
    { type: 'shop_category', name: '电子', sort: 2 },
    { type: 'shop_category', name: '餐饮', sort: 3 }
  ];

  let insertedCount = 0;
  let skippedCount = 0;

  for (const category of categories) {
    // 检查是否已存在
    const existRes = await db.collection('category').where({
      type: category.type,
      name: category.name
    }).count();

    if (existRes.total === 0) {
      // 不存在则插入
      await db.collection('category').add({
        data: {
          ...category,
          create_time: db.serverDate(),
          update_time: db.serverDate()
        }
      });
      insertedCount++;
    } else {
      skippedCount++;
    }
  }

  return {
    success: true,
    message: '分类数据初始化完成',
    data: {
      inserted: insertedCount,
      skipped: skippedCount
    }
  };
};