/**
 * 用户云函数
 * 功能：登录、获取用户信息、角色校验
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
  const { action, code } = event
  
  try {
    switch (action) {
      case 'login':
        return await login(code)
      case 'getUserInfo':
        return await getUserInfo()
      case 'checkRole':
        return await checkRole(event.openid)
      case 'updateUserInfo':
        return await updateUserInfo(event.openid, event.userInfo)
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
 * 用户登录
 * 根据 code 获取 openid，查询或创建用户
 * @param {string} code - 微信登录临时凭证
 */
async function login(code) {
  // 获取 openid（云函数中通过 getWXContext 获取）
  const wxContext = cloud.getWXContext()
  const OPENID = wxContext.OPENID
  
  // 查询用户是否存在
  const userRes = await db.collection('user').where({
    openid: OPENID
  }).get()
  
  let userData
  
  if (userRes.data.length === 0) {
    // 用户不存在，创建新用户（默认普通用户）
    userData = {
      openid: OPENID,
      role: 0,        // 0-普通用户
      shop_id: null,
      expire_date: null,
      response_quota: 3,  // 初始响应配额，3次
      response_package_expire: null,  // 响应包过期时间，默认null
      create_time: db.serverDate(),
      update_time: db.serverDate()
    }
    
    await db.collection('user').add({
      data: userData
    })
  } else {
    // 用户已存在，返回用户信息
    userData = userRes.data[0]
  }
  
  return {
    code: 0,
    message: '登录成功',
    data: {
      openid: userData.openid,
      role: userData.role,
      shop_id: userData.shop_id,
      expire_date: userData.expire_date,
      response_quota: userData.response_quota || 0,
      response_package_expire: userData.response_package_expire || null,
      nickname: userData.nickname,
      avatar: userData.avatar
    }
  }
}

/**
 * 获取用户信息
 * 从 wxContext 获取 openid
 */
async function getUserInfo() {
  // 从 wxContext 获取 openid
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const userRes = await db.collection('user').where({
    openid: openid
  }).get()
  
  if (userRes.data.length === 0) {
    return {
      code: -1,
      message: '用户不存在'
    }
  }
  
  return {
    code: 0,
    message: '获取成功',
    data: userRes.data[0]
  }
}

/**
 * 检查用户角色
 * @param {string} openid - 用户openid
 */
async function checkRole(openid) {
  const userRes = await db.collection('user').where({
    openid: openid
  }).get()
  
  if (userRes.data.length === 0) {
    return {
      code: -1,
      message: '用户不存在'
    }
  }
  
  const user = userRes.data[0]
  
  return {
    code: 0,
    message: '获取成功',
    data: {
      role: user.role,
      isMerchant: user.role === 1,
      isValid: user.expire_date ? new Date(user.expire_date) > new Date() : false
    }
  }
}

/**
 * 更新用户信息
 * @param {string} openid - 用户openid
 * @param {Object} userInfo - 用户信息
 */
async function updateUserInfo(openid, userInfo) {
  // 更新用户信息
  await db.collection('user').where({
    openid: openid
  }).update({
    data: {
      nickname: userInfo.nickName,
      avatar: userInfo.avatarUrl,
      update_time: db.serverDate()
    }
  })
  
  return {
    code: 0,
    message: '更新成功'
  }
}
