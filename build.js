const fs = require('fs-extra');
const path = require('path');

/**
 * 构建配置
 */
const config = {
  mainProjectPath: path.resolve('./main-project'),
  subProjectPath: path.resolve('./sub-project'), 
  subPackageName: process.env.SUB_PACKAGE_NAME || 'demo',
  subAppId: process.env.SUB_APPID || 'wx_default_appid',
  outputPath: path.resolve('./dist'),
  mode: process.env.NODE_ENV || 'development'
};

/**
 * 主构建函数 - 简化可靠版
 */
async function build() {
  try {
    console.log('🚀 开始构建微信小程序...');
    console.log('子包名称:', config.subPackageName);

    // 1. 准备目录
    await prepareDirectory();

    // 2. 拷贝主程序
    await copyMainProject();
    
    // 3. 拷贝子程序到分包目录
    await copySubProject();
    
    // 4. 更新配置文件
    await updateAppJson();
    await updateProjectConfig();

    console.log('✅ 构建完成！输出目录:', config.outputPath);
    
  } catch (error) {
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

/**
 * 准备目录
 */
async function prepareDirectory() {
  await fs.ensureDir(config.outputPath);
  await fs.emptyDir(config.outputPath);
  console.log('📁 目录准备完成');
}

/**
 * 拷贝主程序
 */
async function copyMainProject() {
  if (!await fs.pathExists(config.mainProjectPath)) {
    throw new Error(`主工程路径不存在: ${config.mainProjectPath}`);
  }

  await fs.copy(config.mainProjectPath, config.outputPath, {
    filter: (src) => !src.includes('node_modules') && !src.includes('.git')
  });
  console.log('📦 主工程复制完成');
}

/**
 * 拷贝子程序
 */
async function copySubProject() {
  const subPackageDir = path.join(config.outputPath, 'subpackages', config.subPackageName);
  
  if (!await fs.pathExists(config.subProjectPath)) {
    throw new Error(`子工程路径不存在: ${config.subProjectPath}`);
  }

  await fs.copy(config.subProjectPath, subPackageDir);
  console.log('📦 子工程复制完成');
}

/**
 * 更新 app.json - 简化版
 */
async function updateAppJson() {
  const appJsonPath = path.join(config.outputPath, 'app.json');
  
  if (!await fs.pathExists(appJsonPath)) {
    throw new Error('app.json 文件不存在');
  }

  const appJson = await fs.readJson(appJsonPath);
  
  // 1. 确保主程序有足够的页面（至少2个）
  if (!appJson.pages || appJson.pages.length < 2) {
    console.warn('⚠️  主程序页面不足，确保有至少2个页面');
  }

  // 2. 配置子程序分包
  await setupSubPackage(appJson);

  await fs.writeJson(appJsonPath, appJson, { spaces: 2 });
  console.log('⚙️  app.json 配置完成');
}

/**
 * 配置子程序分包
 */
async function setupSubPackage(appJson) {
  // 初始化分包数组
  if (!appJson.subPackages) {
    appJson.subPackages = [];
  }

  // 移除同名的旧分包
  appJson.subPackages = appJson.subPackages.filter(
    pkg => pkg.root !== `subpackages/${config.subPackageName}`
  );

  // 获取子程序的页面列表
  const subPages = await getSubPackagePages();
  
  // 添加新的分包配置
  appJson.subPackages.push({
    root: `subpackages/${config.subPackageName}`,
    name: config.subPackageName,
    pages: subPages,
    independent: false
  });

  console.log(`📄 子程序页面: ${subPages.join(', ')}`);
}

/**
 * 获取子程序页面列表
 */
async function getSubPackagePages() {
  const pagesDir = path.join(config.subProjectPath, 'pages');
  const pages = [];
  
  if (await fs.pathExists(pagesDir)) {
    const pageDirs = await fs.readdir(pagesDir);
    
    for (const pageDir of pageDirs) {
      const pagePath = path.join(pagesDir, pageDir);
      const stats = await fs.stat(pagePath);
      
      if (stats.isDirectory()) {
        // 检查是否包含必要的页面文件
        const hasWxml = await fs.pathExists(path.join(pagePath, `${pageDir}.wxml`));
        const hasJs = await fs.pathExists(path.join(pagePath, `${pageDir}.js`));
        
        if (hasWxml && hasJs) {
          pages.push(`pages/${pageDir}/${pageDir}`);
        }
      }
    }
  }
  
  // 如果自动扫描失败，使用默认页面
  if (pages.length === 0) {
    pages.push('pages/index/index');
    console.warn('⚠️  自动扫描页面失败，使用默认页面路径');
  }
  
  return pages;
}

/**
 * 更新项目配置
 */
async function updateProjectConfig() {
  const projectConfigPath = path.join(config.outputPath, 'project.config.json');
  
  if (await fs.pathExists(projectConfigPath)) {
    const projectConfig = await fs.readJson(projectConfigPath);
    
    // 只更新必要的字段
    projectConfig.appid = config.subAppId;
    projectConfig.projectname = `主程序+${config.subPackageName}`;
    
    await fs.writeJson(projectConfigPath, projectConfig, { spaces: 2 });
    console.log('⚙️  项目配置更新完成');
  }
}

// 执行构建
build().catch(console.error);