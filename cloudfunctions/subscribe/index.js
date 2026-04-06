const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    const { action, templateId, authCount } = event || {};
    
    if (action === 'update') {
      // 获取当前用户的 openid
      const wxContext = cloud.getWXContext();
      const openid = wxContext.OPENID;
      
      if (!openid) {
        console.error('无法获取 openid');
        return { success: false, message: '无法获取用户信息' };
      }
      
      // 查询用户信息
      const userResult = await db.collection('user').where({ openid: openid }).get();
      
      if (userResult.data.length === 0) {
        console.error('用户不存在');
        return { success: false, message: '用户不存在' };
      }
      
      const user = userResult.data[0];
      const currentRemains = user.sub_remains || 0;
      const newRemains = currentRemains + authCount;
      
      // 更新用户订阅信息
      await db.collection('user').where({ openid: openid }).update({
        data: {
          sub_remains: newRemains,
          sub_last_time: new Date(),
          sub_template_ids: [templateId],
          update_time: new Date()
        }
      });
      
      console.log('更新订阅授权成功:', { openid, newRemains });
      return { success: true, data: { sub_remains: newRemains } };
    }
    
    return { success: false, message: '未知操作' };
  } catch (error) {
    console.error('云函数 subscribe 错误:', error);
    return { success: false, message: error.message };
  }
};