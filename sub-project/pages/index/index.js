Page({
  data: {
    title: '子程序首页',
    features: [
      { name: '功能1', description: '这是子程序的第一个功能' },
      { name: '功能2', description: '这是子程序的第二个功能' },
      { name: '功能3', description: '这是子程序的第三个功能' }
    ],
    currentFeature: null,
    counter: 0
  },

  onLoad(options) {
    console.log('子程序页面加载，参数:', options);
    
    // 从主程序获取全局数据
    const app = getApp();
    this.setData({
      mainVersion: app.globalData.version,
      isLogin: app.globalData.isLogin
    });
  },

  onShow() {
    console.log('子程序页面显示');
  },

  // 选择功能
  selectFeature(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentFeature: this.data.features[index]
    });
  },

  // 增加计数器
  incrementCounter() {
    this.setData({
      counter: this.data.counter + 1
    });
  },

  // 减少计数器
  decrementCounter() {
    if (this.data.counter > 0) {
      this.setData({
        counter: this.data.counter - 1
      });
    }
  },

  // 返回主程序
  backToMain() {
    wx.navigateBack();
  },

  // 调用主程序登录
  callMainLogin() {
    const app = getApp();
    
    if (app.globalData.isLogin) {
      wx.showToast({
        title: '已登录',
        icon: 'success'
      });
      return;
    }

    wx.showLoading({
      title: '登录中...',
    });

    app.login().then(() => {
      wx.hideLoading();
      this.setData({
        isLogin: true
      });
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    });
  }
});