/**
 * 入驻申请页面
 * 功能：商户填写商铺信息进行入驻申请，包括上传头像、填写基本信息、选择地址等
 */
Page({
  data: {
    marketTypes: [],
    shopTypes: [],
    selectedMarketId: null,
    selectedMarketName: '',
    selectedShopTypeId: null,
    selectedShopTypeName: '',
    formData: {
      avatar: '',          // 商铺头像
      name: '',            // 商铺名称
      managerName: '',      // 负责人姓名
      managerPhone: '',     // 负责人电话
      phone: '',           // 商铺电话
      address: '',         // 商铺地址
      lat: null,           // 纬度
      lng: null,           // 经度
      market_type: '',     // 市场类型
      shop_category: '',   // 商铺类型
      description: ''      // 商铺描述
    }
  },

  /**
   * 页面加载时执行
   * 初始化加载分类列表和已存在的商铺信息
   */
  onLoad() {
    this.loadCategories()
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
        const tempFilePaths = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })
        
        // 上传图片到云存储
        wx.cloud.uploadFile({
          cloudPath: 'shop_avatars/' + Date.now() + '.jpg',
          filePath: tempFilePaths,
          success: (uploadRes) => {
            console.log('上传头像成功:', uploadRes)
            this.setData({
              'formData.avatar': uploadRes.fileID
            })
            wx.showToast({ title: '上传成功', icon: 'success' })
          },
          fail: (err) => {
            console.error('上传头像失败:', err)
            wx.showToast({ title: '上传失败', icon: 'none' })
          },
          complete: () => {
            wx.hideLoading()
          }
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
   * 地址输入事件
   * @param {Object} e - 事件对象
   */
  onAddressInput(e) {
    this.setData({
      'formData.address': e.detail.value
    })
  },

  /**
   * 地图选点
   * 调用系统地图选择商铺位置
   */
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          'formData.address': res.address,
          'formData.lat': res.latitude,
          'formData.lng': res.longitude
        })
        wx.showToast({ title: '选择地址成功', icon: 'success' })
      },
      fail: (err) => {
        console.error('选择地址失败:', err)
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '授权失败',
            content: '需要位置权限才能选择地址，请前往设置开启',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '选择地址失败', icon: 'none' })
        }
      }
    })
  },

  /**
   * 获取当前位置
   * 调用系统定位获取当前位置，然后让用户输入地址名称
   */
  getCurrentLocation() {
    wx.showLoading({ title: '定位中...' })
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 3500,
      success: (res) => {
        wx.hideLoading()
        const lat = res.latitude
        const lng = res.longitude
        wx.showModal({
          title: '填写地址名称',
          placeholderText: '请输入地址名称（如：我家仓库）',
          editable: true,
          success: (modalRes) => {
            if (modalRes.confirm) {
              const address = modalRes.content || ''
              this.setData({
                'formData.address': address,
                'formData.lat': lat,
                'formData.lng': lng
              })
              wx.showToast({ title: '获取位置成功', icon: 'success' })
            }
          }
        })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('获取位置失败:', err)
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '授权失败',
            content: '需要位置权限才能获取当前位置，请前往设置开启',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({ title: '获取位置失败，请检查GPS或网络', icon: 'none' })
        }
      }
    })
  },

  /**
   * 市场分类选择事件
   * @param {Object} e - 事件对象
   */
  onMarketChange(e) {
    const { value } = e.detail
    this.setData({
      selectedMarketId: value._id,
      selectedMarketName: value.name,
      'formData.market_type': value.sort
    })
  },

  /**
   * 商铺类型选择事件
   * @param {Object} e - 事件对象
   */
  onShopTypeChange(e) {
    const { value } = e.detail
    this.setData({
      selectedShopTypeId: value._id,
      selectedShopTypeName: value.name,
      'formData.shop_category': value.sort
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
    const { selectedMarketId, selectedShopTypeId } = this.data
    
    if (!formData.name || !formData.phone || !formData.address) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    // 收集表单数据，使用 selectedMarketId 和 selectedShopTypeId
    const submitData = {
      ...formData,
      market_type: selectedMarketId,
      category_type: selectedShopTypeId
    }

    wx.showLoading({ title: '提交中...' })

    try {
      wx.cloud.callFunction({
        name: 'shop',
        data: {
          action: 'create',
          shopData: submitData
        },
        success: (res) => {
          console.log('提交入驻申请成功:', res)
          if (res.result.success) {
            const shopId = res.result.shop_id
            
            // 更新全局数据
            const app = getApp()
            
            // 计算到期时间：当前时间的两年后
            const expireDate = new Date()
            expireDate.setFullYear(expireDate.getFullYear() + 2)
            
            // 更新所有相关的全局数据
            app.globalData.role = 1
            app.globalData.shop_id = shopId
            app.globalData.expire_date = expireDate
            
            // 同时更新本地缓存
            try {
              const cacheData = {
                openid: app.globalData.openid,
                role: 1,
                shop_id: shopId,
                expire_date: expireDate
              }
              wx.setStorageSync('userInfo', cacheData)
              console.log('用户信息已更新到本地缓存:', cacheData)
            } catch (err) {
              console.error('缓存用户信息失败:', err)
            }
            
            console.log('入驻成功，全局数据已更新:', app.globalData)
            wx.showToast({ title: '入驻成功', icon: 'success' })
            
            // 跳转到商铺管理页面
            setTimeout(() => {
              wx.navigateTo({
                url: `/pages/shop/manage?shopId=${shopId}`
              })
            }, 1000)
          } else {
            wx.showToast({ title: '提交失败: ' + (res.result.message || '未知错误'), icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('提交入驻申请失败:', err)
          wx.showToast({ title: '提交失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    } catch (err) {
      console.error('提交入驻申请失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '提交失败', icon: 'none' })
    }
  },

  /**
   * 加载分类列表
   * 从云数据库获取市场分类和商铺类型
   */
  loadCategories() {
    wx.showLoading({ title: '加载分类中...' })
    
    try {
      // 调用云函数获取市场分类
      wx.cloud.callFunction({
        name: 'category',
        data: {
          type: 'market'
        },
        success: (marketRes) => {
          console.log('市场分类云函数返回:', marketRes)
          
          // 调用云函数获取商铺类型
          wx.cloud.callFunction({
            name: 'category',
            data: {
              type: 'shop_category'
            },
            success: (shopRes) => {
              console.log('商铺类型云函数返回:', shopRes)
              
              if (marketRes.result.success && shopRes.result.success) {
                const marketTypes = marketRes.result.data.sort((a, b) => a.sort - b.sort)
                const shopTypes = shopRes.result.data.sort((a, b) => a.sort - b.sort)
                this.setData({ marketTypes, shopTypes })
              }
            },
            complete: () => {
              wx.hideLoading()
            }
          })
        },
        fail: (err) => {
          console.error('获取分类列表失败:', err)
          wx.hideLoading()
        }
      })
    } catch (err) {
      console.error('获取分类列表失败:', err)
      wx.hideLoading()
    }
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