Page({
  // 页面数据
  data: {
    banners: [],
    marketTypes: [],
    shopTypes: [],
    selectedMarket: '',
    selectedMarketName: '',
    selectedShopType: '',
    selectedShopTypeName: '',
    searchKeyword: '',
    shopList: [],
    page: 1,
    hasMore: true
  },

  // 页面加载时执行
  onLoad() {
    console.log('页面加载开始')
    
    // 重置数据
    this.setData({
      page: 1,
      shopList: [],
      hasMore: true
    })
  
    // 加载轮播图数据
    this.loadBanners()
    
    // 加载其他数据
    this.loadFilters()
    this.loadShops()
    this.loadCategories()
    
    // 调用 seedCategory 云函数，初始化分类数据
    wx.cloud.callFunction({
      name: 'seedCategory',
      success: (res) => {
        console.log('分类数据初始化成功:', res.result)
      },
      fail: (err) => {
        console.error('分类数据初始化失败:', err)
      }
    })
  },

  // 搜索输入事件处理
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value,
      page: 1,
      shopList: [],
      hasMore: true
    })
    this.loadShops()
  },

  // 轮播图点击事件处理
  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({ url: link })
    }
  },

  // 市场类型选择变化事件处理
  onMarketChange(e) {
    const index = e.detail.value
    const selectedMarket = this.data.marketTypes[index]._id
    const selectedMarketName = this.data.marketTypes[index].name
    
    console.log('选择的市场分类:', selectedMarket, selectedMarketName)
    
    this.setData({
      selectedMarket,
      selectedMarketName,
      page: 1,
      shopList: [],
      hasMore: true
    })
    
    this.loadShops()
  },

  // 店铺类型选择变化事件处理
  onShopTypeChange(e) {
    const index = e.detail.value
    const selectedShopType = this.data.shopTypes[index]._id
    const selectedShopTypeName = this.data.shopTypes[index].name
    
    console.log('选择的商铺类型:', selectedShopType, selectedShopTypeName)
    
    this.setData({
      selectedShopType,
      selectedShopTypeName,
      page: 1,
      shopList: [],
      hasMore: true
    })
    
    this.loadShops()
  },

  // 店铺点击事件处理
  onShopTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/shop/detail?id=${id}`
    })
  },

  // 加载轮播图数据
  loadBanners() {
    wx.cloud.callFunction({
      name: 'ad',
      data: {
        action: 'list'
      },
      success: (result) => {
        if (result.result.success) {
          this.setData({
            banners: result.result.data
          })
        } else {
          // 如果云函数调用失败，使用本地测试数据
          this.setData({
            banners: [
              { id: 1, image: '/images/R.jpg', link: '/pages/shop/detail?id=3a1b727569cd0d75002331e623ed7c1a' },
              { id: 2, image: '/images/R 1.jpg', link: '/pages/shop/detail?id=2' },
              { id: 3, image: '/images/R2.jpg', link: '/pages/shop/detail?id=3' }
            ]
          })
        }
      },
      fail: (err) => {
        console.error('加载广告失败:', err)
        // 使用本地测试数据
        this.setData({
          banners: [
            { id: 1, image: '/images/R.jpg', link: '/pages/shop/detail?id=3a1b727569cd0d75002331e623ed7c1a' },
            { id: 2, image: '/images/R 1.jpg', link: '/pages/shop/detail?id=2' },
            { id: 3, image: '/images/R2.jpg', link: '/pages/shop/detail?id=3' }
          ]
        })
      }
    })
  },

  // 加载筛选条件数据
  loadFilters() {
    wx.request({
      url: 'https://api.example.com/filters',
      success: (res) => {
        this.setData({
          marketTypes: res.data.marketTypes,
          shopTypes: res.data.shopTypes
        })
      }
    })
  },

  // 加载店铺列表数据
  loadShopList() {
    wx.request({
      url: 'https://api.example.com/shops',
      data: {
        keyword: this.data.searchKeyword,
        market: this.data.selectedMarket,
        type: this.data.selectedShopType
      },
      success: (res) => {
        this.setData({ shopList: res.data })
      }
    })
  },

  // 加载商铺列表（云函数版本）
  async loadShops() {
    // 显示加载中提示
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

   try {
    console.log('调用 shop 云函数参数:', {
      action: 'list',
      page: this.data.page,
      limit: 10,
      keyword: this.data.searchKeyword,
      market_type: this.data.selectedMarket,
      shop_category: this.data.selectedShopType
    })
    
    const res = await wx.cloud.callFunction({
      name: 'shop',
      data: {
        action: 'list',
        page: this.data.page,
        limit: 10,
        keyword: this.data.searchKeyword,
        market_type: this.data.selectedMarket,
        shop_category: this.data.selectedShopType
      }
    })
    
    console.log('shop 云函数返回结果:', res)
    console.log('返回的商铺数量:', res.result.data.length)
    console.log('返回的商铺列表:', res.result.data)
    
    if (res.result.success) {
      // 直接使用云函数返回的临时URL，不再需要前端转换
      // 原因：云函数已经在返回前将云存储file ID转换为临时URL
      const newShopList = this.data.shopList.concat(res.result.data)
      console.log('新的商铺列表:', newShopList)
      console.log('第一个店铺的头像:', newShopList[0]?.avatar)
      
      this.setData({
        shopList: newShopList,
        hasMore: res.result.data.length >= 10
      })
    } else {
  wx.showToast({
    title: '加载失败',
    icon: 'none'
  })
}
  } catch (err) {
    console.error('加载商铺失败:', err)
    wx.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    wx.hideLoading()
  }
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 重置数据
    this.setData({
      page: 1,
      shopList: [],
      hasMore: true
    })
    
    // 重新加载数据
    this.loadShops().then(() => {
      // 停止下拉刷新
      wx.stopPullDownRefresh()
    })
  },

  // 触底加载更多
  onReachBottom() {
    // 如果还有更多数据，加载下一页
    if (this.data.hasMore) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadShops()
    }
  },

  // 加载分类数据
  async loadCategories() {
    try {
      console.log('开始加载分类数据...')
      
      // 调用云函数获取市场分类
      const marketRes = await wx.cloud.callFunction({
        name: 'category',
        data: {
          type: 'market'
        }
      })
      
      console.log('市场分类云函数返回:', marketRes)

      // 调用云函数获取商铺类型
      const shopRes = await wx.cloud.callFunction({
        name: 'category',
        data: {
          type: 'shop_category'
        }
      })
      
      console.log('商铺类型云函数返回:', shopRes)

      if (marketRes.result.success && shopRes.result.success) {
        console.log('市场分类数据:', marketRes.result.data)
        console.log('商铺类型数据:', shopRes.result.data)
        
        // 添加“全部”选项
        const marketTypesWithAll = [{ _id: '', name: '全部' }, ...marketRes.result.data]
        const shopTypesWithAll = [{ _id: '', name: '全部' }, ...shopRes.result.data]
        
        // 更新数据
        this.setData({
          marketTypes: marketTypesWithAll,
          shopTypes: shopTypesWithAll
        })
        
        console.log('更新后的 marketTypes:', this.data.marketTypes)
        console.log('更新后的 shopTypes:', this.data.shopTypes)
      } else {
        // 显示错误提示
        console.error('云函数调用失败')
        wx.showToast({
          title: '加载分类失败',
          icon: 'none'
        })
      }
    } catch (err) {
      // 显示错误提示
      console.error('加载分类失败:', err)
      wx.showToast({
        title: '加载分类失败',
        icon: 'none'
      })
    }
  }
})