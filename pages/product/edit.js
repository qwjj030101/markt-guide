/**
 * 商品编辑页面
 * 功能：商户管理自己的商品，包括添加新商品、删除商品等操作
 */
Page({
  data: {
    formData: {
      image: '',   // 商品图片
      name: ''     // 商品名称
    },
    productList: []   // 商品列表
  },

  /**
   * 页面加载时执行
   * 初始化加载商品列表
   */
  onLoad() {
    this.loadProductList()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新商品列表，确保数据最新
   */
  onShow() {
    this.loadProductList()
  },

  /**
   * 选择图片点击事件
   * 调用系统相册选择图片作为商品图片
   */
  onImageTap() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        this.setData({
          'formData.image': res.tempFilePaths[0]
        })
      }
    })
  },

  /**
   * 商品名称输入事件
   * @param {Object} e - 事件对象
   */
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  /**
   * 提交添加点击事件
   * 验证表单数据并提交添加新商品
   */
  onSubmit() {
    const formData = this.data.formData
    if (!formData.name || !formData.image) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    wx.request({
      url: 'https://api.example.com/product/add',
      method: 'POST',
      data: formData,
      success: () => {
        wx.showToast({ title: '添加成功', icon: 'success' })
        this.setData({
          formData: {
            image: '',
            name: ''
          }
        })
        this.loadProductList()
      }
    })
  },

  /**
   * 删除商品点击事件
   * @param {Object} e - 事件对象
   */
  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '确定要删除该商品吗？',
      success: (res) => {
        if (res.confirm) {
          wx.request({
            url: `https://api.example.com/product/${id}`,
            method: 'DELETE',
            success: () => {
              wx.showToast({ title: '删除成功', icon: 'success' })
              this.loadProductList()
            }
          })
        }
      }
    })
  },

  /**
   * 加载商品列表
   * 从服务器获取当前商铺的商品列表
   */
  loadProductList() {
    wx.request({
      url: 'https://api.example.com/shop/products',
      success: (res) => {
        this.setData({ productList: res.data })
      }
    })
  }
})