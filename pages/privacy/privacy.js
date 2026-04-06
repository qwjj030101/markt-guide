Page({
  /**
   * 拒绝隐私协议
   */
  onReject() {
    wx.showToast({
      title: '拒绝协议将无法使用本小程序',
      icon: 'none'
    })
  },

  /**
   * 同意隐私协议
   */
  onAccept() {
    // 存储同意状态
    wx.setStorageSync('hasAgreedPrivacy', true)
    
    // 执行登录
    const app = getApp()
    app.login()
    
    // 跳转到首页
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})