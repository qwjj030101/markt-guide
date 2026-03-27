const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    console.log('云函数 demand 接收到的参数:', event);
    const { action, content, user_id } = event || {};
    
    if (action === 'add') {
      // 插入需求数据
      const result = await db.collection('demand').add({
        data: {
          user_id: user_id,
          content: content,
          status: 0,
          created_at: new Date()
        }
      });
      
      return {
        success: true,
        id: result._id
      };
    } else if (action === 'list') {
      // 查询需求列表
      let query = db.collection('demand');
      
      // 如果 user_id 存在，只查该用户的记录
      if (user_id) {
        query = query.where({ user_id: user_id });
      }
      
      // 按创建时间倒序排列
      const result = await query.orderBy('created_at', 'desc').get();
      
      // 为每个需求获取用户信息和响应数据
      const demandList = result.data;
      const demandsWithUserInfo = [];
      
      for (const demand of demandList) {
        try {
          // 查询用户信息
let userInfo = {
  avatar: '/images/R.jpg', // 默认头像
  nickName: '用户' + String(demand.user_id || '').substring(0, 4) // 默认昵称
};

try {
  const userResult = await db.collection('user').where({ openid: demand.user_id }).get();
  if (userResult.data.length > 0) {
    // 如果找到用户信息，使用真实信息
    const user = userResult.data[0];
    let avatar = user.avatar || '/images/R.jpg';
    // 确保云存储路径正确
    if (avatar.startsWith('cloud://')) {
      avatar = avatar; // 保持云存储路径不变
    }
    userInfo = {
      avatar: avatar,
      nickName: user.nickname || '用户' + String(demand.user_id || '').substring(0, 4)
    };
  }
} catch (userError) {
  console.error('获取用户信息失败:', userError);
  // 继续使用默认用户信息
}

// 查询响应数据
let responses = [];
try {
  const responseResult = await db.collection('response').where({ demand_id: demand._id }).get();
  responses = [];
  
  for (const item of responseResult.data) {
    try {
      let shopAvatar = '/images/R.jpg'; // 默认头像
      
      if (item.shop_id) {
        try {
          const shopResult = await db.collection('shop').doc(item.shop_id).get();
          if (shopResult.data) {
            // 如果找到商户信息，使用商户的头像
            const avatar = shopResult.data.avatar || '';
            if (avatar.startsWith('cloud://')) {
              try {
                // 获取临时文件 URL
                const tempFileURLResult = await cloud.getTempFileURL({
                  fileList: [avatar]
                });
                if (tempFileURLResult.fileList && tempFileURLResult.fileList[0] && tempFileURLResult.fileList[0].tempFileURL) {
                  shopAvatar = tempFileURLResult.fileList[0].tempFileURL;
                  console.log('获取临时文件 URL 成功:', shopAvatar);
                }
              } catch (err) {
                console.error('获取临时文件 URL 失败:', err);
                // 失败时使用默认头像
                shopAvatar = '/images/R.jpg';
              }
            } else if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
              shopAvatar = avatar;
            } else {
              // 其他路径使用默认头像
              shopAvatar = '/images/R.jpg';
            }
          }
        } catch (shopError) {
          console.error('获取商户信息失败:', shopError);
          // 继续使用默认头像
        }
      }
      
      responses.push({
        shopId: item.shop_id,
        shopAvatar: shopAvatar,
        remark: item.remark || ''
      });
    } catch (itemError) {
      console.error('处理响应项失败:', itemError);
      // 跳过当前响应项，继续处理下一个
    }
  }
} catch (responseError) {
  console.error('获取响应数据失败:', responseError);
  // 继续使用空响应列表
}
          
          demandsWithUserInfo.push({
            ...demand,
            user: userInfo,
            responses: responses
          });
        } catch (error) {
          console.error('处理需求失败:', error);
          // 跳过当前需求，继续处理下一个
          demandsWithUserInfo.push({
            ...demand,
            user: {
              avatar: '/images/R.jpg',
              nickName: '用户' + String(demand.user_id || '').substring(0, 4)
            },
            responses: []
          });
        }
      }
      
      console.log('查询需求列表结果:', demandsWithUserInfo);
      return {
        success: true,
        data: demandsWithUserInfo
      };
    }
    
    console.log('未知操作:', action);
    return {
      success: false,
      message: '未知操作'
    };
  } catch (error) {
    console.error('云函数 demand 错误:', error);
    return {
      success: false,
      message: '操作失败'
    };
  }
}

