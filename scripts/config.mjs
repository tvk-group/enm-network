export const SITE_URL = 'https://enm.network';
export const CONTRACT = '0x00faB8baFfF3f849dd23FF68cfE51d8E3d09937D';
export const ETHERSCAN = `https://etherscan.io/token/${CONTRACT}`;

export const LANGUAGES = [
  { code: 'en', hreflang: 'en', dir: 'ltr', name: 'English', native: 'English' },
  { code: 'tr', hreflang: 'tr', dir: 'ltr', name: 'Turkish', native: 'Türkçe' },
  { code: 'de', hreflang: 'de', dir: 'ltr', name: 'German', native: 'Deutsch' },
  { code: 'fr', hreflang: 'fr', dir: 'ltr', name: 'French', native: 'Français' },
  { code: 'es', hreflang: 'es', dir: 'ltr', name: 'Spanish', native: 'Español' },
  { code: 'it', hreflang: 'it', dir: 'ltr', name: 'Italian', native: 'Italiano' },
  { code: 'pt', hreflang: 'pt', dir: 'ltr', name: 'Portuguese', native: 'Português' },
  { code: 'nl', hreflang: 'nl', dir: 'ltr', name: 'Dutch', native: 'Nederlands' },
  { code: 'ar', hreflang: 'ar', dir: 'rtl', name: 'Arabic', native: 'العربية' },
  { code: 'ru', hreflang: 'ru', dir: 'ltr', name: 'Russian', native: 'Русский' },
  { code: 'zh-cn', hreflang: 'zh-CN', dir: 'ltr', name: 'Chinese Simplified', native: '简体中文' },
  { code: 'zh-tw', hreflang: 'zh-TW', dir: 'ltr', name: 'Chinese Traditional', native: '繁體中文' },
  { code: 'ja', hreflang: 'ja', dir: 'ltr', name: 'Japanese', native: '日本語' },
  { code: 'ko', hreflang: 'ko', dir: 'ltr', name: 'Korean', native: '한국어' },
  { code: 'hi', hreflang: 'hi', dir: 'ltr', name: 'Hindi', native: 'हिन्दी' },
  { code: 'ur', hreflang: 'ur', dir: 'rtl', name: 'Urdu', native: 'اردو' },
  { code: 'pl', hreflang: 'pl', dir: 'ltr', name: 'Polish', native: 'Polski' },
  { code: 'ro', hreflang: 'ro', dir: 'ltr', name: 'Romanian', native: 'Română' },
  { code: 'el', hreflang: 'el', dir: 'ltr', name: 'Greek', native: 'Ελληνικά' },
  { code: 'sv', hreflang: 'sv', dir: 'ltr', name: 'Swedish', native: 'Svenska' },
  { code: 'no', hreflang: 'no', dir: 'ltr', name: 'Norwegian', native: 'Norsk' },
  { code: 'da', hreflang: 'da', dir: 'ltr', name: 'Danish', native: 'Dansk' },
  { code: 'fi', hreflang: 'fi', dir: 'ltr', name: 'Finnish', native: 'Suomi' },
  { code: 'he', hreflang: 'he', dir: 'rtl', name: 'Hebrew', native: 'עברית' },
  { code: 'id', hreflang: 'id', dir: 'ltr', name: 'Indonesian', native: 'Bahasa Indonesia' },
];

export const PAGES = [
  { id: 'home', slug: '', file: 'index.html' },
  { id: 'token', slug: 'token', file: 'token.html' },
  { id: 'tokenomics', slug: 'tokenomics', file: 'tokenomics.html' },
  { id: 'presale', slug: 'presale', file: 'presale.html' },
  { id: 'dashboard', slug: 'dashboard', file: 'dashboard.html' },
  { id: 'wallets', slug: 'wallets', file: 'wallets.html' },
  { id: 'contract', slug: 'contract', file: 'contract.html' },
  { id: 'roadmap', slug: 'roadmap', file: 'roadmap.html' },
  { id: 'risk', slug: 'risk', file: 'risk.html' },
  { id: 'faq', slug: 'faq', file: 'faq.html' },
  { id: 'contact', slug: 'contact', file: 'contact.html' },
];

export function pageUrl(lang, slug) {
  return slug ? `${SITE_URL}/${lang}/${slug}` : `${SITE_URL}/${lang}/`;
}

export function pagePath(lang, slug) {
  return slug ? `/${lang}/${slug}` : `/${lang}/`;
}
