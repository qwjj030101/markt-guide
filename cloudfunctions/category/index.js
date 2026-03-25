/**
 * 分类云函数
 * 功能：获取分类数据
 * 参考：docs/ARCH.md 第4.2节
 */

// 初始化云开发环境
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 主入口函数
exports.main = async (event, context) => {
  const { type } = event
  
  try {
    let query = db.collection('category')
    
    // 如果传入了 type 参数，只返回该类型的分类
    if (type) {
      query = query.where({ type: type })
    }
    
    // 按 sort 字段升序排列
    const categoryRes = await query.orderBy('sort', 'asc').get()
    
    return {
      success: true,
      data: categoryRes.data
    }
  } catch (err) {
    console.error('云函数执行失败:', err)
    return {
      success: false,
      error: err.message
    }
  }
}
