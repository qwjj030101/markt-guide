/**
 * 图片处理工具函数
 * 统一处理云存储文件的 URL 转换
 */

const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 获取云存储文件的临时 URL
 * @param {string} fileID - 云存储文件 ID
 * @returns {Promise<string>} - 返回临时 URL
 */
export async function getTempFileURL(fileID) {
  try {
    if (!fileID || !fileID.startsWith('cloud://')) {
      return fileID
    }
    
    const result = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    
    if (result.fileList && result.fileList[0] && result.fileList[0].tempFileURL) {
      return result.fileList[0].tempFileURL
    }
    
    return fileID
  } catch (err) {
    console.error('获取临时文件 URL 失败:', err)
    return fileID
  }
}

/**
 * 批量获取云存储文件的临时 URL
 * @param {Array} fileIDs - 云存储文件 ID 数组
 * @returns {Promise<Array>} - 返回临时 URL 数组
 */
export async function getTempFileURLs(fileIDs) {
  try {
    if (!Array.isArray(fileIDs)) {
      return []
    }
    
    // 过滤出云存储文件 ID
    const cloudFileIDs = fileIDs.filter(fileID => fileID && fileID.startsWith('cloud://'))
    
    if (cloudFileIDs.length === 0) {
      return fileIDs
    }
    
    const result = await cloud.getTempFileURL({
      fileList: cloudFileIDs
    })
    
    if (!result.fileList) {
      return fileIDs
    }
    
    // 创建 fileID 到 tempFileURL 的映射
    const urlMap = {}
    result.fileList.forEach(item => {
      if (item.fileID && item.tempFileURL) {
        urlMap[item.fileID] = item.tempFileURL
      }
    })
    
    // 替换原始文件 ID 为临时 URL
    return fileIDs.map(fileID => {
      return urlMap[fileID] || fileID
    })
  } catch (err) {
    console.error('批量获取临时文件 URL 失败:', err)
    return fileIDs
  }
}

/**
 * 处理对象中的图片字段，将云存储 fileID 转换为临时 URL
 * @param {Object} obj - 包含图片字段的对象
 * @param {Array} imageFields - 图片字段名数组
 * @returns {Promise<Object>} - 返回处理后的对象
 */
export async function processImageFields(obj, imageFields = ['image', 'avatar']) {
  try {
    if (!obj || typeof obj !== 'object') {
      return obj
    }
    
    const processedObj = { ...obj }
    
    for (const field of imageFields) {
      if (processedObj[field]) {
        processedObj[field] = await getTempFileURL(processedObj[field])
      }
    }
    
    return processedObj
  } catch (err) {
    console.error('处理图片字段失败:', err)
    return obj
  }
}

/**
 * 批量处理对象数组中的图片字段
 * @param {Array} objList - 对象数组
 * @param {Array} imageFields - 图片字段名数组
 * @returns {Promise<Array>} - 返回处理后的对象数组
 */
export async function processImageFieldsBatch(objList, imageFields = ['image', 'avatar']) {
  try {
    if (!Array.isArray(objList)) {
      return objList
    }
    
    const processedList = await Promise.all(
      objList.map(obj => processImageFields(obj, imageFields))
    )
    
    return processedList
  } catch (err) {
    console.error('批量处理图片字段失败:', err)
    return objList
  }
}

module.exports = {
  getTempFileURL,
  getTempFileURLs,
  processImageFields,
  processImageFieldsBatch
}