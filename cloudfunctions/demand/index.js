const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  try {
    console.log('云函数 demand 接收到的参数:', event);
    const { action, content, user_id, image, demand_id } = event || {};
    console.log('解析后的参数:', { action, content, user_id, image, demand_id });
    
    if (action === 'add') {
       console.log('开始处理 action: add', { content, user_id, image });
      
      // 参数校验
      if (!content) {
        console.error('错误：缺少需求内容');
        return { success: false, code: 1001, message: '需求内容不能为空' };
      }
      
      if (!user_id) {
        console.error('错误：缺少用户ID');
        return { success: false, code: 1001, message: '用户ID不能为空' };
      }
      
      const trimmedContent = content.trim();
      if (trimmedContent.length === 0) {
        console.error('错误：需求内容为空');
        return { success: false, code: 1001, message: '需求内容不能为空' };
      }
      
      // 转换图片URL
      let imageUrl = image || '';
      if (imageUrl && imageUrl.startsWith('cloud://')) {
        try {
          const tempResult = await cloud.getTempFileURL({ fileList: [imageUrl] });
          if (tempResult.fileList[0] && tempResult.fileList[0].tempFileURL) {
            imageUrl = tempResult.fileList[0].tempFileURL;
          }
        } catch (tempError) {
          console.error('获取图片临时URL失败:', tempError);
        }
      }
      
      // 插入需求数据
      const result = await db.collection('demand').add({
        data: {
          user_id: user_id,
          content: trimmedContent,
          image: imageUrl,
          status: 0,
          created_at: new Date()
        }
      });
      
      console.log('插入需求数据成功:', result);
      
      // 查询发布需求的用户信息
      let publisherName = '未知用户';
      try {
        const publisherResult = await db.collection('user').where({ openid: user_id }).get();
        if (publisherResult.data.length > 0) {
          publisherName = publisherResult.data[0].nickname || '未知用户';
        }
        console.log('查询到的发布者信息:', publisherName);
      } catch (userError) {
        console.error('查询发布者信息失败:', userError);
      }
      
      // 发送订阅消息给商户
      try {
        // 查询所有商户（暂时移除剩余次数限制，用于测试）
        const merchants = await db.collection('user').where({
          role: 1
        }).get();
        
        console.log('查询到的商户数量:', merchants.data.length);
        console.log('商户列表:', merchants.data);
        
        // 筛选已授权的商户
        const templateId = 'QVS_qFMhHcASgx9Mkmnklr5B9wSVLSP0DfOdYOfTizk';
        const authorizedMerchants = merchants.data.filter(merchant => {
          const templateIds = merchant.sub_template_ids || [];
          return templateIds.includes(templateId);
        });
        
        console.log('已授权的商户数量:', authorizedMerchants.length);
        
        // 优化：并行处理消息发送，提高性能
        const now = new Date();
        const formattedTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const demandSummary = content.substring(0, 20) + (content.length > 20 ? '...' : '');
        
        console.log('准备并行发送消息给商户，数量:', authorizedMerchants.length);
        
        // 并行发送消息
        const sendPromises = authorizedMerchants.map(async merchant => {
          try {
            // 准备模板ID
            const templateId = merchant.sub_template_ids && merchant.sub_template_ids.length > 0 
              ? merchant.sub_template_ids[0] 
              : 'QVS_qFMhHcASgx9Mkmnklr5B9wSVLSP0DfOdYOfTizk';
            
            console.log('准备发送消息给商户:', merchant.openid);
            console.log('商户模板ID列表:', merchant.sub_template_ids);
            console.log('使用的模板ID:', templateId);
            console.log('商户剩余次数:', merchant.sub_remains);
            
            // 发送订阅消息
            try {
              console.log('发送消息前 - 数据:', {
                thing1: { value: demandSummary },
                time2: { value: formattedTime },
                thing3: { value: publisherName }
              });
              
              const sendResult = await cloud.openapi.subscribeMessage.send({
                touser: merchant.openid,
                templateId: templateId,
                page: 'pages/demand/demand',
                data: {
                  thing1: {
                    value: demandSummary
                  },
                  time2: {
                    value: formattedTime
                  },
                  thing3: {
                    value: publisherName }
                }
              });
              
              console.log('发送订阅消息成功:', sendResult);
              
              // 返回商户信息，用于后续批量更新
              return { merchant, success: true };
            } catch (sendErr) {
              console.error('发送订阅消息失败:', sendErr);
              return { merchant, success: false };
            }
          } catch (err) {
            console.error('处理商户失败:', err);
            return { merchant, success: false };
          }
        });
        
        // 等待所有消息发送完成
        const sendResults = await Promise.all(sendPromises);
        console.log('所有消息发送完成，成功数量:', sendResults.filter(r => r.success).length);
        
        // 优化：批量更新剩余次数
        const updatePromises = sendResults
          .filter(result => result.success)
          .map(({ merchant }) => {
            console.log('更新剩余次数:', merchant.openid);
            return db.collection('user').where({ openid: merchant.openid }).update({
              data: {
                sub_remains: merchant.sub_remains - 1,
                update_time: new Date()
              }
            });
          });
        
        // 等待所有更新完成
        await Promise.all(updatePromises);
        console.log('批量更新剩余次数完成');
      } catch (err) {
        console.error('处理订阅消息失败:', err);
        // 发送消息失败不影响需求发布
      }
      
      console.log('action: add 处理完成');
      return {
        success: true,
        id: result._id
      };
    } else if (action === 'respond') {
     // 响应需求
  const { demand_id, remark, shop_id } = event;
  console.log('respond action - 参数:', { demand_id, remark, shop_id });
  
  // 参数校验
  if (!demand_id) {
    console.error('respond action - 缺少 demand_id 参数');
    return { success: false, message: '缺少需求ID' };
  }
  if (!remark) {
    console.error('respond action - 缺少 remark 参数');
    return { success: false, message: '缺少备注信息' };
  }
  if (!shop_id) {
    console.error('respond action - 缺少 shop_id 参数');
    return { success: false, message: '缺少商户ID' };
  }
  
  try {
    // 获取当前用户的 openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    if (!openid) {
      console.error('respond action - 无法获取 openid');
      return { success: false, message: '无法获取用户信息' };
    }
    
    // 查询用户信息，获取响应配额
    const userResult = await db.collection('user').where({ openid: openid }).get();
    
    if (userResult.data.length === 0) {
      console.error('respond action - 用户不存在');
      return { success: false, message: '用户不存在' };
    }
    
    const user = userResult.data[0];
    const responseQuota = user.response_quota || 0;
    const responsePackageExpire = user.response_package_expire;
    const currentTime = new Date();
    
    console.log('respond action - 用户信息:', { responseQuota, responsePackageExpire, currentTime });
    
    // 扣费逻辑
    if (!responsePackageExpire || new Date(responsePackageExpire) <= currentTime) {
      // 包月过期或未开通，需要扣配额
      if (responseQuota <= 0) {
        console.error('respond action - 响应配额不足');
        return { success: false, message: 'INSUFFICIENT_QUOTA' };
      }
      
      // 使用事务更新用户配额
      const transaction = await db.startTransaction();
      try {
        // 检查是否已经响应过
        const existingResponse = await transaction.collection('response')
          .where({
            demand_id: demand_id,
            shop_id: shop_id
          })
          .get();
        
        if (existingResponse.data.length > 0) {
          await transaction.rollback();
          console.error('respond action - 已经响应过该需求');
          return { success: false, message: '您已经响应过该需求' };
        }
        
        // 插入响应数据
        const result = await transaction.collection('response').add({
          data: {
            demand_id: demand_id,
            shop_id: shop_id,
            remark: remark,
            created_at: new Date()
          }
        });
        
        // 更新用户响应配额
        await transaction.collection('user').where({ openid: openid }).update({
          data: {
            response_quota: responseQuota - 1,
            update_time: new Date()
          }
        });
        
        await transaction.commit();
        console.log('respond action - 插入成功并扣减配额:', result);
        return {
          success: true,
          id: result._id
        };
      } catch (err) {
        await transaction.rollback();
        console.error('respond action - 事务失败:', err);
        return { success: false, message: '操作失败: ' + err.message };
      }
    } else {
      // 包月有效，不扣配额
      // 检查是否已经响应过
      const existingResponse = await db.collection('response')
        .where({
          demand_id: demand_id,
          shop_id: shop_id
        })
        .get();
      
      if (existingResponse.data.length > 0) {
        console.error('respond action - 已经响应过该需求');
        return { success: false, message: '您已经响应过该需求' };
      }
      
      // 插入响应数据
      const result = await db.collection('response').add({
        data: {
          demand_id: demand_id,
          shop_id: shop_id,
          remark: remark,
          created_at: new Date()
        }
      });
      
      console.log('respond action - 插入成功（包月有效）:', result);
      return {
        success: true,
        id: result._id
      };
    }
  } catch (err) {
    console.error('respond action - 失败:', err);
    return { success: false, message: '操作失败: ' + err.message };
  }
    } else if (action === 'complete') {
      // 标记需求为已完成
      const { demand_id } = event;
      
      // 更新需求状态
      const result = await db.collection('demand').doc(demand_id).update({
        data: {
          status: 1 // 1 表示已完成
        }
      });
      
      return {
        success: true,
        updated: result.updated
      };
    } else if (action === 'withdraw') {
      // 撤回响应
      const { demand_id } = event;
      console.log('withdraw action - 参数:', { demand_id });
      
      // 参数校验
      if (!demand_id) {
        console.error('withdraw action - 缺少 demand_id 参数');
        return { success: false, message: '缺少需求ID' };
      }
      
      try {
        // 获取当前用户的 openid
        const wxContext = cloud.getWXContext();
        const openid = wxContext.OPENID;
        
        if (!openid) {
          console.error('withdraw action - 无法获取 openid');
          return { success: false, message: '无法获取用户信息' };
        }
        
        // 根据 openid 查询 user 表获取 shop_id
        const userResult = await db.collection('user').where({ openid: openid }).get();
        
        if (userResult.data.length === 0) {
          console.error('withdraw action - 用户不存在');
          return { success: false, message: '用户不存在' };
        }
        
        const user = userResult.data[0];
        
        // 校验当前用户是否是商户
        if (user.role !== 1) {
          console.error('withdraw action - 用户不是商户');
          return { success: false, message: '只有商户才能撤回响应' };
        }
        
        const shop_id = user.shop_id;
        
        if (!shop_id) {
          console.error('withdraw action - 商户没有 shop_id');
          return { success: false, message: '商户信息不完整' };
        }
        
        // 查询需求，检查 status 是否为 0
        const demandResult = await db.collection('demand').doc(demand_id).get();
        
        if (!demandResult.data) {
          console.error('withdraw action - 需求不存在');
          return { success: false, message: '需求不存在' };
        }
        
        if (demandResult.data.status !== 0) {
          console.error('withdraw action - 需求已完成，不能撤回');
          return { success: false, message: '已完成的需求不能撤回' };
        }
        
        // 删除 response 表中 demand_id 和 shop_id 匹配的记录
        const deleteResult = await db.collection('response')
          .where({
            demand_id: demand_id,
            shop_id: shop_id
          })
          .remove();
        
        console.log('withdraw action - 删除响应成功:', deleteResult);
        return {
          success: true,
          deleted: deleteResult.stats.removed
        };
      } catch (err) {
        console.error('withdraw action - 撤回失败:', err);
        return { success: false, message: '撤回失败: ' + err.message };
      }
    } else if (action === 'detail') {
          // 查询需求详情
          console.log('开始查询需求详情，demand_id:', demand_id);
          
          if (!demand_id) {
            console.error('错误：缺少需求ID');
            return { success: false, code: 1001, message: '缺少需求ID' };
          }
          
          // 查询需求基本信息
          try {
            const demandResult = await db.collection('demand').doc(demand_id).get();
            console.log('需求查询结果:', demandResult);
            
            if (!demandResult.data) {
              console.error('错误：需求不存在，demand_id:', demand_id);
              return { success: false, code: 1002, message: '需求不存在' };
            }
            
            const demand = demandResult.data;
            console.log('获取到需求数据:', demand);
            
            // 查询用户信息
            let userInfo = {
              avatar: '/images/R.jpg',
              nickName: '用户' + String(demand.user_id || '').substring(0, 4)
            };
            
            try {
              console.log('开始查询用户信息，user_id:', demand.user_id);
              const userResult = await db.collection('user').where({ openid: demand.user_id }).get();
              console.log('用户查询结果:', userResult);
              
              if (userResult.data.length > 0) {
                const user = userResult.data[0];
                let avatar = user.avatar || '/images/R.jpg';
                // 转换云存储路径
                if (avatar.startsWith('cloud://')) {
                  try {
                    const tempResult = await cloud.getTempFileURL({ fileList: [avatar] });
                    console.log('用户头像URL转换结果:', tempResult);
                    if (tempResult.fileList[0].tempFileURL) {
                      avatar = tempResult.fileList[0].tempFileURL;
                    }
                  } catch (avatarError) {
                    console.error('用户头像URL转换失败:', avatarError);
                  }
                }
                userInfo = {
                  avatar: avatar,
                  nickName: user.nickname || '用户' + String(demand.user_id || '').substring(0, 4)
                };
                console.log('获取到用户信息:', userInfo);
              } else {
                console.warn('未找到用户信息，使用默认值');
              }
            } catch (userError) {
              console.error('查询用户信息失败:', userError);
              console.warn('使用默认用户信息');
            }
            
            // 查询响应列表
            const responses = [];
            try {
              console.log('开始查询响应列表，demand_id:', demand_id);
              const responsesResult = await db.collection('response').where({ demand_id: demand_id }).get();
              console.log('响应查询结果:', responsesResult);
              
              // 优化：批量查询商户信息，避免N+1查询问题
              if (responsesResult.data.length > 0) {
                // 收集所有商户ID
                const shopIds = responsesResult.data.map(item => item.shop_id);
                console.log('需要查询的商户ID列表:', shopIds);
                
                // 批量查询商户信息
                let shopsMap = {};
                try {
                  const shopsResult = await db.collection('shop').where({
                    _id: db.command.in(shopIds)
                  }).get();
                  console.log('批量查询商户结果:', shopsResult);
                  
                  // 创建商户信息映射
                  for (const shop of shopsResult.data) {
                    shopsMap[shop._id] = shop;
                  }
                } catch (shopsError) {
                  console.error('批量查询商户失败:', shopsError);
                }
                
                // 优化：批量转换商户头像URL
                const cloudPaths = [];
                for (const shopId of shopIds) {
                  const shop = shopsMap[shopId];
                  if (shop && shop.avatar && shop.avatar.startsWith('cloud://')) {
                    cloudPaths.push(shop.avatar);
                  }
                }
                
                let tempUrlMap = {};
                if (cloudPaths.length > 0) {
                  try {
                    console.log('批量转换商户头像URL:', cloudPaths);
                    const tempResult = await cloud.getTempFileURL({ fileList: cloudPaths });
                    console.log('批量转换结果:', tempResult);
                    
                    // 创建URL映射
                    for (let i = 0; i < cloudPaths.length; i++) {
                      if (tempResult.fileList[i] && tempResult.fileList[i].tempFileURL) {
                        tempUrlMap[cloudPaths[i]] = tempResult.fileList[i].tempFileURL;
                      }
                    }
                  } catch (tempError) {
                    console.error('批量转换商户头像URL失败:', tempError);
                  }
                }
                
                // 组装响应列表
                for (const item of responsesResult.data) {
                  let shopAvatar = '/images/R.jpg';
                  
                  const shop = shopsMap[item.shop_id];
                  if (shop) {
                    let avatar = shop.avatar || '';
                    if (avatar.startsWith('cloud://') && tempUrlMap[avatar]) {
                      shopAvatar = tempUrlMap[avatar];
                    } else if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
                      shopAvatar = avatar;
                    }
                  }
                  
                  responses.push({
                    shop_id: item.shop_id,
                    remark: item.remark || '',
                    shopAvatar: shopAvatar
                  });
                }
              }
              console.log('获取到响应列表:', responses);
            } catch (responseError) {
              console.error('查询响应数据失败:', responseError);
              console.warn('响应列表为空');
            }
            
            // 转换需求图片URL
            let imageUrl = demand.image || '';
            if (imageUrl && imageUrl.startsWith('cloud://')) {
              try {
                console.log('开始转换需求图片URL:', imageUrl);
                const tempResult = await cloud.getTempFileURL({ fileList: [imageUrl] });
                console.log('图片URL转换结果:', tempResult);
                if (tempResult.fileList[0].tempFileURL) {
                  imageUrl = tempResult.fileList[0].tempFileURL;
                }
              } catch (tempError) {
                console.error('获取图片临时URL失败:', tempError);
                console.warn('使用原图片路径');
              }
            }
            
            // 组装最终数据
            const detailData = {
              ...demand,
              image: imageUrl,
              user: userInfo,
              responses: responses
            };
            
            console.log('查询需求详情结果:', detailData);
            return {
              success: true,
              data: detailData
            };
          } catch (error) {
            console.error('查询需求详情失败:', error);
            return { success: false, code: 1000, message: '查询失败，请重试' };
          }
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
      
      // 批量查询所有涉及的 user_id
      const userIds = [...new Set(demandList.map(d => d.user_id))];
      const usersMap = {};
      
      if (userIds.length > 0) {
        try {
          const usersResult = await db.collection('user').where({
            openid: db.command.in(userIds)
          }).get();
          
          // 构建用户信息映射
          for (const user of usersResult.data) {
            usersMap[user.openid] = user;
          }
        } catch (userError) {
          console.error('批量查询用户信息失败:', userError);
        }
      }
      
      // 批量查询所有需求的响应
      const demandIds = demandList.map(d => d._id);
      const responsesMap = {};
      
      if (demandIds.length > 0) {
        try {
          const responsesResult = await db.collection('response').where({
            demand_id: db.command.in(demandIds)
          }).get();
          
          // 按需求ID分组响应数据
          for (const response of responsesResult.data) {
            if (!responsesMap[response.demand_id]) {
              responsesMap[response.demand_id] = [];
            }
            responsesMap[response.demand_id].push(response);
          }
        } catch (responseError) {
          console.error('批量查询响应数据失败:', responseError);
        }
      }
      
      // 批量查询所有涉及的 shop_id
      const shopIds = [...new Set(Object.values(responsesMap).flat().map(r => r.shop_id))];
      const shopsMap = {};
      
      if (shopIds.length > 0) {
        try {
          const shopsResult = await db.collection('shop').where({
            _id: db.command.in(shopIds)
          }).get();
          
          // 构建商户信息映射
          for (const shop of shopsResult.data) {
            shopsMap[shop._id] = shop;
          }
        } catch (shopError) {
          console.error('批量查询商户信息失败:', shopError);
        }
      }
      
      // 收集所有需要转换的云存储路径（限制数量，避免超时）
      const cloudPaths = [];
      
      // 收集用户头像
      for (const user of Object.values(usersMap)) {
        if (user.avatar && user.avatar.startsWith('cloud://') && cloudPaths.length < 50) {
          cloudPaths.push(user.avatar);
        }
      }
      
      // 收集商户头像
      for (const shop of Object.values(shopsMap)) {
        if (shop.avatar && shop.avatar.startsWith('cloud://') && cloudPaths.length < 50) {
          cloudPaths.push(shop.avatar);
        }
      }
      
      // 收集需求图片
      for (const demand of demandList) {
        if (demand.image && demand.image.startsWith('cloud://') && cloudPaths.length < 50) {
          cloudPaths.push(demand.image);
        }
      }
      
      // 批量获取临时URL
      const tempUrlMap = {};
      if (cloudPaths.length > 0) {
        try {
          const tempResult = await cloud.getTempFileURL({
            fileList: cloudPaths
          });
          
          // 构建临时URL映射
          for (const item of tempResult.fileList) {
            if (item.tempFileURL) {
              tempUrlMap[item.fileID] = item.tempFileURL;
            }
          }
        } catch (tempError) {
          console.error('批量获取临时URL失败:', tempError);
        }
      }
      
      // 组装最终数据
      for (const demand of demandList) {
        try {
          // 获取用户信息
          let userInfo = {
            avatar: '/images/R.jpg',
            nickName: '用户' + String(demand.user_id || '').substring(0, 4)
          };
          
          const user = usersMap[demand.user_id];
          if (user) {
            let avatar = user.avatar || '/images/R.jpg';
            // 使用临时URL映射
            if (avatar.startsWith('cloud://') && tempUrlMap[avatar]) {
              avatar = tempUrlMap[avatar];
            }
            userInfo = {
              avatar: avatar,
              nickName: user.nickname || '用户' + String(demand.user_id || '').substring(0, 4)
            };
          }
          
          // 获取响应数据
          const responses = [];
          const demandResponses = responsesMap[demand._id] || [];
          
          for (const item of demandResponses) {
            let shopAvatar = '/images/R.jpg';
            
            const shop = shopsMap[item.shop_id];
            if (shop) {
              let avatar = shop.avatar || '';
              if (avatar.startsWith('cloud://') && tempUrlMap[avatar]) {
                shopAvatar = tempUrlMap[avatar];
              } else if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
                shopAvatar = avatar;
              }
            }
            
            responses.push({
              shopId: item.shop_id,
              shopAvatar: shopAvatar,
              remark: item.remark || ''
            });
          }
          
          // 转换需求图片URL
          let imageUrl = demand.image || '';
          if (imageUrl && imageUrl.startsWith('cloud://') && tempUrlMap[imageUrl]) {
            imageUrl = tempUrlMap[imageUrl];
          }
          
          demandsWithUserInfo.push({
            ...demand,
            image: imageUrl,
            user: userInfo,
            responses: responses
          });
        } catch (error) {
          console.error('处理需求失败:', error);
          // 转换需求图片URL
          let imageUrl = demand.image || '';
          if (imageUrl && imageUrl.startsWith('cloud://') && tempUrlMap[imageUrl]) {
            imageUrl = tempUrlMap[imageUrl];
          }
          
          demandsWithUserInfo.push({
            ...demand,
            image: imageUrl,
            user: {
              avatar: '/images/R.jpg',
              nickName: '用户' + String(demand.user_id || '').substring(0, 4)
            },
            responses: []
          });
        }
      }
      
      // 对需求列表进行排序：先按 status 升序（0在1前），再按 created_at 降序（新的在前）
      demandsWithUserInfo.sort((a, b) => {
        // 先按 status 升序
        if (a.status !== b.status) {
          return a.status - b.status;
        }
        // 再按 created_at 降序
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB - dateA;
      });
      
      console.log('查询需求列表结果（排序后）:', demandsWithUserInfo);
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
    console.error('错误堆栈:', error.stack);
    return {
      success: false,
      message: '操作失败: ' + error.message
    };
  }
}

