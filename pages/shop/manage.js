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
    productList: []       // 商品列表
  },

  /**
   * 页面加载时执行
   * 初始化加载商铺信息和商品列表
   */
  onLoad() {
    this.loadShopInfo()
    this.loadProductList()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新商铺信息和商品列表，确保数据最新
   */
  onShow() {
    this.loadShopInfo()
    this.loadProductList()
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
    wx.navigateTo({
      url: '/pages/product/edit'
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
    wx.request({
      url: 'https://api.example.com/shop/info',
      success: (res) => {
        this.setData({ shopInfo: res.data })
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