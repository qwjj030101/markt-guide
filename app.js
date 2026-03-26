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

  // 初始化完成后再调用登录
  this.login()
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
    // 步骤1：调用 wx.login 获取临时登录凭证 code
    wx.login({
      success: (res) => {
        if (res.code) {
          // 步骤2：调用云函数 user/login 交换 openid 和用户信息
          wx.cloud.callFunction({
            name: 'user',
            data: {
              action: 'login',
              code: res.code
            }
          }).then((result) => {
            // 步骤3：存储用户信息到 globalData
            const userData = result.result
            this.globalData.openid = userData.openid
            this.globalData.role = userData.role || 0
            this.globalData.shop_id = userData.shop_id || null
            this.globalData.expire_date = userData.expire_date || null
            
            // 如果已授权，获取微信用户信息
            this.getUserProfile()
            
            console.log('登录成功，globalData:', this.globalData)
          }).catch((err) => {
            console.error('云函数调用失败:', err)
          })
        } else {
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
   * 检查会员是否有效
   * @returns {boolean} 会员是否未过期
   */
  isMemberValid() {
    if (!this.globalData.expire_date) return false
    const expireDate = new Date(this.globalData.expire_date)
    const now = new Date()
    return expireDate > now
  },

  /**
   * 获取剩余天数
   * @returns {number} 剩余天数，已过期返回0
   */
  getRemainingDays() {
    if (!this.globalData.expire_date) return 0
    const expireDate = new Date(this.globalData.expire_date)
    const now = new Date()
    const diffTime = expireDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  },

  /**
   * 更新全局用户数据
   * @param {Object} userData - 用户数据对象
   */
  updateGlobalData(userData) {
    if (userData.role !== undefined) {
      this.globalData.role = userData.role
    }
    if (userData.shop_id !== undefined) {
      this.globalData.shop_id = userData.shop_id
    }
    if (userData.expire_date !== undefined) {
      this.globalData.expire_date = userData.expire_date
    }
    if (userData.userInfo) {
      this.globalData.userInfo = userData.userInfo
    }
  }
})
