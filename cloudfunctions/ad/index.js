/**
 * 广告云函数
 * 功能：获取广告列表
 */

// 初始化云开发环境
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 主入口函数
exports.main = async (event, context) => {
  const { action } = event
  
  try {
    switch (action) {
      case 'list':
        return await getAdsList()
      default:
        return {
          success: false,
          message: '未知操作类型'
        }
    }
  } catch (err) {
    console.error('云函数执行失败:', err)
    return {
      success: false,
      message: err.message
    }
  }
}

/**
 * 获取广告列表
 * 从 ads 集合获取广告数据，按 sort 字段排序
 */
async function getAdsList() {
  try {
    // 查询 ads 集合
    const adsRes = await db.collection('ads')
      .where({
        status: 1  // 只获取状态为启用的广告
      })
      .orderBy('sort', 'asc')  // 按 sort 字段升序排序
      .get()
    
    console.log('获取广告列表成功:', adsRes.data)
    
    // 处理广告数据，将云存储 fileID 转换为临时 URL
    const processedAds = await Promise.all(adsRes.data.map(async (ad) => {
      if (ad.image && ad.image.startsWith('cloud://')) {
        try {
          const tempRes = await cloud.getTempFileURL({
            fileList: [ad.image]
          })
          if (tempRes.fileList[0].tempFileURL) {
            ad.image = tempRes.fileList[0].tempFileURL
          }
        } catch (err) {
          console.error('获取广告图片临时URL失败:', err)
        }
      }
      return ad
    }))
    
    return {
      success: true,
      data: processedAds
    }
  } catch (err) {
    console.error('获取广告列表失败:', err)
    return {
      success: false,
      message: '获取广告列表失败: ' + err.message
    }
  }
}