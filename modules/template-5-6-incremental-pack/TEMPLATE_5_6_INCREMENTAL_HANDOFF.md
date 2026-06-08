# 模板 5-6 增量提交说明

这份文件是给“已经接过前四套模板工具”的另一个 agent 用的。

目标不是重新交付整套工具，而是**单独把第 5、6 套模板补进去**。

---

## 1. 这次新增什么

只新增两套模板策略：

1. `sticker-emoji-creature`
2. `scratchboard-night-creature`

对应中文名：

1. `贴纸感表情怪物`
2. `夜色刮刻怪物`

---

## 2. 集成范围

如果对方那边已经有前四套模板工具，这次最小集成只需要同步以下内容：

- `src/config/templateProfiles.js`
  新增 2 个 profile，并注册到 `TEMPLATE_PROFILES`
- `tests/template-fusion-service.test.js`
  把模板数量校验从 `>= 4` 提到 `>= 6`
  再补 2 个 `label` 断言
- `tools/run-fifth-template-read-test.mjs`
  第 5 套火山实测脚本
- `tools/run-sixth-template-blame-test.mjs`
  第 6 套火山实测脚本
- `TEMPLATE_STYLE_RECORDS.md`
  新增第 5 套和第 6 套风格档案
- `AGENT_README.md`
  把新的 `templateId` 和脚本名补进去

如果对方只想先跑通功能，不关心文档，可以最低只改：

- `src/config/templateProfiles.js`
- `tests/template-fusion-service.test.js`

---

## 3. 模板 5 定义

### `templateId`

```txt
sticker-emoji-creature
```

### 中文名

```txt
贴纸感表情怪物
```

### 风格核心

- 白底或浅奶油背景
- 像聊天贴纸包里的单张角色
- 粉紫、淡蓝、奶白、果冻粉为主
- 明显贴纸感、表情包感、消息气泡和 emoji 点缀
- 标题在上，角色在中，下方一句极短网感吐槽

### 适合主题

- 已读不回
- 双标
- 临时鸽
- 嘴硬
- 社交装死

### 容易跑偏的方向

- 跑成儿童插画
- 跑成长说明图鉴
- 跑成普通萌宠插画

### 已有火山实测

- 结果图：[fifth-template-read-result.jpeg](/C:/Users/user/Documents/task/fifth-template-read-result.jpeg)
- 返回记录：[fifth-template-read-result.json](/C:/Users/user/Documents/task/fifth-template-read-result.json)

---

## 4. 模板 6 定义

### `templateId`

```txt
scratchboard-night-creature
```

### 中文名

```txt
夜色刮刻怪物
```

### 风格核心

- 深黑或墨蓝夜色背景
- 粗糙刮刻版画线条
- 黑白灰为主，只有极少量强调色
- 地下独立海报、冷讽刺、压迫感
- 单主体强图形，标题和角色一起形成视觉锤点

### 适合主题

- 甩锅
- 背刺
- 压榨
- 冷暴力
- 会议折磨

### 容易跑偏的方向

- 跑成普通黑白漫画
- 跑成写实恐怖海报
- 跑成纯人物海报而不是怪物化讽刺图形

### 已有火山实测

- 结果图：[sixth-template-blame-result.jpeg](/C:/Users/user/Documents/task/sixth-template-blame-result.jpeg)
- 返回记录：[sixth-template-blame-result.json](/C:/Users/user/Documents/task/sixth-template-blame-result.json)

---

## 5. 对另一个 agent 的最小操作步骤

1. 在 `src/config/templateProfiles.js` 中补入模板 5 和模板 6 的 profile 对象
2. 把这两个 profile 注册进 `TEMPLATE_PROFILES`
3. 运行 `npm test`
4. 运行 `npm run build`
5. 如需实测，分别运行：

```bash
node .\tools\run-fifth-template-read-test.mjs
node .\tools\run-sixth-template-blame-test.mjs
```

---

## 6. 建议的合并方式

如果对方仓库里的前四套模板实现已经和这里略有分叉，不要整文件覆盖，优先按下面方式合并：

1. 只复制两个新增 profile
2. 只补 `TEMPLATE_PROFILES` 注册项
3. 只补测试断言
4. 只补文档中的模板 5、6 条目

这样最不容易把对方已经改过的前四套配置冲掉。

---

## 7. 这次增量交付的相关文件

- [src/config/templateProfiles.js](/C:/Users/user/Documents/task/src/config/templateProfiles.js)
- [tests/template-fusion-service.test.js](/C:/Users/user/Documents/task/tests/template-fusion-service.test.js)
- [tools/run-fifth-template-read-test.mjs](/C:/Users/user/Documents/task/tools/run-fifth-template-read-test.mjs)
- [tools/run-sixth-template-blame-test.mjs](/C:/Users/user/Documents/task/tools/run-sixth-template-blame-test.mjs)
- [TEMPLATE_STYLE_RECORDS.md](/C:/Users/user/Documents/task/TEMPLATE_STYLE_RECORDS.md)
- [AGENT_README.md](/C:/Users/user/Documents/task/AGENT_README.md)

---

## 8. 一句话交接口径

如果你要把这段直接发给另一个 agent，可以用这句话：

> 前四套模板工具已经提交，这次只需要把第 5 套 `sticker-emoji-creature` 和第 6 套 `scratchboard-night-creature` 作为增量模板并入，模板定义、风格档案、测试断言和火山实测脚本都已经准备好，按 `TEMPLATE_5_6_INCREMENTAL_HANDOFF.md` 合并即可。
