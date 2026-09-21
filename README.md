# 面试作战手册

纯静态站点：`index.html` + `css/` + `js/` + `assets/`，无构建步骤。

**在线地址（开启 Pages 后生效）**  
https://yixi233-mo.github.io/Interview/

仓库：https://github.com/Yixi233-mo/Interview

## 本地打开
直接双击 `index.html`，或：

```bash
python -m http.server 8000
```

## 怎么用
1. 先过「口径速查」，把数字背熟
2. 再过「盲区清单」，知道哪些能主动承认
3. 逐题看，勾选已复习
4. 用「自测模式」随机抽题，练口述
5. 面试前过一遍「翻车急救」

## 怎么改
- 改题目/答案：编辑 `js/data.js`
- 改样式：编辑 `css/styles.css`
- 改逻辑：编辑 `js/app.js`

改完提交推送即可更新站点：

```bash
git add -A
git commit -m "update handbook"
git push
```

## GitHub Pages 部署

代码已推送到 `main`。在仓库页开启 Pages（二选一）：

**方式 A（推荐，配合仓库里的 Actions）**  
1. 打开 https://github.com/Yixi233-mo/Interview/settings/pages  
2. Source 选择 **GitHub Actions**  
3. 等 Actions 跑完，访问上面的在线地址

**方式 B（经典分支部署）**  
1. 同上设置页  
2. Source 选择 **Deploy from a branch**  
3. Branch 选 `main`，目录选 `/ (root)`，Save  

> 仓库需为 **Public**，Pages（免费）才会生效。内容已脱敏；若改为 Private，免费 Pages 不可用。

## 脱敏说明

手册正文已脱敏，请保持同一套说法：

| 字段 | 手册写法 |
|------|----------|
| 专业 | 【其他专业】 |
| 工作城市 | 合肥 |
| 亲属城市 | 南京 |
| 籍贯 | 外省 |
| 年龄 | 【年龄】 |
| 医疗项目名 | 医知通 |
| 薪资 / LegalMate / 团队规模 | 保留 |

真实对照请记在本地私密处，不要写进本仓库。

## 面试前必做
- [ ] 填完 data.js 里所有【需核实】
- [ ] 填完 data.js 里所有【如实说】
- [ ] 确认空窗期口径（hr-04）
- [ ] 确认 17.8 万条数据来源（med-05）
- [ ] 确认薪资口径（hr-05）
