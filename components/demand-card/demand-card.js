Component({
  /**
   * 组件的属性列表
   */
  properties: {
    demand: {
      type: Object,
      value: {},
      observer: function(newVal, oldVal) {
        console.log('需求卡片接收到数据:', newVal);
        console.log('需求卡片 - hasResponded:', newVal.hasResponded, 'status:', newVal.status);
        // 只在 demand 对象变化时更新显示的响应列表
        this.setData({ showMore: false }, () => {
          this.updateDisplayResponses();
        });
      }
    },
    userQuota: {
      type: Number,
      value: 0
    },
    userPackageExpire: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showMore: false, // true=显示部分响应（显示"更多"），false=显示全部响应（显示"收起"）
    displayResponses: [] // 要显示的响应列表
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击响应列表中的头像
     */
    onTapShop(e) {
      const shopId = e.currentTarget.dataset.shopId;
      this.triggerEvent('tapShop', { shop_id: shopId });
    },

    /**
     * 点击"我有货"按钮
     */
    onTapResponse(e) {
      const demandId = e.currentTarget.dataset.demandId;
      const { demand, userQuota, userPackageExpire } = this.properties;
      
      console.log('点击我有货按钮 - demandId:', demandId, 'demand.status:', demand.status);
      
      // 检查需求是否已完成
      if (demand.status === 1) {
        console.log('需求已完成，显示提示');
        wx.showToast({
          title: '需求已完成',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 检查响应配额
      console.log('检查响应配额 - userQuota:', userQuota, 'userPackageExpire:', userPackageExpire);
      
      // 检查是否有响应配额或无限响应套餐
      const now = new Date();
      const hasQuota = userQuota > 0;
      const hasValidPackage = userPackageExpire && new Date(userPackageExpire) > now;
      
      if (hasQuota || hasValidPackage) {
        console.log('有响应配额，触发响应事件');
        // 触发响应事件
        this.triggerEvent('tapResponse', { demand_id: demandId });
      } else {
        console.log('响应配额不足，触发购买事件');
        // 触发购买事件
        this.triggerEvent('needBuy', { demand_id: demandId });
      }
    },

    /**
     * 点击"已完成"按钮
     */
    onTapComplete(e) {
      const demandId = e.currentTarget.dataset.demandId;
      this.triggerEvent('tapComplete', { demand_id: demandId });
    },

    /**
     * 点击"撤回"按钮
     */
    onTapWithdraw(e) {
      const demandId = e.currentTarget.dataset.demandId;
      this.triggerEvent('tapWithdraw', { demand_id: demandId });
    },

    /**
     * 更新显示的响应列表
     */
    updateDisplayResponses() {
      const { demand, showMore } = this.data;
      const responses = demand.responses || [];
      
      if (showMore) {
        // 显示全部响应
        this.setData({
          displayResponses: responses
        });
      } else {
        // 只显示前3条响应
        this.setData({
          displayResponses: responses.slice(0, 3)
        });
      }
    },

    /**
     * 切换显示全部响应
     */
    toggleShowMore() {
      const { showMore } = this.data;
      this.setData({ showMore: !showMore }, () => {
        this.updateDisplayResponses();
      });
    }
  }
})