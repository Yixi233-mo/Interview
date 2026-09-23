# 手册

纯静态工具站：可搜索题库、标签筛选、复习进度、自测模式。零后端、零运行时依赖；发布链用 Staticrypt 做客户端 AES 加密。

- 在线地址（Pages 开启且 Source=`main` → `/docs` 后生效）：https://yixi233-mo.github.io/Interview/
- 仓库：https://github.com/Yixi233-mo/Interview

## 技术栈

| 层 | 说明 |
|----|------|
| 页面 | HTML5 + CSS3（设计令牌、深色模式、打印样式） |
| 逻辑 | 原生 JavaScript（ES2020），无框架 |
| 持久化 | `localStorage`（勾选进度、标签展开等） |
| 加密发布 | [Staticrypt](https://github.com/robinmoisson/staticrypt)（AES-256，浏览器端解密） |
| 构建 | Node.js ≥ 16 + `scripts/build-encrypted.js` |
| 托管 | GitHub Pages（只发布 `docs/`） |

## 目录结构

```
├── index.html                 # 开发入口（本地直接打开）
├── css/styles.css             # 样式
├── js/
│   ├── data.js                # 题库数据（本地编辑，不进公开发布树）
│   ├── storage.js             # localStorage 封装
│   └── app.js                 # 渲染 / 搜索 / 弹窗 / 自测
├── scripts/build-encrypted.js # 内联打包 + Staticrypt 加密
├── docs/index.html            # 加密后的发布页（Pages 只发这个）
├── .github/workflows/pages.yml
├── package.json               # devDependency: staticrypt
└── README.md
```

## 功能

- 章节导航、折叠展开、全文搜索（高亮命中）
- 标签筛选（可收起；已选标签摘要）
- 复习勾选与进度百分比
- 口径速查 / 翻车急救 / 盲区 / 需核实 弹窗
- 自测模式（随机抽题、显示答案、会了/不会）
- 移动端抽屉目录、系统打印

## 本地使用与开发

双击根目录 `index.html`，或起静态服务：

```bash
python -m http.server 8000
```

| 改什么 | 文件 |
|--------|------|
| 题目 / 答案 | `js/data.js` |
| 样式 | `css/styles.css` |
| 交互逻辑 | `js/app.js` |
| 持久化 | `js/storage.js` |

## 加密构建与发布

发布页必须是「内联单文件 → 加密」的结果，避免 `js/data.js` 等以明文出现在可公开访问的路径。

```powershell
npm install
$env:HB_PASSWORD = "你的密码"   # 至少 8 位，不要写进仓库
node scripts/build-encrypted.js
git add -A
git commit -m "deploy encrypted handbook"
git push
```

脚本流程：

1. 将 `css/styles.css` 与 `js/*.js` 内联进单文件 HTML（`.build/index.html`）
2. 用 Staticrypt 加密，输出 `docs/index.html`
3. 做明文特征串检查（确保密文页无题库明文）

### GitHub Pages 配置

https://github.com/Yixi233-mo/Interview/settings/pages

- Source：**Deploy from a branch**
- Branch：`main`，目录：**`/docs`**

也可用仓库内 Actions workflow（上传 `docs` 目录）。

### 环境变量

| 变量 | 作用 |
|------|------|
| `HB_PASSWORD` | 加密密码（构建期；亦可用 `STATICRYPT_PASSWORD`） |

密码只用于本地构建，不进仓库、不写入前端源码。

## 构建注意

- 内联 JS 时使用函数形式的 `String.replace`（源码里可能含 `$&`、`$$` 等特殊替换序列）。
- 公开树中应只保留 `docs/index.html` 等可发布文件；若仓库内仍含明文 `js/data.js`，加密等于无效。
- 本地开发用的 `index.html`、`css/`、`js/` 仅供编辑，不作为公开 Pages 入口。
