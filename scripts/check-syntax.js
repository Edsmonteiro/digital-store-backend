const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
function walk(folder) {
  for (const file of fs.readdirSync(folder, { withFileTypes: true })) {
    const full = path.join(folder, file.name);
    if (file.isDirectory()) walk(full);
    else if (/\.(js|cjs)$/.test(file.name)) execFileSync(process.execPath, ['--check', full], { stdio: 'inherit' });
  }
}
for (const name of ['src', 'migrations', 'seeders', 'tests', 'scripts']) walk(path.join(root, name));
console.log('Todos os arquivos JS passaram na verificação de sintaxe.');
