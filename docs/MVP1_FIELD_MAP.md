# MVP1 字段映射说明

## 1. 用户输入到 LLM 请求

前端输入：

```js
{
  text,
  sourceType,
  generateMode,
  templateProfileId,
  timestamp
}
```

转换为故事分析请求：

```js
{
  userId,
  roomId,
  storyText,
  sourceType,
  generateMode
}
```

文件：

```txt
src/services/storyAnalyzeRequest.js
```

## 2. 自嘲模式字段映射

来源：

```txt
src/services/minimaxDirectService.js
```

LLM 输出：

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

映射到前端：

```js
targetRole -> object
complaintTags -> tags
positivePraise -> compliment
summary -> summary
coreConflict -> coreConflict
visualCharacter -> visualCharacter
memeText -> memeText
imagePrompt -> imagePrompt
animationPrompt -> animationPrompt
```

## 3. 发泄模式字段映射

来源：

```txt
src/services/mockTargetPromptService.js
```

LLM 输出：

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

映射到前端：

```js
targetRole -> object
mockSummary -> summary
coreBehavior -> coreConflict
annoyingLevel -> emotionLevel
mockTags + mockProps -> tags
memeTexts[0] 或 mockTitle -> memeText
roastCopy 或 publicExecutionCopy -> compliment
visualCharacter -> visualCharacter
imagePrompt -> imagePrompt
animationPrompt -> animationPrompt
stickerPrompt -> stickerPrompt
```

保留原字段：

```js
mockTitle
mockTags
villainType
facialExpression
signaturePose
mockProps
memeTexts
roastCopy
publicExecutionCopy
stickerPrompt
```

## 4. 图片 prompt 输入字段

进入 `buildComplaintTemplatePrompt(aiResult)` 的字段：

```js
memeText
promptLabel
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

输出：

```js
userPrompt
```

再进入：

```js
buildTemplateAwarePrompt({
  userPrompt,
  fileName,
  templateProfile
})
```

输出：

```js
finalPrompt
```

最终：

```js
payload.prompt = finalPrompt
result.templatePrompt = finalPrompt
```

## 5. 前端展示字段

结果卡片展示：

```js
scene
emotion
promptLabel
tags
summary
visualCharacter
memeText
imagePrompt
animationPrompt
compliment
promptSource
generateMode
templateProfileLabel
sourceType
createdAt
```

结果卡片不展示：

```js
text
```

但 `text` 会保留，用于：

- 再来一张
- 历史回填

