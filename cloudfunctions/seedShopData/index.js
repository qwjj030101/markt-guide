// 云函数 seedShopData
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// 要导入的商铺数据（只保留有效部分，省略 id 和 _id）
const shopsData = [
  { name: "韩都衣舍", avatar: "cloud://cloud1-9guxzqosc70e21d1.636c-cloud1-9guxzqosc70e21d1-1408904578/portrait1.jpg", phone: "13800138001", address: "A区101号", lat: 23.123, lng: 113.456, description: "韩版女装，时尚潮流", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "潮流前线", avatar: "cloud://cloud1-9guxzqosc70e21d1.636c-cloud1-9guxzqosc70e21d1-1408904578/portrait2.jpg", phone: "13800138002", address: "A区102号", lat: 23.124, lng: 113.457, description: "休闲男装，商务正装", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "数码港", avatar: "cloud://cloud1-9guxzqosc70e21d1.636c-cloud1-9guxzqosc70e21d1-1408904578/portrait3.jpg", phone: "13800138003", address: "B区201号", lat: 23.125, lng: 113.458, description: "手机、电脑、数码配件", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "老李餐饮", avatar: "cloud://cloud1-9guxzqosc70e21d1.636c-cloud1-9guxzqosc70e21d1-1408904578/portrait5.jpg", phone: "13800138004", address: "C区301号", lat: 23.126, lng: 113.459, description: "快餐、简餐、外卖", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "雅戈尔服饰", avatar: "https://picsum.photos/200/200?random=105", phone: "13800138005", address: "A区103号", lat: 23.127, lng: 113.460, description: "商务男装，衬衫专家", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "小米之家", avatar: "https://picsum.photos/200/200?random=106", phone: "13800138006", address: "B区202号", lat: 23.128, lng: 113.461, description: "小米手机、智能家居", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "海底捞火锅", avatar: "https://picsum.photos/200/200?random=107", phone: "13800138007", address: "C区302号", lat: 23.129, lng: 113.462, description: "火锅、川菜", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "耐克专卖", avatar: "https://picsum.photos/200/200?random=108", phone: "13800138008", address: "A区104号", lat: 23.130, lng: 113.463, description: "运动鞋服", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "华为体验店", avatar: "https://picsum.photos/200/200?random=109", phone: "13800138009", address: "B区203号", lat: 23.131, lng: 113.464, description: "华为手机、平板", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "星巴克咖啡", avatar: "https://picsum.photos/200/200?random=110", phone: "13800138010", address: "C区303号", lat: 23.132, lng: 113.465, description: "咖啡、甜点", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "优衣库", avatar: "https://picsum.photos/200/200?random=111", phone: "13800138011", address: "A区105号", lat: 23.133, lng: 113.466, description: "基本款服饰", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "OPPO专卖", avatar: "https://picsum.photos/200/200?random=112", phone: "13800138012", address: "B区204号", lat: 23.134, lng: 113.467, description: "OPPO手机、耳机", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "肯德基", avatar: "https://picsum.photos/200/200?random=113", phone: "13800138013", address: "C区304号", lat: 23.135, lng: 113.468, description: "炸鸡、汉堡", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "ZARA", avatar: "https://picsum.photos/200/200?random=114", phone: "13800138014", address: "A区106号", lat: 23.136, lng: 113.469, description: "快时尚女装", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "京东之家", avatar: "https://picsum.photos/200/200?random=115", phone: "13800138015", address: "B区205号", lat: 23.137, lng: 113.470, description: "电脑、数码", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "必胜客", avatar: "https://picsum.photos/200/200?random=116", phone: "13800138016", address: "C区305号", lat: 23.138, lng: 113.471, description: "披萨、意面", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "H&M", avatar: "https://picsum.photos/200/200?random=117", phone: "13800138017", address: "A区107号", lat: 23.139, lng: 113.472, description: "时尚男女装", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "vivo专卖", avatar: "https://picsum.photos/200/200?random=118", phone: "13800138018", address: "B区206号", lat: 23.140, lng: 113.473, description: "vivo手机", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "麦当劳", avatar: "https://picsum.photos/200/200?random=119", phone: "13800138019", address: "C区306号", lat: 23.141, lng: 113.474, description: "汉堡、薯条", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "阿迪达斯", avatar: "https://picsum.photos/200/200?random=120", phone: "13800138020", address: "A区108号", lat: 23.142, lng: 113.475, description: "运动装备", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "魅族专卖", avatar: "https://picsum.photos/200/200?random=121", phone: "13800138021", address: "B区207号", lat: 23.143, lng: 113.476, description: "魅族手机", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "喜茶", avatar: "https://picsum.photos/200/200?random=122", phone: "13800138022", address: "C区307号", lat: 23.144, lng: 113.477, description: "奶茶、果茶", market_type: 3, category_type: 3, status: 1, expire_date: new Date("2027-01-01") },
  { name: "太平鸟", avatar: "https://picsum.photos/200/200?random=123", phone: "13800138023", address: "A区109号", lat: 23.145, lng: 113.478, description: "时尚女装", market_type: 1, category_type: 1, status: 1, expire_date: new Date("2027-01-01") },
  { name: "联想专卖", avatar: "https://picsum.photos/200/200?random=124", phone: "13800138024", address: "B区208号", lat: 23.146, lng: 113.479, description: "电脑、笔记本", market_type: 2, category_type: 2, status: 1, expire_date: new Date("2027-01-01") },
  { name: "海底捞火锅（分店）", avatar: "https://picsum.photos/200/200?random=125", phone: "13800138025", address: "C区308号", lat: 23.147, lng: 113.480, description: "火锅", market_type: 3, category_type: 3, status: 0, expire_date: new Date("2025-01-01") },
  { name: "已过期店铺", avatar: "https://picsum.photos/200/200?random=126", phone: "13800138026", address: "A区110号", lat: 23.148, lng: 113.481, description: "测试过期", market_type: 1, category_type: 1, status: 0, expire_date: new Date("2025-01-01") }
];

exports.main = async (event, context) => {
  try {
    let inserted = 0;
    let skipped = 0;
    for (const shop of shopsData) {
      // 检查是否已存在（根据商铺名称）
      const existing = await db.collection('shop').where({ name: shop.name }).get();
      if (existing.data.length > 0) {
        console.log(`商铺 ${shop.name} 已存在，跳过`);
        skipped++;
        continue;
      }
      await db.collection('shop').add({ data: shop });
      inserted++;
    }
    return {
      success: true,
      message: `导入完成，新增 ${inserted} 条，跳过 ${skipped} 条（已存在）`
    };
  } catch (err) {
    console.error(err);
    return {
      success: false,
      error: err.message
    };
  }
};