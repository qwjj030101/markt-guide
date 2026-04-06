/**
 * 反馈云函数
 * 功能：处理用户反馈数据
 */

// 初始化云开发环境
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 主入口函数
exports.main = async (event, context) => {
  const { action, feedback } = event
  
  try {
    switch (action) {
      case 'add':
        return await addFeedback(feedback)
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
 * 添加反馈
 * @param {Object} feedback - 反馈数据
 * @returns {Object} - 操作结果
 */
async function addFeedback(feedback) {
  try {
    // 尝试直接获取 feedbacks 集合的数据，如果集合不存在会抛出错误
    try {
      await db.collection('feedbacks').limit(1).get()
      console.log('feedbacks 集合已存在')
    } catch (err) {
      // 集合不存在，创建 feedbacks 集合
      await db.createCollection('feedbacks')
      console.log('feedbacks 集合创建成功')
    }
    
    // 添加反馈数据
    const result = await db.collection('feedbacks').add({
      data: {
        ...feedback,
        status: 0, // 0: 未处理, 1: 已处理
        create_time: new Date(),
        update_time: new Date()
      }
    })
    
    console.log('添加反馈成功:', result)
    
    return {
      success: true,
      message: '反馈提交成功',
      data: result
    }
  } catch (err) {
    console.error('添加反馈失败:', err)
    return {
      success: false,
      message: '添加反馈失败: ' + err.message
    }
  }
}