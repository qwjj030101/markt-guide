/**
 * 商铺云函数
 * 功能：商铺列表、详情、管理（编辑、商品）
 * 参考：docs/ARCH.md 第4.2节
 */

// 初始化云开发环境
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 分类数据缓存
let categoryCache = {
  market: {},
  shop_category: {}
}

// 加载分类数据到缓存
async function loadCategoryCache() {
  console.log('开始加载分类数据缓存...')
  try {
    const categoryRes = await db.collection('category').get()
    console.log('从数据库查询到的分类数据:', categoryRes.data)
    
    categoryCache = {
      market: {},
      shop_category: {}
    }
    
    categoryRes.data.forEach(cat => {
      if (cat.type === 'market' || cat.type === 'shop_category') {
        categoryCache[cat.type][cat.sort] = cat._id
        console.log(`添加到缓存: type=${cat.type}, sort=${cat.sort}, _id=${cat._id}`)
      }
    })
    
    console.log('分类数据缓存加载成功:', categoryCache)
  } catch (err) {
    console.error('分类数据缓存加载失败:', err)
  }
}

// 初始化时加载缓存（云函数冷启动时执行）
loadCategoryCache()

// 定时更新缓存（每5分钟）
setInterval(loadCategoryCache, 5 * 60 * 1000)

// 主入口函数
exports.main = async (event, context) => {
  const { action } = event
  
  // 每次都重新加载缓存（临时测试用）
  //await loadCategoryCache()
  
  try {
    switch (action) {
      case 'list':
        return await getShopList(event)
      case 'getList':
        return await getShopList(event)
      case 'getDetail':
        return await getShopDetail(event.shopId)
      case 'update':
        return await updateShop(event)
      case 'getProducts':
        return await getProducts(event.shopId)
      case 'addProduct':
        return await addProduct(event)
      case 'deleteProduct':
        return await deleteProduct(event.productId)
      default:
        return {
          code: -1,
          message: '未知操作类型'
        }
    }
  } catch (err) {
    console.error('云函数执行失败:', err)
    return {
      code: -1,
      message: err.message
    }
  }
}

/**
 * 获取商铺列表
 * @param {Object} params - 查询参数
 */
async function getShopList(params) {
   const { page = 1, limit = 10, keyword, market_type, shop_category } = params
  
  console.log('传入的参数:', { market_type, shop_category })
  console.log('当前缓存:', categoryCache)
  
  let where = {
     status: 1,  // 临时注释
     expire_date: _.gt(new Date())  // 临时注释
  }
  
  if (keyword) {
    where.name = db.RegExp({
      regexp: keyword,
      options: 'i'  // 不区分大小写
    })
  }
  
  // 处理 market_type 参数
  if (market_type) {
    try {
      if (typeof market_type === 'string' && market_type.length > 10) {
        // 如果传入的是 _id（长字符串），从缓存中查找对应的数字值
        const marketSort = Object.keys(categoryCache.market).find(sort => categoryCache.market[sort] === market_type)
        if (marketSort) {
          where.market_type = parseInt(marketSort)
          console.log('从缓存获取数字值:', marketSort)
        } else {
          console.log('缓存中没有找到对应的数字值:', market_type)
        }
      } else {
        // 如果传入的是数字，直接使用
        where.market_type = parseInt(market_type)
        console.log('直接使用数字值:', market_type)
      }
    } catch (err) {
      console.error('处理 market_type 时出错:', err)
    }
  }
  
  // 处理 shop_category 参数
  if (shop_category) {
    try {
      if (typeof shop_category === 'string' && shop_category.length > 10) {
        // 如果传入的是 _id（长字符串），从缓存中查找对应的数字值
        const categorySort = Object.keys(categoryCache.shop_category).find(sort => categoryCache.shop_category[sort] === shop_category)
        if (categorySort) {
          where.category_type = parseInt(categorySort)
          console.log('从缓存获取数字值:', categorySort)
        } else {
          console.log('缓存中没有找到对应的数字值:', shop_category)
        }
      } else {
        // 如果传入的是数字，直接使用
        where.category_type = parseInt(shop_category)
        console.log('直接使用数字值:', shop_category)
      }
    } catch (err) {
      console.error('处理 shop_category 时出错:', err)
    }
  }
  
  console.log('最终查询条件:', where)
  
  const shopRes = await db.collection('shop')
    .where(where)
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
  
  const countRes = await db.collection('shop')
    .where(where)
    .count()
  
  console.log('查询结果数量:', shopRes.data.length)
  
  // 处理店铺头像，将云存储file ID转换为临时URL
  // 原理：云函数运行在云端，拥有管理员权限，可以访问所有云存储文件
  // 即使文件权限是"仅创建者可读写"，云函数也能获取到临时URL
  const processedShops = await Promise.all(shopRes.data.map(async (shop) => {
    if (shop.avatar && shop.avatar.startsWith('cloud://')) {
      try {
        const tempRes = await cloud.getTempFileURL({
          fileList: [shop.avatar]
        })
        if (tempRes.fileList[0].tempFileURL) {
          shop.avatar = tempRes.fileList[0].tempFileURL
        }
      } catch (err) {
        console.error('获取临时URL失败:', err)
      }
    }
    return shop
  }))
  
  return {
    success: true,
    data: processedShops,
    total: countRes.total
  }
}

/**
 * 获取商铺详情
 * @param {string} shopId - 商铺ID
 */
async function getShopDetail(shopId) {
  const shopRes = await db.collection('shop').doc(shopId).get()
  const shopInfo = shopRes.data
  
  // 处理头像，将云存储file ID转换为临时URL
  if (shopInfo.avatar && shopInfo.avatar.startsWith('cloud://')) {
    try {
      const tempRes = await cloud.getTempFileURL({
        fileList: [shopInfo.avatar]
      })
      if (tempRes.fileList[0].tempFileURL) {
        shopInfo.avatar = tempRes.fileList[0].tempFileURL
      }
    } catch (err) {
      console.error('获取临时URL失败:', err)
    }
  }
  
  return {
    code: 0,
    message: '获取成功',
    data: shopInfo
  }
}

/**
 * 更新商铺信息
 * @param {Object} params - 更新参数
 */
async function updateShop(params) {
  const { shopId, shopData, openid } = params
  
  // 权限校验：检查是否为该商铺的拥有者
  const userRes = await db.collection('user').where({
    openid: openid
  }).get()
  
  if (userRes.data.length === 0 || userRes.data[0].shop_id !== shopId) {
    return {
      code: -1,
      message: '无权操作'
    }
  }
  
  await db.collection('shop').doc(shopId).update({
    data: {
      ...shopData,
      update_time: db.serverDate()
    }
  })
  
  return {
    code: 0,
    message: '更新成功'
  }
}

/**
 * 获取商品列表
 * @param {string} shopId - 商铺ID
 */
async function getProducts(shopId) {
  const productRes = await db.collection('product').where({
    shop_id: shopId
  }).get()
  
  return {
    code: 0,
    message: '获取成功',
    data: productRes.data
  }
}

/**
 * 添加商品
 * @param {Object} params - 商品数据
 */
async function addProduct(params) {
  const { shopId, productData, openid } = params
  
  // 权限校验
  const userRes = await db.collection('user').where({
    openid: openid
  }).get()
  
  if (userRes.data.length === 0 || userRes.data[0].shop_id !== shopId) {
    return {
      code: -1,
      message: '无权操作'
    }
  }
  
  await db.collection('product').add({
    data: {
      shop_id: shopId,
      ...productData,
      create_time: db.serverDate(),
      update_time: db.serverDate()
    }
  })
  
  return {
    code: 0,
    message: '添加成功'
  }
}

/**
 * 删除商品
 * @param {string} productId - 商品ID
 */
async function deleteProduct(productId) {
  await db.collection('product').doc(productId).remove()
  
  return {
    code: 0,
    message: '删除成功'
  }
}