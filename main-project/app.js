App({
  onLaunch() {
    console.log('主程序启动 - 版本: 1.0.0');
    
    // 检查登录状态
    this.checkLoginStatus();
  },
  
  onShow() {
    console.log('主程序显示');
  },
  
  onHide() {
    console.log('主程序隐藏');
  },
  
  checkLoginStatus() {
    // 模拟检查登录状态
    const token = wx.getStorageSync('token');
    if (!token) {
      console.log('用户未登录');
      this.globalData.isLogin = false;
    } else {
      console.log('用户已登录');
      this.globalData.isLogin = true;
    }
  },
  
  login() {
    // 模拟登录
    return new Promise((resolve) => {
      setTimeout(() => {
        wx.setStorageSync('token', 'mock-token-' + Date.now());
        this.globalData.isLogin = true;
        resolve(true);
      }, 1000);
    });
  },
  
  logout() {
    wx.removeStorageSync('token');
    this.globalData.isLogin = false;
  },
  
  globalData: {
    isLogin: false,
    userInfo: null,
    version: '1.0.0'
  }
});