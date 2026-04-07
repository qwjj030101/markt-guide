/**
 * 发布需求页面
 * 功能：支持文字输入和图片上传，发布新需求
 */
import { uploadImage } from '../../utils/upload';

Page({
  data: {
    content: '',
    image: '',
    imageUrl: ''
  },

  /**
   * 页面加载时执行
   */
  onLoad() {
    // 页面初始化
  },

  /**
   * 输入需求内容
   * @param {Object} e - 事件对象
   */
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },

  /**
   * 选择图片
   */
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePaths = res.tempFiles;
        if (tempFilePaths.length > 0) {
          const tempFilePath = tempFilePaths[0].tempFilePath;
          this.setData({
            imageUrl: tempFilePath
          });
        }
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
      }
    });
  },

  /**
   * 删除图片
   */
  deleteImage() {
    this.setData({
      image: '',
      imageUrl: ''
    });
  },

/**
 * 发布需求
 */
  async onPublish() {
    const { content, imageUrl } = this.data;
    const trimmedContent = content.trim();
    
    if (!trimmedContent) {
      wx.showToast({ title: '需求内容不能为空', icon: 'none' });
      return;
    }
    
    try {
      wx.showLoading({ title: '发布中...' });
      
      // 获取当前用户的 openid
      const app = getApp();
      let openid = app.globalData.openid;
      
      if (!openid) {
        openid = wx.getStorageSync('openid');
        if (!openid) {
          wx.hideLoading();
          wx.showToast({ title: '请先登录', icon: 'none' });
          return;
        }
      }
      
      // 上传图片（如果有）
      let image = '';
      if (imageUrl) {
        image = await uploadImage(imageUrl, 'demand-images/');
      }
      
      // 调用云函数发布需求
      const result = await wx.cloud.callFunction({
        name: 'demand',
        data: {
          action: 'add',
          content: trimmedContent,
          user_id: openid,
          image: image
        }
      });
      
      wx.hideLoading();
      
      if (result.result && result.result.success) {
        wx.showToast({ title: '发布成功' });
        
        // 设置全局标记，提示其他页面需要刷新
        wx.setStorageSync('needRefreshDemand', true);
        
        // 返回到需求页面
        wx.navigateBack();
      } else {
        wx.showToast({ title: '发布失败', icon: 'none' });
      }
    } catch (err) {
      console.error('发布需求失败:', err);
      wx.hideLoading();
      wx.showToast({ title: `发布失败: ${err.message}`, icon: 'none' });
    }
  },

  /**
   * 取消发布
   */
  onCancel() {
    wx.navigateBack();
  }
});