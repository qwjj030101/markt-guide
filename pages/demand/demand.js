/**
 * 需求广场页面
 * 功能：展示轮播图、需求列表，支持发布需求、响应需求、完成需求等操作
 */
Page({
  data: {
    banners: [],
    pageTitle: '',
    isMerchant: false,
    demandList: [],
    userQuota: 0,
    userPackageExpire: ''
  },

  /**
   * 加载广告数据
   * 从云数据库 ads 集合获取广告列表
   */
  loadAds() {
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

  /**
   * 广告点击事件
   * @param {Object} e - 事件对象
   */
  onAdTap(e) {
    const link = e.detail.link
    console.log('广告点击:', link)
    
    if (!link) {
      return
    }
    
    // 判断链接类型
    if (link.startsWith('http://') || link.startsWith('https://')) {
      // 外部链接，使用 web-view 打开
      wx.navigateTo({
        url: `/pages/webview/webview?url=${encodeURIComponent(link)}`
      })
    } else if (link.startsWith('/pages/')) {
      // 内部页面链接
      wx.navigateTo({
        url: link
      })
    } else if (link.startsWith('wx')) {
      // 其他小程序链接
      wx.navigateToMiniProgram({
        appId: link,
        success: (res) => {
          console.log('跳转小程序成功:', res)
        },
        fail: (err) => {
          console.error('跳转小程序失败:', err)
          wx.showToast({ title: '跳转失败', icon: 'none' })
        }
      })
    } else {
      // 默认使用 navigateTo
      wx.navigateTo({
        url: link
      })
    }
  },

  /**
   * 页面加载时执行
   * 初始化加载轮播图、用户信息和需求列表
   */
  onLoad() {
    console.log('========== 页面加载 ==========')
    this.loadAds()
    this.loadUserInfo()
  },

  /**
   * 页面显示时执行
   * 每次显示页面时刷新需求列表，确保数据最新
   */
  onShow() {
    console.log('========== 页面显示 ==========')
    
    // 检查是否需要刷新
    const needRefresh = wx.getStorageSync('needRefreshDemand')
    console.log('页面显示 - needRefresh:', needRefresh)
    
    if (needRefresh) {
      // 清除标记
      wx.removeStorageSync('needRefreshDemand')
      console.log('页面显示 - 清除 needRefreshDemand 标记')
    }
    
    // 获取当前用户角色
    const app = getApp()
    const role = app.globalData.role
    const openid = app.globalData.openid
    
    console.log('页面显示 - 用户角色:', role, 'openid:', openid)
    
    // 如果是商户（role === 1），则刷新需求列表
    if (role === 1) {
      console.log('页面显示 - 商户，刷新需求列表')
      this.loadDemandList()
    } else {
      console.log('页面显示 - 普通用户，不刷新需求列表')
    }
  },
  
  /**
   * 下拉刷新事件
   * 用户下拉页面时触发，用于刷新需求列表
   */
  onPullDownRefresh() {
    console.log('========== 下拉刷新触发 ==========')
    
    // 刷新需求列表
    this.loadDemandList()
    
    // 停止下拉刷新动画
    wx.stopPullDownRefresh()
  },
  
  /**
   * 检查商户订阅消息授权
   */
  checkSubscribeAuth() {
    const app = getApp()
    const role = app.globalData.role
    
    // 只有商户需要授权
    if (role !== 1) {
      return
    }
    
    // 检查本地存储是否已授权
    const hasAuth = wx.getStorageSync('subscribeAuth')
    if (hasAuth) {
      return
    }
    
    // 模板ID（使用单模板方案）
    const templateId = 'QVS_qFMhHcASgx9Mkmnklr5B9wSVLSP0DfOdYOfTizk' // 替换为实际的模板ID
    
    // 调用订阅消息授权
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息授权成功:', res)
        
        // 检查授权结果
        if (res[templateId] === 'accept') {
          // 上报授权结果到云函数
          this.updateSubscribeAuth(templateId, 1)
          
          // 标记已授权
          wx.setStorageSync('subscribeAuth', true)
        }
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err)
      }
    })
  },
  
  /**
   * 上报订阅消息授权结果到云函数
   * @param {string} templateId - 模板ID
   * @param {number} authCount - 授权成功的模板数
   */
  updateSubscribeAuth(templateId, authCount) {
    console.log('上报订阅授权结果到云函数')
    console.log('参数:', { templateId, authCount })
    
    wx.cloud.callFunction({
      name: 'subscribe',
      data: {
        action: 'update',
        templateId: templateId,
        authCount: authCount
      },
      success: (res) => {
        console.log('上报订阅授权结果成功:', res)
      },
      fail: (err) => {
        console.error('上报订阅授权结果失败:', err)
      }
    })
  },
  
  /**
   * 订阅消息授权按钮点击事件
   */
  onSubscribeTap() {
    console.log('onSubscribeTap 被调用 - 用户点击事件')
    const app = getApp()
    const role = app.globalData.role
    
    // 只有商户需要授权
    if (role !== 1) {
      wx.showToast({ title: '仅商户可订阅', icon: 'none' })
      return
    }
    
    // 模板ID（使用单模板方案）
    const templateId = 'QVS_qFMhHcASgx9Mkmnklr5B9wSVLSP0DfOdYOfTizk' // 替换为实际的模板ID
    
    console.log('准备调用订阅消息授权')
    console.log('模板ID:', templateId)
    
    // 调用订阅消息授权
    wx.requestSubscribeMessage({
      tmplIds: [templateId],
      success: (res) => {
        console.log('订阅消息授权成功:', res)
        
        // 检查授权结果
        if (res[templateId] === 'accept') {
          // 上报授权结果到云函数
          this.updateSubscribeAuth(templateId, 1)
          
          // 标记已授权
          wx.setStorageSync('subscribeAuth', true)
          
          wx.showToast({ title: '订阅成功', icon: 'success' })
        } else if (res[templateId] === 'reject') {
          wx.showToast({ title: '已拒绝订阅', icon: 'none' })
        } else if (res[templateId] === 'ban') {
          wx.showToast({ title: '已被后台封禁', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('订阅消息授权失败:', err)
        wx.showToast({ title: `授权失败: ${err.errMsg}`, icon: 'none' })
      }
    })
  },

  /**
   * 轮播图点击事件
   * @param {Object} e - 事件对象
   */
  onBannerTap(e) {
    const link = e.currentTarget.dataset.link
    if (link) {
      wx.navigateTo({ url: link })
    }
  },

  /**
   * 商户信息点击事件
   * 跳转到商户详情页面
   * @param {Object} e - 事件对象
   */
  onResponseTap(e) {
    const shopId = e.currentTarget.dataset.shopId
    wx.navigateTo({
      url: `/pages/shop/detail?id=${shopId}`
    })
  },

  /**
   * 完成需求事件
   * 调用接口标记需求为已完成状态
   * @param {Object} e - 事件对象
   */
  onComplete(e) {
    const id = e.currentTarget.dataset.id
    wx.cloud.callFunction({
      name: 'demand',
      data: {
        action: 'complete',
        demand_id: id
      },
      success: (result) => {
        if (result.result.success) {
          wx.showToast({ title: '已完成', icon: 'success' })
          this.loadDemandList()
        } else {
          wx.showToast({ title: '操作失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('标记需求完成失败:', err)
        wx.showToast({ title: '操作失败', icon: 'none' })
      }
    })
  },

  /**
   * 响应需求事件
   * 商户可以输入备注信息响应需求
   * @param {Object} e - 事件对象
   */
  onRespond(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '商户备注',
      editable: true,
      placeholderText: '请输入商户备注',
      success: (res) => {
        if (res.confirm && res.content) {
          // 获取当前商户的 shop_id
          const app = getApp()
          const shopId = app.globalData.shop_id
          
          console.log('响应需求 - 需求ID:', id, '商户ID:', shopId, '备注:', res.content)
          
          if (!shopId) {
            wx.showToast({ title: '商户信息不存在', icon: 'none' })
            return
          }
          
          wx.cloud.callFunction({
            name: 'demand',
            data: {
              action: 'respond',
              demand_id: id,
              remark: res.content,
              shop_id: shopId
            },
            success: (result) => {
              console.log('响应需求 - 云函数返回:', result)
              if (result.result.success) {
                wx.showToast({ title: '响应成功', icon: 'success' })
                this.loadDemandList()
              } else {
                console.error('响应需求 - 失败:', result.result.message)
                if (result.result.message === 'INSUFFICIENT_QUOTA') {
                  wx.showToast({ title: '响应配额不足', icon: 'none' })
                } else {
                  wx.showToast({ title: result.result.message || '操作失败', icon: 'none' })
                }
              }
            },
            fail: (err) => {
              console.error('响应需求 - 云函数调用失败:', err)
              wx.showToast({ title: '网络错误，请稍后重试', icon: 'none' })
            }
          })
        }
      }
    })
  },

  /**
   * 撤回响应事件
   * 商户可以撤回之前对需求的响应
   * @param {Object} e - 事件对象
   */
  onDemandWithdraw(e) {
    const demandId = e.detail.demand_id
    
    wx.showModal({
      title: '确认撤回',
      content: '确认撤回该响应吗？',
      success: (res) => {
        if (res.confirm) {
          wx.cloud.callFunction({
            name: 'demand',
            data: {
              action: 'withdraw',
              demand_id: demandId
            },
            success: (result) => {
              if (result.result.success) {
                wx.showToast({ title: '撤回成功', icon: 'success' })
                this.loadDemandList()
              } else {
                wx.showToast({ title: result.result.message || '操作失败', icon: 'none' })
              }
            },
            fail: (err) => {
              console.error('撤回响应失败:', err)
              wx.showToast({ title: '操作失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  /**
   * 发布需求事件
   * 用户可以发布新的需求描述
   */
  async onPublish() {
    console.log('========== onPublish 被调用 ==========')
    
    // 检查登录状态
    const app = getApp()
    const isLoggedIn = await app.checkLogin()
    
    if (!isLoggedIn) {
      // 未登录，显示提示
      wx.showModal({
        title: '提示',
        content: '请先登录后再发布需求',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 跳转到我的页面
            wx.navigateTo({
              url: '/pages/mine/mine'
            })
          }
        }
      })
      return
    }
    
    // 已登录，显示发布对话框
    this.showPublishModal()
  },

  /**
   * 显示发布需求对话框
   */
  showPublishModal() {
    console.log('========== showPublishModal 被调用 ==========')
    wx.showModal({
      title: '发布需求',
      editable: true,
      placeholderText: '请输入您要采购的商品或服务',
      confirmText: '发布',
      success: (res) => {
        console.log('========== 弹窗回调触发 ==========', res)
        if (res.confirm && res.content) {
          const trimmedContent = res.content.trim()
          console.log('========== 发布内容 ==========', trimmedContent)
          if (trimmedContent === '') {
            console.log('========== 空需求，不发布 ==========')
            wx.showToast({ title: '空需求不可发布', icon: 'none' })
            return
          }
          console.log('========== 准备调用 addDemand ==========')
          this.addDemand(trimmedContent)
        } else {
          console.log('========== 用户取消或内容为空 ==========')
        }
      },
      fail: (err) => {
        console.error('========== 弹窗失败 ==========', err)
      }
    })
  },

  /**
   * 添加需求
   * @param {string} content - 需求内容
   */
  async addDemand(content) {
    console.log('========== addDemand 被调用 ==========')
    try {
      console.log('========== addDemand 开始 ==========', content)
      // 显示加载提示
      wx.showLoading({ title: '发布中...' })

      // 获取当前用户的 openid
      const app = getApp()
      let openid = app.globalData.openid
      console.log('========== 获取 openid - globalData ==========', openid)
      
      if (!openid) {
        // 如果 globalData 中没有 openid，从本地缓存获取
        openid = wx.getStorageSync('openid')
          console.log('========== 获取 openid - 缓存 ==========', openid)
        if (!openid) {
          // 如果本地缓存也没有，提示用户
          wx.hideLoading()
          wx.showToast({ title: '请先登录', icon: 'none' })
          console.log('========== 发布需求失败: 未登录 ==========')
          return
        }
      }

      console.log('========== 准备调用云函数 - action: add ==========')
      console.log('========== 参数 ==========', {
        action: 'add',
        content: content,
        user_id: openid
      })

      // 调用云函数
      const result = await wx.cloud.callFunction({
        name: 'demand',
        data: {
          action: 'add',
          content: content,
          user_id: openid
        }
      })

      console.log('========== 云函数调用成功 ==========')
      console.log('========== 云函数返回结果 ==========', result)

      // 隐藏加载提示
      wx.hideLoading()

      // 处理结果
    if (result.result && result.result.success) {
      console.log('========== 发布成功 ==========')
      wx.showToast({ title: '发布成功' })
      this.loadDemandList()
      
      // 设置全局标记，提示其他页面需要刷新
      wx.setStorageSync('needRefreshDemand', true)
      console.log('========== 设置刷新标记 ==========')
    } else {
      console.log('========== 发布失败 ==========')
      console.log('========== 失败原因 ==========', result.result.message)
      wx.showToast({ title: '发布失败', icon: 'none' })
    }
    } catch (err) {
      console.error('========== addDemand 异常 ==========')
      console.error('========== 异常信息 ==========', err)
      console.error('========== 异常堆栈 ==========', err.stack)
      wx.hideLoading()
      wx.showToast({ title: `发布失败: ${err.message}`, icon: 'none' })
    }
  },

  /**
   * 加载轮播图数据
   * 从服务器获取轮播图列表
   */
  loadBanners() {
    wx.request({
      url: 'https://api.example.com/banners',
      success: (res) => {
        this.setData({ banners: res.data })
      }
    })
  },

  /**
   * 加载用户信息
   * 获取用户角色信息，判断是否为商户，并设置相应页面标题
   */
  loadUserInfo() {
    const app = getApp()
    // 从 globalData 获取用户信息
    const userInfo = app.globalData.userInfo
    const role = app.globalData.role
    const openid = app.globalData.openid
    
    console.log('加载用户信息 - userInfo:', userInfo)
    console.log('加载用户信息 - role:', role)
    console.log('加载用户信息 - openid:', openid)
    
    this.setData({
      isMerchant: role === 1,
      pageTitle: role === 1 ? '需求广场' : '我的需求'
    })
    
    // 根据用户角色决定是否传 user_id
    this.loadDemandList()
  },

  /**
   * 加载需求列表
   * 从服务器获取需求数据
   */
  loadDemandList() {
    const app = getApp()
    const role = app.globalData.role
    const openid = app.globalData.openid
    const response_quota = app.globalData.response_quota || 0
    const response_package_expire = app.globalData.response_package_expire || ''
    
    console.log('加载需求列表 - 用户角色:', role, 'openid:', openid)
    console.log('加载需求列表 - 响应配额:', response_quota, '响应包过期时间:', response_package_expire)
    
    // 更新页面数据
    this.setData({
      userQuota: response_quota,
      userPackageExpire: response_package_expire
    })
    
    // 根据用户角色决定是否传 user_id
    const data = { action: 'list' }
    if (role !== 1 && openid) { // 普通用户传 user_id，且 openid 存在
      data.user_id = openid
      console.log('加载需求列表 - 普通用户，传 user_id:', openid)
    } else {
      console.log('加载需求列表 - 商户或 openid 不存在，不传 user_id')
    }
    
    console.log('准备调用云函数 - action: list')
    console.log('参数:', data)
    
    wx.cloud.callFunction({
      name: 'demand',
      data: data,
      success: (result) => {
        console.log('加载需求列表 - 云函数返回结果:', result)
        if (result.result.success) {
          console.log('加载需求列表 - 成功，数据:', result.result.data)
          
          // 处理数据，添加必要的字段
          const processedData = result.result.data.map(item => {
            // 获取当前用户的 shop_id
            const shopId = app.globalData.shop_id;
            console.log('处理需求 - 需求ID:', item._id, '当前shopId:', shopId, '响应列表:', item.responses);
            
            // 判断当前商户是否已经响应过该需求
            const hasResponded = item.responses && item.responses.some(response => response.shopId === shopId);
            console.log('处理需求 - hasResponded:', hasResponded, 'status:', item.status);
            
            return {
              id: item._id,
              user: item.user || { // 使用云函数返回的用户信息
                avatar: '/images/R.jpg',
                nickName: '用户' + item.user_id.substring(0, 4)
              },
              content: item.content,
              responses: item.responses || [], // 如果没有响应，设置为空数组
              isOwn: item.user_id === openid, // 判断是否是当前用户发布的
              canRespond: role === 1 && item.user_id !== openid, // 商户可以响应不是自己发布的需求
              hasResponded: hasResponded, // 当前商户是否已响应
              status: item.status
            }
          })
          
          this.setData({ demandList: processedData })
        } else {
          console.log('加载需求列表 - 失败，原因:', result.result.message)
          wx.showToast({ title: '加载失败', icon: 'none' })
        }
      },
      fail: (err) => {
        console.error('加载需求列表失败:', err)
        console.error('错误堆栈:', err.stack)
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  /**
   * 点击响应列表中的头像
   * @param {Object} e - 事件对象
   */
  onTapShop(e) {
    const shopId = e.detail.shop_id
    this.onResponseTap({ currentTarget: { dataset: { shopId: shopId } } })
  },

  /**
   * 点击"我有货"按钮
   * @param {Object} e - 事件对象
   */
  onTapResponse(e) {
    const demandId = e.detail.demand_id
    this.onRespond({ currentTarget: { dataset: { id: demandId } } })
  },

  /**
   * 点击"已完成"按钮
   * @param {Object} e - 事件对象
   */
  onTapComplete(e) {
    const demandId = e.detail.demand_id
    this.onComplete({ currentTarget: { dataset: { id: demandId } } })
  },

  /**
   * 响应配额不足，需要购买
   * @param {Object} e - 事件对象
   */
  onNeedBuy(e) {
    const demandId = e.detail.demand_id
    
    wx.showModal({
      title: '响应配额不足',
      content: '您的响应配额不足，是否前往购买响应包？',
      confirmText: '前往购买',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/buy/buy?demand_id=${demandId}`
          })
        }
      }
    })
  }
})