# ComplaintStoryAnalyzer 长故事吐槽解析服务

`ComplaintStoryAnalyzer` 是后续主项目最前置的后端能力模块，负责把用户讲述的长篇吐槽故事解析成结构化 JSON。

本模块不做前端、不生成图片、不播放动画，只完成：

```text
长故事文本 / 语音转文字结果
        ↓
故事预处理
        ↓
MiniMax LLM 语义理解
        ↓
结构化吐槽 JSON
        ↓
供表情包生成、AI 生图、泄愤动画、反向夸夸模块继续使用
```

## 1. 模块定位

在完整互动解压项目中，本服务位于链路最前面：

```text
多人连麦 / 文本输入 / 语音转文字
        ↓
ComplaintStoryAnalyzer 长故事吐槽解析服务
        ↓
表情包生成模块
AI 生图模块
泄愤动画模块
反向夸夸模块
房间互动模块
```

用户不需要手动输入标签，只需要讲一段故事。后端自动识别：

- 发生了什么
- 吐槽对象是谁
- 故事场景是什么
- 用户主要情绪是什么
- 有哪些槽点标签
- 适合生成什么表情包文案
- 适合生成什么泄愤道具或动画
- 适合生成什么反向夸夸文案
- 后续 AI 生图应该使用什么提示词

## 2. 技术栈

- Java 17+
- Spring Boot 3.3.x
- Spring Web
- WebClient
- Jackson
- Lombok
- H2，可选存储
- MiniMax Anthropic Compatible API

当前默认模型配置为：

```text
Base URL: https://api.minimaxi.com/anthropic
Request Path: /v1/messages
Model: MiniMax-M2.7
```

如果你的 MiniMax Token Plan 只支持文档中的 `MiniMax-M3`，可以通过环境变量覆盖模型名。

## 3. 目录结构

```text
src/main/java/com/zjbq/complaint
├── ComplaintStoryAnalyzerApplication.java
├── config
│   ├── LlmProperties.java
│   └── StorageProperties.java
├── controller
│   └── ComplaintStoryAnalyzerController.java
├── dto
│   └── AnalyzeStoryRequest.java
├── exception
│   ├── BadRequestException.java
│   ├── GlobalExceptionHandler.java
│   └── LlmCallException.java
├── llm
│   ├── LlmClient.java
│   └── MinimaxLlmClient.java
├── prompt
│   └── ComplaintStoryPromptTemplate.java
├── repository
│   └── StoryAnalysisRepository.java
├── service
│   ├── AnalysisSanitizer.java
│   ├── ComplaintStoryAnalyzerService.java
│   └── StoryPreprocessor.java
└── vo
    ├── AnalyzeStoryResponse.java
    └── ApiResponse.java
```

## 4. 核心接口

### POST `/api/story/analyze`

请求体：

```json
{
  "userId": "用户ID，可为空",
  "roomId": "房间ID，可为空",
  "storyText": "用户讲述的一大段吐槽故事",
  "sourceType": "text",
  "generateMode": "both"
}
```

字段说明：

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `userId` | 否 | 用户 ID |
| `roomId` | 否 | 多人连麦房间 ID |
| `storyText` | 是 | 用户讲述的完整故事 |
| `sourceType` | 否 | `text` 或 `speech`，默认 `text` |
| `generateMode` | 否 | `meme`、`vent`、`both`，默认 `both` |

成功响应：

```json
{
  "code": 200,
  "message": "analyze success",
  "data": {
    "analysisId": "da3867039c93469aa2036bb33c129a52",
    "summary": "同事拖延甩锅还装无辜，当众反咬我背锅",
    "targetRole": "甩锅同事",
    "scene": "职场",
    "emotion": "愤怒",
    "emotionLevel": 4,
    "complaintTags": ["甩锅达人", "装无辜", "当众背刺", "拖延成性", "反咬一口"],
    "coreConflict": "自己拖延交材料却当众甩锅，还装可怜倒打一耙",
    "visualCharacter": "戴假无辜面具、背后藏巨型铁锅的甩锅小人",
    "ventTool": "巨型弹弓把甩锅侠弹进碎锅机，喷出满屏锅形碎片",
    "memeText": "锅从天上来，甩得真精彩",
    "positivePraise": "被当众冤枉还能冷静解释，你比甩锅侠有格局一百倍",
    "imagePrompt": "抖音风格卡通插画，一个戴假无辜面具的职场小人站在会议室里，手指对面，背后的巨大铁锅闪闪发光，表情夸张得意，整体丑萌搞笑",
    "animationPrompt": "甩锅小人被巨型弹弓弹射进碎锅机，碎锅机高速运转喷出无数锅形碎片，碎片拼成'甩锅失败'四字，背景会议室，节奏卡点搞笑",
    "safetyLevel": "safe",
    "confidence": 0.92,
    "needUserConfirm": false
  }
}
```

失败响应：

```json
{
  "code": 400,
  "message": "内容太短，请再多讲一点，AI 才能更准确帮你出气。",
  "data": null
}
```

## 5. 参数校验与预处理

服务端会自动处理：

1. `storyText` 不能为空
2. 少于 20 个中文字符时返回错误：

```text
内容太短，请再多讲一点，AI 才能更准确帮你出气。
```

3. 超过 3000 字的故事会先截断，避免大模型输入过长
4. 清理明显无意义重复内容，例如连续重复的 `啊啊啊啊啊`
5. `sourceType` 只支持：`text`、`speech`
6. `generateMode` 只支持：`meme`、`vent`、`both`

## 6. LLM 调用策略

LLM 客户端封装在：

```text
src/main/java/com/zjbq/complaint/llm/MinimaxLlmClient.java
```

当前实现使用 MiniMax Anthropic Compatible 协议：

```text
Base URL: https://api.minimaxi.com/anthropic
Path: /v1/messages
```

请求头包括：

```text
x-api-key: ${MINIMAX_API_KEY}
Authorization: Bearer ${MINIMAX_API_KEY}
anthropic-version: 2023-06-01
Content-Type: application/json
```

请求体主要字段：

```json
{
  "model": "MiniMax-M2.7",
  "max_tokens": 2048,
  "messages": [
    {
      "role": "user",
      "content": "完整提示词"
    }
  ],
  "temperature": 0.45,
  "stream": false
}
```

如果模型返回不是合法 JSON，服务会自动重试一次。重试仍失败时，不会让接口崩溃，而是返回兜底结果。

## 7. Prompt 模板

提示词模板单独维护在：

```text
src/main/java/com/zjbq/complaint/prompt/ComplaintStoryPromptTemplate.java
```

不要把提示词写在 Controller 中。后续如果要优化表情包风格、泄愤动画风格、反向夸夸语气，只需要改这一层。

## 8. 后处理规则

LLM 返回后，服务会再次清洗和校验：

- 字段缺失时自动补齐
- `emotionLevel` 限制在 1 到 5
- `complaintTags` 至少 3 个，最多 6 个
- `memeText` 限制 18 字以内
- `positivePraise` 避免过度油腻表达
- `imagePrompt` 脱敏手机号、邮箱、部分公司名称
- `safetyLevel=need_review` 时，`needUserConfirm=true`
- `confidence < 0.70` 时，`needUserConfirm=true`

## 9. 兜底结果

如果大模型调用失败、响应解析失败、JSON 缺字段严重，接口仍返回 `200`，但 `data` 使用兜底内容。

典型兜底特征：

```json
{
  "summary": "用户遇到了一件让人很无语的糟心事。",
  "targetRole": "离谱当事人",
  "scene": "其他",
  "confidence": 0.30,
  "needUserConfirm": true
}
```

如果你看到 `confidence=0.30`，通常说明真实 LLM 没有成功返回可解析结果，需要查看后端日志。

## 10. 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `LLM_MOCK_ENABLED` | 是否启用 mock 模式 | `true` |
| `MINIMAX_API_KEY` | MiniMax API Key | 空 |
| `MINIMAX_API_ENDPOINT` | MiniMax Anthropic Base URL | `https://api.minimaxi.com/anthropic` |
| `MINIMAX_MODEL` | 模型名称 | `MiniMax-M2.7` |
| `MINIMAX_TIMEOUT_SECONDS` | 调用超时时间 | `30` |
| `STORY_ANALYSIS_STORAGE_ENABLED` | 是否写入 `story_analysis` 表 | `false` |

### Mock 模式启动

默认就是 mock 模式，不需要 API Key。

```powershell
cd D:\Desktop\ZJBQ\cousor
mvn spring-boot:run
```

### 真实 MiniMax 模式启动

```powershell
cd D:\Desktop\ZJBQ\cousor

$env:LLM_MOCK_ENABLED="false"
$env:MINIMAX_API_KEY="你的真实API_KEY"
$env:MINIMAX_API_ENDPOINT="https://api.minimaxi.com/anthropic"
$env:MINIMAX_MODEL="MiniMax-M2.7"

mvn spring-boot:run
```

如果你的 Key 只支持 `MiniMax-M3`，启动前改成：

```powershell
$env:MINIMAX_MODEL="MiniMax-M3"
```

## 11. 本地测试

### PowerShell 编码初始化

Windows PowerShell 测中文前建议执行：

```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

### 成功请求

```powershell
$body = @{
  userId = "u1001"
  roomId = "r2001"
  storyText = "今天上班真的把我气笑了，我同事明明自己没有按时交材料，结果开会的时候当着领导的面说是我没有提醒他，还把整个进度延期都甩到我身上。我解释的时候他还在旁边装无辜，说自己最近太忙忘了，我真的又无语又心累。"
  sourceType = "text"
  generateMode = "both"
} | ConvertTo-Json -Depth 5

$response = Invoke-RestMethod `
  -Uri "http://localhost:8080/api/story/analyze" `
  -Method Post `
  -ContentType "application/json; charset=utf-8" `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($body))

$response | ConvertTo-Json -Depth 20
```

### 内容太短测试

```powershell
$body = @{
  storyText = "太气了"
  sourceType = "text"
  generateMode = "both"
} | ConvertTo-Json -Depth 5

try {
  Invoke-RestMethod `
    -Uri "http://localhost:8080/api/story/analyze" `
    -Method Post `
    -ContentType "application/json; charset=utf-8" `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
} catch {
  $stream = $_.Exception.Response.GetResponseStream()
  $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
  $reader.ReadToEnd()
}
```

预期返回：

```json
{
  "code": 400,
  "message": "内容太短，请再多讲一点，AI 才能更准确帮你出气。",
  "data": null
}
```

## 12. Postman 测试

请求地址：

```text
POST http://localhost:8080/api/story/analyze
```

Headers：

```text
Content-Type: application/json; charset=utf-8
```

Body 选择 `raw`，格式选择 `JSON`：

```json
{
  "userId": "u1001",
  "roomId": "r2001",
  "storyText": "今天上班真的把我气笑了，我同事明明自己没有按时交材料，结果开会的时候当着领导的面说是我没有提醒他，还把整个进度延期都甩到我身上。我解释的时候他还在旁边装无辜，说自己最近太忙忘了，我真的又无语又心累。",
  "sourceType": "text",
  "generateMode": "both"
}
```

## 13. 可选存储

启动时会初始化 `story_analysis` 表。

默认不写库：

```powershell
$env:STORY_ANALYSIS_STORAGE_ENABLED="false"
```

开启写库：

```powershell
$env:STORY_ANALYSIS_STORAGE_ENABLED="true"
```

当前默认使用 H2 内存库，适合本地开发。后续整合到主项目时，可以替换为 MySQL、PostgreSQL 或主项目已有数据源。

表结构字段：

```text
id
analysis_id
user_id
room_id
original_story
summary
target_role
scene
emotion
emotion_level
complaint_tags
core_conflict
visual_character
vent_tool
meme_text
positive_praise
image_prompt
animation_prompt
safety_level
confidence
created_at
updated_at
```

## 14. 后续接入主项目建议

后期封装进主项目时，建议按下面顺序接入：

1. 保留 `controller` 接口路径 `/api/story/analyze`，方便前端和房间模块调用
2. 将 `dto`、`vo` 作为主项目公共接口契约
3. 将 `prompt` 层独立成可配置模板，方便运营调风格
4. 将 `llm` 层保持接口化，后续可以替换为其他模型
5. 将 `repository` 层改接主项目数据库
6. 将 `analysisId` 作为后续表情包、生图、动画任务的关联 ID
7. 后续模块只依赖本接口返回的结构化字段，不直接依赖用户原始长文本

推荐后续数据流：

```text
POST /api/story/analyze
        ↓
返回 analysisId + structured analysis
        ↓
POST /api/meme/generate?analysisId=xxx
POST /api/image/generate?analysisId=xxx
POST /api/vent/animation?analysisId=xxx
POST /api/praise/generate?analysisId=xxx
```

## 15. 常见问题

### 1. 返回 `confidence=0.30` 是什么情况？

说明走了兜底结果。常见原因：

- `LLM_MOCK_ENABLED=true`
- API Key 没有读取到
- 模型名不被当前 Key 支持
- MiniMax 接口返回 400、401、404
- 模型返回内容不是合法 JSON

查看后端日志中的：

```text
Calling MINIMAXM2.7
MINIMAXM2.7 HTTP error
MINIMAXM2.7 raw response
```

### 2. 端口 8080 被占用怎么办？

关闭之前启动的服务，或临时换端口：

```powershell
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"
```

接口地址同步改成：

```text
http://localhost:8081/api/story/analyze
```

### 3. PowerShell 中文乱码怎么办？

执行：

```powershell
chcp 65001
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
```

请求时使用：

```powershell
-Body ([System.Text.Encoding]::UTF8.GetBytes($body))
```

### 4. API Key 能不能写进代码？

不建议。当前实现从环境变量读取：

```text
MINIMAX_API_KEY
```

如果只在本机使用，可以将它写入 Windows 用户环境变量，避免每次手动设置。
