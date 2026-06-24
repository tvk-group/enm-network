import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE_URL, CONTRACT, ETHERSCAN, LANGUAGES, PAGES, pageUrl, pagePath } from './config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const LOCALES_DIR = path.join(ROOT, 'locales');

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const link = (lang, slug, text, cls = '') => {
  const href = pagePath(lang, slug);
  const c = cls ? ` class="${cls}"` : '';
  return `<a href="${href}"${c}>${esc(text)}</a>`;
};

function loadLocale(code) {
  const file = path.join(LOCALES_DIR, `${code}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function hreflangTags(pageId) {
  const page = PAGES.find((p) => p.id === pageId);
  return LANGUAGES.map((l) => {
    const url = pageUrl(l.code, page.slug);
    return `  <link rel="alternate" hreflang="${l.hreflang}" href="${url}" />`;
  }).join('\n') + `\n  <link rel="alternate" hreflang="x-default" href="${pageUrl('en', page.slug)}" />`;
}

function headMeta({ lang, langInfo, pageId, t, page }) {
  const slug = PAGES.find((p) => p.id === pageId).slug;
  const url = pageUrl(lang, slug);
  const htmlLang = langInfo.hreflang.toLowerCase();
  const dir = langInfo.dir;

  return `<!DOCTYPE html>
<html lang="${htmlLang}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
  <link rel="canonical" href="${url}" />
${hreflangTags(pageId)}
  <meta property="og:locale" content="${htmlLang.replace('-', '_')}" />
  <meta property="og:title" content="${esc(page.ogTitle || page.title)}" />
  <meta property="og:description" content="${esc(page.ogDescription || page.description)}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="ENM Token | enm.network" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(page.ogTitle || page.title)}" />
  <meta name="twitter:description" content="${esc(page.ogDescription || page.description)}" />
  <meta name="theme-color" content="#0a1628" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/assets/css/main.css" />`;
}

function jsonLdOrganization() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ENM Token',
    url: SITE_URL,
    logo: `${SITE_URL}/assets/images/logo.png`,
    sameAs: [ETHERSCAN],
    description: 'Official ENM utility token documentation for the EnergieMIND energy intelligence ecosystem.',
  });
}

function jsonLdWebSite(lang) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'enm.network',
    url: pageUrl(lang, ''),
    inLanguage: LANGUAGES.find((l) => l.code === lang).hreflang,
    publisher: { '@type': 'Organization', name: 'ENM Token', url: SITE_URL },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/${lang}/faq?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  });
}

function jsonLdBreadcrumb(lang, pageId, t) {
  const page = PAGES.find((p) => p.id === pageId);
  const items = [
    { '@type': 'ListItem', position: 1, name: t.common.nav.home, item: pageUrl(lang, '') },
  ];
  if (pageId !== 'home') {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: t.pages[pageId].breadcrumb,
      item: pageUrl(lang, page.slug),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items });
}

function jsonLdFAQ(t) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.pages.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  });
}

function jsonLdArticle(lang, pageId, t) {
  const page = PAGES.find((p) => p.id === pageId);
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: t.pages[pageId].h1,
    description: t.pages[pageId].description,
    url: pageUrl(lang, page.slug),
    inLanguage: LANGUAGES.find((l) => l.code === lang).hreflang,
    publisher: { '@type': 'Organization', name: 'ENM Token', url: SITE_URL },
    mainEntityOfPage: pageUrl(lang, page.slug),
  });
}

function renderLangSwitcher(lang, pageId, t, suffix = 'nav') {
  const page = PAGES.find((p) => p.id === pageId);
  const id = `lang-select-${suffix}`;
  const options = LANGUAGES.map((l) => {
    const href = pageUrl(l.code, page.slug);
    const sel = l.code === lang ? ' selected' : '';
    return `<option value="${href}"${sel}>${esc(l.native)}</option>`;
  }).join('');
  return `<div class="lang-switcher">
    <label class="sr-only" for="${id}">${esc(t.common.selectLanguage)}</label>
    <select id="${id}" class="lang-select" aria-label="${esc(t.common.selectLanguage)}">${options}</select>
  </div>`;
}

function renderNav(lang, t, activePage) {
  const c = t.common;
  const navItems = [
    ['home', c.nav.home, ''],
    ['token', c.nav.token, 'token'],
    ['tokenomics', c.nav.tokenomics, 'tokenomics'],
    ['presale', c.nav.presale, 'presale'],
    ['contract', c.nav.contract, 'contract'],
    ['roadmap', c.nav.roadmap, 'roadmap'],
    ['risk', c.nav.risk, 'risk'],
    ['faq', c.nav.faq, 'faq'],
    ['contact', c.nav.contact, 'contact'],
  ];
  const links = navItems.map(([id, label, slug]) => {
    const cls = id === activePage ? ' class="active"' : '';
    return `<a href="${pagePath(lang, slug)}"${cls}>${esc(label)}</a>`;
  }).join('\n        ');
  return links;
}

function renderFooter(lang, t) {
  const c = t.common;
  return `<footer class="footer">
    <div class="wrap">
      <div class="footer-grid">
        <div>
          <div class="brand"><span class="mark"></span><span>${esc(c.footer.brand)}</span></div>
          <p class="small" style="margin-top: 10px;">${esc(c.footer.desc)}</p>
        </div>
        <div>
          <h4>${esc(c.footer.tokenHeading)}</h4>
          <div class="footer-links">
            ${link(lang, 'token', c.nav.token)}
            ${link(lang, 'tokenomics', c.nav.tokenomics)}
            ${link(lang, 'presale', c.nav.presale)}
            ${link(lang, 'contract', c.nav.contract)}
          </div>
        </div>
        <div>
          <h4>${esc(c.footer.infoHeading)}</h4>
          <div class="footer-links">
            ${link(lang, 'roadmap', c.nav.roadmap)}
            ${link(lang, 'risk', c.nav.risk)}
            ${link(lang, 'faq', c.nav.faq)}
            ${link(lang, 'contact', c.nav.contact)}
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span class="small">${esc(c.footer.contractLabel)} <code>${CONTRACT}</code></span>
        <a class="small" href="${ETHERSCAN}" target="_blank" rel="noopener">${esc(c.buttons.etherscan)}</a>
      </div>
    </div>
  </footer>`;
}

function riskBanner(t, text, withLink = true) {
  const riskLink = withLink
    ? ` <a href="${pagePath('{lang}', 'risk').replace('{lang}', 'LANG')}" style="color: #92400e; font-weight: 700;">${esc(t.common.risk.readFull)}</a>`
    : '';
  return `<div class="risk-banner"><strong>${esc(t.common.risk.label)}</strong> ${esc(text)}${withLink ? riskLink.replace('LANG', '%%LANG%%') : ''}</div>`;
}

function riskBannerLang(t, text, lang, withLink = true) {
  const linkHtml = withLink
    ? ` <a href="${pagePath(lang, 'risk')}" style="color: #92400e; font-weight: 700;">${esc(t.common.risk.readFull)}</a>`
    : '';
  return `<div class="risk-banner"><strong>${esc(t.common.risk.label)}</strong> ${esc(text)}${linkHtml}</div>`;
}

function renderHome(lang, t) {
  const p = t.pages.home;
  const c = t.common;
  return `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
          <h1><span class="gradient-text">${esc(p.h1)}</span></h1>
          <p class="lead">${esc(p.lead)}</p>
          <p class="support-line">${esc(p.supportLine)}</p>
          <div class="hero-actions">
            <a class="btn primary" href="${pagePath(lang, 'contract')}">${esc(c.buttons.viewContract)}</a>
            <a class="btn outline-navy" href="${pagePath(lang, 'risk')}">${esc(c.buttons.readRisk)}</a>
            <a class="btn green" href="${pagePath(lang, 'presale')}">${esc(c.buttons.joinPresale)}</a>
          </div>
          <div class="contract-pill"><strong>${esc(c.contract.label)}</strong> <code>${CONTRACT}</code></div>
        </div>
        <div class="stats-panel">
          <h3>${esc(c.stats.overview)}</h3>
          <div class="stats-grid">
            <div class="stat-item"><strong>ENM</strong><span>${esc(c.stats.symbol)}</span></div>
            <div class="stat-item"><strong>ERC-20</strong><span>${esc(c.stats.standard)}</span></div>
            <div class="stat-item"><strong>50B</strong><span>${esc(c.stats.maxSupply)}</span></div>
            <div class="stat-item"><strong>18</strong><span>${esc(c.stats.decimals)}</span></div>
          </div>
        </div>
      </div>
    </section>
    <section>
      <div class="wrap">
        <div class="section-head">
          <h2>${esc(p.layersTitle)}</h2>
          <p>${esc(p.layersDesc)}</p>
        </div>
        <div class="layer-grid">
          <article class="layer-card project">
            <div class="domain">${esc(p.projectDomain)}</div>
            <h3>${esc(p.projectTitle)}</h3>
            <p>${esc(p.projectDesc)}</p>
          </article>
          <article class="layer-card token">
            <div class="domain">${esc(p.tokenDomain)}</div>
            <h3>${esc(p.tokenTitle)}</h3>
            <p>${esc(p.tokenDesc)}</p>
          </article>
        </div>
      </div>
    </section>
    <section style="background: var(--bg-subtle);">
      <div class="wrap">
        <div class="section-head">
          <h2>${esc(p.utilityTitle)}</h2>
          <p>${esc(p.utilityDesc)}</p>
        </div>
        <div class="cards">
          <article class="card"><div class="icon">⚡</div><h3>${esc(p.card1Title)}</h3><p>${esc(p.card1Desc)}</p></article>
          <article class="card"><div class="icon">♨️</div><h3>${esc(p.card2Title)}</h3><p>${esc(p.card2Desc)}</p></article>
          <article class="card"><div class="icon">🔗</div><h3>${esc(p.card3Title)}</h3><p>${esc(p.card3Desc)}</p></article>
        </div>
      </div>
    </section>
    <section><div class="wrap">${riskBannerLang(t, p.riskShort, lang)}</div></section>`;
}

function renderToken(lang, t) {
  const p = t.pages.token;
  const c = t.common;
  const f = p.fields;
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}</div>
      <div class="token-panel">
        <div class="token-box">
          <h3>${esc(p.aboutTitle)}</h3>
          <p>${esc(p.aboutP1)}</p>
          <p style="margin-top: 14px;">${esc(p.aboutP2)}</p>
          <div style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px;">
            <a class="btn primary" href="${ETHERSCAN}" target="_blank" rel="noopener">${esc(c.buttons.openEtherscan)}</a>
            <a class="btn" href="${pagePath(lang, 'contract')}" style="background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: white;">${esc(c.buttons.contractDetails)}</a>
          </div>
        </div>
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead><tr><th>${esc(c.table.property)}</th><th>${esc(c.table.value)}</th></tr></thead>
            <tbody>
              <tr><td>${esc(f.name)}</td><td><strong>EnergieMind</strong></td></tr>
              <tr><td>${esc(f.symbol)}</td><td><strong>ENM</strong></td></tr>
              <tr><td>${esc(f.network)}</td><td><strong>${esc(c.values.ethereumMainnet)}</strong></td></tr>
              <tr><td>${esc(f.standard)}</td><td><strong>ERC-20</strong></td></tr>
              <tr><td>${esc(f.decimals)}</td><td><strong>18</strong></td></tr>
              <tr><td>${esc(f.maxSupply)}</td><td><strong>${esc(c.values.maxSupplyValue)}</strong></td></tr>
              <tr><td>${esc(f.status)}</td><td><span class="badge locked">${esc(c.badges.locked)}</span></td></tr>
              <tr><td>${esc(f.contract)}</td><td><code style="font-size: 12px;">${CONTRACT}</code></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div></section>
    <section style="background: var(--bg-subtle);"><div class="wrap">
      <div class="section-head"><h2>${esc(p.scopeTitle)}</h2><p>${esc(p.scopeDesc)}</p></div>
      <div class="cards">
        <article class="card"><div class="icon">⚡</div><h3>${esc(p.card1Title)}</h3><p>${esc(p.card1Desc)}</p></article>
        <article class="card"><div class="icon">♨️</div><h3>${esc(p.card2Title)}</h3><p>${esc(p.card2Desc)}</p></article>
        <article class="card"><div class="icon">🏗️</div><h3>${esc(p.card3Title)}</h3><p>${esc(p.card3Desc)}</p></article>
      </div>
    </div></section>
    <section><div class="wrap">
      <div class="risk-banner"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskFooter)}
        <a href="${pagePath(lang, 'risk')}" style="color: #92400e; font-weight: 700;">${esc(c.risk.fullNotice)}</a>
      </div>
    </div></section>`;
}

function renderTokenomics(lang, t) {
  const p = t.pages.tokenomics;
  const c = t.common;
  const rows = p.allocations.map((a) => `
              <tr>
                <td><strong>${esc(a.name)}</strong></td>
                <td>${esc(a.desc)}</td>
                <td><span class="badge pending">${esc(c.badges.pending)}</span></td>
              </tr>`).join('');
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}</div>
      <div class="table-panel" style="margin-bottom: 32px;">
        <table class="data-table">
          <thead><tr><th>${esc(c.table.parameter)}</th><th>${esc(c.table.value)}</th><th>${esc(c.table.status)}</th></tr></thead>
          <tbody>
            <tr><td><strong>${esc(p.totalSupply)}</strong></td><td>${esc(c.values.maxSupplyValue)}</td>
              <td><span class="badge" style="background: rgba(23,178,106,0.12); color: var(--green-dark); border: 1px solid rgba(23,178,106,0.25);">${esc(c.badges.confirmed)}</span></td></tr>
          </tbody>
        </table>
      </div>
      <div class="section-head"><h2>${esc(p.categoriesTitle)}</h2><p>${esc(p.categoriesDesc)}</p></div>
      <div class="table-panel">
        <table class="data-table">
          <thead><tr><th>${esc(c.table.category)}</th><th>${esc(c.table.description)}</th><th>${esc(c.table.allocation)}</th></tr></thead>
          <tbody>${rows}
          </tbody>
        </table>
      </div>
      <div class="prose" style="margin-top: 32px;"><p>${esc(p.footerNote)}</p></div>
    </div></section>
    <section><div class="wrap">${riskBannerLang(t, p.riskFooter, lang)}</div></section>`;
}

function renderPresale(lang, t) {
  const p = t.pages.presale;
  const c = t.common;
  const f = p.fields;
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(p.important)}</strong> ${esc(p.riskShort)}</div>
      <div class="table-panel">
        <table class="data-table">
          <thead><tr><th>${esc(c.table.parameter)}</th><th>${esc(c.table.status)}</th></tr></thead>
          <tbody>
            <tr><td><strong>${esc(f.presaleStatus)}</strong></td><td><span class="badge preparation">${esc(c.badges.preparation)}</span></td></tr>
            <tr><td><strong>${esc(f.acceptedAssets)}</strong></td><td>${esc(c.values.tba)}</td></tr>
            <tr><td><strong>${esc(f.vesting)}</strong></td><td>${esc(c.values.tba)}</td></tr>
            <tr><td><strong>${esc(f.kyc)}</strong></td><td>${esc(c.values.tbaKyc)}</td></tr>
            <tr><td><strong>${esc(f.saleTerms)}</strong></td><td>${esc(c.values.tba)}</td></tr>
            <tr><td><strong>${esc(f.price)}</strong></td><td>${esc(c.values.notPublished)}</td></tr>
            <tr><td><strong>${esc(f.saleDates)}</strong></td><td>${esc(c.values.notPublished)}</td></tr>
            <tr><td><strong>${esc(f.allocationAmount)}</strong></td><td>${esc(c.values.notPublished)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="prose" style="margin-top: 32px;">
        <h2>${esc(p.expectTitle)}</h2>
        <p>${esc(p.expectP1)}</p>
        <p>${esc(p.expectP2)} <a href="${pagePath(lang, 'contact')}" style="color: var(--energy-blue-dark); font-weight: 600;">${esc(p.contactLink)}</a>.</p>
      </div>
    </div></section>
    <section><div class="wrap">${riskBannerLang(t, p.riskFooter, lang)}</div></section>`;
}

function renderContract(lang, t) {
  const p = t.pages.contract;
  const c = t.common;
  const f = p.fields;
  const checklist = p.checklist.map((item) => `<li>${esc(item)}</li>`).join('');
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(p.verifyBanner)}</strong> ${esc(p.verifyText)}</div>
      <div class="token-panel">
        <div class="token-box">
          <h3>${esc(p.officialTitle)}</h3>
          <p>${esc(p.officialDesc)}</p>
          <div class="token-list" style="margin: 20px 0;">
            <div class="token-row"><span>${esc(f.address)}</span><strong style="font-size: 12px;">${CONTRACT}</strong></div>
            <div class="token-row"><span>${esc(f.network)}</span><strong>${esc(c.values.ethereumMainnet)}</strong></div>
            <div class="token-row"><span>${esc(f.chainId)}</span><strong>${esc(c.values.chainId)}</strong></div>
          </div>
          <a class="btn primary" href="${ETHERSCAN}" target="_blank" rel="noopener">${esc(c.buttons.openEtherscan)}</a>
        </div>
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead><tr><th>${esc(c.table.parameter)}</th><th>${esc(c.table.value)}</th></tr></thead>
            <tbody>
              <tr><td>${esc(f.tokenName)}</td><td><strong>EnergieMind</strong></td></tr>
              <tr><td>${esc(f.symbol)}</td><td><strong>ENM</strong></td></tr>
              <tr><td>${esc(f.standard)}</td><td><strong>ERC-20</strong></td></tr>
              <tr><td>${esc(f.decimals)}</td><td><strong>18</strong></td></tr>
              <tr><td>${esc(f.maxSupply)}</td><td><strong>${esc(c.values.maxSupplyValue)}</strong></td></tr>
              <tr><td>${esc(f.transferStatus)}</td><td><span class="badge locked">${esc(c.badges.locked)}</span></td></tr>
              <tr><td>${esc(f.sourceCode)}</td><td><strong>${esc(c.values.verified)}</strong></td></tr>
              <tr><td>${esc(f.license)}</td><td><strong>${esc(c.values.mit)}</strong></td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="margin-top: 32px;">
        <div class="contract-pill" style="font-size: 15px; padding: 20px;">
          <div><strong style="display: block; margin-bottom: 8px; color: var(--navy);">${esc(p.copyLabel)}</strong>
          <code style="font-size: 15px;">${CONTRACT}</code></div>
        </div>
      </div>
      <div class="prose" style="margin-top: 32px;">
        <h2>${esc(p.checklistTitle)}</h2>
        <p>${esc(p.checklistIntro)}</p>
        <ul style="color: var(--muted); line-height: 1.8; font-size: 15px;">${checklist}</ul>
      </div>
    </div></section>
    <section><div class="wrap">${riskBannerLang(t, p.riskFooter, lang)}</div></section>`;
}

function renderRoadmap(lang, t) {
  const p = t.pages.roadmap;
  const c = t.common;
  const steps = p.steps.map((s) => `
          <article class="step"><h3>${esc(s.title)}</h3><p>${esc(s.desc)}</p></article>`).join('');
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}</div>
      <div class="roadmap">${steps}</div>
      <div class="prose" style="margin-top: 32px;"><p>${esc(p.footerNote)}</p></div>
    </div></section>
    <section><div class="wrap">${riskBannerLang(t, p.riskFooter, lang)}</div></section>`;
}

function renderRisk(lang, t) {
  const p = t.pages.risk;
  const [first, ...rest] = p.sections;
  const firstContent = first.bold
    ? `<p><strong>${esc(first.content)}</strong></p>`
    : `<p>${esc(first.content)}</p>`;
  const restHtml = rest.map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.content)}</p>`).join('');
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap"><div class="risk-page">
      <h2>${esc(first.title)}</h2>
      ${firstContent}
      ${restHtml}
    </div></div></section>`;
}

function faqAnswer(lang, t, item, idx) {
  const link = (href, label, ext = false) =>
    `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''} style="color: var(--energy-blue-dark); font-weight: 600;">${esc(label)}</a>`;
  let a = esc(item.a);
  const extras = {
    2: ` ${link(ETHERSCAN, 'Etherscan', true)}`,
    4: ` ${link(pagePath(lang, 'risk'), t.pages.risk.h1)}`,
    5: ` ${link(pagePath(lang, 'presale'), t.pages.presale.h1)}`,
    6: ` ${link(pagePath(lang, 'tokenomics'), t.pages.tokenomics.h1)}`,
    9: ` ${link(pagePath(lang, 'contact'), t.pages.contact.h1)}`,
  };
  if (extras[idx]) a += extras[idx];
  return a;
}

function renderFAQ(lang, t) {
  const p = t.pages.faq;
  const c = t.common;
  const items = p.items.map((item, idx) =>
    `<details class="faq-item"><summary>${esc(item.q)}</summary><div class="faq-body">${faqAnswer(lang, t, item, idx)}</div></details>`
  ).join('');
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}
        <a href="${pagePath(lang, 'risk')}" style="color: #92400e; font-weight: 700;">${esc(c.risk.readFull)}</a>
      </div>
      <div class="faq-list">${items}</div>
    </div></section>
    <section><div class="wrap">
      <div class="risk-banner"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskFooter)}</div>
    </div></section>`;
}

function renderContact(lang, t) {
  const p = t.pages.contact;
  const c = t.common;
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(p.securityLabel)}</strong> ${esc(p.securityText)}</div>
      <div class="contact-grid">
        <article class="contact-card"><h3>${esc(p.card1Title)}</h3><p>${esc(p.card1Desc)}</p>
          <p style="margin-top: 12px;"><a href="mailto:token@enm.network">token@enm.network</a></p></article>
        <article class="contact-card"><h3>${esc(p.card2Title)}</h3><p>${esc(p.card2Desc)}</p>
          <p style="margin-top: 12px;"><a href="mailto:partners@enm.network">partners@enm.network</a></p></article>
        <article class="contact-card"><h3>${esc(p.card3Title)}</h3><p>${esc(p.card3Desc)}</p>
          <p style="margin-top: 12px;"><a href="https://energiemind.com" target="_blank" rel="noopener">energiemind.com ↗</a></p></article>
        <article class="contact-card"><h3>${esc(p.card4Title)}</h3><p>${esc(p.card4Desc)}</p>
          <p style="margin-top: 12px;">
            <a href="${pagePath(lang, 'contract')}">${esc(p.contractPage)}</a><br/>
            <a href="${ETHERSCAN}" target="_blank" rel="noopener">Etherscan ↗</a><br/>
            <a href="${pagePath(lang, 'faq')}">${esc(c.nav.faq)}</a>
          </p></article>
      </div>
      <div class="prose" style="margin-top: 32px;"><p>${esc(p.footerNote)}</p></div>
    </div></section>
    <section><div class="wrap">${riskBannerLang(t, p.riskFooter, lang)}</div></section>`;
}

const RENDERERS = {
  home: renderHome,
  token: renderToken,
  tokenomics: renderTokenomics,
  presale: renderPresale,
  contract: renderContract,
  roadmap: renderRoadmap,
  risk: renderRisk,
  faq: renderFAQ,
  contact: renderContact,
};

function buildPage(lang, langInfo, pageId, t) {
  const page = t.pages[pageId];
  const nav = renderNav(lang, t, pageId);
  const schemas = [
    `<script type="application/ld+json">${jsonLdOrganization()}</script>`,
    `<script type="application/ld+json">${jsonLdBreadcrumb(lang, pageId, t)}</script>`,
    `<script type="application/ld+json">${jsonLdArticle(lang, pageId, t)}</script>`,
  ];
  if (pageId === 'home') schemas.push(`<script type="application/ld+json">${jsonLdWebSite(lang)}</script>`);
  if (pageId === 'faq') schemas.push(`<script type="application/ld+json">${jsonLdFAQ(t)}</script>`);

  const contractBtn = pageId === 'contract'
    ? `<a class="btn primary" href="${ETHERSCAN}" target="_blank" rel="noopener">${esc(t.common.buttons.etherscan)}</a>`
    : `<a class="btn primary" href="${pagePath(lang, 'contract')}">${esc(t.common.buttons.viewContract)}</a>`;

  return `${headMeta({ lang, langInfo, pageId, t, page })}
${schemas.join('\n')}
</head>
<body>
  <nav class="nav">
    <div class="wrap nav-inner">
      <a class="brand" href="${pagePath(lang, '')}" aria-label="${esc(t.common.brandHome)}">
        <span class="mark"></span>
        <span>ENM<div class="brand-sub">enm.network</div></span>
      </a>
      <div class="nav-links">
        ${nav}
      </div>
      <div class="nav-actions">
        ${renderLangSwitcher(lang, pageId, t, 'nav')}
        ${contractBtn}
        <button class="menu-toggle" aria-label="${esc(t.common.openMenu)}">☰</button>
      </div>
    </div>
  </nav>
  <div class="mobile-nav" aria-hidden="true">
    <div class="mobile-nav-panel">
      <button class="mobile-nav-close" aria-label="${esc(t.common.closeMenu)}">×</button>
      ${renderLangSwitcher(lang, pageId, t, 'mobile')}
      <div class="nav-links">${nav}</div>
    </div>
  </div>
  <main>
    ${RENDERERS[pageId](lang, t)}
  </main>
  ${renderFooter(lang, t)}
  <script src="/assets/js/main.js"></script>
</body>
</html>`;
}

function generateSitemaps() {
  const sitemapDir = path.join(ROOT, 'sitemaps');
  fs.mkdirSync(sitemapDir, { recursive: true });
  const indexEntries = [];

  for (const lang of LANGUAGES) {
    const urls = PAGES.map((p) => {
      const loc = pageUrl(lang.code, p.slug);
      const priority = p.id === 'home' ? '1.0' : '0.8';
      const changefreq = p.id === 'presale' ? 'weekly' : 'monthly';
      return `  <url>
    <loc>${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${LANGUAGES.map((l) => `
    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${pageUrl(l.code, p.slug)}" />`).join('')}
  </url>`;
    }).join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
    const filename = `sitemap-${lang.code}.xml`;
    fs.writeFileSync(path.join(sitemapDir, filename), sitemap);
    indexEntries.push(`  <sitemap>
    <loc>${SITE_URL}/sitemaps/${filename}</loc>
  </sitemap>`);
  }

  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${indexEntries.join('\n')}
</sitemapindex>`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), index);
}

function generateRobots() {
  const robots = `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Yandex
Allow: /

User-agent: Baiduspider
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;
  fs.writeFileSync(path.join(ROOT, 'robots.txt'), robots);
}

function generateRootRedirect() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=/en/" />
  <link rel="canonical" href="${SITE_URL}/en/" />
  <script>location.replace('/en/');</script>
  <title>Redirecting…</title>
</head>
<body><p><a href="/en/">Continue to ENM Token</a></p></body>
</html>`;
  fs.writeFileSync(path.join(ROOT, 'index.html'), html);
}

function cleanOldPages() {
  const oldPages = ['token.html', 'tokenomics.html', 'presale.html', 'contract.html', 'roadmap.html', 'risk.html', 'faq.html', 'contact.html'];
  for (const f of oldPages) {
    const fp = path.join(ROOT, f);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
}

// Main build
console.log('Building multilingual site...');
cleanOldPages();

let count = 0;
for (const langInfo of LANGUAGES) {
  const t = loadLocale(langInfo.code);
  const outDir = path.join(ROOT, langInfo.code);
  fs.mkdirSync(outDir, { recursive: true });

  for (const page of PAGES) {
    const html = buildPage(langInfo.code, langInfo, page.id, t);
    const outFile = path.join(outDir, page.file);
    fs.writeFileSync(outFile, html);
    count++;
  }
}

generateSitemaps();
generateRobots();
generateRootRedirect();

console.log(`Built ${count} pages across ${LANGUAGES.length} languages.`);
