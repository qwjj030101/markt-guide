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

// 主入口函数
exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
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
  const { marketType, shopType, keyword, page = 1, pageSize = 10 } = params
  
  let where = {
    status: 1  // 只显示有效商铺
  }
  
  if (marketType) {
    where.market_type = marketType
  }
  
  if (shopType) {
    where.shop_type = shopType
  }
  
  if (keyword) {
    where.name = db.RegExp({
      regexp: keyword,
      options: 'i'
    })
  }
  
  const shopRes = await db.collection('shop')
    .where(where)
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  
  return {
    code: 0,
    message: '获取成功',
    data: shopRes.data
  }
}

/**
 * 获取商铺详情
 * @param {string} shopId - 商铺ID
 */
async function getShopDetail(shopId) {
  const shopRes = await db.collection('shop').doc(shopId).get()
  
  return {
    code: 0,
    message: '获取成功',
    data: shopRes.data
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
