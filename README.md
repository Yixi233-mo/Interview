# 面试作战手册

本地可编辑的静态手册；**线上 Pages 只发布加密页**（Staticrypt AES-256）。

**在线地址（开启 Pages 且 Source=main/docs 后生效）**  
https://yixi233-mo.github.io/Interview/

仓库：https://github.com/Yixi233-mo/Interview

## 本地开发（未加密，勿直接当公开页）

双击根目录 `index.html`，或：

```bash
python -m http.server 8000
```

改题目：`js/data.js`；样式：`css/styles.css`；逻辑：`js/app.js`。

## 加密后发布到 GitHub Pages

> 原方案只加密 `index.html` 不够：`js/data.js` 仍是明文。  
> 正确流程：**内联打包 → staticrypt → 只发布 `docs/index.html`**。

```powershell
cd "E:\work\Mimo\手册"
# 换成你自己的密码（至少 8 位，不要写进仓库）
$env:HB_PASSWORD = "你的密码"
node scripts/build-encrypted.js
git add -A
git commit -m "deploy encrypted handbook"
git push
```

GitHub 设置：  
https://github.com/Yixi233-mo/Interview/settings/pages  
Source 选 **Deploy from a branch** → Branch `main` → 目录 **`/docs`** → Save。

（若用 Actions：workflow 已改为上传 `docs` 目录。）

## 重要：仓库里不要留明文题库

- `docs/index.html`：加密后的密码页（可公开）
- 根目录 `js/`、`css/`、未加密 `index.html`：**仅本地编辑**
- 公开仓库若仍包含 `js/data.js`，等于没加密

历史提交里若已有明文 `data.js`，需要 **重建仓库** 或 **force-push 清历史** 才能真正抹掉。重建更干净：新建空仓库，只推 `docs/` + `README.md` + `scripts/` + `package.json` + workflow。

## 脱敏口径（手册内）

| 字段 | 手册写法 |
|------|----------|
| 专业 | 【其他专业】 |
| 工作城市 | 合肥 |
| 亲属城市 | 南京 |
| 籍贯 | 外省 |
| 年龄 | 【年龄】 |
| 医疗项目名 | 医知通 |
| 薪资 / LegalMate | 保留 |

## 面试前必做
- [ ] 填完 data.js 里所有【需核实】
- [ ] 填完 data.js 里所有【如实说】
- [ ] 确认空窗期口径（hr-04）
- [ ] 确认 17.8 万条数据来源（med-05）
- [ ] 确认薪资口径（hr-05）
- [ ] 改完重新跑 `build-encrypted.js` 并 push
