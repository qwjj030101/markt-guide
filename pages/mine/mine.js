/**
 * 个人中心页面
 * 功能：展示用户信息、商户状态、会员有效期，提供商铺管理、续费、入驻等入口
 */
Page({
  data: {
    userInfo: {
      avatar: '',    // 用户头像URL
      nickname: ''   // 用户昵称
    },
    isMerchant: false,   // 是否为商户身份
    isValid: false,      // 会员是否有效
    remainingDays: 0      // 剩余天数
  },

  /**
   * 页面加载时执行
   * 初始化加载用户信息
   */
  onLoad() {
    this.loadUserInfo()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新用户信息，确保数据最新
   */
  onShow() {
    this.loadUserInfo()
  },

  /**
   * 商铺管理点击事件
   * 跳转到商铺管理页面
   */
  onShopTap() {
    wx.navigateTo({
      url: '/pages/shop/manage'
    })
  },

  /**
   * 续费点击事件
   * 跳转到付费页面进行会员续费
   */
  onRenewTap() {
    wx.navigateTo({
      url: '/pages/pay/pay'
    })
  },

  /**
   * 入驻申请点击事件
   * 跳转到入驻申请页面
   */
  onJoinTap() {
    wx.navigateTo({
      url: '/pages/join/join'
    })
  },

  /**
   * 加载用户信息
   * 从服务器获取用户详细信息，包括头像、昵称、角色、会员到期时间等
   */
  loadUserInfo() {
    wx.request({
      url: 'https://api.example.com/user/info',
      success: (res) => {
        const userInfo = res.data
        const remainingDays = this.calculateRemainingDays(userInfo.expireDate)
        this.setData({
          userInfo: {
            avatar: userInfo.avatar,
            nickname: userInfo.nickname
          },
          isMerchant: userInfo.role === 1,
          isValid: remainingDays > 0,
          remainingDays: remainingDays
        })
      }
    })
  },

  /**
   * 计算剩余天数
   * @param {string} expireDate - 会员到期日期
   * @returns {number} 剩余天数，如果已过期则返回0
   */
  calculateRemainingDays(expireDate) {
    if (!expireDate) return 0
    const now = new Date()
    const expire = new Date(expireDate)
    const diffTime = expire - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }
})