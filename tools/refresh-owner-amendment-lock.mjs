/** Only for the owner-approved A1 2026-10-26 amendment, after source row review. */
import {readFileSync,writeFileSync} from 'node:fs';
import {gitBlobSha,parseCanonicalSource} from './curriculum-contract.mjs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8');
const revision='2026-10-26-owner-a1-twelve-per-stage';
const lockPath='content/curriculum/roadmap.lock.json',manifestPath='content/curriculum/universal-path.v1.json';
const lock=JSON.parse(read(lockPath)),manifest=JSON.parse(read(manifestPath));
const source=read('docs/curriculum/01-universal-learning-path.md');
if(lock.approvedRevision!==revision||manifest.revision!==revision)throw Error('Wrong amendment revision');
if(JSON.stringify(parseCanonicalSource(source))!==JSON.stringify(manifest.lessons))throw Error('Markdown table and JSON roadmap disagree; do not sign the lock');
const sourceHash=gitBlobSha(source);
lock.sourceGitBlobSha=sourceHash;manifest.sourceGitBlobSha=sourceHash;
lock.manifestGitBlobSha=gitBlobSha(JSON.stringify(manifest,null,2)+'\n');
writeFileSync(new URL(manifestPath,root),JSON.stringify(manifest,null,2)+'\n');
writeFileSync(new URL(lockPath,root),JSON.stringify(lock,null,2)+'\n');
console.log('Reviewed roadmap and lock checksums updated.');
