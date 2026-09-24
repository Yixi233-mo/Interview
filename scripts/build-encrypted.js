/* scripts/build-encrypted.js
 * 1) 把 css/js 内联进单文件 HTML
 * 2) 用 staticrypt 加密，输出到 docs/index.html（供 GitHub Pages）
 * 3) 用同一密码在 Node 侧真实解密校验
 *
 * 密码：环境变量 HB_PASSWORD 或命令行参数；不要写进仓库
 *
 * staticrypt 3.x 注意：
 * - 密码是第 2 个位置参数（不是 -p）
 * - 输出路径用 -o（没有 -d 目录输出）
 * - 标题/按钮等用 -t / --decrypt-button / --passphrase-placeholder / -i / --label-error
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

// 必须用函数替换，js 内含 $& 等特殊替换序列
html = html
  .replace(
    '<link rel="stylesheet" href="css/styles.css" />',
    () => `<style>\n${css}\n</style>`
  )
  .replace(
    /<script src="js\/data\.js"><\/script>\s*<script src="js\/storage\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
    () => `<script>\n${storage}\n</script>\n<script>\n${data}\n</script>\n<script>\n${app}\n</script>`
  );

if (html.includes('<script src="js/') || html.includes('href="css/styles.css"')) {
  console.error('内联失败：HTML 仍以 script/link 引用外部 css/js');
  process.exit(1);
}

const bundleDir = path.join(root, '.build');
fs.mkdirSync(bundleDir, { recursive: true });
const bundleFile = path.join(bundleDir, 'index.html');
fs.writeFileSync(bundleFile, html, 'utf8');
console.log('单文件打包完成:', bundleFile, `(内联后 ${(html.length / 1024).toFixed(1)} KB)`);

fs.mkdirSync(outDir, { recursive: true });

const staticryptJs = path.join(root, 'node_modules', 'staticrypt', 'cli', 'index.js');
const staticryptCmd = path.join(root, 'node_modules', '.bin', 'staticrypt.cmd');

const args = [
  bundleFile,
  password,
  '-o', outHtml,
  '--engine', 'webcrypto',
  '--short',
  '--remember', '30',
  '-t', '作战手册',
  '--passphrase-placeholder', '输入访问密码',
  '--decrypt-button', '解锁',
  '-i', '本手册已加密，请输入密码后查看。',
  '--label-error', '密码错误'
];
const childEnv = { ...process.env, STATICRYPT_PASSWORD: password, HB_PASSWORD: password };

if (fs.existsSync(staticryptJs)) {
  execFileSync(process.execPath, [staticryptJs, ...args], { stdio: 'inherit', cwd: root, env: childEnv });
} else if (fs.existsSync(staticryptCmd)) {
  execFileSync(staticryptCmd, args, { stdio: 'inherit', cwd: root, env: childEnv });
} else {
  execFileSync('npx', ['--yes', 'staticrypt', ...args], {
    stdio: 'inherit',
    cwd: root,
    env: childEnv,
    shell: true
  });
}

if (!fs.existsSync(outHtml)) {
  console.error('未生成 docs/index.html');
  try { console.error('docs 目录:', fs.readdirSync(outDir)); } catch (_) {}
  process.exit(1);
}

const enc = fs.readFileSync(outHtml, 'utf8');
const leaks = ['hr-01', '医知通', 'HANDBOOK_DATA', 'LegalMate 的文档解析', '期望薪资'];
const hit = leaks.filter((s) => enc.includes(s));
console.log('加密文件:', outHtml, `(${(enc.length / 1024).toFixed(1)} KB)`);
if (hit.length) {
  console.error('警告：加密文件中仍疑似明文:', hit);
  process.exit(1);
}
console.log('明文关键词检查：通过');

// 真实解密校验（与浏览器同一套 webcrypto 流程）
async function verifyDecrypt() {
  const cryptoEngine = require(path.join(root, 'node_modules/staticrypt/lib/cryptoEngine/webcryptoEngine'));
  const codec = require(path.join(root, 'node_modules/staticrypt/lib/codec')).init(cryptoEngine);

  // 模板写入：const encryptedMsg = '{encrypted}', salt = '{salt}'
  const encMatch = enc.match(/encryptedMsg\s*=\s*'([a-f0-9]+)'/i);
  const saltMatch = enc.match(/salt\s*=\s*'([a-f0-9]{32})'/i);

  if (!saltMatch || !encMatch) {
    console.error('无法从加密页解析 salt/密文');
    process.exit(1);
  }

  const salt = saltMatch[1];
  const encrypted = encMatch[1];
  const hashed = await cryptoEngine.hashPassphrase(password, salt);
  const result = await codec.decode(encrypted, hashed, salt);

  if (!result.success) {
    console.error('解密校验失败：', result.message || result);
    process.exit(1);
  }
  const plain = result.decoded;
  const ok =
    plain.includes('HANDBOOK_DATA') &&
    plain.includes('作战手册') &&
    !plain.includes('<script src="js/data.js">');
  if (!ok) {
    console.error('解密成功但内容异常：无题库标记或仍引用外部 js');
    process.exit(1);
  }
  console.log(`解密校验通过：密码正确，还原 HTML ${(plain.length / 1024).toFixed(1)} KB，含题库`);
  console.log('完成。浏览器打开 docs/index.html，输入同一密码即可。');
}

verifyDecrypt().catch((e) => {
  console.error('解密校验出错:', e);
  process.exit(1);
});
