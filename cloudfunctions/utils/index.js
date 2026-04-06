/**
 * 工具函数统一导出文件
 * 方便其他云函数通过 require('../utils') 一次性引入所有工具函数
 */

// 导入数据库操作工具函数
const dbUtils = require('./dbUtils');

// 导入图片处理工具函数
const imageUtils = require('./imageUtils');

// 统一导出所有工具函数
module.exports = {
  // 数据库操作工具函数
  ...dbUtils,
  
  // 图片处理工具函数
  ...imageUtils
};

// 也可以单独导出每个模块，方便按需引入
module.exports.dbUtils = dbUtils;
module.exports.imageUtils = imageUtils;