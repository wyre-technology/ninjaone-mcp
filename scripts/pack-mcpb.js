#!/usr/bin/env node
const { execSync } = require('child_process');
const { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, readFileSync, writeFileSync, statSync } = require('fs');
const { resolve, join } = require('path');

const ROOT = resolve(__dirname, '..');
const STAGING = resolve(ROOT, '.mcpb-staging');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

try {
  console.log('\\n=== Building project ===');
  run('npm run build', { cwd: ROOT });

  console.log('\\n=== Preparing staging directory ===');
  if (existsSync(STAGING)) rmSync(STAGING, { recursive: true });
  mkdirSync(STAGING, { recursive: true });

  console.log('\\n=== Copying production files ===');
  const pkg = require(join(ROOT, 'package.json'));
  cpSync(join(ROOT, 'dist'), join(STAGING, 'dist'), { recursive: true });
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  manifest.version = pkg.version;
  writeFileSync(join(STAGING, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\\n');
  copyFileSync(join(ROOT, 'README.md'), join(STAGING, 'README.md'));
  if (existsSync(join(ROOT, 'LICENSE'))) {
    copyFileSync(join(ROOT, 'LICENSE'), join(STAGING, 'LICENSE'));
  }

  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main,
    dependencies: pkg.dependencies,
  };
  writeFileSync(join(STAGING, 'package.json'), JSON.stringify(prodPkg, null, 2));

  console.log('\\n=== Copying production dependencies ===');
  const prodPaths = execSync('npm ls --production --parseable --all 2>/dev/null', { cwd: ROOT, encoding: 'utf8' })
    .split('\\n')
    .filter(p => p.includes('node_modules'))
    .map(p => p.trim());
  console.log(`  ${prodPaths.length} production packages`);
  for (const absPath of prodPaths) {
    const relPath = absPath.slice(ROOT.length + 1);
    const destPath = join(STAGING, relPath);
    if (existsSync(absPath)) {
      mkdirSync(join(destPath, '..'), { recursive: true });
      cpSync(absPath, destPath, { recursive: true });
    }
  }

  run('find dist -name "*.map" -delete', { cwd: STAGING });
  run('find node_modules -type d \\( -name test -o -name tests -o -name __tests__ -o -name examples -o -name example \\) -exec rm -rf {} + 2>/dev/null || true', { cwd: STAGING });
  run('find node_modules -type f \\( -name "*.map" -o -name "CHANGELOG*" -o -name "HISTORY*" -o -name "CONTRIBUTING*" -o -name ".eslintrc*" -o -name ".prettierrc*" -o -name "tsconfig.json" \\) -delete 2>/dev/null || true', { cwd: STAGING });

  if (existsSync(join(ROOT, '.mcpbignore'))) {
    copyFileSync(join(ROOT, '.mcpbignore'), join(STAGING, '.mcpbignore'));
  }

  console.log('\\n=== Packing MCPB bundle ===');
  const bundleName = pkg.name.replace(/^@.*\\//, '');
  const bundlePath = join(ROOT, `${bundleName}.mcpb`);
  run(`npx mcpb pack "${STAGING}" "${bundlePath}"`, { cwd: ROOT });

  console.log('\\n=== Cleanup ===');
  rmSync(STAGING, { recursive: true });

  console.log('\\n=== Done! ===');
  if (existsSync(bundlePath)) {
    const stats = statSync(bundlePath);
    console.log(`Bundle: ${bundleName}.mcpb (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
  }
} catch (error) {
  console.error('Pack failed:', error.message);
  if (existsSync(STAGING)) rmSync(STAGING, { recursive: true });
  process.exit(1);
}