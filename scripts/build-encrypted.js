/* scripts/build-encrypted.js
 * 1) 把 css/js 内联进单文件 HTML
 * 2) 用 staticrypt 加密，输出到 docs/index.html（供 GitHub Pages）
 * 密码：环境变量 HB_PASSWORD，或交互提示；不要写进仓库
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'docs');
const outHtml = path.join(outDir, 'index.html');
const password = process.env.HB_PASSWORD || process.argv[2];

if (!password || password.length < 8) {
  console.error('请提供至少 8 位密码：HB_PASSWORD=xxx node scripts/build-encrypted.js');
  console.error('或：node scripts/build-encrypted.js "YourPassword"');
  process.exit(1);
}

function read(p) {
  return fs.readFileSync(path.join(root, p), 'utf8');
}

let html = read('index.html');
const css = read('css/styles.css');
const storage = read('js/storage.js');
const data = read('js/data.js');
const app = read('js/app.js');

// 去掉外链，改为内联（顺序与原页面一致）
// 注意：js 内含 $& 等，replace 第二参必须用函数，避免被当成特殊替换模式
html = html
  .replace(
    '<link rel="stylesheet" href="css/styles.css" />',
    () => `<style>\n${css}\n</style>`
  )
  .replace(
    /<script src="js\/data\.js"><\/script>\s*<script src="js\/storage\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
    () => `<script>\n${storage}\n</script>\n<script>\n${data}\n</script>\n<script>\n${app}\n</script>`
  );

if (
  html.includes('<script src="js/') ||
  html.includes('href="css/styles.css"')
) {
  console.error('内联失败：HTML 仍以 script/link 引用外部 css/js');
  process.exit(1);
}

const bundleDir = path.join(root, '.build');
fs.mkdirSync(bundleDir, { recursive: true });
// staticrypt v3：输出到目录并保留输入文件名，故先命名为 index.html
const bundleFile = path.join(bundleDir, 'index.html');
fs.writeFileSync(bundleFile, html, 'utf8');
console.log('单文件打包完成:', bundleFile, `(内联后 ${(html.length / 1024).toFixed(1)} KB)`);

fs.mkdirSync(outDir, { recursive: true });
const staticryptJs = path.join(root, 'node_modules', 'staticrypt', 'cli', 'index.js');
const staticryptCmd = path.join(root, 'node_modules', '.bin', 'staticrypt.cmd');

const args = [
  bundleFile,
  '-p', password,
  '-d', outDir,
  '--short',
  '--remember', '30',
  '--template-title', '作战手册',
  '--template-placeholder', '输入访问密码',
  '--template-button', '解锁',
  '--template-instructions', '本手册已加密，请输入密码后查看。',
  '--template-error', '密码错误'
];

if (fs.existsSync(staticryptJs)) {
  execFileSync(process.execPath, [staticryptJs, ...args], { stdio: 'inherit', cwd: root });
} else if (fs.existsSync(staticryptCmd)) {
  execFileSync(staticryptCmd, args, { stdio: 'inherit', cwd: root });
} else {
  execFileSync('npx', ['--yes', 'staticrypt', ...args], {
    stdio: 'inherit',
    cwd: root,
    shell: true
  });
}

if (!fs.existsSync(outHtml)) {
  const alt = [
    path.join(outDir, 'index.html'),
    path.join(root, 'encrypted', 'index.html'),
    path.join(root, 'encrypted', 'standalone.html')
  ].find((p) => fs.existsSync(p));
  if (alt && alt !== outHtml) fs.copyFileSync(alt, outHtml);
}

if (!fs.existsSync(outHtml)) {
  console.error('未找到加密输出 docs/index.html');
  try {
    console.error('docs 目录:', fs.readdirSync(outDir));
  } catch (_) {}
  process.exit(1);
}

const enc = fs.readFileSync(outHtml, 'utf8');
const leaks = ['hr-01', '医知通', 'HANDBOOK_DATA', 'LegalMate 的文档解析', '期望薪资'];
const hit = leaks.filter((s) => enc.includes(s));
console.log('加密文件:', outHtml, `(${(enc.length / 1024).toFixed(1)} KB)`);
if (hit.length) {
  console.error('警告：加密文件中仍疑似明文:', hit);
} else {
  console.log('明文关键词检查：未在加密页中发现题库特征串');
}
console.log('完成。打开 docs/index.html，输入密码应可查看手册。');
