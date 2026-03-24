/**
 * 商铺编辑页面
 * 功能：商户编辑自己的商铺信息，包括头像、名称、电话、地址、营业时间、描述等
 */
Page({
  data: {
    formData: {
      avatar: '',          // 商铺头像
      name: '',            // 商铺名称
      phone: '',           // 联系电话
      address: '',         // 商铺地址
      businessHours: '',   // 营业时间
      description: ''      // 商铺描述
    }
  },

  /**
   * 页面加载时执行
   * 初始化加载商铺信息进行编辑
   */
  onLoad() {
    this.loadShopInfo()
  },

  /**
   * 选择头像点击事件
   * 调用系统相册选择图片作为商铺头像
   */
  onAvatarTap() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({
          'formData.avatar': res.tempFilePaths[0]
        })
      }
    })
  },

  /**
   * 商铺名称输入事件
   * @param {Object} e - 事件对象
   */
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  /**
   * 联系电话输入事件
   * @param {Object} e - 事件对象
   */
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    })
  },

  /**
   * 选择地址点击事件
   * 调用系统地图选择商铺位置
   */
  onAddressTap() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.address': res.address,
          'formData.lat': res.latitude,
          'formData.lng': res.longitude
        })
      }
    })
  },

  /**
   * 营业时间输入事件
   * @param {Object} e - 事件对象
   */
  onBusinessHoursInput(e) {
    this.setData({
      'formData.businessHours': e.detail.value
    })
  },

  /**
   * 商铺描述输入事件
   * @param {Object} e - 事件对象
   */
  onDescriptionInput(e) {
    this.setData({
      'formData.description': e.detail.value
    })
  },

  /**
   * 提交保存点击事件
   * 验证表单数据并提交更新商铺信息
   */
  onSubmit() {
    const formData = this.data.formData
    if (!formData.name || !formData.phone || !formData.address) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    wx.request({
      url: 'https://api.example.com/shop/update',
      method: 'POST',
      data: formData,
      success: () => {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    })
  },

  /**
   * 加载商铺信息
   * 从服务器获取当前商铺的信息进行编辑
   */
  loadShopInfo() {
    wx.request({
      url: 'https://api.example.com/shop/info',
      success: (res) => {
        this.setData({ formData: res.data })
      }
    })
  }
})