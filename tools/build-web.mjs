import { cpSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const source = join(root, 'apps/learner-web');
const target = join(root, 'dist');
const content = join(root, 'content/language-pairs/fa-en');

// Generated dist/ is an artifact. Lessons remain authored under content/.
rmSync(target, { recursive: true, force: true });
mkdirSync(join(target, 'data'), { recursive: true });
cpSync(source, target, { recursive: true });
copyFileSync(join(content, 'preview-manifest.json'), join(target, 'data/manifest.json'));
cpSync(join(content, 'lessons'), join(target, 'data/lessons'), { recursive: true });
console.log('Built dist/ — fa-en preview with independent content JSON');
