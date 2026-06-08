# 模板图融合生图工具

这是一个基于 Vite 的前端小工具，可以实现：

- 上传模板图
- 输入提示词
- 调用你自己的生图接口
- 展示并下载融合后的结果图

## 启动

```bash
npm install
npm run dev
```

## 先填配置

在 [src/config/imageModelConfig.js](./src/config/imageModelConfig.js) 中填写：

- `API_URL`
- `API_KEY`
- `MODEL_NAME`

如果你的服务端请求体字段和当前示例不一样，也在这个文件里修改：

- `buildImageRequestPayload(...)`
- `resolveImageUrlFromResponse(...)`

这样改动范围最小，前端页面不用再动。

## 测试

```bash
npm test
```

## 构建

```bash
npm run build
```

如果你最后需要单个 HTML 文件：

```bash
npm run build:single
```

输出文件：

```txt
dist/index.single.html
```
