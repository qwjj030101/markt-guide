Component({
  /**
   * 组件的属性列表
   */
  properties: {
    banners: {
      type: Array,
      value: [],
      observer: function(newVal) {
        console.log('轮播图组件接收到数据:', newVal)
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件生命周期函数
   */
  ready() {
    console.log('轮播图组件准备就绪')
    console.log('组件当前 banners 数据:', this.properties.banners)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理轮播图点击事件
     */
    handleBannerTap(e) {
      console.log('轮播图点击事件触发:', e)
      const index = e.currentTarget.dataset.index
      console.log('点击的轮播图索引:', index)
      const banner = this.properties.banners[index]
      console.log('点击的轮播图数据:', banner)
      
      if (banner && (banner.link || banner.url)) {
        const link = banner.link || banner.url
        console.log('跳转到:', link)
        // 直接跳转，保持原有功能
        wx.navigateTo({url: link})
      } else {
        console.log('轮播图数据或链接不存在')
      }
    }
  }
})