import fs from 'node:fs';

const commit = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(commit || '')) throw new Error('GITHUB_SHA must identify the release commit');
const html = fs.readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const script = html.match(/src="(\/assets\/index-[^"]+\.js)"/)?.[1];
if (!script) throw new Error('The built entry script is missing');
fs.writeFileSync(new URL('../dist/release.json', import.meta.url), JSON.stringify({ commit, script }) + '\n');
