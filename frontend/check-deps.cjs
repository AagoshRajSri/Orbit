const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');
const deps = new Set(Object.keys(pkg.dependencies || {}));
const builtinModules = new Set(require('module').builtinModules);

const getFiles = dir => {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map(dirent => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
};

const files = getFiles('./src').filter(f => f.endsWith('.js'));
let missing = new Set();

files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const imports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(m => m[1])
    .concat([...content.matchAll(/import\s+['"]([^'"]+)['"]/g)].map(m => m[1]));

  imports.forEach(imp => {
    if (imp.startsWith('.')) return;
    const pkgName = imp.split('/').length > 1 && imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
    if (!deps.has(pkgName) && !builtinModules.has(pkgName) && !imp.startsWith('node:')) {
      missing.add(pkgName);
    }
  });
});

console.log('Missing deps:', Array.from(missing));
