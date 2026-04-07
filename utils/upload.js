/**
 * 图片上传工具
 * 统一处理图片上传和URL转换
 */

/**
 * 上传图片并转换为可直接使用的URL
 * @param {string} tempFilePath - 临时文件路径
 * @param {string} cloudPathPrefix - 云存储路径前缀
 * @returns {Promise<string>} - 可直接使用的图片URL
 */
export async function uploadImage(tempFilePath, cloudPathPrefix = 'images/') {
  try {
    // 显示加载提示
    wx.showLoading({ title: '上传中...' });
    
    // 生成唯一的云存储路径
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const cloudPath = `${cloudPathPrefix}${timestamp}_${random}.jpg`;
    
    // 上传图片到云存储
    const uploadResult = await wx.cloud.uploadFile({
      cloudPath: cloudPath,
      filePath: tempFilePath
    });
    
    // 存储原始云存储路径，避免使用临时URL
    // 临时URL有时间限制，会导致403错误
    // 云函数会在返回数据时统一转换为永久URL
    let imageUrl = uploadResult.fileID;
    
    // 隐藏加载提示
    wx.hideLoading();
    return imageUrl;
  } catch (error) {
    console.error('上传图片失败:', error);
    wx.hideLoading();
    wx.showToast({ title: '上传失败', icon: 'none' });
    throw error;
  }
}

/**
 * 批量上传图片
 * @param {Array<string>} tempFilePaths - 临时文件路径数组
 * @param {string} cloudPathPrefix - 云存储路径前缀
 * @returns {Promise<Array<string>>} - 可直接使用的图片URL数组
 */
export async function uploadImages(tempFilePaths, cloudPathPrefix = 'images/') {
  try {
    wx.showLoading({ title: '上传中...' });
    
    const uploadPromises = tempFilePaths.map(async (tempFilePath, index) => {
      const timestamp = Date.now();
      const cloudPath = `${cloudPathPrefix}${timestamp}_${index}.jpg`;
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: tempFilePath
      });
      
      // 存储原始云存储路径，避免使用临时URL
      let imageUrl = uploadResult.fileID;
      
      return imageUrl;
    });
    
    const imageUrls = await Promise.all(uploadPromises);
    wx.hideLoading();
    return imageUrls;
  } catch (error) {
    console.error('批量上传图片失败:', error);
    wx.hideLoading();
    wx.showToast({ title: '上传失败', icon: 'none' });
    throw error;
  }
}

/**
 * 转换图片URL为可直接使用的临时URL
 * @param {string} imageUrl - 图片URL（可能是云存储路径或HTTP URL）
 * @returns {Promise<string>} - 可直接使用的图片URL
 */
export async function getImageUrl(imageUrl) {
  try {
    // 如果是空字符串或null，返回默认图片
    if (!imageUrl || imageUrl === '') {
      return '/images/R.jpg';
    }
    
    // 如果已经是HTTP/HTTPS URL，直接返回
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // 如果是云存储路径，转换为临时URL
    if (imageUrl.startsWith('cloud://')) {
      const tempResult = await wx.cloud.getTempFileURL({
        fileList: [imageUrl]
      });
      
      if (tempResult.fileList[0] && tempResult.fileList[0].tempFileURL) {
        return tempResult.fileList[0].tempFileURL;
      }
    }
    
    // 其他情况返回默认图片
    return '/images/R.jpg';
  } catch (error) {
    console.error('转换图片URL失败:', error);
    return '/images/R.jpg';
  }
}

/**
 * 批量转换图片URL
 * @param {Array<string>} imageUrls - 图片URL数组
 * @returns {Promise<Array<string>>} - 转换后的图片URL数组
 */
export async function getImageUrls(imageUrls) {
  try {
    const cloudPaths = imageUrls.filter(url => url && url.startsWith('cloud://'));
    const otherUrls = imageUrls.map(url => {
      if (!url || url === '') {
        return '/images/R.jpg';
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      return null;
    });
    
    let tempUrlMap = {};
    if (cloudPaths.length > 0) {
      const tempResult = await wx.cloud.getTempFileURL({
        fileList: cloudPaths
      });
      
      for (let i = 0; i < cloudPaths.length; i++) {
        if (tempResult.fileList[i] && tempResult.fileList[i].tempFileURL) {
          tempUrlMap[cloudPaths[i]] = tempResult.fileList[i].tempFileURL;
        }
      }
    }
    
    return imageUrls.map((url, index) => {
      if (!url || url === '') {
        return '/images/R.jpg';
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      if (url.startsWith('cloud://') && tempUrlMap[url]) {
        return tempUrlMap[url];
      }
      return '/images/R.jpg';
    });
  } catch (error) {
    console.error('批量转换图片URL失败:', error);
    return imageUrls.map(() => '/images/R.jpg');
  }
}