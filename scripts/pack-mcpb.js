#!/usr/bin/env node

/**
 * Pack script for creating MCPB (MCP Bundle) distribution.
 * Creates a clean staging directory with only production deps,
 * then runs mcpb pack to create the bundle.
 */

import { execSync } from 'child_process';
import { cpSync, mkdirSync, rmSync, existsSync, copyFileSync, readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const ROOT = resolve(__dirname, '..');
const STAGING = resolve(ROOT, '.mcpb-staging');

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', ...opts });
}

try {
  // 1. Build the project
  console.log('\n=== Building project ===');
  run('npm run build', { cwd: ROOT });

  // 2. Clean and create staging directory
  console.log('\n=== Preparing staging directory ===');
  if (existsSync(STAGING)) rmSync(STAGING, { recursive: true });
  mkdirSync(STAGING, { recursive: true });

  // 3. Copy production files (sync manifest version from package.json)
  console.log('\n=== Copying production files ===');
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  cpSync(join(ROOT, 'dist'), join(STAGING, 'dist'), { recursive: true });
  const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
  manifest.version = pkg.version;
  writeFileSync(
    join(STAGING, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  );
  copyFileSync(join(ROOT, 'README.md'), join(STAGING, 'README.md'));
  if (existsSync(join(ROOT, 'LICENSE'))) {
    copyFileSync(join(ROOT, 'LICENSE'), join(STAGING, 'LICENSE'));
  }

  // 4. Create a minimal package.json with only production deps
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: pkg.main,
    dependencies: pkg.dependencies,
  };
  writeFileSync(
    join(STAGING, 'package.json'),
    JSON.stringify(prodPkg, null, 2)
  );

  // 5. Copy only production dependencies
  console.log('\n=== Copying production dependencies ===');
  const prodPaths = execSync('npm ls --production --parseable --all 2>/dev/null', { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
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

  // 6. Remove unnecessary files from staging
  run('find dist -name "*.map" -delete', { cwd: STAGING });
  run('find node_modules -type d \\( -name test -o -name tests -o -name __tests__ -o -name examples -o -name example \\) -exec rm -rf {} + 2>/dev/null || true', { cwd: STAGING });
  run('find node_modules -type f \\( -name "*.map" -o -name "CHANGELOG*" -o -name "HISTORY*" -o -name "CONTRIBUTING*" -o -name ".eslintrc*" -o -name ".prettierrc*" -o -name "tsconfig.json" \\) -delete 2>/dev/null || true', { cwd: STAGING });

  // 7. Copy .mcpbignore if present
  if (existsSync(join(ROOT, '.mcpbignore'))) {
    copyFileSync(join(ROOT, '.mcpbignore'), join(STAGING, '.mcpbignore'));
  }

  // 8. Pack the bundle
  console.log('\n=== Packing MCPB bundle ===');
  const bundleName = pkg.name.replace(/^@.*\//, '');
  const bundlePath = join(ROOT, `${bundleName}.mcpb`);
  run(`npx mcpb pack "${STAGING}" "${bundlePath}"`, { cwd: ROOT });

  // 9. Cleanup
  console.log('\n=== Cleanup ===');
  rmSync(STAGING, { recursive: true });

  console.log('\n=== Done! ===');
  if (existsSync(bundlePath)) {
    const stats = statSync(bundlePath);
    console.log(`Bundle: ${bundleName}.mcpb (${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
  }
} catch (error) {
  console.error('Pack failed:', error.message);
  if (existsSync(STAGING)) rmSync(STAGING, { recursive: true });
  process.exit(1);
}
