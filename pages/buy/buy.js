Page({
  data: {
    selectedPackage: {
      type: '',
      count: '',
      price: 0,
      name: ''
    },
    customCount: 1,
    customPrice: 3
  },

  /**
   * 页面加载
   */
  onLoad() {
    // 页面加载逻辑
  },

  /**
   * 选择套餐
   * @param {Object} e - 事件对象
   */
  selectPackage(e) {
    const { type, count, price } = e.currentTarget.dataset
    let name = ''
    
    if (type === 'per_use') {
      name = `${count}次响应`
    } else if (type === 'monthly') {
      if (count === 30) {
        name = '1个月无限响应'
      } else if (count === 90) {
        name = '3个月无限响应'
      } else if (count === 365) {
        name = '1年无限响应'
      }
    }
    
    this.setData({
      selectedPackage: {
        type,
        count,
        price: parseInt(price),
        name
      }
    })
  },

  /**
   * 显示自定义次数输入框
   */
  showCustomCount() {
    wx.showModal({
      title: '自定义响应次数',
      editable: true,
      placeholderText: '请输入响应次数',
      inputType: 'number',
      inputValue: this.data.customCount.toString(),
      success: (res) => {
        if (res.confirm && res.content) {
          const count = parseInt(res.content)
          if (count > 0) {
            const price = this.calculateCustomPrice(count)
            this.setData({
              customCount: count,
              customPrice: price,
              selectedPackage: {
                type: 'per_use',
                count: 'custom',
                price: price,
                name: `${count}次响应`
              }
            })
          } else {
            wx.showToast({ title: '请输入有效的次数', icon: 'none' })
          }
        }
      }
    })
  },

  /**
   * 计算自定义次数的价格
   * @param {number} count - 响应次数
   * @returns {number} 价格
   */
  calculateCustomPrice(count) {
    if (count < 10) {
      return count * 3
    } else if (count < 100) {
      return count * 2
    } else {
      return count * 1.5
    }
  },

  /**
   * 确认购买
   */
  confirmBuy() {
    const { selectedPackage } = this.data
    
    if (!selectedPackage.type) {
      wx.showToast({ title: '请选择套餐', icon: 'none' })
      return
    }
    
    wx.showModal({
      title: '确认购买',
      content: `您确定要购买${selectedPackage.name}吗？价格：¥${selectedPackage.price}`,
      success: (res) => {
        if (res.confirm) {
          this.createPayment()
        }
      }
    })
  },

  /**
   * 创建支付订单
   */
  createPayment() {
    const { selectedPackage, customCount } = this.data
    let count = selectedPackage.count
    
    // 如果是自定义次数，使用实际输入的次数
    if (count === 'custom') {
      count = customCount
    }
    
    wx.showLoading({ title: '正在创建订单...' })
    
    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'create',
        package_type: selectedPackage.type,
        count: count,
        price: selectedPackage.price
      },
      success: (result) => {
        wx.hideLoading()
        
        if (result.result.success) {
          // 发起微信支付
          this.requestPayment(result.result.paymentParams, result.result.orderId, selectedPackage.type, count)
        } else {
          wx.showToast({ title: result.result.message || '创建订单失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('创建订单失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  },

  /**
   * 发起微信支付
   * @param {Object} paymentParams - 支付参数
   * @param {string} orderId - 订单ID
   * @param {string} packageType - 套餐类型
   * @param {number} count - 响应次数或天数
   */
  requestPayment(paymentParams, orderId, packageType, count) {
    // 在开发环境中模拟支付成功
    // 实际生产环境中使用 wx.requestPayment
    console.log('模拟支付成功，订单ID:', orderId)
    this.handlePaymentSuccess(orderId, packageType, count)
    
    // 实际支付代码（生产环境使用）
    /*
    wx.requestPayment({
      timeStamp: paymentParams.timeStamp,
      nonceStr: paymentParams.nonceStr,
      package: paymentParams.package,
      signType: paymentParams.signType,
      paySign: paymentParams.paySign,
      success: (res) => {
        // 支付成功，处理回调
        this.handlePaymentSuccess(orderId, packageType, count)
      },
      fail: (err) => {
        // 支付失败
        console.error('支付失败:', err)
        wx.showToast({ title: '支付失败，请重试', icon: 'none' })
      }
    })
    */
  },

  /**
   * 处理支付成功
   * @param {string} orderId - 订单ID
   * @param {string} packageType - 套餐类型
   * @param {number} count - 响应次数或天数
   */
  handlePaymentSuccess(orderId, packageType, count) {
    wx.showLoading({ title: '处理支付结果...' })
    
    // 调用支付回调
    wx.cloud.callFunction({
      name: 'payment',
      data: {
        action: 'callback',
        order_id: orderId,
        package_type: packageType,
        count: count,
        status: 'success'
      },
      success: (result) => {
        wx.hideLoading()
        
        if (result.result.success) {
          // 轮询支付状态，确保支付成功
          this.pollPaymentStatus(orderId, packageType, count)
        } else {
          wx.showToast({ title: '处理支付结果失败', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('处理支付结果失败:', err)
        wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
      }
    })
  },

  /**
   * 轮询支付状态
   * @param {string} orderId - 订单ID
   * @param {string} packageType - 套餐类型
   * @param {number} count - 响应次数或天数
   */
  pollPaymentStatus(orderId, packageType, count) {
    let retryCount = 0
    const maxRetries = 5
    const interval = 1000 // 1秒

    const poll = () => {
      if (retryCount >= maxRetries) {
        wx.showToast({ title: '支付处理超时', icon: 'none' })
        return
      }

      wx.cloud.callFunction({
        name: 'payment',
        data: {
          action: 'status',
          order_id: orderId
        },
        success: (result) => {
          if (result.result.success && result.result.status === 'success') {
            // 支付确认成功
            wx.showToast({
              title: '购买成功',
              icon: 'success',
              duration: 2000,
              success: () => {
                // 购买成功后返回我的页面并刷新
                setTimeout(() => {
                  wx.navigateBack({
                    delta: 1,
                    success: () => {
                      // 通知上一页刷新数据
                      const pages = getCurrentPages()
                      const minePage = pages[pages.length - 2]
                      if (minePage && minePage.loadUserInfo) {
                        minePage.loadUserInfo()
                      }
                    }
                  })
                }, 1000)
              }
            })
          } else {
            // 继续轮询
            retryCount++
            setTimeout(poll, interval)
          }
        },
        fail: (err) => {
          console.error('查询支付状态失败:', err)
          retryCount++
          setTimeout(poll, interval)
        }
      })
    }

    // 开始轮询
    poll()
  }
})