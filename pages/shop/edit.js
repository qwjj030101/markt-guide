/**
 * 商铺编辑页面
 * 功能：编辑商铺信息，包括名称、电话、地址、简介、头像等
 */
Page({
  data: {
    shopId: '',
    shopInfo: {
      name: '',
      phone: '',
      address: '',
      description: '',
      businessHours: '',
      avatar: '',
      lat: null,
      lng: null
    }
  },

  /**
   * 页面加载时执行
   * 初始化加载商铺信息
   */
  onLoad(options) {
    const app = getApp()
    const shopId = app.globalData.shop_id
    
    if (!shopId) {
      wx.showToast({ title: '商铺信息不存在', icon: 'none' })
      wx.navigateBack()
      return
    }
    
    this.setData({ shopId })
    this.loadShopInfo()
  },

  /**
   * 加载商铺信息
   * 从云函数获取当前商铺的详细信息
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
            this.setData({ shopInfo: res.result.data })
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
   * 选择头像
   * 调用系统相册选择图片，上传到云存储
   */
  chooseAvatar() {
    const self = this
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: function(res) {
        const tempFilePaths = res.tempFilePaths
        self.uploadAvatar(tempFilePaths[0])
      }
    })
  },

  /**
   * 上传头像
   * 将选择的图片上传到云存储
   */
  uploadAvatar(tempFilePath) {
    wx.showLoading({ title: '上传中...' })
    
    const cloudPath = `shop_avatars/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: (res) => {
        console.log('上传头像成功:', res)
        const avatarUrl = res.fileID
        
        // 获取临时文件URL用于预览
        wx.cloud.getTempFileURL({
          fileList: [avatarUrl],
          success: (tempRes) => {
            if (tempRes.fileList[0].tempFileURL) {
              const updatedShopInfo = {
                ...this.data.shopInfo,
                avatar: tempRes.fileList[0].tempFileURL
              }
              this.setData({ shopInfo: updatedShopInfo })
            }
          }
        })
      },
      fail: (err) => {
        console.error('上传头像失败:', err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  /**
   * 选择地址
   * 调用系统地图选择位置
   */
  chooseAddress() {
    wx.chooseLocation({
      success: (res) => {
        const address = res.address
        const lat = res.latitude
        const lng = res.longitude
        
        const updatedShopInfo = {
          ...this.data.shopInfo,
          address: address,
          lat: lat,
          lng: lng
        }
        
        this.setData({ shopInfo: updatedShopInfo })
      },
      fail: (err) => {
        console.error('选择地址失败:', err)
        wx.showToast({
          title: '选择地址失败，请重试',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 商铺名称变更
   */
  onNameChange(e) {
    const name = e.detail.value
    const updatedShopInfo = {
      ...this.data.shopInfo,
      name: name
    }
    this.setData({ shopInfo: updatedShopInfo })
  },

  /**
   * 联系电话变更
   */
  onPhoneChange(e) {
    const phone = e.detail.value
    const updatedShopInfo = {
      ...this.data.shopInfo,
      phone: phone
    }
    this.setData({ shopInfo: updatedShopInfo })
  },

  /**
   * 商铺简介变更
   */
  onDescriptionChange(e) {
    const description = e.detail.value
    const updatedShopInfo = {
      ...this.data.shopInfo,
      description: description
    }
    this.setData({ shopInfo: updatedShopInfo })
  },

  /**
   * 地址变更
   */
  onAddressChange(e) {
    const address = e.detail.value
    const updatedShopInfo = {
      ...this.data.shopInfo,
      address: address
    }
    this.setData({ shopInfo: updatedShopInfo })
  },

  /**
   * 营业时间变更
   */
  onBusinessHoursChange(e) {
    const businessHours = e.detail.value
    const updatedShopInfo = {
      ...this.data.shopInfo,
      businessHours: businessHours
    }
    this.setData({ shopInfo: updatedShopInfo })
  },

  /**
   * 提交保存
   * 调用云函数更新商铺信息
   */
  onSubmit() {
    const { shopId, shopInfo } = this.data
    
    // 表单验证
    if (!shopInfo.name) {
      wx.showToast({ title: '请输入商铺名称', icon: 'none' })
      return
    }
    
    if (!shopInfo.phone) {
      wx.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
    
    if (!shopInfo.address) {
      wx.showToast({ title: '请选择商铺地址', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    try {
      wx.cloud.callFunction({
        name: 'shop',
        data: {
          action: 'update',
          shopId: shopId,
          shopData: shopInfo
        },
        success: (res) => {
          console.log('更新商铺信息成功:', res)
          if (res.result.code === 0) {
            wx.showToast({ title: '保存成功' })
            wx.navigateBack()
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('更新商铺信息失败:', err)
          wx.showToast({ title: '保存失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    } catch (err) {
      console.error('更新商铺信息失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  /**
   * 取消编辑
   * 返回上一页
   */
  onCancel() {
    wx.navigateBack()
  }
})