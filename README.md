# 笑一下蒜鸟 SuanBird MVP2

笑一下蒜鸟 MVP2 是一个面向吐槽场景的 AI 即时解压表情包生成器。用户输入一段糟心事，应用会自动理解事件、提炼槽点、生成丑萌反派形象文案，并结合模板风格输出可保存的表情包。

## 功能亮点

- 支持文字输入和语音输入，适合快速记录吐槽片段。
- 支持“吐槽对方”和“夸夸自己”两种生成模式。
- 内置职场、生活、通勤、消费、社交等场景识别与兜底分析。
- 内置 6 套视觉模板，可自动匹配或手动选择。
- 支持历史结果回看、重新生成和图片保存。
- 支持 MiniMax 接口直连，也支持本地兜底结果用于演示。

## 技术栈

- Vite
- 原生 JavaScript 模块化
- Node.js test runner
- MiniMax 文本/图像生成接口

## 目录结构

```txt
.
├── public/                  # 静态资源
├── src/
│   ├── assets/              # 模板示例图和占位图
│   ├── components/          # UI 组件
│   ├── config/              # 运行时配置、模板注册和常量
│   ├── data/                # Mock 数据
│   ├── features/            # 生成、导出、历史、语音等功能模块
│   ├── services/            # AI 分析、图片生成、内容安全和 Prompt 服务
│   ├── styles/              # 页面样式
│   ├── templates/           # 文案模板、图片模板和场景规则
│   └── utils/               # 通用工具
├── tests/                   # 自动化测试
├── tools/                   # 构建和演示辅助脚本
├── modules/                 # 模板融合与增量模板交接材料
└── Prompt_extraction/       # 后端接口交接/联调模块
```

## 本地运行

```bash
npm install
npm run dev
```

启动后打开终端提示的本地地址，通常是：

```txt
http://localhost:5173/
```

不要直接双击打开根目录的 `index.html` 作为开发预览，因为开发版依赖 Vite 的模块服务。

## 常用脚本

```bash
npm run dev
npm run build
npm run preview
npm test
```

如果需要生成单文件演示版本：

```bash
npm run build:single
```

如果现场无法安装依赖，可以使用无依赖构建脚本：

```bash
node tools/build-standalone.mjs
```

## MiniMax / 图片模型配置

正式发布时不要把真实 Key 写进任何前端文件。推荐使用项目自带的 Node 同源代理：

```bash
npm run build:standalone
$env:NODE_ENV="production"
$env:MINIMAX_API_KEY="你的真实 MiniMax Key"
$env:ARK_IMAGE_API_KEY="你的真实图片模型 Key"
npm start
```

然后访问：

```txt
http://localhost:8787/index.html
```

浏览器只会请求同域的 `/api/story/analyze` 和 `/api/image/generate`，真实 Key 只存在于 Node 进程环境变量里。阿里云部署步骤见 `docs/ALIYUN_DEPLOY.md`。

## 质量检查

```bash
npm test
npm run build
```

测试覆盖场景识别、内容安全、Prompt 生成、模板选择、图片接口 payload 和文本优先生成流程。

## 参赛说明

MVP2 重点验证“把一段真实吐槽变成可传播表情包”的核心链路：

- 输入长吐槽后，系统能提炼结构化槽点。
- 输出文案保持轻量、年轻化和社交传播感。
- 图片生成失败时仍能展示可用文本和兜底图。
- 演示环境可以在无后端、无真实 API Key 的情况下完成基本体验。
