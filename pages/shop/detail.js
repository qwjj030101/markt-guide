/**
 * 商铺详情页面
 * 功能：展示商铺详细信息、商品列表，提供拨打电话、查看地图等操作
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
      description: '',    // 商铺描述
      lat: null,          // 纬度
      lng: null           // 经度
    },
    productList: []       // 商品列表
  },

  /**
   * 页面加载时执行
   * @param {Object} options - 页面参数，包含商铺ID
   */
  onLoad(options) {
    // 兼容不同的参数名：id 或 shop_id
    const shopId = options.id || options.shop_id || ''
    if (!shopId) {
      wx.showToast({ title: '参数错误', icon: 'none' })
      return
    }
    this.setData({ shopId })
    this.loadShopInfo(shopId)
    this.loadProductList(shopId)
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
    const { lat, lng, name, address } = this.data.shopInfo
    
    // 检查坐标是否存在
    if (!lat || !lng) {
      wx.showToast({
        title: '位置信息缺失，无法导航',
        icon: 'none'
      })
      return
    }
    
    // 转换为数字类型
    const latitude = Number(lat)
    const longitude = Number(lng)
    
    // 检查是否为有效数字
    if (isNaN(latitude) || isNaN(longitude)) {
      wx.showToast({
        title: '位置信息无效，无法导航',
        icon: 'none'
      })
      return
    }
    
    wx.openLocation({
      latitude: latitude,
      longitude: longitude,
      name: name,
      address: address
    })
  },

  /**
   * 加载商铺信息
   * @param {string} shopId - 商铺ID
   */
  loadShopInfo(shopId) {
     wx.showLoading({
    title: '加载中...'
  })
  
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
  // 直接使用云函数返回的临时URL，不再需要前端转换
  // 原因：云函数已经在返回前将云存储file ID转换为临时URL
  // 这样可以避免前端权限问题，即使云存储文件权限是"仅创建者可读写"
  let shopInfo = res.result.data
  // 字段映射：支持 latitude/longitude 和 lat/lng
  if (shopInfo.latitude && !shopInfo.lat) {
    shopInfo.lat = shopInfo.latitude
  }
  if (shopInfo.longitude && !shopInfo.lng) {
    shopInfo.lng = shopInfo.longitude
  }
  console.log('获取商铺信息成功，头像:', shopInfo.avatar)
  this.setData({ shopInfo })
} else {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('获取商铺详情失败:', err)
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  } catch (err) {
    console.error('获取商铺详情失败:', err)
    wx.hideLoading()
    wx.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
  },

  /**
   * 加载商品列表
   * @param {string} shopId - 商铺ID
   */
  loadProductList(shopId) {
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
            this.setData({ 
              productList: res.result.data 
            })
          }
        },
        fail: (err) => {
          console.error('获取商品列表失败:', err)
        }
      })
    } catch (err) {
      console.error('获取商品列表失败:', err)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  }
})