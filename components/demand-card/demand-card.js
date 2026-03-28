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
        // 只在 demand 对象变化时更新显示的响应列表
        this.setData({ showMore: false }, () => {
          this.updateDisplayResponses();
        });
      }
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
      const { demand } = this.properties;
      
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
      
      console.log('需求未完成，触发响应事件');
      // 触发响应事件
      this.triggerEvent('tapResponse', { demand_id: demandId });
    },

    /**
     * 点击"已完成"按钮
     */
    onTapComplete(e) {
      const demandId = e.currentTarget.dataset.demandId;
      this.triggerEvent('tapComplete', { demand_id: demandId });
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