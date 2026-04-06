/**
 * 初始化广告数据云函数
 * 功能：创建 ads 集合并初始化广告数据
 */

const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    // 尝试直接获取 ads 集合的数据，如果集合不存在会抛出错误
    try {
      await db.collection('ads').limit(1).get()
      console.log('ads 集合已存在')
    } catch (err) {
      // 集合不存在，创建 ads 集合
      await db.createCollection('ads')
      console.log('ads 集合创建成功')
    }
    
    // 检查是否已有数据
    const existingAds = await db.collection('ads').get()
    
    if (existingAds.data.length === 0) {
      // 添加默认广告数据
      const defaultAds = [
        {
          id: 1,
          image: '/images/R.jpg',
          link: '/pages/shop/detail?id=3a1b727569cd0d75002331e623ed7c1a',
          sort: 1,
          status: 1,
          create_time: new Date(),
          update_time: new Date()
        },
        {
          id: 2,
          image: '/images/R 1.jpg',
          link: '/pages/shop/detail?id=2',
          sort: 2,
          status: 1,
          create_time: new Date(),
          update_time: new Date()
        },
        {
          id: 3,
          image: '/images/R2.jpg',
          link: '/pages/shop/detail?id=3',
          sort: 3,
          status: 1,
          create_time: new Date(),
          update_time: new Date()
        }
      ]
      
      for (const ad of defaultAds) {
        await db.collection('ads').add({
          data: ad
        })
      }
      
      console.log('默认广告数据添加成功')
      
      return {
        success: true,
        message: '广告数据初始化成功'
      }
    } else {
      console.log('广告数据已存在，无需初始化')
      
      return {
        success: true,
        message: '广告数据已存在'
      }
    }
  } catch (err) {
    console.error('初始化广告数据失败:', err)
    return {
      success: false,
      message: '初始化失败: ' + err.message
    }
  }
}