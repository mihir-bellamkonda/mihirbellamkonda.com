import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const poems = JSON.parse(fs.readFileSync(path.join(root, 'src/poems.json'), 'utf8'));
const urls = [...new Set(poems.map(poem => poem.external_url).filter(Boolean))];
const failures = [];

async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'mihirbellamkonda.com link check' }
    });
    // Authentication, bot protection, rate limits, and HEAD restrictions all
    // establish that a host exists. A genuine missing page does not.
    const restricted = [401, 403, 405, 429].includes(response.status);
    if (!response.ok && !restricted) failures.push(`${response.status} ${url}`);
    else console.log(`${response.status} ${url}`);
  } catch (error) {
    failures.push(`${error.name}: ${url}`);
  } finally {
    clearTimeout(timer);
  }
}

for (const url of urls) await checkUrl(url);

if (failures.length) {
  console.error('Venue link check failed:');
  failures.forEach(message => console.error(`- ${message}`));
  process.exit(1);
}

console.log(`Checked ${urls.length} venue links.`);
