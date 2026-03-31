/**
 * 商铺管理页面
 * 功能：商户管理自己的商铺信息和商品列表，提供编辑商铺、添加商品等操作
 */
Page({
  data: {
    shopId: '',
    shopInfo: {
      name: '',           // 商铺名称
      avatar: '',         // 商铺头像
      phone: '',          // 联系电话
      address: '',        // 商铺地址
      businessHours: '',  // 营业时间
      description: ''     // 商铺描述
    },
    productList: [],      // 商品列表
    isLoading: false      // 加载状态标志
  },

  /**
   * 页面加载时执行
   * 初始化加载商铺信息和商品列表
   */
  onLoad(options) {
    // 权限校验
    const app = getApp()
    const role = app.globalData.role
    const shop_id = app.globalData.shop_id
    const shopId = options.shopId || ''
    
    // 检查权限：必须是商户且 shop_id 匹配
    if (role !== 1 || shop_id !== shopId) {
      wx.showToast({ title: '无权限', icon: 'none' })
      wx.redirectTo({
        url: `/pages/shop/detail?shop_id=${shopId}`
      })
      return
    }
    
    this.setData({ shopId })
    this.loadShopInfo()
    this.loadProductList()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新商铺信息和商品列表，确保数据最新
   */
  onShow() {
    // 只在非加载状态时刷新，避免重复加载
    if (!this.data.isLoading) {
      this.loadShopInfo()
      this.loadProductList()
    }
  },

  /**
   * 编辑商铺点击事件
   * 跳转到商铺编辑页面
   */
  onEditTap() {
    wx.navigateTo({
      url: '/pages/shop/edit'
    })
  },

  /**
   * 添加商品点击事件
   * 跳转到商品编辑页面
   */
  onAddProductTap() {
    const { shopId } = this.data
    wx.navigateTo({
      url: `/pages/product/edit?shop_id=${shopId}`
    })
  },

  /**
   * 编辑商品点击事件
   * 跳转到商品编辑页面，传递商品ID
   */
  onEditProduct(e) {
    const { shopId } = this.data
    const productId = e.currentTarget.dataset.productId
    wx.navigateTo({
      url: `/pages/product/edit?shop_id=${shopId}&product_id=${productId}`
    })
  },

  /**
   * 拨打电话点击事件
   * 调用系统拨号功能拨打商铺电话
   */
  onPhoneTap() {
    wx.makePhoneCall({
      phoneNumber: this.data.shopInfo.phone
    })
  },

  /**
   * 查看地址点击事件
   * 调用系统地图功能显示商铺位置
   */
  onAddressTap() {
    wx.openLocation({
      latitude: this.data.shopInfo.lat,
      longitude: this.data.shopInfo.lng,
      name: this.data.shopInfo.name,
      address: this.data.shopInfo.address
    })
  },

  /**
   * 加载商铺信息
   * 从服务器获取当前商户的商铺信息
   */
  loadShopInfo() {
    const { shopId } = this.data
    wx.showLoading({ title: '加载中...' })
    
    try {
      wx.cloud.callFunction({
        name: 'shop',
        data: {
          action: 'getDetail',
          shopId: shopId
        },
        success: (res) => {
          console.log('获取商铺详情成功:', res)
          if (res.result.code === 0) {
           const shopInfo = res.result.data;
           // 添加默认值，防止字段为空
           shopInfo.businessHours = shopInfo.businessHours || '暂无营业时间';
           this.setData({ shopInfo });
          } else {
            wx.showToast({ title: '加载失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('获取商铺详情失败:', err)
          wx.showToast({ title: '加载失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    } catch (err) {
      console.error('获取商铺详情失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  /**
   * 加载商品列表
   * 从服务器获取当前商铺的商品列表
   */
  loadProductList() {
    const { shopId, isLoading } = this.data
    
    // 如果正在加载，直接返回，避免重复加载
    if (isLoading) {
      return
    }
    
    this.setData({ isLoading: true })
    
    try {
      wx.cloud.callFunction({
        name: 'shop',
        data: {
          action: 'getProducts',
          shopId: shopId
        },
        success: (res) => {
          console.log('获取商品列表成功:', res)
          if (res.result.code === 0) {
            this.setData({ productList: res.result.data })
          }
        },
        fail: (err) => {
          console.error('获取商品列表失败:', err)
        },
        complete: () => {
          this.setData({ isLoading: false })
        }
      })
    } catch (err) {
      console.error('获取商品列表失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
      this.setData({ isLoading: false })
    }
  },

  /**
   * 删除商品点击事件
   * 弹出确认框，确认后调用云函数删除商品
   */
  onDeleteProduct(e) {
    const productId = e.currentTarget.dataset.productId
    
    wx.showModal({
      title: '确认删除',
      content: '确定删除该商品吗？',
      success: (modalRes) => {
        if (modalRes.confirm) {
          wx.showLoading({ title: '删除中...' })
          
          try {
            wx.cloud.callFunction({
              name: 'product',
              data: {
                action: 'delete',
                productId: productId
              },
              success: (res) => {
                console.log('删除商品成功:', res)
                if (res.result.code === 0) {
                  wx.showToast({ title: '删除成功', icon: 'success' })
                  // 删除成功后刷新商品列表
                  this.loadProductList()
                } else {
                  wx.showToast({ title: '删除失败', icon: 'none' })
                }
              },
              fail: (err) => {
                console.error('删除商品失败:', err)
                wx.showToast({ title: '删除失败', icon: 'none' })
              },
              complete: () => {
                wx.hideLoading()
              }
            })
          } catch (err) {
            console.error('删除商品失败:', err)
            wx.hideLoading()
            wx.showToast({ title: '删除失败', icon: 'none' })
          }
        }
      }
    })
  }
})