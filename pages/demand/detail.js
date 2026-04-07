import { getImageUrl, getImageUrls } from '../../utils/upload';

/**
 * 需求详情页面
 * 功能：显示需求详情，包括图片、响应列表，提供响应和完成操作
 */
Page({
  data: {
    demand: null
  },

  /**
   * 页面加载时执行
   * @param {Object} options - 页面参数
   */
  onLoad(options) {
    console.log('需求详情页加载，参数:', options);
    const demandId = options.demand_id || options.id;
    if (demandId) {
      this.loadDemandDetail(demandId);
    }
  },

  /**
   * 加载需求详情
   * @param {string} demandId - 需求ID
   */
  async loadDemandDetail(demandId) {
    wx.showLoading({ title: '加载中...' });
    
    try {
      const result = await wx.cloud.callFunction({
        name: 'demand',
        data: {
          action: 'detail',
          demand_id: demandId
        }
      });
      
      wx.hideLoading();
      if (result.result.success) {
        const demand = result.result.data;
        
        // 转换图片URL
        await this.convertImageUrls(demand);
        
        // 处理需求数据
        const app = getApp();
        const role = app.globalData.role;
        const openid = app.globalData.openid;
        
        const processedDemand = {
          ...this.data.demand,
          isOwn: demand.user_id === openid,
          canRespond: role === 1 && demand.user_id !== openid && demand.status === 0
        };
        
        this.setData({ demand: processedDemand });
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('加载需求详情失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    }
  },
  
  async convertImageUrls(demand) {
    try {
      // 转换用户头像
      let userAvatar = '/images/R.jpg';
      if (demand.user && demand.user.avatar) {
        userAvatar = await getImageUrl(demand.user.avatar);
      }
      
      // 转换需求图片
      let demandImage = '';
      if (demand.image) {
        demandImage = await getImageUrl(demand.image);
      }
      
      // 转换响应列表中的商户头像
      const responses = demand.responses || [];
      const responseAvatars = responses.map(r => r.shopAvatar || '');
      const convertedAvatars = await getImageUrls(responseAvatars);
      
      const convertedResponses = responses.map((response, index) => ({
        ...response,
        shopAvatar: convertedAvatars[index]
      }));
      
      // 更新数据
      this.setData({
        demand: {
          ...demand,
          user: {
            ...(demand.user || {}),
            avatar: userAvatar
          },
          image: demandImage,
          responses: convertedResponses
        }
      });
    } catch (error) {
      console.error('转换图片URL失败:', error);
      // 转换失败时使用原始数据
      this.setData({ demand: demand });
    }
  },

  /**
   * 预览图片
   */
  previewImage() {
    const { demand } = this.data;
    if (demand && demand.image) {
      wx.previewImage({
        urls: [demand.image],
        current: demand.image
      });
    }
  },

  /**
   * 响应需求事件
   */
  onRespond() {
    const { demand } = this.data;
    if (!demand) return;
    
    wx.showModal({
      title: '商户备注',
      editable: true,
      placeholderText: '请输入商户备注',
      success: (res) => {
        if (res.confirm && res.content) {
          const app = getApp();
          const shopId = app.globalData.shop_id;
          
          if (!shopId) {
            wx.showToast({ title: '商户信息不存在', icon: 'none' });
            return;
          }
          
          wx.cloud.callFunction({
            name: 'demand',
            data: {
              action: 'respond',
              demand_id: demand._id,
              remark: res.content,
              shop_id: shopId
            },
            success: (result) => {
              if (result.result.success) {
                wx.showToast({ title: '响应成功', icon: 'success' });
                // 刷新详情页
                this.loadDemandDetail(demand._id);
              } else {
                if (result.result.message === 'INSUFFICIENT_QUOTA') {
                  wx.showToast({ title: '响应配额不足', icon: 'none' });
                } else {
                  wx.showToast({ title: result.result.message || '操作失败', icon: 'none' });
                }
              }
            },
            fail: (err) => {
              console.error('响应需求失败:', err);
              wx.showToast({ title: '操作失败', icon: 'none' });
            }
          });
        }
      }
    });
  },

  /**
   * 完成需求事件
   */
  onComplete() {
    const { demand } = this.data;
    if (!demand) return;
    
    wx.cloud.callFunction({
      name: 'demand',
      data: {
        action: 'complete',
        demand_id: demand._id
      },
      success: (result) => {
        if (result.result.success) {
          wx.showToast({ title: '已完成', icon: 'success' });
          // 刷新详情页
          this.loadDemandDetail(demand._id);
        } else {
          wx.showToast({ title: '操作失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('标记需求完成失败:', err);
        wx.showToast({ title: '操作失败', icon: 'none' });
      }
    });
  },

  /**
   * 商户信息点击事件
   * @param {Object} e - 事件对象
   */
  onResponseTap(e) {
    const shopId = e.currentTarget.dataset.shopId;
    wx.navigateTo({
      url: `/pages/shop/detail?id=${shopId}`
    });
  }
});