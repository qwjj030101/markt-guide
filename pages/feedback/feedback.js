Page({
  data: {
    // 反馈类型选项
    feedbackTypes: ['问题反馈', '功能建议', '其他'],
    // 选中的类型索引
    selectedType: 0,
    // 表单数据
    formData: {
      title: '',
      content: '',
      contact: ''
    },
    // 图片列表（存储 fileID）
    imageList: []
  },

  // 反馈类型变化
  onTypeChange(e) {
    this.setData({
      selectedType: e.detail.value
    })
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({
      'formData.title': e.detail.value
    })
  },

  // 内容输入
  onContentInput(e) {
    this.setData({
      'formData.content': e.detail.value
    })
  },

  // 联系方式输入
  onContactInput(e) {
    this.setData({
      'formData.contact': e.detail.value
    })
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 3 - this.data.imageList.length, // 最多选择3张
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        // 上传图片
        this.uploadImages(res.tempFilePaths)
      }
    })
  },

  // 上传图片
  uploadImages(tempFilePaths) {
    wx.showLoading({ title: '上传中...' })
    
    const uploadTasks = tempFilePaths.map((tempFilePath, index) => {
      const cloudPath = `feedback/${Date.now()}_${index}.jpg`
      return wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      })
    })

    Promise.all(uploadTasks).then((results) => {
      wx.hideLoading()
      
      const newImageList = results.map(result => result.fileID)
      this.setData({
        imageList: [...this.data.imageList, ...newImageList]
      })
    }).catch((err) => {
      wx.hideLoading()
      wx.showToast({ title: '上传失败', icon: 'none' })
      console.error('上传图片失败:', err)
    })
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      urls: this.data.imageList,
      current: this.data.imageList[index]
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const newImageList = this.data.imageList.filter((_, i) => i !== index)
    this.setData({
      imageList: newImageList
    })
  },

  // 提交反馈
  onSubmit(e) {
    const { title, content, contact } = this.data.formData
    const type = this.data.feedbackTypes[this.data.selectedType]
    const images = this.data.imageList

    // 验证表单
    if (!title || !content) {
      wx.showToast({ title: '请填写标题和内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    // 获取用户 openid（使用 login 方法）
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'login',
        code: '' // 空代码，因为云函数中直接从 wxContext 获取
      },
      success: (res) => {
        if (res.result.code === 0) {
          const openid = res.result.data.openid
          
          // 存储反馈数据到云数据库
          wx.cloud.callFunction({
            name: 'feedback',
            data: {
              action: 'add',
              feedback: {
                type: type,
                title: title,
                content: content,
                images: images,
                contact: contact,
                openid: openid,
                create_time: new Date()
              }
            },
            success: (res) => {
              wx.hideLoading()
              wx.showToast({ title: '感谢反馈', icon: 'success' })
              
              // 延迟返回上一页
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            },
            fail: (err) => {
              wx.hideLoading()
              wx.showToast({ title: '提交失败', icon: 'none' })
              console.error('提交反馈失败:', err)
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({ title: '获取用户信息失败', icon: 'none' })
          console.error('获取 openid 失败:', res.result.message)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '获取用户信息失败', icon: 'none' })
        console.error('获取 openid 失败:', err)
      }
    })
  }
})