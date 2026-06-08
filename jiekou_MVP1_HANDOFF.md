# MVP1 接口交接文件

## 1. 项目定位

MVP1 是“吐槽一下”前端主工程。用户输入一段糟心事后，系统会：

1. 先生成结构化文本结果，立即展示给用户。
2. 再把结构化字段和选定模板组合成图片模型提示词。
3. 后台生成图片，完成后替换结果卡片中的加载动画。

最终演示文件是：

```txt
D:\Desktop\hks\MVP1\dist\index.html
```

本地完整演示推荐启动：

```txt
D:\Desktop\hks\MVP1\start-demo.cmd
```

打开地址：

```txt
http://localhost:8787/index.html
```

## 2. 前端输入接口

主入口：

```js
generateTextResult(request)
completeImageForResult(result, request)
generateResult(request)
```

文件：

```txt
src/features/generate/generateController.js
```

### GenerateRequest

```js
{
  text: string,
  sourceType: "text" | "speech",
  generateMode: "vent" | "self",
  templateProfileId: "auto"
    | "monster-atlas"
    | "creature-flashcard"
    | "furry-mascot-sheet"
    | "pastel-plush-bestiary"
    | "sticker-emoji-creature"
    | "scratchboard-night-creature",
  styleSeed?: string,
  timestamp?: number
}
```

字段说明：

- `text`：用户输入的长故事。
- `sourceType`：输入来源，文字或语音转写。
- `generateMode`：生成模式。
  - `vent`：发泄，调用被吐槽对象恶搞提示词服务。
  - `self`：自嘲，调用原故事理解提示词服务。
- `templateProfileId`：图片模板选择。
  - `auto` 表示自动按标签匹配模板。
  - 其他值表示强制使用某个模板。
- `timestamp`：用于生成本次请求的 `userId` / `roomId`。

## 3. 两段式输出接口

### 第一段：文本先出

```js
const textResult = await generateTextResult(request);
```

返回后前端立即展示文本结果。此时图片还没有生成完成：

```js
{
  imageStatus: "pending",
  imageGenerating: true,
  imageUrl: 本地模板占位图,
  summary,
  visualCharacter,
  memeText,
  imagePrompt,
  animationPrompt,
  templateProfileLabel,
  ...
}
```

### 第二段：图片补齐

```js
const finalResult = await completeImageForResult(textResult, request);
```

图片完成后返回：

```js
{
  ...textResult,
  imageStatus: "ready",
  imageGenerating: false,
  imageUrl: 最终图片地址,
  templatePrompt: 最终传给图片模型的完整提示词,
  templateProfileId,
  templateProfileLabel,
  templateTitle
}
```

### 兼容旧接口

```js
const result = await generateResult(request);
```

这个接口会一次性跑完文本和图片，适合测试，不适合前端等待体验。

## 4. Result 字段说明

核心结果对象字段：

```js
{
  id: string,
  text: string,
  scene: string,
  emotion: string,
  object: string,
  tags: string[],
  compliment: string,
  imageUrl: string,
  summary: string,
  promptLabel: string,

  imagePrompt: string,
  visualCharacter: string,
  memeText: string,
  animationPrompt: string,

  generateMode: "vent" | "self",

  mockTitle: string,
  mockSummary: string,
  mockTags: string[],
  villainType: string,
  facialExpression: string,
  signaturePose: string,
  mockProps: string[],
  memeTexts: string[],
  roastCopy: string,
  publicExecutionCopy: string,
  stickerPrompt: string,

  templatePrompt: string,
  templateKey: string,
  requestedTemplateProfileId: string,
  templateProfileId: string,
  templateProfileLabel: string,
  templateTitle: string,

  promptSource: string,
  sourceType: "text" | "speech",
  imageStatus: "pending" | "ready",
  imageGenerating: boolean,
  imageError: string,
  createdAt: string
}
```

前端目前展示：

- `scene` / `emotion` / `promptLabel` / `tags`
- `summary`
- `visualCharacter`
- `memeText`
- `imagePrompt`
- `animationPrompt`
- `compliment`
- `promptSource`
- `generateMode`
- `templateProfileLabel`
- `sourceType`

用户原文 `text` 保留在对象里用于“再来一张”和历史回填，但结果卡片不展示原文。

## 5. LLM 文本分析接口

统一入口：

```txt
src/services/promptExtractionService.js
```

### 自嘲模式

当：

```js
generateMode === "self"
```

调用：

```txt
src/services/minimaxDirectService.js
```

输出核心字段：

```js
summary
targetRole
scene
emotion
emotionLevel
complaintTags
coreConflict
visualCharacter
ventTool
memeText
positivePraise
imagePrompt
animationPrompt
safetyLevel
confidence
```

### 发泄模式

当：

```js
generateMode === "vent"
```

调用：

```txt
src/services/mockTargetPromptService.js
```

输出核心字段：

```js
targetRole
mockTitle
mockSummary
scene
coreBehavior
annoyingLevel
mockTags
villainType
visualCharacter
facialExpression
signaturePose
mockProps
memeTexts
roastCopy
publicExecutionCopy
imagePrompt
animationPrompt
stickerPrompt
safeVersion
safetyLevel
confidence
```

发泄模式会被转换成主流程字段：

```js
mockSummary -> summary
coreBehavior -> coreConflict
mockTags/mockProps -> tags
memeTexts[0] 或 mockTitle -> memeText
roastCopy -> compliment
```

## 6. 本地 Node API

本地 demo server：

```txt
tools/local-demo-server.mjs
```

端口：

```txt
8787
```

### 6.1 故事分析接口

```http
POST /api/story/analyze
Content-Type: application/json
```

请求：

```json
{
  "userId": "u12456789",
  "roomId": "r12456789",
  "storyText": "同事又把锅甩给我。",
  "sourceType": "text",
  "generateMode": "vent"
}
```

响应：

```json
{
  "code": 200,
  "message": "minimax direct success",
  "data": {
    "analysisId": "string",
    "analysisMode": "vent",
    "summary": "string",
    "targetRole": "string",
    "scene": "职场",
    "emotion": "无语",
    "emotionLevel": 3,
    "complaintTags": ["甩锅"],
    "coreConflict": "string",
    "visualCharacter": "string",
    "ventTool": "string",
    "memeText": "string",
    "positivePraise": "string",
    "imagePrompt": "string",
    "animationPrompt": "string",
    "safetyLevel": "safe",
    "confidence": 0.9,
    "mockTitle": "string",
    "mockTags": ["string"],
    "villainType": "string",
    "mockProps": ["string"],
    "stickerPrompt": "string"
  }
}
```

### 6.2 图片生成代理接口

```http
POST /api/image/generate
Content-Type: application/json
```

请求：

```json
{
  "model": "doubao-seedream-5-0-260128",
  "prompt": "最终图片提示词",
  "size": "2K",
  "response_format": "url",
  "watermark": false,
  "metadata": {
    "template_image_name": "workplace-monster-atlas.png",
    "use_template_image": false
  }
}
```

响应：

```json
{
  "code": 200,
  "message": "image generation success",
  "data": {
    "imageUrl": "https://...",
    "raw": {}
  }
}
```

## 7. 图片提示词链路

文件：

```txt
src/services/templateMemeService.js
```

链路：

```txt
LLM 结构化字段
-> buildComplaintTemplatePrompt(aiResult)
-> buildTemplateAwarePrompt({ userPrompt, fileName, templateProfile })
-> finalPrompt
-> payload.prompt
-> /api/image/generate
```

前端结果对象里保存完整图片提示词的字段叫：

```js
result.templatePrompt
```

会拼进图片 prompt 的字段：

```js
memeText / promptLabel
summary
coreConflict
mockTitle
villainType
visualCharacter
facialExpression
signaturePose
mockProps
imagePrompt
animationPrompt
stickerPrompt
tags
complaintTags
scene
emotion
```

只参与自动选模板、不一定直接作为图像主干的字段：

```js
roastCopy
publicExecutionCopy
memeTexts
object
```

## 8. 模板接口

模板配置文件：

```txt
src/config/templateProfiles.js
```

当前 6 套模板：

```txt
monster-atlas                 黑白怪物图鉴
creature-flashcard            动物变种图鉴
furry-mascot-sheet            毛球怪手绘系列
pastel-plush-bestiary         糖果色吐槽小怪物
sticker-emoji-creature        贴纸感表情怪物
scratchboard-night-creature   夜色刮刻怪物
```

模板对象结构：

```js
{
  id: string,
  label: string,
  description: string,
  promptIntro: string,
  styleSummary: string[],
  extraRules: string[],
  compositionTemplate(titleHint): string,
  goal: string,
  explicitTitlePattern: RegExp,
  titleRules: Array<{ keywords: string[], title: string }>,
  fileNameRules: Array<{ includes: string, title: string }>,
  defaultTitle: string
}
```

前端可选：

```txt
auto 自动匹配
6 个具体模板 id
```

自动匹配逻辑：

```txt
src/services/templateMemeService.js
```

## 9. 关键文件索引

```txt
src/app.js                                   前端编排，两段式生成
src/components/InputPanel.js                 输入区、生成模式、模板选择
src/components/ResultCard.js                 结果卡片、图片 loading 状态
src/features/generate/generateController.js  文本生成和图片补齐
src/services/promptExtractionService.js      LLM 分发入口
src/services/minimaxDirectService.js         自嘲模式 MiniMax 提示词
src/services/mockTargetPromptService.js      发泄模式 MiniMax 提示词
src/services/templateMemeService.js          图像 prompt 组合
src/services/templateFusionService.js        图片代理请求
src/config/templateProfiles.js               6 套模板定义
tools/local-demo-server.mjs                  本地 API 代理服务
tools/build-standalone.mjs                   生成 dist/index.html
```

## 10. 验证命令

```bash
node --test tests\generate-services.test.js
node tools\build-standalone.mjs
node --check tools\local-demo-server.mjs
```

