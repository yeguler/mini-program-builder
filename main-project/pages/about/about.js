Page({
  data: {
    title: '关于页面',
    version: '',
    description: '这是主程序模板的关于页面'
  },

  onLoad() {
    const app = getApp();
    this.setData({
      version: app.globalData.version
    });
  },

  onShow() {
    console.log('关于页面显示');
  },

  contactUs() {
    wx.showModal({
      title: '联系我们',
      content: '如有问题请联系技术支持',
      showCancel: false
    });
  },

  checkUpdate() {
    const app = getApp();
    wx.showModal({
      title: '版本信息',
      content: `当前版本: ${app.globalData.version}`,
      showCancel: false
    });
  }
});