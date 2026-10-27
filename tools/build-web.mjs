import { auditCurriculum } from './curriculum-contract.mjs';
import { cpSync, mkdirSync, copyFileSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const source = join(root, 'apps/learner-web');
const target = join(root, 'dist');
const content = join(root, 'content/language-pairs/fa-en');

// Never produce or publish a site built with an unauthorized lesson sequence.
const curriculumAudit = auditCurriculum(root);
if (curriculumAudit.errors.length) {
  throw new Error('Curriculum lock violation:\n' + curriculumAudit.errors.join('\n'));
}

// Generated dist/ is an artifact. Lessons remain authored under content/.
rmSync(target, { recursive: true, force: true });
mkdirSync(join(target, 'data'), { recursive: true });
cpSync(source, target, { recursive: true });
copyFileSync(join(content, 'preview-manifest.json'), join(target, 'data/manifest.json'));
copyFileSync(join(content, 'curriculum.a1.json'), join(target, 'data/curriculum.a1.json'));
cpSync(join(content, 'lessons'), join(target, 'data/lessons'), { recursive: true });

// Use a new URL for each build's JS/CSS so an older installed service worker
// cannot accidentally serve obsolete UI assets immediately after deployment.
const revision = process.env.GITHUB_SHA?.slice(0, 12) || `local-${Date.now()}`;
const rewrite = (file, replacements) => {
  const path = join(target, file);
  let body = readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    if (!body.includes(from)) throw new Error(`Missing build marker ${from} in ${file}`);
    body = body.replace(from, to);
  }
  writeFileSync(path, body);
};
rewrite('index.html', [
  ['./ui-v2.css', `./ui-v2.css?v=${revision}`],
  ['src="./app.js"', `src="./app.js?v=${revision}"`]
]);
rewrite('app.js', [
  ["from './lesson-modules.js'", `from './lesson-modules.js?v=${revision}'`],
  ["from './word-review.js'", `from './word-review.js?v=${revision}'`],
  ["from './practice-engine.js'", `from './practice-engine.js?v=${revision}'`],
  ["from './sentence-puzzle.js'", `from './sentence-puzzle.js?v=${revision}'`],
  ["from './progress-migration.js'", `from './progress-migration.js?v=${revision}'`],
  ["from './learning-contracts.js'", `from './learning-contracts.js?v=${revision}'`],
]);
rewrite('lesson-modules.js', [
  ["from './word-review.js'", `from './word-review.js?v=${revision}'`],
  ["from './practice-engine.js'", `from './practice-engine.js?v=${revision}'`],
  ["from './sentence-composer.js'", `from './sentence-composer.js?v=${revision}'`],
  ["from './lesson-flow.js'", `from './lesson-flow.js?v=${revision}'`],
  ["from './sentence-puzzle.js'", `from './sentence-puzzle.js?v=${revision}'`],
  ["from './visual-learning.js'", `from './visual-learning.js?v=${revision}'`]
]);
// The source service-worker cache name is an implementation detail; give each
// deployed build its own cache without hardcoding the old source version.
const swPath = join(target, 'sw.js');
const swSource = readFileSync(swPath, 'utf8');
if (!/^const CACHE = '[^']+';/m.test(swSource)) throw new Error('Missing service-worker cache declaration');
writeFileSync(swPath, swSource.replace(/^const CACHE = '[^']+';/m, `const CACHE = 'tutivar-${revision}';`));
rewrite('sw.js', [
  ["'./ui-v2.css'", `'./ui-v2.css?v=${revision}'`],
  ["'./app.js'", `'./app.js?v=${revision}'`],
  ["'./lesson-modules.js'", `'./lesson-modules.js?v=${revision}'`],
  ["'./word-review.js'", `'./word-review.js?v=${revision}'`],
  ["'./practice-engine.js'", `'./practice-engine.js?v=${revision}'`],
  ["'./sentence-composer.js'", `'./sentence-composer.js?v=${revision}'`],
  ["'./lesson-flow.js'", `'./lesson-flow.js?v=${revision}'`],
  ["'./sentence-puzzle.js'", `'./sentence-puzzle.js?v=${revision}'`],
  ["'./visual-learning.js'", `'./visual-learning.js?v=${revision}'`],
  ["'./progress-migration.js'", `'./progress-migration.js?v=${revision}'`],
  ["'./learning-contracts.js'", `'./learning-contracts.js?v=${revision}'`]
]);
rewrite('lesson-flow.js', [
  ["from './sentence-puzzle.js'", `from './sentence-puzzle.js?v=${revision}'`],
  ["from './visual-learning.js'", `from './visual-learning.js?v=${revision}'`]
]);
console.log(`Built dist/ — fa-en independent content; revision ${revision}`);
