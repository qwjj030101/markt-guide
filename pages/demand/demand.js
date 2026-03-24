/**
 * 需求广场页面
 * 功能：展示轮播图、需求列表，支持发布需求、响应需求、完成需求等操作
 */
Page({
  data: {
    banners: [],
    pageTitle: '',
    isMerchant: false,
    demandList: []
  },

  /**
   * 页面加载时执行
   * 初始化加载轮播图、用户信息和需求列表
   */
  onLoad() {
    this.loadBanners()
    this.loadUserInfo()
    this.loadDemandList()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新需求列表，确保数据最新
   */
  onShow() {
    this.loadDemandList()
  },

  /**
   * 轮播图点击事件
   * @param {Object} e - 事件对象
   */
  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({ url: link })
    }
  },

  /**
   * 商户信息点击事件
   * 跳转到商户详情页面
   * @param {Object} e - 事件对象
   */
  onResponseTap(e) {
    const shopId = e.currentTarget.dataset.shopId
    wx.navigateTo({
      url: `/pages/shop/detail?id=${shopId}`
    })
  },

  /**
   * 完成需求事件
   * 调用接口标记需求为已完成状态
   * @param {Object} e - 事件对象
   */
  onComplete(e) {
    const id = e.currentTarget.dataset.id
    wx.request({
      url: `https://api.example.com/demands/${id}/complete`,
      method: 'POST',
      success: () => {
        wx.showToast({ title: '已完成', icon: 'success' })
        this.loadDemandList()
      }
    })
  },

  /**
   * 响应需求事件
   * 商户可以输入备注信息响应需求
   * @param {Object} e - 事件对象
   */
  onRespond(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '商户备注',
      editable: true,
      placeholderText: '请输入商户备注',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.request({
            url: `https://api.example.com/demands/${id}/respond`,
            method: 'POST',
            data: { remark: res.content },
            success: () => {
              wx.showToast({ title: '响应成功', icon: 'success' })
              this.loadDemandList()
            }
          })
        }
      }
    })
  },

  /**
   * 发布需求事件
   * 用户可以发布新的需求描述
   */
  onPublish() {
    wx.showModal({
      title: '发布需求',
      editable: true,
      placeholderText: '请输入需求描述',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.request({
            url: 'https://api.example.com/demands',
            method: 'POST',
            data: { content: res.content },
            success: () => {
              wx.showToast({ title: '发布成功', icon: 'success' })
              this.loadDemandList()
            }
          })
        }
      }
    })
  },

  /**
   * 加载轮播图数据
   * 从服务器获取轮播图列表
   */
  loadBanners() {
    wx.request({
      url: 'https://api.example.com/banners',
      success: (res) => {
        this.setData({ banners: res.data })
      }
    })
  },

  /**
   * 加载用户信息
   * 获取用户角色信息，判断是否为商户，并设置相应页面标题
   */
  loadUserInfo() {
    wx.request({
      url: 'https://api.example.com/user/info',
      success: (res) => {
        this.setData({
          isMerchant: res.data.role === 1,
          pageTitle: res.data.role === 1 ? '需求广场' : '我的需求'
        })
      }
    })
  },

  /**
   * 加载需求列表
   * 从服务器获取所有需求数据
   */
  loadDemandList() {
    wx.request({
      url: 'https://api.example.com/demands',
      success: (res) => {
        this.setData({ demandList: res.data })
      }
    })
  }
})