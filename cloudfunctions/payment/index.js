// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, package_type, count, order_id, status, paymentInfo } = event
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    switch (action) {
      case 'create':
        return await createOrder(openid, package_type, count)
      case 'callback':
        return await handleCallback(openid, order_id, package_type, count, status, paymentInfo)
      case 'status':
        return await getPaymentStatus(order_id, openid)
      default:
        return { success: false, message: '无效的操作' }
    }
  } catch (err) {
    console.error('支付云函数错误:', err)
    return { success: false, message: '操作失败: ' + err.message }
  }
}

/**
 * 创建支付订单
 * @param {string} openid - 用户ID
 * @param {string} packageType - 套餐类型：per_use 或 monthly
 * @param {number} count - 响应次数或天数
 */
async function createOrder(openid, package_type, count) {
  // 验证参数
  if (!openid || !package_type || count === undefined) {
    return { success: false, message: '参数缺失' }
  }
  
  // 类型转换
  const parsedCount = parseInt(count)
  if (isNaN(parsedCount) || parsedCount <= 0) {
    return { success: false, message: '无效的数量' }
  }
  
  // 计算价格
  const price = calculatePrice(package_type, parsedCount)
  
  if (price <= 0) {
    return { success: false, message: '无效的套餐' }
  }
  
  // 生成订单ID
  const orderId = 'order_' + Date.now() + '_' + Math.floor(Math.random() * 1000)
  
  // 插入订单数据
  await db.collection('payment').add({
    data: {
      order_id: orderId,
      openid: openid,
      package_type: package_type,
      count: parsedCount,
      price: price,
      status: 'pending',
      create_time: new Date()
    }
  })
  
  // 调用微信支付统一下单
  // 注意：这里需要实际调用微信支付API，这里仅做模拟
  const paymentParams = {
    timeStamp: Date.now().toString(),
    nonceStr: Math.random().toString(36).substr(2, 15),
    package: 'prepay_id=wx201410272009395522657a690389285100',
    signType: 'MD5',
    paySign: 'C380BEC2BFD727A4B6845133519F3AD6'
  }
  
  return {
    success: true,
    orderId: orderId,
    paymentParams: paymentParams,
    price: price
  }
}

/**
 * 处理支付回调
 * @param {string} openid - 用户ID
 * @param {string} orderId - 订单ID
 * @param {string} packageType - 套餐类型
 * @param {number} count - 响应次数或天数
 * @param {string} status - 支付状态
 * @param {object} paymentInfo - 支付信息
 */
async function handleCallback(openid, orderId, packageType, count, status, paymentInfo) {
  if (status !== 'success') {
    return { success: false, message: '支付失败' }
  }
  
  // 验证签名
  // 注意：这里需要实际验证签名，这里仅做模拟
  
  // 启动事务
  const transaction = await db.startTransaction()
  
  try {
    // 更新订单状态
    await transaction.collection('payment').where({ order_id: orderId }).update({
      data: {
        status: 'success',
        pay_time: new Date(),
        payment_info: paymentInfo
      }
    })
    
    // 更新用户响应配额
    if (packageType === 'per_use') {
      // 按次套餐，增加响应配额
      const currentUser = await transaction.collection('user').where({ openid: openid }).get()
      if (currentUser.data.length > 0) {
        const user = currentUser.data[0]
        const currentQuota = user.response_quota || 0
        await transaction.collection('user').where({ openid: openid }).update({
          data: {
            response_quota: currentQuota + parseInt(count),
            update_time: new Date()
          }
        })
      }
    } else if (packageType === 'monthly') {
      // 包月套餐，设置响应包过期时间
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + parseInt(count))
      
      await transaction.collection('user').where({ openid: openid }).update({
        data: {
          response_package_expire: expireDate,
          update_time: new Date()
        }
      })
    }
    
    // 提交事务
    await transaction.commit()
    
    return {
      success: true
    }
  } catch (err) {
    // 回滚事务
    await transaction.rollback()
    throw err
  }
}

/**
 * 计算价格
 * @param {string} packageType - 套餐类型
 * @param {number} count - 响应次数或天数
 */
function calculatePrice(packageType, count) {
  if (packageType === 'per_use') {
    // 按次套餐
    if (count < 10) {
      return count * 3
    } else if (count < 100) {
      return count * 2
    } else {
      return count * 1.5
    }
  } else if (packageType === 'monthly') {
    // 包月套餐
    if (count === 30) {
      return 88
    } else if (count === 90) {
      return 200
    } else if (count === 365) {
      return 666
    }
  }
  return 0
}

/**
 * 获取支付状态
 * @param {string} orderId - 订单ID
 * @param {string} openid - 用户ID
 */
async function getPaymentStatus(orderId, openid) {
  if (!orderId) {
    return { success: false, message: '订单ID缺失' }
  }
  
  const orderRes = await db.collection('payment').where({
    order_id: orderId
  }).get()
  
  if (orderRes.data.length === 0) {
    return { success: false, message: '订单不存在' }
  }
  
  const order = orderRes.data[0]
  
  // 验证订单所属用户
  if (order.openid !== openid) {
    return { success: false, message: '无权查询此订单' }
  }
  
  return {
    success: true,
    status: order.status
  }
}