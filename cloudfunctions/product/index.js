// 云函数入口文件
const cloud = require('wx-server-sdk')

// 初始化云函数
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const productCollection = db.collection('product')

/**
 * 商品管理云函数
 * 功能：商品的增删改查操作
 */

/**
 * 获取商品详情
 * @param {Object} params - 参数
 * @param {string} params.productId - 商品ID
 * @returns {Object} - 商品信息
 */
async function getProductDetail(params) {
  const { productId } = params
  try {
    const result = await productCollection.doc(productId).get()
    return { code: 0, message: '获取成功', data: result.data }
  } catch (err) {
    return { code: -1, message: '获取失败: ' + err.message }
  }
}

/**
 * 添加商品
 * @param {Object} params - 参数
 * @param {string} params.shopId - 商铺ID
 * @param {Object} params.productData - 商品数据
 * @returns {Object} - 添加结果
 */
async function addProduct(params) {
  const { shopId, productData } = params
  try {
    const result = await productCollection.add({
      data: {
        ...productData,
        shop_id: shopId,
        status: 1, // 默认为上架状态
        create_time: db.serverDate(),
        update_time: db.serverDate()
      }
    })
    return { code: 0, message: '添加成功', data: result._id }
  } catch (err) {
    return { code: -1, message: '添加失败: ' + err.message }
  }
}

/**
 * 更新商品
 * @param {Object} params - 参数
 * @param {string} params.productId - 商品ID
 * @param {Object} params.productData - 商品数据
 * @returns {Object} - 更新结果
 */
async function updateProduct(params) {
  const { productId, productData } = params
  try {
    // 移除_id字段，因为不能更新_id
    const { _id, ...updateData } = productData
    
    await productCollection.doc(productId).update({
      data: {
        ...updateData,
        update_time: db.serverDate()
      }
    })
    return { code: 0, message: '更新成功' }
  } catch (err) {
    return { code: -1, message: '更新失败: ' + err.message }
  }
}

/**
 * 删除商品
 * @param {Object} params - 参数
 * @param {string} params.productId - 商品ID
 * @returns {Object} - 删除结果
 */
async function deleteProduct(params) {
  const { productId } = params
  try {
    // 获取当前用户的 openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    // 获取商品信息，检查归属
    const product = await productCollection.doc(productId).get()
    if (!product.data) {
      return { code: -1, message: '商品不存在' }
    }
    
    const shopId = product.data.shop_id
    
    // 检查用户是否有权限（该商品属于当前商户的商铺）
    const userResult = await db.collection('user').where({ openid: openid }).get()
    if (userResult.data.length === 0) {
      return { code: -1, message: '用户不存在' }
    }
    
    const user = userResult.data[0]
    if (user.role !== 1 || user.shop_id !== shopId) {
      return { code: -1, message: '无权限删除该商品' }
    }
    
    // 执行删除操作
    await productCollection.doc(productId).remove()
    return { code: 0, message: '删除成功' }
  } catch (err) {
    return { code: -1, message: '删除失败: ' + err.message }
  }
}

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, ...params } = event
  
  try {
    switch (action) {
      case 'detail':
        return getProductDetail(params)
      case 'add':
        return addProduct(params)
      case 'update':
        return updateProduct(params)
      case 'delete':
        return deleteProduct(params)
      default:
        return { code: -1, message: '未知操作' }
    }
  } catch (err) {
    return { code: -1, message: '操作失败: ' + err.message }
  }
}