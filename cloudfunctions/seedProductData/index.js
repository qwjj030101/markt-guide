// 云函数 seedProductData
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 商品数据列表（商铺名称和商品信息）
// 你只需要在这里改商品名称、图片，商铺名称要和数据库里的一致
const productsData = [
  { shopName: "韩都衣舍", name: "夏季连衣裙", image: "https://picsum.photos/200/200?random=201" },
  { shopName: "韩都衣舍", name: "休闲衬衫", image: "https://picsum.photos/200/200?random=202" },
  { shopName: "韩都衣舍", name: "牛仔短裤", image: "https://picsum.photos/200/200?random=203" },
  { shopName: "数码港", name: "蓝牙耳机", image: "https://picsum.photos/200/200?random=204" },
  { shopName: "数码港", name: "充电宝", image: "https://picsum.photos/200/200?random=205" },
  { shopName: "数码港", name: "手机壳", image: "https://picsum.photos/200/200?random=206" },
  { shopName: "老李餐饮", name: "牛肉面", image: "https://picsum.photos/200/200?random=207" },
  { shopName: "老李餐饮", name: "酸辣粉", image: "https://picsum.photos/200/200?random=208" }
];

exports.main = async (event, context) => {
  let inserted = 0;
  let skipped = 0;

  // 先把所有商铺的名字和 _id 查出来，做成一个快速查找的字典
  const shops = await db.collection('shop').get();
  const shopMap = {};
  shops.data.forEach(shop => {
    shopMap[shop.name] = shop._id;
  });

  for (const item of productsData) {
    const shopId = shopMap[item.shopName];
    if (!shopId) {
      console.log(`找不到商铺：${item.shopName}，跳过`);
      skipped++;
      continue;
    }

    // 检查这个商品是否已经存在（根据商铺和商品名）
    const existing = await db.collection('product')
      .where({
        shop_id: shopId,
        name: item.name
      })
      .get();
    if (existing.data.length > 0) {
      console.log(`商品 ${item.name} 已存在，跳过`);
      skipped++;
      continue;
    }

    // 插入新商品
    await db.collection('product').add({
      data: {
        shop_id: shopId,
        name: item.name,
        image: item.image
      }
    });
    inserted++;
  }

  return {
    success: true,
    message: `导入完成，新增 ${inserted} 条，跳过 ${skipped} 条（已存在或商铺不存在）`
  };
};