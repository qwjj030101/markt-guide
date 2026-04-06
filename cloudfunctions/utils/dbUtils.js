/**
 * 数据库操作工具函数
 * 封装常用的数据库操作，减少代码重复
 */

const cloud = require('wx-server-sdk')

// 初始化云开发环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 查询单个文档
 * @param {string} collectionName - 集合名称
 * @param {Object} query - 查询条件
 * @returns {Promise} - 返回查询结果
 */
export async function getOne(collectionName, query) {
  try {
    const result = await db.collection(collectionName).where(query).get()
    return result.data[0] || null
  } catch (err) {
    console.error('查询单个文档失败:', err)
    throw err
  }
}

/**
 * 查询多个文档
 * @param {string} collectionName - 集合名称
 * @param {Object} query - 查询条件
 * @param {Object} options - 可选参数，如排序、分页等
 * @returns {Promise} - 返回查询结果
 */
export async function getList(collectionName, query = {}, options = {}) {
  try {
    let dbQuery = db.collection(collectionName).where(query)
    
    // 排序
    if (options.orderBy) {
      dbQuery = dbQuery.orderBy(options.orderBy.field, options.orderBy.direction || 'asc')
    }
    
    // 分页
    if (options.skip) {
      dbQuery = dbQuery.skip(options.skip)
    }
    if (options.limit) {
      dbQuery = dbQuery.limit(options.limit)
    }
    
    const result = await dbQuery.get()
    return result.data
  } catch (err) {
    console.error('查询多个文档失败:', err)
    throw err
  }
}

/**
 * 添加文档
 * @param {string} collectionName - 集合名称
 * @param {Object} data - 文档数据
 * @returns {Promise} - 返回添加结果
 */
export async function add(collectionName, data) {
  try {
    const result = await db.collection(collectionName).add({ data })
    return result
  } catch (err) {
    console.error('添加文档失败:', err)
    throw err
  }
}

/**
 * 更新文档
 * @param {string} collectionName - 集合名称
 * @param {Object} query - 查询条件
 * @param {Object} data - 更新数据
 * @returns {Promise} - 返回更新结果
 */
export async function update(collectionName, query, data) {
  try {
    // 移除 _id 字段，因为不能更新 _id
    const { _id, ...updateData } = data
    const result = await db.collection(collectionName).where(query).update({ data: updateData })
    return result
  } catch (err) {
    console.error('更新文档失败:', err)
    throw err
  }
}

/**
 * 删除文档
 * @param {string} collectionName - 集合名称
 * @param {Object} query - 查询条件
 * @returns {Promise} - 返回删除结果
 */
export async function remove(collectionName, query) {
  try {
    const result = await db.collection(collectionName).where(query).remove()
    return result
  } catch (err) {
    console.error('删除文档失败:', err)
    throw err
  }
}

/**
 * 执行事务
 * @param {Function} transactionFn - 事务函数
 * @returns {Promise} - 返回事务执行结果
 */
export async function runTransaction(transactionFn) {
  try {
    const result = await db.runTransaction(transactionFn)
    return result
  } catch (err) {
    console.error('执行事务失败:', err)
    throw err
  }
}

module.exports = {
  getOne,
  getList,
  add,
  update,
  remove,
  runTransaction,
  db,
  _
}