import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES = path.join(__dirname, '..', 'locales');

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      deepMerge(target[key], source[key]);
    } else if (target[key] === undefined) {
      target[key] = source[key];
    }
  }
  return target;
}

const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'));

for (const file of fs.readdirSync(LOCALES).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const fp = path.join(LOCALES, file);
  const locale = JSON.parse(fs.readFileSync(fp, 'utf8'));
  deepMerge(locale, JSON.parse(JSON.stringify(en)));
  fs.writeFileSync(fp, JSON.stringify(locale, null, 2) + '\n');
  console.log('Synced', file);
}

console.log('Locale sync complete.');
