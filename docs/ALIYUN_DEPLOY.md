# MVP2 阿里云部署说明

目标：别人用手机访问 H5 页面，但 MiniMax / 图片模型 API Key 只保存在阿里云服务器环境变量里，不进入浏览器。

## 推荐架构

```txt
手机浏览器
  -> https://your-domain.com/index.html
  -> 同域 POST /api/story/analyze
  -> 同域 POST /api/image/generate
  -> 阿里云 Node 服务读取环境变量调用 MiniMax / 图片模型
```

不要把 `src/config/runtimeConfig.js` 写入真实 Key 后再构建。前端构建产物会被浏览器看到，真实 Key 必须只放云服务器环境变量。

## 部署方式

最简单方案是阿里云 ECS：

1. 服务器安装 Node.js 20 或更高版本。
2. 上传 `MVP2` 项目到服务器。
3. 在服务器进入 `MVP2` 目录。
4. 安装依赖并构建单文件页面。
5. 用生产环境变量启动 Node 代理。
6. 用 Nginx 把公网 HTTPS 域名反向代理到 Node 端口。

## 构建命令

```bash
npm ci
npm run build:standalone
```

生成结果：

```txt
dist/index.html
```

## 环境变量

参考 `.env.example`，云服务器上至少需要：

```bash
export NODE_ENV=production
export PORT=8787
export PUBLIC_URL=https://your-domain.com/index.html
export ALLOWED_ORIGIN=https://your-domain.com

export MINIMAX_API_KEY=你的真实MiniMaxKey
export MINIMAX_MODEL=MiniMax-M2.7

export ARK_IMAGE_API_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
export ARK_IMAGE_API_KEY=你的真实图片模型Key
export ARK_IMAGE_MODEL=doubao-seedream-5-0-260128
```

启动：

```bash
npm start
```

生产模式下 `tools/local-demo-server.mjs` 只从环境变量读取 Key，不会从前端配置文件或旧模板模块读取 Key。

## Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

上线后建议配置 HTTPS 证书，并让安全组只开放 80 / 443。Node 的 `8787` 端口只给本机 Nginx 访问。

## 验证接口

```bash
curl -X POST https://your-domain.com/api/story/analyze \
  -H "Content-Type: application/json" \
  -d '{"storyText":"今天开会又被甩锅了。","sourceType":"text","generateMode":"vent"}'
```

成功时返回：

```json
{
  "code": 200,
  "message": "minimax direct success",
  "data": {
    "summary": "...",
    "complaintTags": ["..."],
    "imagePrompt": "..."
  }
}
```

## 上线前检查

- 不要把真实 Key 写进 `src/config/runtimeConfig.js`。
- 不要把整个项目目录配置成静态站点根目录。
- 只让 Node 服务暴露 `dist/index.html` 和两个 API 路由。
- `ALLOWED_ORIGIN` 改成你的正式域名。
- 加 IP 限流、日志和每日预算上限，避免公开后被刷接口。
