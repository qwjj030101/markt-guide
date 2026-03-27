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
    this.showPublishModal()
  },

  /**
   * 显示发布需求对话框
   */
  showPublishModal() {
    wx.showModal({
      title: '发布需求',
      editable: true,
      placeholderText: '请输入您要采购的商品或服务',
      confirmText: '发布',
      success: (res) => {
        if (res.confirm && res.content) {
          this.addDemand(res.content)
        }
      }
    })
  },

  /**
   * 添加需求
   * @param {string} content - 需求内容
   */
  async addDemand(content) {
    try {
      // 显示加载提示
      wx.showLoading({ title: '发布中...' })

      // 获取当前用户的 openid
      const app = getApp()
      let openid = app.globalData.openid
      
      if (!openid) {
        // 如果 globalData 中没有 openid，从本地缓存获取
        openid = wx.getStorageSync('openid')
        if (!openid) {
          // 如果本地缓存也没有，提示用户
          wx.hideLoading()
          wx.showToast({ title: '请先登录', icon: 'none' })
          return
        }
      }

      // 调用云函数
      const result = await wx.cloud.callFunction({
        name: 'demand',
        data: {
          action: 'add',
          content: content,
          user_id: openid
        }
      })

      // 隐藏加载提示
      wx.hideLoading()

      // 处理结果
      if (result.result.success) {
        wx.showToast({ title: '发布成功' })
        this.loadDemandList()
      } else {
        wx.showToast({ title: '发布失败', icon: 'none' })
      }
    } catch (err) {
      // 隐藏加载提示
      wx.hideLoading()
      // 显示错误信息
      console.error('发布需求失败:', err)
      wx.showToast({ title: '发布失败', icon: 'none' })
    }
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
    const app = getApp()
    // 从 globalData 获取用户信息
    const userInfo = app.globalData.userInfo
    const role = app.globalData.role
    
    this.setData({
      isMerchant: role === 1,
      pageTitle: role === 1 ? '需求广场' : '我的需求'
    })
    
    // 根据用户角色决定是否传 user_id
    this.loadDemandList()
  },

  /**
   * 加载需求列表
   * 从服务器获取需求数据
   */
  loadDemandList() {
    const app = getApp()
    const role = app.globalData.role
    const openid = app.globalData.openid
    
    console.log('加载需求列表 - 用户角色:', role, 'openid:', openid)
    
    // 根据用户角色决定是否传 user_id
    const data = { action: 'list' }
    if (role !== 1 && openid) { // 普通用户传 user_id，且 openid 存在
      data.user_id = openid
      console.log('加载需求列表 - 普通用户，传 user_id:', openid)
    } else {
      console.log('加载需求列表 - 商户或 openid 不存在，不传 user_id')
    }
    
    wx.cloud.callFunction({
      name: 'demand',
      data: data,
      success: (result) => {
        console.log('加载需求列表 - 云函数返回结果:', result)
        if (result.result.success) {
          console.log('加载需求列表 - 成功，数据:', result.result.data)
          
          // 处理数据，添加必要的字段
          const processedData = result.result.data.map(item => {
            return {
              id: item._id,
              user: item.user || { // 使用云函数返回的用户信息
                avatar: '/images/R.jpg',
                nickName: '用户' + item.user_id.substring(0, 4)
              },
              content: item.content,
              responses: item.responses || [], // 如果没有响应，设置为空数组
              isOwn: item.user_id === openid, // 判断是否是当前用户发布的
              canRespond: role === 1 && item.user_id !== openid, // 商户可以响应不是自己发布的需求
              status: item.status
            }
          })
          
          this.setData({ demandList: processedData })
        } else {
          console.log('加载需求列表 - 失败，原因:', result.result.message)
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('加载需求列表失败:', err)
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  /**
   * 点击响应列表中的头像
   * @param {Object} e - 事件对象
   */
  onTapShop(e) {
    const shopId = e.detail.shop_id
    this.onResponseTap({ currentTarget: { dataset: { shopId: shopId } } })
  },

  /**
   * 点击"我有货"按钮
   * @param {Object} e - 事件对象
   */
  onTapResponse(e) {
    const demandId = e.detail.demand_id
    this.onRespond({ currentTarget: { dataset: { id: demandId } } })
  },

  /**
   * 点击"已完成"按钮
   * @param {Object} e - 事件对象
   */
  onTapComplete(e) {
    const demandId = e.detail.demand_id
    this.onComplete({ currentTarget: { dataset: { id: demandId } } })
  }
})