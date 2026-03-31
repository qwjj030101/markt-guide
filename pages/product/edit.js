/**
 * 商品编辑页面
 * 功能：添加或编辑商品信息，包括商品名称和图片
 */
Page({
  data: {
    productId: '',
    shopId: '',
    isEditMode: false,
    productInfo: {
      name: '',
      image: ''
    }
  },

  /**
   * 页面加载时执行
   * 初始化页面数据，判断是编辑模式还是添加模式
   */
  onLoad(options) {
    const { product_id, shop_id } = options
    this.setData({
      productId: product_id || '',
      shopId: shop_id || '',
      isEditMode: !!product_id
    })
    
    // 如果是编辑模式，加载商品信息
    if (this.data.isEditMode) {
      this.loadProductInfo()
    }
  },

  /**
   * 加载商品信息
   * 从服务器获取商品详情并填充到表单
   */
  loadProductInfo() {
    const { productId } = this.data
    wx.showLoading({ title: '加载中...' })
    
    try {
      wx.cloud.callFunction({
        name: 'product',
        data: {
          action: 'detail',
          productId: productId
        },
        success: (res) => {
          console.log('获取商品详情成功:', res)
          if (res.result.code === 0) {
            this.setData({ productInfo: res.result.data })
          } else {
            wx.showToast({ title: '加载失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('获取商品详情失败:', err)
          wx.showToast({ title: '加载失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    } catch (err) {
      console.error('获取商品详情失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  /**
   * 商品名称变更
   */
  onNameChange(e) {
    const name = e.detail.value
    const updatedProductInfo = {
      ...this.data.productInfo,
      name: name
    }
    this.setData({ productInfo: updatedProductInfo })
  },

  /**
   * 选择图片
   * 从本地相册或相机选择图片
   */
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFilePaths
        this.uploadImage(tempFilePaths[0])
      }
    })
  },

  /**
   * 上传图片
   * 将选择的图片上传到云存储
   */
  uploadImage(tempFilePath) {
    wx.showLoading({ title: '上传中...' })
    
    const cloudPath = `product_images/${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`
    
    wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath,
      success: (res) => {
        console.log('上传图片成功:', res)
        const imageFileId = res.fileID
        
        // 存储fileID，而不是临时URL
        const updatedProductInfo = {
          ...this.data.productInfo,
          image: imageFileId
        }
        this.setData({ productInfo: updatedProductInfo })
      },
      fail: (err) => {
        console.error('上传图片失败:', err)
        wx.showToast({ title: '上传失败', icon: 'none' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  /**
   * 保存商品信息
   * 根据是否是编辑模式，调用添加或更新云函数
   */
  onSave() {
    const { isEditMode, productId, shopId, productInfo } = this.data
    
    // 表单验证
    if (!productInfo.name) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    try {
      const action = isEditMode ? 'update' : 'add'
      const data = {
        action: action,
        shopId: shopId,
        productData: productInfo
      }
      
      // 如果是编辑模式，添加productId
      if (isEditMode) {
        data.productId = productId
      }
      
      wx.cloud.callFunction({
        name: 'product',
        data: data,
        success: (res) => {
          console.log('保存商品成功:', res)
          if (res.result.code === 0) {
            wx.showToast({ title: isEditMode ? '更新成功' : '添加成功', icon: 'success' })
            // 保存成功后返回上一页
            setTimeout(() => {
              wx.navigateBack()
            }, 1000)
          } else {
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        },
        fail: (err) => {
          console.error('保存商品失败:', err)
          wx.showToast({ title: '保存失败', icon: 'none' })
        },
        complete: () => {
          wx.hideLoading()
        }
      })
    } catch (err) {
      console.error('保存商品失败:', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },

  /**
   * 删除商品
   * 调用删除云函数，成功后返回上一页
   */
  onDelete() {
    const { productId } = this.data
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
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
                  // 删除成功后返回上一页
                  setTimeout(() => {
                    wx.navigateBack()
                  }, 1000)
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