import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TOKEN_NAME, TOKEN_SYMBOL, TOKEN_ONCHAIN_NAME } from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES = path.join(__dirname, '..', 'locales');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES, 'en.json'), 'utf8'));

const REPLACEMENTS = [
  [/ENM Token/g, TOKEN_NAME],
  [/ENM \(EnergieMind\)/g, `${TOKEN_NAME} (${TOKEN_SYMBOL})`],
  [/EnergieMind ENM/g, `${TOKEN_NAME} (${TOKEN_SYMBOL})`],
  [/Official ENM /g, `Official ${TOKEN_NAME} (${TOKEN_SYMBOL}) `],
  [/the ENM token/gi, `${TOKEN_NAME} (${TOKEN_SYMBOL})`],
  [/ENM token/gi, `${TOKEN_NAME} (${TOKEN_SYMBOL})`],
  [/What is ENM\?/g, `What is ${TOKEN_NAME}?`],
  [/About ENM/g, `About ${TOKEN_NAME}`],
  [/Is ENM an investment/g, `Is ${TOKEN_NAME} an investment`],
  [/Contact ENM/g, `Contact ${TOKEN_NAME}`],
  [/ENM team/g, 'EnergieMIND team'],
  [/ENM Treasury/g, `${TOKEN_NAME} Treasury`],
  [/ENM Ethereum/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) Ethereum`],
  [/ENM contract/gi, `${TOKEN_NAME} (${TOKEN_SYMBOL}) contract`],
  [/ENM presale/gi, `${TOKEN_NAME} (${TOKEN_SYMBOL}) presale`],
  [/ENM Roadmap/g, `${TOKEN_NAME} Roadmap`],
  [/ENM Risk/g, `${TOKEN_NAME} Risk`],
  [/ENM FAQ/g, `${TOKEN_NAME} FAQ`],
  [/ENM Official/g, `${TOKEN_NAME} Official`],
  [/ENM Investor/g, `${TOKEN_NAME} Investor`],
  [/ENM Launch/g, `${TOKEN_NAME} Launch`],
  [/ENM is not/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) is not`],
  [/ENM is a/g, `${TOKEN_SYMBOL} is a`],
  [/ENM is prepared/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) is prepared`],
  [/ENM is presented/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) is presented`],
  [/ENM is positioned/g, `${TOKEN_SYMBOL} is positioned`],
  [/ENM is deployed/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) is deployed`],
  [/ENM is offered/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) is offered`],
  [/ENM does not/g, `${TOKEN_NAME} (${TOKEN_SYMBOL}) does not`],
  [/interacting with ENM/g, `interacting with ${TOKEN_NAME} (${TOKEN_SYMBOL})`],
  [/adding ENM to/g, `adding ${TOKEN_NAME} (${TOKEN_SYMBOL}) to`],
  [/token name is \\"EnergieMind\\" and symbol is \\"ENM\\"/g,
    `on-chain token name is \\"${TOKEN_ONCHAIN_NAME}\\" and the ticker symbol is \\"${TOKEN_SYMBOL}\\" (${TOKEN_NAME})`],
];

function walkStrings(obj, fn) {
  if (typeof obj === 'string') return fn(obj);
  if (Array.isArray(obj)) return obj.map((v) => walkStrings(v, fn));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = walkStrings(v, fn);
    return out;
  }
  return obj;
}

function applyReplacements(str) {
  let s = str;
  for (const [re, rep] of REPLACEMENTS) s = s.replace(re, rep);
  return s;
}

for (const file of fs.readdirSync(LOCALES).filter((f) => f.endsWith('.json'))) {
  const fp = path.join(LOCALES, file);
  let locale = JSON.parse(fs.readFileSync(fp, 'utf8'));
  locale.common = locale.common || {};
  locale.common.branding = JSON.parse(JSON.stringify(en.common.branding));
  locale.common.brandHome = en.common.brandHome;
  locale.common.footer = locale.common.footer || {};
  locale.common.footer.brand = en.common.footer.brand;
  locale.common.stats = locale.common.stats || {};
  locale.common.stats.ticker = en.common.stats.ticker;
  locale = walkStrings(locale, applyReplacements);
  fs.writeFileSync(fp, JSON.stringify(locale, null, 2) + '\n');
  console.log('Branding updated:', file);
}

console.log('Branding propagation complete.');
