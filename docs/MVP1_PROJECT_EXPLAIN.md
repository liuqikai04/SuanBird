# MVP1 项目说明文件

## 1. 这是一个什么项目

MVP1 是“吐槽一下”的前端主工程。目标是让用户输入一段糟心事，系统先理解故事，再生成一个适合吐槽传播的表情包。

当前体验重点：

- 支持 1000 字长文本输入。
- 支持“发泄 / 自嘲”两种模式。
- 支持手动选择图片模板，也支持自动匹配。
- 文本先出，图片后台生成，减少用户等待感。
- 最终产物可以构建为单个 `dist/index.html`。

## 2. 当前目录结构

```txt
MVP1/
  index.html
  package.json
  start-demo.cmd
  dist/
    index.html
  docs/
    MVP1_PROJECT_EXPLAIN.md
  modules/
    template-fusion/
    template-5-6-incremental-pack/
  Prompt_extraction/
  src/
    app.js
    components/
    config/
    features/
    services/
    styles/
    templates/
    utils/
  tests/
    generate-services.test.js
  tools/
    build-standalone.mjs
    local-demo-server.mjs
    publish-to-prompt-extraction.mjs
```

## 3. 开发和演示方式

### 开发模式

```bash
cd D:\Desktop\hks\MVP1
npm run dev
```

### 生成单文件 HTML

```bash
node tools\build-standalone.mjs
```

输出：

```txt
dist/index.html
```

### 本地完整演示

```txt
start-demo.cmd
```

它会启动：

```txt
http://localhost:8787/index.html
```

这个 Node 服务同时代理：

- MiniMax 文本理解
- 火山 / Ark 图片生成

## 4. 用户流程

```txt
输入故事
-> 选择发泄或自嘲
-> 选择自动模板或具体模板
-> 点击生成
-> 先展示文本结果
-> 图片生成中显示 loading 动画
-> 图片生成完成后替换 loading
-> 用户保存图片
```

## 5. 生成模式

### 发泄

模式值：

```txt
vent
```

目标：

把“被吐槽对象”做成一个恶搞反派形象。

调用文件：

```txt
src/services/mockTargetPromptService.js
```

典型字段：

- `mockTitle`
- `villainType`
- `visualCharacter`
- `mockProps`
- `roastCopy`
- `imagePrompt`
- `animationPrompt`
- `stickerPrompt`

### 自嘲

模式值：

```txt
self
```

目标：

更偏向理解用户自己的处境、情绪和反向夸夸。

调用文件：

```txt
src/services/minimaxDirectService.js
```

典型字段：

- `summary`
- `targetRole`
- `scene`
- `emotion`
- `complaintTags`
- `positivePraise`
- `imagePrompt`
- `animationPrompt`

## 6. 两段式生成

旧逻辑是“文本 + 图片全部完成后才显示”，等待感很强。

现在拆成：

```js
generateTextResult(request)
completeImageForResult(result, request)
```

第一段：

- 生成结构化文本。
- 结果卡片立刻显示。
- 图片区域显示 loading 动画。

第二段：

- 调用图片生成接口。
- 完成后替换图片。
- 保存按钮恢复可用。

相关文件：

```txt
src/app.js
src/features/generate/generateController.js
src/components/ResultCard.js
src/styles/card.css
```

## 7. 模板系统

模板配置：

```txt
src/config/templateProfiles.js
```

当前模板：

| id | 名称 | 适合方向 |
| --- | --- | --- |
| `monster-atlas` | 黑白怪物图鉴 | 甩锅、插队、会议、强讽刺 |
| `creature-flashcard` | 动物变种图鉴 | 动物化槽点、图鉴卡片 |
| `furry-mascot-sheet` | 毛球怪手绘系列 | 固定毛球怪、轻手绘 |
| `pastel-plush-bestiary` | 糖果色吐槽小怪物 | 紫粉软萌、生活吐槽 |
| `sticker-emoji-creature` | 贴纸感表情怪物 | 已读不回、双标、嘴硬 |
| `scratchboard-night-creature` | 夜色刮刻怪物 | 甩锅、背刺、压榨、会议折磨 |

前端还有一个：

```txt
auto 自动匹配
```

它不是模板本身，只是选择策略。

## 8. 图片生成链路

核心文件：

```txt
src/services/templateMemeService.js
```

链路：

```txt
aiResult
-> buildComplaintTemplatePrompt()
-> buildTemplateAwarePrompt()
-> finalPrompt
-> buildImageRequestPayload()
-> createFusionImage()
-> /api/image/generate
```

最终图片模型收到的字段：

```js
payload.prompt
```

前端结果对象里对应：

```js
result.templatePrompt
```

## 9. 重要状态字段

图片状态：

```js
imageStatus: "pending" | "ready"
imageGenerating: boolean
imageError: string
```

模板状态：

```js
requestedTemplateProfileId
templateProfileId
templateProfileLabel
templateTitle
templatePrompt
```

生成来源：

```js
promptSource
sourceType
generateMode
```

## 10. 本地服务说明

文件：

```txt
tools/local-demo-server.mjs
```

提供：

```txt
GET  /index.html
POST /api/story/analyze
POST /api/image/generate
```

注意：

- `dist/index.html` 直接双击打开时，浏览器可能因为跨域不能直接调用 MiniMax 或图片接口。
- `start-demo.cmd` 会启动本地代理，推荐演示时使用。

## 11. 测试

测试文件：

```txt
tests/generate-services.test.js
```

覆盖：

- 场景识别
- 安全脱敏
- 长故事提示词提取
- 发泄 / 自嘲模式分发
- 模板 profile 注册
- 模板自动选择
- 图片 payload
- 两段式文本先出

运行：

```bash
node --test tests\generate-services.test.js
```

## 12. 后续开发建议

如果要新增模板：

1. 在 `src/config/templateProfiles.js` 添加 profile。
2. 在 `src/services/templateMemeService.js` 补自动选择规则。
3. 在 `tests/generate-services.test.js` 补断言。
4. 运行测试和 standalone 构建。

如果要改 LLM 输出：

1. 先改 `minimaxDirectService.js` 或 `mockTargetPromptService.js` 的 prompt。
2. 再改 `promptExtractionService.js` 的字段映射。
3. 再确认 `templateMemeService.js` 是否要把新字段拼进图片 prompt。

如果要改图片接口：

1. 优先改 `src/config/imageModelConfig.js`。
2. 必要时改 `src/services/templateFusionService.js`。
3. 本地代理同步改 `tools/local-demo-server.mjs`。

