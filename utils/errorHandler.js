/**
 * 错误处理工具
 * 包含错误码定义和错误信息映射
 */

// 错误码定义
export const ERROR_CODES = {
  // 通用错误
  COMMON_ERROR: 1000,
  
  // 参数错误
  MISSING_PARAMS: 1001,
  
  // 需求相关错误
  DEMAND_NOT_FOUND: 1002,
  DEMAND_CREATE_FAILED: 1003,
  DEMAND_RESPOND_FAILED: 1004,
  DEMAND_COMPLETE_FAILED: 1005,
  DEMAND_WITHDRAW_FAILED: 1006,
  
  // 用户相关错误
  USER_NOT_FOUND: 2001,
  USER_LOGIN_FAILED: 2002,
  USER_AUTH_FAILED: 2003,
  
  // 商户相关错误
  SHOP_NOT_FOUND: 3001,
  SHOP_CREATE_FAILED: 3002,
  SHOP_UPDATE_FAILED: 3003,
  
  // 响应相关错误
  RESPONSE_QUOTA_EXCEEDED: 4001,
  RESPONSE_ALREADY_EXISTS: 4002,
  
  // 图片相关错误
  IMAGE_UPLOAD_FAILED: 5001,
  IMAGE_URL_CONVERT_FAILED: 5002,
};

// 错误信息映射
export const ERROR_MESSAGES = {
  // 通用错误
  1000: '操作失败，请重试',
  
  // 参数错误
  1001: '参数错误，请检查输入',
  
  // 需求相关错误
  1002: '需求不存在或已被删除',
  1003: '发布需求失败',
  1004: '响应需求失败',
  1005: '标记需求完成失败',
  1006: '撤回响应失败',
  
  // 用户相关错误
  2001: '用户信息获取失败',
  2002: '登录失败，请重试',
  2003: '授权失败，请重试',
  
  // 商户相关错误
  3001: '商户信息不存在',
  3002: '创建商户失败',
  3003: '更新商户信息失败',
  
  // 响应相关错误
  4001: '响应配额不足',
  4002: '已响应过该需求',
  
  // 图片相关错误
  5001: '图片上传失败',
  5002: '图片URL转换失败',
};

/**
 * 处理错误
 * @param {Object} error - 错误对象，包含code和message
 * @param {Function} callback - 可选的回调函数
 */
export function handleError(error, callback) {
  console.error('错误信息:', error);
  
  // 获取错误码和错误信息
  const errorCode = error.code || 1000;
  const errorMessage = ERROR_MESSAGES[errorCode] || error.message || '操作失败，请重试';
  
  // 显示错误提示
  wx.showToast({
    title: errorMessage,
    icon: 'none',
    duration: 2000,
    success: () => {
      if (typeof callback === 'function') {
        callback(errorCode, errorMessage);
      }
    }
  });
}

/**
 * 处理云函数调用错误
 * @param {Object} result - 云函数调用结果
 * @param {Function} successCallback - 成功回调
 * @param {Function} errorCallback - 错误回调
 */
export function handleCloudFunctionResult(result, successCallback, errorCallback) {
  if (result && result.result) {
    if (result.result.success) {
      // 成功
      if (typeof successCallback === 'function') {
        successCallback(result.result.data);
      }
    } else {
      // 失败
      handleError(result.result, errorCallback);
    }
  } else {
    // 网络错误或其他错误
    handleError({ code: 1000, message: '网络错误，请重试' }, errorCallback);
  }
}