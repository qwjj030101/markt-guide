/**
 * 付费页面
 * 功能：展示会员套餐价格，提供支付功能
 */
Page({
  data: {
    price: 0   // 会员套餐价格
  },

  /**
   * 页面加载时执行
   * 初始化加载套餐价格信息
   */
  onLoad() {
    this.loadPackageInfo()
  },

  /**
   * 支付点击事件
   * 创建支付订单并调用微信支付
   */
  onPay() {
    wx.request({
      url: 'https://api.example.com/payment/create',
      method: 'POST',
      success: (res) => {
        const paymentData = res.data
        wx.requestPayment({
          timeStamp: paymentData.timeStamp,
          nonceStr: paymentData.nonceStr,
          package: paymentData.package,
          signType: paymentData.signType,
          paySign: paymentData.paySign,
          success: () => {
            wx.showToast({ title: '支付成功', icon: 'success' })
            setTimeout(() => {
              wx.switchTab({
                url: '/pages/mine/mine'
              })
            }, 1500)
          },
          fail: () => {
            wx.showToast({ title: '支付失败', icon: 'none' })
          }
        })
      }
    })
  },

  /**
   * 加载套餐信息
   * 从服务器获取会员套餐的价格信息
   */
  loadPackageInfo() {
    wx.request({
      url: 'https://api.example.com/package/info',
      success: (res) => {
        this.setData({ price: res.data.price })
      }
    })
  }
})