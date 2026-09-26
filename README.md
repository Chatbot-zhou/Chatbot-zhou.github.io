# 周晨博 · 个人主页

纯静态个人介绍主页：原生 HTML / CSS / JS，零依赖、零构建，支持明暗双主题与中英双语切换。

## 本地预览

直接双击 `index.html` 即可在浏览器打开；或起一个本地服务：

```bash
cd personal-homepage
python -m http.server 8080
# 访问 http://localhost:8080
```

## 部署到 Upma（上码）平台

1. 打开 [upma.cn](https://www.upma.cn/) 并登录；
2. 将整个 `personal-homepage` 文件夹（或 `personal-homepage.zip`）拖入上传框；
   - 注意：入口文件必须是站点根目录下的 `index.html`（本目录已满足）；
   - 用 zip 上传时，`index.html` 需位于压缩包根层，不要多套一层文件夹；
3. 上传后自动发布，即可获得永久访问链接；可在项目控制台绑定自定义域名（CNAME 解析，SSL 自动下发）。

免费套餐额度：2 个项目 / 每月 1GB 流量，静态页面足够使用。

## 已部署地址（双平台互为容灾）

| 地址 | 说明 |
| --- | --- |
| https://fractal-xjhm.upma.site/ | Upma 托管，国内 CDN 访问快 |
| https://chatbot-zhou.github.io/ | GitHub Pages 托管（仓库 `Chatbot-zhou/Chatbot-zhou.github.io`） |

**更新 GitHub Pages 版本**：本目录已初始化为 git 仓库并关联远程（SSH），改完文件后：

```bash
git add -A && git commit -m "update" && git push
```

push 后 Pages 自动重新构建（约 1 分钟）。

## 介绍页双链接

GitHub（`Chatbot-zhou/Chatbot-zhou`）与 Gitee（`chatbotzhou/chatbotzhou`）的介绍 README 已同时挂两个地址：Upma（国内快）+ GitHub Pages（备用）。

## 目录结构

```
personal-homepage/
├── index.html        # 单页结构（Hero / 数据 / 关于 / 技能 / 经历 / 项目 / 开源 / 联系）
├── css/style.css     # 浅色玻璃拟态 + 深色主题（CSS 变量驱动），动效与响应式
├── js/i18n.js        # 中英双语字典（改文案主要改这里）
├── js/main.js        # 主题切换、语言切换、打字机、进场动画、数字滚动、导航
├── assets/favicon.svg
└── README.md
```

## 常见修改

- **改文案**：中文在 `index.html` 里直接改，同时更新 `js/i18n.js` 中对应的 key（英文）；
- **改配色**：`css/style.css` 顶部 `:root`（浅色）与 `[data-theme="dark"]`（深色）两段 CSS 变量；
- **换头像/加照片**：图片放入 `assets/` 后在 Hero 区引用即可（当前按需求未放头像）。
