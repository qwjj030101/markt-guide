/**
 * 通用 picker 组件
 * 功能：提供统一的选择器功能，支持自定义选项列表和显示字段
 */
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 选项列表
    items: {
      type: Array,
      value: [],
      observer: function(newVal) {
        // 当选项列表变化时，更新显示选项
        this.setDisplayItems()
      }
    },
    // 显示字段名
    valueKey: {
      type: String,
      value: 'name'
    },
    // 未选中时的提示文字
    placeholder: {
      type: String,
      value: '请选择'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    selectedIndex: 0,
    selectedName: '',
    displayItems: []
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化组件
     */
    attached: function() {
      this.setDisplayItems()
    },

    /**
     * 设置显示选项
     */
    setDisplayItems: function() {
      const { items, valueKey } = this.properties
      const displayItems = items.map(item => item[valueKey] || '')
      this.setData({ displayItems })
    },

    /**
     * 选择器变化事件
     * @param {Object} e - 事件对象
     */
    onPickerChange: function(e) {
      const index = e.detail.value
      const { items, valueKey } = this.properties
      const selectedItem = items[index]
      const selectedName = selectedItem ? selectedItem[valueKey] || '' : ''

      this.setData({
        selectedIndex: index,
        selectedName: selectedName
      })

      // 触发父组件的 change 事件，传递选中的完整对象
      this.triggerEvent('change', {
        index: index,
        value: selectedItem,
        name: selectedName
      })
    }
  }
})