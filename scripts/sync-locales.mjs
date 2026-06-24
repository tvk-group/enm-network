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

function forceFromEn(target, source, keyPath) {
  const keys = keyPath.split('.');
  let s = source;
  let t = target;
  for (let i = 0; i < keys.length - 1; i++) {
    if (s[keys[i]] === undefined) return;
    if (!t[keys[i]] || typeof t[keys[i]] !== 'object') t[keys[i]] = {};
    s = s[keys[i]];
    t = t[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (s[last] !== undefined) t[last] = JSON.parse(JSON.stringify(s[last]));
}

const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'));

const FORCE_SYNC_PATHS = [
  'common.brandHome',
  'common.branding',
  'common.footer.brand',
  'common.footer.desc',
  'common.footer.descShort',
  'common.footer.ecosystemHeading',
  'common.footer.youAreHere',
  'pages.home.layersTitle',
  'pages.home.layersDesc',
  'pages.home.domains',
  'pages.token.aboutP2',
  'pages.contact.card2Desc',
  'pages.contact.card3Title',
  'pages.contact.card3Desc',
  'pages.faq.items',
];

for (const file of fs.readdirSync(LOCALES).filter((f) => f.endsWith('.json') && f !== 'en.json')) {
  const fp = path.join(LOCALES, file);
  const locale = JSON.parse(fs.readFileSync(fp, 'utf8'));
  deepMerge(locale, JSON.parse(JSON.stringify(en)));
  forceFromEn(locale, en, 'common.branding');
  locale.common.brandHome = en.common.brandHome;
  if (locale.common.footer) locale.common.footer.brand = en.common.footer.brand;
  if (locale.common.stats) locale.common.stats.ticker = en.common.stats.ticker;
  for (const keyPath of FORCE_SYNC_PATHS) forceFromEn(locale, en, keyPath);
  fs.writeFileSync(fp, JSON.stringify(locale, null, 2) + '\n');
  console.log('Synced', file);
}

console.log('Locale sync complete.');
