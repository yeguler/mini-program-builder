const app = getApp();

Page({
  data: {
    title: '主程序首页',
    version: '',
    isLogin: false,
    userInfo: null,
    currentTime: ''
  },

  onLoad() {
    this.setData({
      version: app.globalData.version,
      isLogin: app.globalData.isLogin,
      currentTime: this.formatTime(new Date())
    });
  },

  onShow() {
    // 更新登录状态
    this.setData({
      isLogin: app.globalData.isLogin
    });
  },

  formatTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
  },

  // 登录按钮点击事件
  onLoginTap() {
    if (this.data.isLogin) {
      this.onLogoutTap();
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
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({
        title: '登录失败',
        icon: 'error'
      });
      console.error('登录失败:', err);
    });
  },

  // 退出登录
  onLogoutTap() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({
            isLogin: false,
            userInfo: null
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 获取用户信息
  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      this.setData({
        userInfo: e.detail.userInfo
      });
      app.globalData.userInfo = e.detail.userInfo;
    }
  },

  // 跳转到分包页面（构建后会存在）
  gotoSubPackage() {
    wx.navigateTo({
      url: '/subpackages/demo/pages/index/index'
    });
  },

  // 显示版本信息
  showVersionInfo() {
    wx.showModal({
      title: '版本信息',
      content: `主程序版本: ${this.data.version}\n当前时间: ${this.data.currentTime}`,
      showCancel: false
    });
  }
});