const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

/**
 * 构建配置 - 针对流水线环境优化
 */
const config = {
  // 主工程Git配置（从环境变量获取）
  mainProjectRepo:
    process.env.MAIN_PROJECT_REPO ||
    'https://github.com/your-company/main-project.git',
  mainProjectBranch: process.env.MAIN_PROJECT_BRANCH || 'main',

  // 子工程配置（当前流水线工程）
  subProjectPath: process.cwd(), // 当前工作目录就是子工程目录
  subPackageName: process.env.SUB_PACKAGE_NAME || path.basename(process.cwd()),
  subAppId: process.env.SUB_APPID || process.env.APPID || 'wx_default_appid',

  // 构建输出配置
  outputPath: path.resolve(process.cwd(), 'dist'), // 输出到子工程目录下的dist文件夹
  tempPath: path.resolve(process.cwd(), '.temp'),

  // 构建模式
  mode: process.env.NODE_ENV || 'development',

  // 主程序公共资源配置
  mainPublicResources: {
    components: ['common-header', 'common-footer'],
    utils: ['common.js', 'request.js'],
    images: ['logo.png', 'icons/'],
    styles: ['theme.wxss'],
  },
}

/**
 * 主构建函数 - 流水线环境优化版
 */
async function build() {
  try {
    console.log('🚀 开始流水线构建...')
    console.log('工作目录:', process.cwd())
    console.log('子包名称:', config.subPackageName)
    console.log('主工程仓库:', config.mainProjectRepo)
    console.log('主工程分支:', config.mainProjectBranch)
    console.log('输出目录:', config.outputPath)

    // 1. 准备目录
    await prepareDirectory()

    // 2. 从Git拉取主工程代码
    await cloneMainProject()

    // 3. 设置主工程路径
    config.mainProjectPath = path.join(config.tempPath, 'main-project')

    // 4. 拷贝主工程到输出目录
    await copyMainProject()

    // 5. 拷贝子工程到分包目录
    await copySubProject()

    // 6. 创建主程序资源快捷方式
    await createMainResourceShortcuts()

    // 7. 验证子程序路径
    await validateSubPackagePaths()

    // 8. 更新配置文件
    await updateAppJson()
    await updateProjectConfig()

    // 9. 生成构建报告
    await generateBuildReport()

    // 10. 清理临时文件（可选）
    if (process.env.CLEAN_TEMP !== 'false') {
      await cleanTempFiles()
    }

    console.log('✅ 流水线构建完成！')
    console.log('构建产物位置:', config.outputPath)
  } catch (error) {
    console.error('❌ 构建失败:', error)
    process.exit(1)
  }
}

/**
 * 准备目录
 */
async function prepareDirectory() {
  await fs.ensureDir(config.outputPath)
  await fs.ensureDir(config.tempPath)
  await fs.emptyDir(config.outputPath)
  await fs.emptyDir(config.tempPath)
  console.log('📁 目录准备完成')
}

/**
 * 从Git拉取主工程代码
 */
async function cloneMainProject() {
  const mainProjectTempDir = path.join(config.tempPath, 'main-project')

  console.log('📥 正在拉取主工程代码...')

  try {
    // 使用git clone命令拉取代码
    const cloneCommand = `git clone -b ${config.mainProjectBranch} ${config.mainProjectRepo} ${mainProjectTempDir}`
    console.log(`执行命令: ${cloneCommand}`)

    execSync(cloneCommand, {
      stdio: 'inherit',
      cwd: config.tempPath,
    })

    console.log('✅ 主工程代码拉取完成')

    // 显示拉取的commit信息
    const commitInfo = execSync('git log -1 --oneline', {
      cwd: mainProjectTempDir,
      encoding: 'utf8',
    })
    console.log(`📝 主工程最新提交: ${commitInfo.trim()}`)
  } catch (error) {
    throw new Error(`拉取主工程代码失败: ${error.message}`)
  }
}

/**
 * 拷贝主工程到输出目录
 */
async function copyMainProject() {
  if (!(await fs.pathExists(config.mainProjectPath))) {
    throw new Error(`主工程路径不存在: ${config.mainProjectPath}`)
  }

  await fs.copy(config.mainProjectPath, config.outputPath, {
    filter: (src) => {
      // 过滤掉不需要的文件
      if (
        src.includes('node_modules') ||
        src.includes('.git') ||
        src.includes('.temp') ||
        src.includes('dist')
      ) {
        return false
      }
      return true
    },
  })

  console.log('📦 主工程复制完成')
}

/**
 * 拷贝子工程到分包目录
 */
async function copySubProject() {
  const subPackageDir = path.join(
    config.outputPath,
    'subpackages',
    config.subPackageName
  )

  if (!(await fs.pathExists(config.subProjectPath))) {
    throw new Error(`子工程路径不存在: ${config.subProjectPath}`)
  }

  await fs.copy(config.subProjectPath, subPackageDir, {
    filter: (src) => {
      // 过滤掉构建相关文件
      if (
        src.includes('node_modules') ||
        src.includes('.git') ||
        src.includes('dist') ||
        path.basename(src) === 'build.js' ||
        path.basename(src) === 'package-lock.json'
      ) {
        return false
      }
      return true
    },
  })

  console.log('📦 子工程复制完成')
}

/**
 * 创建主程序资源快捷方式
 */
async function createMainResourceShortcuts() {
  const subPackageDir = path.join(
    config.outputPath,
    'subpackages',
    config.subPackageName
  )

  console.log('🔗 创建主程序资源快捷方式...')

  // 创建快捷方式目录
  await fs.ensureDir(path.join(subPackageDir, '_main_resources'))

  // 创建各类资源快捷方式
  await createComponentShortcuts(subPackageDir)
  await createUtilsShortcuts(subPackageDir)
  await createImageShortcuts(subPackageDir)
  await createStyleShortcuts(subPackageDir)

  console.log('✅ 主程序资源快捷方式创建完成')
}

/**
 * 创建组件快捷方式
 */
async function createComponentShortcuts(subPackageDir) {
  const componentsDir = path.join(
    subPackageDir,
    '_main_resources',
    'components'
  )
  await fs.ensureDir(componentsDir)

  for (const component of config.mainPublicResources.components) {
    const mainComponentPath = path.join(
      config.outputPath,
      'components',
      component
    )
    const shortcutPath = path.join(componentsDir, component)

    if (await fs.pathExists(mainComponentPath)) {
      await fs.copy(mainComponentPath, shortcutPath)
      console.log(`   📦 组件快捷方式: ${component}`)
    }
  }
}

/**
 * 创建工具函数快捷方式
 */
async function createUtilsShortcuts(subPackageDir) {
  const utilsDir = path.join(subPackageDir, '_main_resources', 'utils')
  await fs.ensureDir(utilsDir)

  for (const utilFile of config.mainPublicResources.utils) {
    const mainUtilPath = path.join(config.outputPath, 'utils', utilFile)
    const shortcutPath = path.join(utilsDir, utilFile)

    if (await fs.pathExists(mainUtilPath)) {
      await fs.copy(mainUtilPath, shortcutPath)
      console.log(`   🔧 工具快捷方式: ${utilFile}`)
    }
  }
}

/**
 * 创建图片资源快捷方式
 */
async function createImageShortcuts(subPackageDir) {
  const imagesDir = path.join(subPackageDir, '_main_resources', 'images')
  await fs.ensureDir(imagesDir)

  for (const imageResource of config.mainPublicResources.images) {
    const mainImagePath = path.join(config.outputPath, 'images', imageResource)
    const shortcutPath = path.join(imagesDir, imageResource)

    if (await fs.pathExists(mainImagePath)) {
      if ((await fs.stat(mainImagePath)).isDirectory()) {
        await fs.copy(mainImagePath, shortcutPath)
        console.log(`   🖼️  图片目录快捷方式: ${imageResource}`)
      } else {
        await fs.copy(mainImagePath, shortcutPath)
        console.log(`   🖼️  图片快捷方式: ${imageResource}`)
      }
    }
  }
}

/**
 * 创建样式文件快捷方式
 */
async function createStyleShortcuts(subPackageDir) {
  const stylesDir = path.join(subPackageDir, '_main_resources', 'styles')
  await fs.ensureDir(stylesDir)

  for (const styleFile of config.mainPublicResources.styles) {
    const mainStylePath = path.join(config.outputPath, styleFile)
    const shortcutPath = path.join(stylesDir, styleFile)

    if (await fs.pathExists(mainStylePath)) {
      await fs.copy(mainStylePath, shortcutPath)
      console.log(`   🎨 样式快捷方式: ${styleFile}`)
    }
  }
}

/**
 * 验证子程序路径
 */
async function validateSubPackagePaths() {
  const subPackageDir = path.join(
    config.outputPath,
    'subpackages',
    config.subPackageName
  )

  console.log('🔍 检查子程序路径规范...')

  let hasIssues = false
  const jsonFiles = await findFiles(subPackageDir, '**/*.json')

  for (const file of jsonFiles) {
    const issues = await checkJsonFile(file, subPackageDir)
    if (issues.length > 0) {
      hasIssues = true
      console.warn(`⚠️  ${path.relative(subPackageDir, file)} 存在问题:`)
      issues.forEach((issue) => console.warn(`   - ${issue}`))
    }
  }

  if (!hasIssues) {
    console.log('✅ 子程序路径检查通过')
  }
}

/**
 * 检查JSON文件中的路径问题
 */
async function checkJsonFile(file, subPackageDir) {
  const issues = []

  try {
    const content = await fs.readFile(file, 'utf8')
    const jsonData = JSON.parse(content)

    if (
      jsonData.usingComponents &&
      typeof jsonData.usingComponents === 'object'
    ) {
      for (const [key, value] of Object.entries(jsonData.usingComponents)) {
        if (typeof value === 'string' && value.startsWith('/')) {
          issues.push(`组件 "${key}" 使用了绝对路径: ${value}`)
        }
      }
    }
  } catch (error) {
    issues.push(`文件解析错误: ${error.message}`)
  }

  return issues
}

/**
 * 查找文件
 */
async function findFiles(dir, pattern) {
  const glob = require('glob')
  return new Promise((resolve, reject) => {
    glob(
      pattern,
      {
        cwd: dir,
        absolute: true,
        ignore: ['node_modules/**', '.git/**', '_main_resources/**', 'dist/**'],
      },
      (err, files) => {
        if (err) reject(err)
        else resolve(files)
      }
    )
  })
}

/**
 * 更新app.json
 */
async function updateAppJson() {
  const appJsonPath = path.join(config.outputPath, 'app.json')

  if (!(await fs.pathExists(appJsonPath))) {
    throw new Error('app.json 文件不存在')
  }

  const appJson = await fs.readJson(appJsonPath)

  // 配置子程序分包
  await setupSubPackage(appJson)

  await fs.writeJson(appJsonPath, appJson, { spaces: 2 })
  console.log('⚙️  app.json 配置完成')
}

/**
 * 配置子程序分包
 */
async function setupSubPackage(appJson) {
  if (!appJson.subPackages) {
    appJson.subPackages = []
  }

  // 移除同名的旧分包
  appJson.subPackages = appJson.subPackages.filter(
    (pkg) => pkg.root !== `subpackages/${config.subPackageName}`
  )

  // 获取子程序的页面列表
  const subPages = await getSubPackagePages()

  // 添加新的分包配置
  appJson.subPackages.push({
    root: `subpackages/${config.subPackageName}`,
    name: config.subPackageName,
    pages: subPages,
    independent: false,
  })

  console.log(`📄 子程序页面: ${subPages.join(', ')}`)
}

/**
 * 获取子程序页面列表
 */
async function getSubPackagePages() {
  const pagesDir = path.join(config.subProjectPath, 'pages')
  const pages = []

  if (await fs.pathExists(pagesDir)) {
    const pageDirs = await fs.readdir(pagesDir)

    for (const pageDir of pageDirs) {
      const pagePath = path.join(pagesDir, pageDir)
      const stats = await fs.stat(pagePath)

      if (stats.isDirectory()) {
        const hasWxml = await fs.pathExists(
          path.join(pagePath, `${pageDir}.wxml`)
        )
        const hasJs = await fs.pathExists(path.join(pagePath, `${pageDir}.js`))

        if (hasWxml && hasJs) {
          pages.push(`pages/${pageDir}/${pageDir}`)
        }
      }
    }
  }

  if (pages.length === 0) {
    pages.push('pages/index/index')
    console.warn('⚠️  自动扫描页面失败，使用默认页面路径')
  }

  return pages
}

/**
 * 更新项目配置
 */
async function updateProjectConfig() {
  const projectConfigPath = path.join(config.outputPath, 'project.config.json')

  if (await fs.pathExists(projectConfigPath)) {
    const projectConfig = await fs.readJson(projectConfigPath)

    // 更新AppID和项目名称
    projectConfig.appid = config.subAppId
    projectConfig.projectname = `主程序+${config.subPackageName}`

    await fs.writeJson(projectConfigPath, projectConfig, { spaces: 2 })
    console.log('⚙️  项目配置更新完成')
  }
}

/**
 * 生成构建报告
 */
async function generateBuildReport() {
  const report = {
    buildTime: new Date().toISOString(),
    mode: config.mode,
    subPackage: config.subPackageName,
    appId: config.subAppId,
    mainProjectRepo: config.mainProjectRepo,
    mainProjectBranch: config.mainProjectBranch,
    buildInfo: {
      nodeVersion: process.version,
      platform: process.platform,
    },
  }

  // 统计文件信息
  const fileStats = {}
  await countFiles(config.outputPath, fileStats)
  report.fileStats = fileStats

  const reportPath = path.join(config.outputPath, 'build-report.json')
  await fs.writeJson(reportPath, report, { spaces: 2 })

  console.log('📊 构建报告生成完成')
  console.log('文件统计:', fileStats)
}

/**
 * 统计文件数量
 */
async function countFiles(dir, stats) {
  try {
    const items = await fs.readdir(dir)

    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = await fs.stat(fullPath)

      if (stat.isDirectory()) {
        await countFiles(fullPath, stats)
      } else {
        const ext = path.extname(item) || '无扩展名'
        stats[ext] = (stats[ext] || 0) + 1
      }
    }
  } catch (error) {
    // 忽略统计错误
  }
}

/**
 * 清理临时文件
 */
async function cleanTempFiles() {
  if (await fs.pathExists(config.tempPath)) {
    await fs.remove(config.tempPath)
    console.log('🧹 临时文件清理完成')
  }
}

/**
 * 环境变量检查
 */
function checkEnvironment() {
  const requiredEnvVars = ['MAIN_PROJECT_REPO']
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.warn('⚠️  缺少环境变量:', missingVars.join(', '))
    console.warn('💡 将使用默认配置继续构建')
  }
}

// 检查环境变量
checkEnvironment()

// 执行构建
build().catch(console.error)
