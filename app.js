/**
 * 全局应用实例
 * 功能：管理全局用户数据、登录状态、云函数调用等
 * 参考架构：docs/ARCH.md 第3节全局状态管理
 */
App({
  /**
   * 全局数据
   * 存储用户信息、角色、商铺ID等核心状态
   */
  globalData: {
    userInfo: null,       // 微信用户信息（头像、昵称等）
    openid: null,         // 用户唯一标识
    role: 0,              // 用户角色：0-普通用户，1-商户
    shop_id: null,        // 商铺ID（role=1时有效）
    expire_date: null     // 会员过期时间（role=1时有效）
  },

  /**
   * 应用启动时执行
   * 调用登录流程获取用户身份
   */
  onLaunch() {
     // 初始化云开发环境
  wx.cloud.init({
    env: 'cloud1-9guxzqosc70e21d1',  // 替换为你的实际环境ID
    traceUser: true  // 开启用户追踪
  })

  // 从本地缓存恢复用户信息
  this.restoreUserInfo()
  
  // 检查隐私协议同意状态
  const hasAgreedPrivacy = wx.getStorageSync('hasAgreedPrivacy')
  if (!hasAgreedPrivacy) {
    // 延迟显示隐私协议，确保小程序初始化完成
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/privacy/privacy'
      })
    }, 500)
  } else {
    // 已同意隐私协议，执行登录
    this.login()
  }
  /**
  *wx.cloud.callFunction({
  *name: 'seedProductData',
  *success: res => {
  *console.log('商品导入结果', res.result);
  *}
  *})
  */
  
  },

  /**
   * 应用显示时执行
   */
  onShow() {
    console.log('App show')
  },

  /**
   * 应用隐藏时执行
   */
  onHide() {
    console.log('App hide')
  },

  /**
   * 用户登录流程
   * 参考 ARCH.md 6.1 用户登录流程
   */
  login() {
    // 检查隐私协议同意状态
    const hasAgreedPrivacy = wx.getStorageSync('hasAgreedPrivacy')
    if (!hasAgreedPrivacy) {
      return
    }

    // 步骤1：调用 wx.login 获取临时登录凭证 code
    wx.login({
      success: (res) => {
        if (res.code) {  // 修复：添加括号
          // 步骤2：调用云函数 user/login 交换 openid 和用户信息
          wx.cloud.callFunction({
            name: 'user',
            data: {
              action: 'login',
              code: res.code,
              userInfo: this.globalData.userInfo  // 传递用户信息
            }
          }).then((result) => {
            // 步骤3：存储用户信息到 globalData
            const userData = result.result.data  // 修正：获取正确的返回数据结构
            this.globalData.openid = userData.openid  // 修复：改为 openid
            this.globalData.role = userData.role || 0
            this.globalData.shop_id = userData.shop_id || null
            this.globalData.expire_date = userData.expire_date || null
            this.globalData.response_quota = userData.response_quota || 0
            this.globalData.response_package_expire = userData.response_package_expire || null
            
            // 存储用户头像和昵称
            this.globalData.userInfo = {
              nickName: userData.nickname || '微信用户',
              avatarUrl: userData.avatar || ''
            }
            // 同时更新本地缓存
            try {
              wx.setStorageSync('userInfoWechat', this.globalData.userInfo)
            } catch (err) {
              console.error('缓存用户信息失败:', err)
            }
            
            // 步骤4：将用户信息存入本地缓存
            const cacheData = {
              openid: userData.openid,  // 修复：改为 openid
              role: userData.role || 0,
              shop_id: userData.shop_id || null,
              expire_date: userData.expire_date || null,
              response_quota: userData.response_quota || 0,
              response_package_expire: userData.response_package_expire || null
            }
            wx.setStorageSync('userInfo', cacheData)
            console.log('用户信息已存入本地缓存:', cacheData)
            console.log('用户头像和昵称:', this.globalData.userInfo)
            
            // 移除自动调用getUserProfile，改为用户主动触发
            console.log('登录成功，globalData:', this.globalData)
          }).catch((err) => {
            console.error('云函数调用失败:', err)
          })
        } else {  // 修复：添加括号
          console.error('wx.login 失败:', res)
        }
      }
    })
  },

  /**
   * 获取微信用户信息
   * 用于获取用户头像、昵称等展示信息
   */
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        this.globalData.userInfo = res.userInfo
        console.log('获取用户信息成功:', res.userInfo)
      },
      fail: (err) => {
        console.log('用户拒绝授权:', err)
        // 如果用户拒绝授权，使用默认昵称和空头像
        this.globalData.userInfo = {
          nickName: '微信用户',
          avatarUrl: ''
        }
        console.log('使用默认用户信息:', this.globalData.userInfo)
      }
    })
  },

  /**
   * 检查是否为商户
   * @returns {boolean} 是否为商户角色
   */
  isMerchant() {
    return this.globalData.role === 1
  },

  /**
   * 检查登录状态
   * @returns {Promise<boolean>} 是否已登录
   */
  checkLogin() {
    return new Promise((resolve) => {
      // 检查 globalData 中是否已有 openid
      if (this.globalData.openid) {
        console.log('checkLogin - 已有 openid:', this.globalData.openid)
        resolve(true)
        return
      }
      
      // 检查本地缓存中是否有 openid
      const openid = wx.getStorageSync('openid')
      if (openid) {
        this.globalData.openid = openid
        console.log('checkLogin - 从缓存获取 openid:', openid)
        resolve(true)
        return
      }
      
      // 未登录
      console.log('checkLogin - 未登录')
      resolve(false)
    })
  },

  /**
   * 检查会员是否有效
   * @returns {boolean} 会员是否未过期
   */
  isMemberValid() {
    if (!this.globalData.expire_date) return false  // 修复：添加括号
    const expireDate = new Date(this.globalData.expire_date)
    const now = new Date()
    return expireDate > now
  },

  /**
   * 获取剩余天数
   * @returns {number} 剩余天数，已过期返回0
   */
  getRemainingDays() {
    if (!this.globalData.expire_date) return 0  // 修复：添加括号
    const expireDate = new Date(this.globalData.expire_date)
    const now = new Date()
    const diffTime = expireDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  },

  /**
   * 从本地缓存恢复用户信息
   * 确保每次启动小程序时，用户信息不会丢失
   */
  restoreUserInfo() {
    try {
      // 从本地缓存获取用户基本信息
      const cacheData = wx.getStorageSync('userInfo')
      if (cacheData) {  // 修复：添加括号
        this.globalData.openid = cacheData.openid
        this.globalData.role = cacheData.role || 0
        this.globalData.shop_id = cacheData.shop_id || null
        this.globalData.expire_date = cacheData.expire_date || null
        this.globalData.response_quota = cacheData.response_quota || 0
        this.globalData.response_package_expire = cacheData.response_package_expire || null
      }
      
      // 从本地缓存获取用户微信信息（头像、昵称）
      const userInfoCache = wx.getStorageSync('userInfoWechat')
      if (userInfoCache) {  // 修复：添加括号
        this.globalData.userInfo = userInfoCache
      }
      
      console.log('从本地缓存恢复用户信息:', this.globalData)
    } catch (err) {
      console.error('恢复用户信息失败:', err)
    }
  },

  /**
   * 更新全局用户数据
   * @param {Object} userData - 用户数据对象
   */
  updateGlobalData(userData) {
    if (userData.role !== undefined) {  // 修复：添加括号
      this.globalData.role = userData.role
    }
    if (userData.shop_id !== undefined) {  // 修复：添加括号
      this.globalData.shop_id = userData.shop_id
    }
    if (userData.expire_date !== undefined) {  // 修复：添加括号
      this.globalData.expire_date = userData.expire_date
    }
    if (userData.response_quota !== undefined) {  // 修复：添加括号
      this.globalData.response_quota = userData.response_quota
    }
    if (userData.response_package_expire !== undefined) {  // 修复：添加括号
      this.globalData.response_package_expire = userData.response_package_expire
    }
    if (userData.userInfo) {  // 修复：添加括号
      this.globalData.userInfo = userData.userInfo
      // 同时更新本地缓存
      try {
        wx.setStorageSync('userInfoWechat', userData.userInfo)
      } catch (err) {
        console.error('缓存用户信息失败:', err)
      }
    }
  }
})
