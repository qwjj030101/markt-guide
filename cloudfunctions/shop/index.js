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

// 引入工具函数
//const dbUtils = require('../utils/dbUtils')
//const imageUtils = require('../utils/imageUtils')

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
        categoryCache[cat.type][cat._id] = cat.sort
        console.log(`添加到缓存: type=${cat.type}, _id=${cat._id}, sort=${cat.sort}`)
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
  
  // 每次都重新加载缓存，确保数据最新
  await loadCategoryCache()
  
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
      case 'create':
        return await createShop(event)
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
        const marketSort = categoryCache.market[market_type]
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
        const categorySort = categoryCache.shop_category[shop_category]
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
  
  // 构建 查询条件， 同时支持category_type 和 cateogry_type

  let queryCondition = {
    status: 1,
    expire_date: _.gt(new Date())
  }
  
  // 添加关键词搜索
  if (keyword) {
    queryCondition.name = db.RegExp({
      regexp: keyword,
      options: 'i'  // 不区分大小写
    })
  }
  
  // 添加市场类型过滤
  if (market_type) {
    queryCondition.market_type = where.market_type
  }
  
  // 添加商铺类型过滤，同时支持多种字段名
  if (shop_category && where.category_type) {
    queryCondition.$or = [
      { category_type: where.category_type },
      { shop_category: where.category_type }
      //{ cateogry_type: where.category_type }
    ]
  }
  
  console.log('修正后的查询条件:', queryCondition)
  
  const shopRes = await db.collection('shop')
    .where(queryCondition)
    .skip((page - 1) * limit)
    .limit(limit)
    .get()
  
  const countRes = await db.collection('shop')
    .where(queryCondition)
    .count()
  
  console.log('查询结果详情:', shopRes.data)
  
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
  const { shopId, shopData } = params
  
  // 获取当前用户的 openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  console.log('updateShop - 参数:', { shopId, openid })
  
  // 权限校验：检查是否为该商铺的拥有者
  const userRes = await db.collection('user').where({
    openid: openid
  }).get()
  
  console.log('updateShop - 用户查询结果:', userRes.data)
  
  if (userRes.data.length === 0) {
    console.error('updateShop - 用户不存在')
    return {
      code: -1,
      message: '用户不存在'
    }
  }
  
  const user = userRes.data[0]
  console.log('updateShop - 用户信息:', user)
  
  // 类型转换，确保比较时类型一致
  const userShopId = user.shop_id
  const targetShopId = shopId
  
  console.log('updateShop - 权限校验:', { userShopId, targetShopId, equal: userShopId == targetShopId })
  
  if (userShopId != targetShopId) {
    console.error('updateShop - 权限校验失败')
    return {
      code: -1,
      message: '无权操作'
    }
  }
  
  try {
    // 删除 _id、status、expire_date 字段，防止更新失败
    const { _id, status, expire_date, lat, lng, ...otherData } = shopData
    
    // 处理经纬度字段，确保为数字类型
    const updateData = {
      ...otherData,
      update_time: db.serverDate()
    }
    
    // 只有当 lat 和 lng 存在时才更新
    if (lat !== undefined && lng !== undefined) {
      updateData.lat = parseFloat(lat)
      updateData.lng = parseFloat(lng)
    }
    
    await db.collection('shop').doc(shopId).update({
      data: updateData
    })
    
    // 如果更新了到期日期，同步更新用户的到期日期
    if (shopData.expire_date) {
      await db.collection('user').where({
        shop_id: shopId
      }).update({
        data: {
          expire_date: shopData.expire_date,
          update_time: db.serverDate()
        }
      })
      console.log('updateShop - 同步更新用户到期日期成功')
    }
    
    console.log('updateShop - 更新成功')
    return {
      code: 0,
      message: '更新成功'
    }
  } catch (err) {
    console.error('updateShop - 更新失败:', err)
    return {
      code: -1,
      message: '更新失败: ' + err.message
    }
  }
}

/**
 * 创建商铺
 * @param {Object} params - 创建参数
 */
async function createShop(params) {
  const { shopData } = params
  
  try {
    // 获取当前用户的 openid
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    console.log('createShop - 当前用户 openid:', openid)
    
    // 处理经纬度字段、分类字段和头像字段
    const { lat, lng, market_type, category_type, avatar, ...otherData } = shopData
    
    // 确保 avatar 字段被正确保存
    console.log('createShop - 头像信息:', avatar)
    
    // 处理市场类型
    let marketTypeValue = null
    if (market_type) {
      if (typeof market_type === 'string' && market_type.length > 10) {
        // 如果传入的是 _id（长字符串），从缓存中查找对应的数字值
        marketTypeValue = categoryCache.market[market_type]
        if (marketTypeValue) {
          marketTypeValue = parseInt(marketTypeValue)
          console.log('从缓存获取市场类型数字值:', marketTypeValue)
        } else {
          console.log('缓存中没有找到对应的市场类型数字值:', market_type)
        }
      } else {
        // 如果传入的是数字，直接使用
        marketTypeValue = parseInt(market_type)
        console.log('直接使用市场类型数字值:', market_type)
      }
    }
    
    // 处理商铺类型
    let categoryTypeValue = null
    if (category_type) {
      if (typeof category_type === 'string' && category_type.length > 10) {
        // 如果传入的是 _id（长字符串），从缓存中查找对应的数字值
        categoryTypeValue = categoryCache.shop_category[category_type]
        if (categoryTypeValue) {
          categoryTypeValue = parseInt(categoryTypeValue)
          console.log('从缓存获取商铺类型数字值:', categoryTypeValue)
        } else {
          console.log('缓存中没有找到对应的商铺类型数字值:', category_type)
        }
      } else {
        // 如果传入的是数字，直接使用
        categoryTypeValue = parseInt(category_type)
        console.log('直接使用商铺类型数字值:', category_type)
      }
    }
    
    // 计算到期时间：当前时间的两年后
    const expireDate = new Date()
    expireDate.setFullYear(expireDate.getFullYear() + 2)
    
    const result = await db.collection('shop').add({
      data: {
        ...otherData,
        avatar: avatar, // 保存头像字段
        market_type: marketTypeValue,
        shop_category: categoryTypeValue,
        lat: lat !== undefined ? parseFloat(lat) : null,
        lng: lng !== undefined ? parseFloat(lng) : null,
        status: 1, // 免费入驻直接上架
        expire_date: expireDate, // 免费入驻，到期日期为当前时间的两年后
        create_time: db.serverDate(),
        update_time: db.serverDate()
      }
    })
    
    console.log('createShop - 创建成功:', result)
    
    // 更新用户表，设置 role 为 1（商户），shop_id 为新创建的商铺 ID，expire_date 为相同的到期时间
    await db.collection('user').where({ openid }).update({
      data: {
        role: 1,
        shop_id: result._id,
        expire_date: expireDate,
        update_time: db.serverDate()
      }
    })
    
    console.log('createShop - 更新用户角色成功')
    
    return {
      success: true,
      shop_id: result._id
    }
  } catch (err) {
    console.error('createShop - 创建失败:', err)
    return {
      success: false,
      message: '创建失败: ' + err.message
    }
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
  
  // 处理商品图片，将云存储file ID转换为临时URL
  const processedProducts = await Promise.all(productRes.data.map(async (product) => {
    if (product.image && product.image.startsWith('cloud://')) {
      try {
        const tempRes = await cloud.getTempFileURL({
          fileList: [product.image]
        })
        if (tempRes.fileList[0].tempFileURL) {
          product.image = tempRes.fileList[0].tempFileURL
        }
      } catch (err) {
        console.error('获取商品图片临时URL失败:', err)
      }
    }
    return product
  }))
  
  return {
    code: 0,
    message: '获取成功',
    data: processedProducts
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