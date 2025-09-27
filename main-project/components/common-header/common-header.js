Component({
  properties: {
    title: {
      type: String,
      value: '默认标题'
    },
    showBack: {
      type: Boolean,
      value: false
    }
  },

  data: {
    statusBarHeight: 0,
    navBarHeight: 44
  },

  lifetimes: {
    attached() {
      const systemInfo = wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight
      });
    }
  },

  methods: {
    onBack() {
      wx.navigateBack();
    },

    onHome() {
      wx.reLaunch({
        url: '/pages/index/index'
      });
    }
  }
});