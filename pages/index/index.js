Page({
  // 页面数据
  data: {
    banners: [],
    marketTypes: [],
    shopTypes: [],
    selectedMarket: '',
    selectedShopType: '',
    searchKeyword: '',
    shopList: []
  },

  // 页面加载时执行
  onLoad() {
    this.loadBanners()
    this.loadFilters()
    this.loadShopList()
  },

  // 搜索输入事件处理
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
    this.loadShopList()
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
    this.setData({
      selectedMarket: this.data.marketTypes[index]
    })
    this.loadShopList()
  },

  // 店铺类型选择变化事件处理
  onShopTypeChange(e) {
    const index = e.detail.value
    this.setData({
      selectedShopType: this.data.shopTypes[index]
    })
    this.loadShopList()
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
    wx.request({
      url: 'https://api.example.com/banners',
      success: (res) => {
        this.setData({ banners: res.data })
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
  }
})