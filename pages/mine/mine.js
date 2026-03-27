/**
 * 个人中心页面
 * 功能：展示用户信息、商户状态、会员有效期，提供商铺管理、续费、入驻等入口
 */
Page({
  data: {
    userInfo: {
      avatarUrl: '',    // 用户头像URL
      nickName: ''   // 用户昵称
    },
    isMerchant: false,   // 是否为商户身份
    isValid: false,      // 会员是否有效
    remainingDays: 0,     // 剩余天数
    expireDateFormatted: '', // 格式化后的到期时间
    isAuthorized: false,  // 是否已授权
    isAuthorizing: false  // 是否正在授权中
  },

  /**
   * 页面加载时执行
   * 初始化加载用户信息
   */
  onLoad() {
    this.loadUserInfo()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新用户信息，确保数据最新
   */
  onShow() {
    const app = getApp()
    const globalUserInfo = app.globalData.userInfo
    const role = app.globalData.role
    const expire_date = app.globalData.expire_date
    const remainingDays = app.getRemainingDays()
    
    // 检查是否已授权（是否有用户信息且不是默认值）
    const isAuthorized = globalUserInfo && (globalUserInfo.nickName !== '微信用户' || globalUserInfo.avatarUrl !== '')
    const isMerchant = role === 1
    const isValid = remainingDays > 0
    const expireDateFormatted = this.formatExpireDate(expire_date)
    
    this.setData({
      userInfo: globalUserInfo || {
        avatarUrl: '',
        nickName: ''
      },
      isMerchant: isMerchant,
      isValid: isValid,
      remainingDays: remainingDays,
      expireDateFormatted: expireDateFormatted,
      isAuthorized: isAuthorized  // 判断是否已授权
    })
    console.log('加载用户信息:', this.data.userInfo)
    console.log('授权状态:', isAuthorized)
    console.log('用户角色:', role, '是否为商户:', isMerchant)
    console.log('过期时间:', expire_date, '剩余天数:', remainingDays, '是否有效:', isValid, '格式化到期时间:', expireDateFormatted)
  },

  /**
   * 商铺管理点击事件
   * 跳转到商铺管理页面
   */
  onShopTap() {
    wx.navigateTo({
      url: '/pages/shop/manage'
    })
  },

  /**
   * 续费点击事件
   * 跳转到付费页面进行会员续费
   */
  onRenewTap() {
    wx.navigateTo({
      url: '/pages/pay/pay'
    })
  },

  /**
   * 入驻申请点击事件
   * 跳转到入驻申请页面
   */
  onJoinTap() {
    wx.navigateTo({
      url: '/pages/join/join'
    })
  },

  /**
   * 授权按钮点击事件
   * 调用 wx.getUserProfile 获取用户信息
   */
  onAuthorizeTap() {
    // 防止重复点击
    if (this.data.isAuthorizing) {
      return
    }
    
    const app = getApp()
    
    // 设置授权中状态
    this.setData({ isAuthorizing: true })
    
    // 注意：从2022年11月开始，wx.getUserProfile不再支持获取用户头像和昵称
    // 这里使用模拟数据来演示，实际项目中可以引导用户手动输入
    const mockUserInfo = {
      nickName: '微信用户' + Math.floor(Math.random() * 10000),
      avatarUrl: '' // 空头像，实际项目中可以使用默认头像
    }
    
    console.log('模拟获取用户信息:', mockUserInfo)
    
    // 存储用户信息到globalData
    app.globalData.userInfo = mockUserInfo
    
    // 存储用户信息到本地缓存
    try {
      wx.setStorageSync('userInfoWechat', mockUserInfo)
      console.log('用户信息已存入本地缓存')
    } catch (err) {
      console.error('缓存用户信息失败:', err)
    }
    
    // 更新页面数据
    this.setData({
      userInfo: mockUserInfo,
      isAuthorized: true,
      isAuthorizing: false
    })
    
    console.log('授权完成，用户信息:', mockUserInfo)
  },

  /**
   * 加载用户信息
   * 从 globalData 获取用户详细信息，包括头像、昵称、角色、会员到期时间等
   */
  loadUserInfo() {
    const app = getApp()
    const globalUserInfo = app.globalData.userInfo
    const role = app.globalData.role
    const remainingDays = app.getRemainingDays()
    
    // 检查是否已授权（是否有用户信息且不是默认值）
    const isAuthorized = globalUserInfo && (globalUserInfo.nickName !== '微信用户' || globalUserInfo.avatarUrl !== '')
    
    this.setData({
      userInfo: globalUserInfo || {
        avatarUrl: '',
        nickName: ''
      },
      isMerchant: role === 1,
      isValid: remainingDays > 0,
      remainingDays: remainingDays,
      isAuthorized: isAuthorized  // 判断是否已授权
    })
    console.log('加载用户信息:', this.data.userInfo)
    console.log('授权状态:', isAuthorized)
  },

  /**
   * 计算剩余天数
   * @param {string} expireDate - 会员到期日期
   * @returns {number} 剩余天数，如果已过期则返回0
   */
  calculateRemainingDays(expireDate) {
    if (!expireDate) return 0
    const now = new Date()
    const expire = new Date(expireDate)
    const diffTime = expire - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  },
  // 添加头像选择方法
chooseAvatar() {
  wx.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePaths = res.tempFiles
      if (tempFilePaths.length > 0) {
        const tempFilePath = tempFilePaths[0].tempFilePath
        const app = getApp()
        
        // 显示加载提示
        wx.showLoading({ title: '上传中...' })
        
        // 上传图片到云存储
        wx.cloud.uploadFile({
          cloudPath: 'avatars/' + Date.now() + '.jpg', // 生成唯一的文件名
          filePath: tempFilePath,
          success: (uploadRes) => {
            // 获取云存储的永久链接
            const avatarUrl = uploadRes.fileID
            
            // 存储头像路径到用户信息
            app.globalData.userInfo.avatarUrl = avatarUrl
            // 存储到本地缓存
            try {
              wx.setStorageSync('userInfoWechat', app.globalData.userInfo)
            } catch (err) {
              console.error('缓存用户信息失败:', err)
            }
            // 更新页面数据
            this.setData({
              userInfo: app.globalData.userInfo
            })
            // 同步到数据库
            this.updateUserInfoToDB()
            
            // 隐藏加载提示
            wx.hideLoading()
          },
          fail: (err) => {
            console.error('上传头像失败:', err)
            // 隐藏加载提示
            wx.hideLoading()
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        })
      }
    }
  })
},

// 添加编辑昵称方法
  editNickname() {
    const app = getApp()
    wx.showModal({
      title: '修改昵称',
      editable: true,  // 允许输入
      placeholderText: '请输入你的新昵称',
      inputValue: this.data.userInfo.nickName,
      success: (res) => {
        if (res.confirm) {
          const nickName = res.content
          // 存储昵称到用户信息
          app.globalData.userInfo.nickName = nickName
          // 存储到本地缓存
          try {
            wx.setStorageSync('userInfoWechat', app.globalData.userInfo)
          } catch (err) {
            console.error('缓存用户信息失败:', err)
          }
          // 更新页面数据
          this.setData({
            userInfo: app.globalData.userInfo
          })
          // 同步到数据库
          this.updateUserInfoToDB()
        }
      }
    })
  },

  // 同步用户信息到数据库
  updateUserInfoToDB() {
    const app = getApp()
    console.log('开始同步用户信息到数据库:', {
      openid: app.globalData.openid,
      userInfo: app.globalData.userInfo
    })
    
    if (app.globalData.openid && app.globalData.userInfo) {
      wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'updateUserInfo',
          openid: app.globalData.openid,
          userInfo: app.globalData.userInfo
        },
        success: (res) => {
          console.log('同步用户信息到数据库成功:', res)
        },
        fail: (err) => {
          console.error('同步用户信息到数据库失败:', err)
        }
      })
    } else {
      console.error('同步用户信息到数据库失败: 缺少openid或userInfo', {
        openid: app.globalData.openid,
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 显示操作菜单
  showActionSheet() {
    wx.showActionSheet({
      itemList: ['修改昵称', '更换头像'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            // 修改昵称
            this.editNickname();
            break;
          case 1:
            // 更换头像
            this.chooseAvatar();
            break;
        }
      }
    });
  },

  /**
   * 格式化过期时间为 xxxx年xx月xx日 格式
   * @param {string} expireDate - 过期时间
   * @returns {string} 格式化后的日期字符串
   */
  formatExpireDate(expireDate) {
    if (!expireDate) return ''
    const date = new Date(expireDate)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}年${month}月${day}日`
  },
})
