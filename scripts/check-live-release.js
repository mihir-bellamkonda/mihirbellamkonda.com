import { setTimeout } from 'node:timers/promises';

const expected = process.env.GITHUB_SHA;
if (!/^[a-f0-9]{40}$/.test(expected || '')) throw new Error('GITHUB_SHA must identify the expected release');
const url = new URL('/release.json', process.env.SITE_URL || 'https://mihirbellamkonda.com');
url.searchParams.set('expected', expected);
let last;
for (let attempt = 0; attempt < 18; attempt++) {
  try {
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Release marker returned ${response.status}`);
    const release = await response.json();
    if (release.commit !== expected) throw new Error('The live site still serves a different release');
    if (!/^\/assets\/index-[\w-]+\.js$/.test(release.script || '')) throw new Error('The release entry script is missing');
    const home = await fetch(new URL('/', url), { cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!home.ok || !(await home.text()).includes(`src="${release.script}"`)) {
      throw new Error('The live homepage has not caught up with its release marker');
    }
    console.log('The expected release is live.');
    process.exit(0);
  } catch (error) {
    last = error;
    console.log(`Waiting for the published release (${attempt + 1}/18): ${error.message}`);
    if (attempt < 17) await setTimeout(10000);
  }
}
throw last;
