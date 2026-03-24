/**
 * 入驻申请页面
 * 功能：商户填写商铺信息进行入驻申请，包括上传头像、填写基本信息、选择地址等
 */
Page({
  data: {
    shopTypes: [],
    formData: {
      avatar: '',          // 商铺头像
      name: '',            // 商铺名称
      managerName: '',      // 负责人姓名
      managerPhone: '',     // 负责人电话
      phone: '',           // 商铺电话
      address: '',         // 商铺地址
      shopType: '',        // 商铺类型
      description: ''      // 商铺描述
    }
  },

  /**
   * 页面加载时执行
   * 初始化加载商铺类型列表和已存在的商铺信息
   */
  onLoad() {
    this.loadShopTypes()
    this.loadExistingShop()
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
  }
  ,

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
   * 负责人姓名输入事件
   * @param {Object} e - 事件对象
   */
  onManagerNameInput(e) {
    this.setData({
      'formData.managerName': e.detail.value
    })
  },

  /**
   * 负责人电话输入事件
   * @param {Object} e - 事件对象
   */
  onManagerPhoneInput(e) {
    this.setData({
      'formData.managerPhone': e.detail.value
    })
  },

  /**
   * 商铺电话输入事件
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
   * 商铺类型选择事件
   * @param {Object} e - 事件对象
   */
  onShopTypeChange(e) {
    const index = e.detail.value
    this.setData({
      'formData.shopType': this.data.shopTypes[index]
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
   * 提交申请点击事件
   * 验证表单数据并提交入驻申请
   */
  onSubmit() {
    const formData = this.data.formData
    if (!formData.name || !formData.phone || !formData.address) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    wx.request({
      url: 'https://api.example.com/shop/apply',
      method: 'POST',
      data: formData,
      success: () => {
        wx.navigateTo({
          url: '/pages/pay/pay'
        })
      }
    })
  },

  /**
   * 加载商铺类型列表
   * 从服务器获取可用的商铺类型选项
   */
  loadShopTypes() {
    wx.request({
      url: 'https://api.example.com/shop/types',
      success: (res) => {
        this.setData({ shopTypes: res.data })
      }
    })
  },

  /**
   * 加载已存在的商铺信息
   * 如果用户之前已经提交过申请，则回显之前的信息
   */
  loadExistingShop() {
    wx.request({
      url: 'https://api.example.com/shop/existing',
      success: (res) => {
        if (res.data) {
          this.setData({ formData: res.data })
        }
      }
    })
  }
})