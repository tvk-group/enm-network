import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SITE_URL, CONTRACT, ETHERSCAN, TOKEN_NAME, TOKEN_SYMBOL, TOKEN_ONCHAIN_NAME, SITE_BRAND, SITE_OG_NAME, LANGUAGES, PAGES, pageUrl, pagePath } from './config.mjs';
import {
  OFFICIAL_WALLETS,
  PRESALE_WALLET,
  PRESALE_PHASES,
  PUBLIC_STAGES,
  ACCEPTED_ASSETS,
  walletEtherscan,
  formatDateRange,
} from './presale-config.mjs';

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

const PORTAL_PAGES = new Set(['dashboard', 'apply']);

function headMeta({ lang, langInfo, pageId, t, page }) {
  const slug = PAGES.find((p) => p.id === pageId).slug;
  const url = pageUrl(lang, slug);
  const htmlLang = langInfo.hreflang.toLowerCase();
  const dir = langInfo.dir;
  const isPortal = PORTAL_PAGES.has(pageId);
  const fontLink = isPortal
    ? `  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Orbitron:wght@500;600;700;800&display=swap" rel="stylesheet">`
    : `  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Orbitron:wght@500;600;700;800&display=swap" rel="stylesheet">`;
  const extraCss = isPortal ? '\n  <link rel="stylesheet" href="/assets/css/portal.css" />' : '';

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
  <meta property="og:site_name" content="${esc(SITE_OG_NAME)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(page.ogTitle || page.title)}" />
  <meta name="twitter:description" content="${esc(page.ogDescription || page.description)}" />
  <meta name="theme-color" content="#ffb020" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLink}
  <link rel="stylesheet" href="/assets/css/main.css" />${extraCss}`;
}

function jsonLdOrganization() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_BRAND,
    alternateName: TOKEN_SYMBOL,
    url: SITE_URL,
    logo: `${SITE_URL}/assets/images/logo.png`,
    sameAs: [ETHERSCAN],
    description: `Official ${TOKEN_NAME} (${TOKEN_SYMBOL}) documentation for the EnergieMIND energy intelligence ecosystem.`,
  });
}

function jsonLdWebSite(lang) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'enm.network',
    url: pageUrl(lang, ''),
    inLanguage: LANGUAGES.find((l) => l.code === lang).hreflang,
    publisher: { '@type': 'Organization', name: SITE_BRAND, url: SITE_URL },
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
    publisher: { '@type': 'Organization', name: SITE_BRAND, url: SITE_URL },
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
    ['dashboard', c.nav.dashboard, 'dashboard'],
    ['apply', c.nav.apply, 'apply'],
    ['wallets', c.nav.wallets, 'wallets'],
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
            ${link(lang, 'dashboard', c.nav.dashboard)}
            ${link(lang, 'apply', c.nav.apply)}
            ${link(lang, 'wallets', c.nav.wallets)}
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
    ? ` <a href="${pagePath('{lang}', 'risk').replace('{lang}', 'LANG')}" style="color: var(--energy-blue-dark); font-weight: 700;">${esc(t.common.risk.readFull)}</a>`
    : '';
  return `<div class="risk-banner"><strong>${esc(t.common.risk.label)}</strong> ${esc(text)}${withLink ? riskLink.replace('LANG', '%%LANG%%') : ''}</div>`;
}

function riskBannerLang(t, text, lang, withLink = true) {
  const linkHtml = withLink
    ? ` <a href="${pagePath(lang, 'risk')}" style="color: var(--energy-blue-dark); font-weight: 700;">${esc(t.common.risk.readFull)}</a>`
    : '';
  return `<div class="risk-banner"><strong>${esc(t.common.risk.label)}</strong> ${esc(text)}${linkHtml}</div>`;
}

function portalBgMarkup() {
  return `<div class="portal-bg" aria-hidden="true"></div>
  <div class="portal-bg-grid" aria-hidden="true"></div>
  <div class="portal-bg-flow" aria-hidden="true">
    <div class="energy-line"></div><div class="energy-line"></div>
    <div class="energy-line"></div><div class="energy-line"></div>
  </div>
  <div class="portal-pulse" aria-hidden="true"></div>`;
}

function renderHome(lang, t) {
  const p = t.pages.home;
  const c = t.common;
  const target = p.countdownTarget || '2026-07-01';
  return `
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
          <h1><span class="gradient-text">${esc(p.h1)}</span>${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
          <p class="lead">${esc(p.lead)}</p>
          <p class="support-line">${esc(p.supportLine)}</p>
          <div class="hero-actions">
            <a class="btn primary" href="${pagePath(lang, 'apply')}">${esc(c.buttons.applyAccess)}</a>
            <a class="btn outline-navy" href="${pagePath(lang, 'dashboard')}">${esc(c.buttons.openDashboard)}</a>
            <a class="btn green" href="${pagePath(lang, 'presale')}">${esc(c.buttons.joinPresale)}</a>
          </div>
          <div class="contract-pill"><strong>${esc(c.contract.label)}</strong> <code>${CONTRACT}</code></div>
          <div class="countdown-grid" id="energy-countdown" data-target="${target}">
            <p style="grid-column: 1 / -1; margin: 24px 0 8px; font-weight: 700; color: var(--muted); font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em;">${esc(p.countdownTitle)}</p>
            <div class="countdown-unit"><div class="num" data-unit="days">—</div><div class="lbl">${esc(p.countdownDays)}</div></div>
            <div class="countdown-unit"><div class="num" data-unit="hours">—</div><div class="lbl">${esc(p.countdownHours)}</div></div>
            <div class="countdown-unit"><div class="num" data-unit="mins">—</div><div class="lbl">${esc(p.countdownMins)}</div></div>
            <div class="countdown-unit"><div class="num" data-unit="secs">—</div><div class="lbl">${esc(p.countdownSecs)}</div></div>
          </div>
        </div>
        <div class="stats-panel">
          <h3>${esc(c.stats.overview)}</h3>
          <div class="stats-grid">
            <div class="stat-item"><strong>${TOKEN_SYMBOL}</strong><span>${esc(c.stats.ticker)}</span></div>
            <div class="stat-item"><strong>ERC-20</strong><span>${esc(c.stats.standard)}</span></div>
            <div class="stat-item"><strong>50B</strong><span>${esc(c.stats.maxSupply)}</span></div>
            <div class="stat-item"><strong>18</strong><span>${esc(c.stats.decimals)}</span></div>
          </div>
        </div>
      </div>
      <div class="wrap">
        <div class="trust-bar">
          <div class="trust-item"><span>✓</span> ${esc(p.trustAudit)}</div>
          <div class="trust-item"><span>✓</span> ${esc(p.trustKyc)}</div>
          <div class="trust-item"><span>✓</span> ${esc(p.trustVesting)}</div>
          <div class="trust-item"><span>✓</span> ${esc(p.trustMultichain)}</div>
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
    <section>
      <div class="wrap">
        <div class="section-head">
          <h2>${esc(p.portalCtaTitle)}</h2>
          <p>${esc(p.portalCtaDesc)}</p>
        </div>
        <div class="hero-actions">
          <a class="btn primary" href="${pagePath(lang, 'apply')}">${esc(c.buttons.applyAccess)}</a>
          <a class="btn" href="${pagePath(lang, 'dashboard')}">${esc(c.buttons.openDashboard)}</a>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
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
            <a class="btn" href="${pagePath(lang, 'contract')}">${esc(c.buttons.contractDetails)}</a>
          </div>
        </div>
        <div class="card" style="padding: 0; overflow: hidden;">
          <table class="data-table">
            <thead><tr><th>${esc(c.table.property)}</th><th>${esc(c.table.value)}</th></tr></thead>
            <tbody>
              <tr><td>${esc(f.name)}</td><td><strong>${esc(TOKEN_NAME)}</strong></td></tr>
              <tr><td>${esc(f.symbol)}</td><td><strong>${TOKEN_SYMBOL}</strong></td></tr>
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
        <a href="${pagePath(lang, 'risk')}" style="color: var(--energy-blue-dark); font-weight: 700;">${esc(c.risk.fullNotice)}</a>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
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

function presaleConfigScript(lang, t) {
  const phaseLabels = {};
  const phaseDescs = {};
  for (const ph of PRESALE_PHASES) {
    const loc = t.pages.presale?.phases?.find((x) => x.id === ph.id);
    phaseLabels[ph.id] = loc?.name || ph.id;
    phaseDescs[ph.id] = loc?.desc || '';
  }
  return `<script type="application/json" id="presale-config">${JSON.stringify({
    phases: PRESALE_PHASES,
    phaseLabels,
    phaseDescs,
    publicStages: PUBLIC_STAGES,
    wallets: OFFICIAL_WALLETS,
    presaleWallet: PRESALE_WALLET,
    acceptedAssets: ACCEPTED_ASSETS,
    tokenContract: CONTRACT,
    lang,
    badges: t.common.badges,
    labels: {
      walletConnected: t.pages.dashboard?.walletConnected || 'Connected',
      walletDisconnected: t.pages.dashboard?.walletDisconnected || 'Not connected',
      connectWallet: t.common.buttons?.connectWallet || 'Connect Wallet',
      disconnectWallet: t.common.buttons?.disconnectWallet || 'Disconnect',
      copied: t.common.buttons?.copied || 'Copied!',
    },
  })}</script>`;
}

function renderPhaseTimeline(lang, t, p) {
  const localePhases = p.phases || [];
  return PRESALE_PHASES.map((phase) => {
    const label = localePhases.find((x) => x.id === phase.id) || { name: phase.id, desc: '' };
    return `
      <article class="phase-card" data-phase="${phase.id}">
        <div class="phase-card-head">
          <h3>${esc(label.name)}</h3>
          <span class="badge scheduled phase-status">${esc(t.common.badges.scheduled)}</span>
        </div>
        <p class="phase-desc">${esc(label.desc)}</p>
        <div class="phase-dates">${formatDateRange(phase.start, phase.end, lang)}</div>
      </article>`;
  }).join('');
}

function renderPublicStages(lang, t, p) {
  return PUBLIC_STAGES.map((s) => `
    <article class="stage-card" data-stage="${s.stage}">
      <div class="stage-num">${esc(p.stageLabel)} ${s.stage}</div>
      <div class="stage-dates">${formatDateRange(s.start, s.end, lang)}</div>
      <div class="stage-weeks">${s.weeks} ${esc(p.weeksLabel)}</div>
      <span class="badge scheduled stage-status">${esc(t.common.badges.scheduled)}</span>
    </article>`).join('');
}

function renderPresale(lang, t) {
  const p = t.pages.presale;
  const c = t.common;
  const f = p.fields;
  const phases = renderPhaseTimeline(lang, t, p);
  const stages = renderPublicStages(lang, t, p);
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
      <p class="lead">${esc(p.lead)}</p>
      <div class="hero-actions" style="margin-top: 20px;">
        <a class="btn primary" href="${pagePath(lang, 'apply')}">${esc(c.buttons.applyAccess)}</a>
        <a class="btn" href="${pagePath(lang, 'dashboard')}">${esc(c.buttons.openDashboard)}</a>
      </div>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(p.important)}</strong> ${esc(p.riskShort)}</div>
      <div class="section-head"><h2>${esc(p.timelineTitle)}</h2><p>${esc(p.timelineDesc)}</p></div>
      <div class="phase-grid">${phases}</div>
      <div class="section-head" style="margin-top: 40px;"><h2>${esc(p.publicStagesTitle)}</h2><p>${esc(p.publicStagesDesc)}</p></div>
      <div class="stage-grid">${stages}</div>
      <div class="table-panel" style="margin-top: 32px;">
        <table class="data-table">
          <thead><tr><th>${esc(c.table.parameter)}</th><th>${esc(c.table.status)}</th></tr></thead>
          <tbody>
            <tr><td><strong>${esc(f.presaleStatus)}</strong></td><td><span class="badge scheduled" id="presale-status-badge">${esc(c.badges.scheduled)}</span></td></tr>
            <tr><td><strong>${esc(f.acceptedAssets)}</strong></td><td>${ACCEPTED_ASSETS.join(', ')}</td></tr>
            <tr><td><strong>${esc(f.contributionWallet)}</strong></td><td><code style="font-size:12px;">${PRESALE_WALLET.address}</code> <a href="${pagePath(lang, 'wallets')}" style="color:var(--energy-blue-dark);font-weight:600;">${esc(c.buttons.verifyOnWallets)}</a></td></tr>
            <tr><td><strong>${esc(f.vesting)}</strong></td><td>${esc(c.values.tba)}</td></tr>
            <tr><td><strong>${esc(f.kyc)}</strong></td><td>${esc(c.values.tbaKyc)}</td></tr>
            <tr><td><strong>${esc(f.price)}</strong></td><td>${esc(c.values.tba)}</td></tr>
          </tbody>
        </table>
      </div>
      <div class="prose" style="margin-top: 32px;">
        <h2>${esc(p.expectTitle)}</h2>
        <p>${esc(p.expectP1)}</p>
        <p>${esc(p.expectP2)} <a href="mailto:token@enm.network" style="color: var(--energy-blue-dark); font-weight: 600;">${esc(p.contactLink)}</a>.</p>
        <p>${esc(p.dashboardCta)} <a href="${pagePath(lang, 'dashboard')}" style="color: var(--energy-blue-dark); font-weight: 600;">${esc(c.nav.dashboard)}</a>.</p>
        <p>${esc(p.walletsCta)} <a href="${pagePath(lang, 'wallets')}" style="color: var(--energy-blue-dark); font-weight: 600;">${esc(c.nav.wallets)}</a>.</p>
      </div>
    </div></section>
    <section><div class="wrap">${riskBannerLang(t, p.riskFooter, lang)}</div></section>
    ${presaleConfigScript(lang, t)}`;
}

function renderDashboard(lang, t) {
  const p = t.pages.dashboard;
  const c = t.common;
  const dashPath = pagePath(lang, 'dashboard');
  const applyPath = pagePath(lang, 'apply');
  return `
    ${portalBgMarkup()}
    <div class="portal-wrap" id="portal-dashboard"
      data-kyc-not-started="${esc(p.kycNotStarted)}"
      data-kyc-pending="${esc(p.kycPending)}"
      data-kyc-approved="${esc(p.kycApproved)}"
      data-kyc-rejected="${esc(p.kycRejected)}">
      <div class="portal-head">
        <div class="portal-tag"><span class="dot"></span> ${esc(p.eyebrow)}</div>
        <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
        <p class="portal-lead">${esc(p.lead)}</p>
      </div>

      <div id="portal-guest-view">
        <div class="portal-card" style="text-align: center; padding: 48px 24px;">
          <h2 style="font-family: var(--portal-display); margin-bottom: 10px;">${esc(p.guestTitle)}</h2>
          <p class="card-desc">${esc(p.guestDesc)}</p>
          <div class="hero-actions" style="justify-content: center; margin-top: 20px;">
            <a class="btn primary" href="${applyPath}">${esc(p.guestApply)}</a>
            <a class="btn" href="${applyPath}#login">${esc(p.guestLogin)}</a>
          </div>
        </div>
      </div>

      <div id="portal-investor-view" class="portal-hidden">
        <div class="portal-toolbar">
          <div>
            <strong id="portal-user-name">—</strong>
            <span class="muted" style="display:block;font-size:13px;color:var(--portal-muted);" id="portal-user-email">—</span>
          </div>
          <span class="spacer"></span>
          <a class="btn btn-sm" href="${pagePath(lang, 'wallets')}">${esc(c.buttons.viewWallets)}</a>
          <button type="button" class="btn btn-sm" id="portal-logout">${esc(p.logout)}</button>
        </div>

        <div class="journey-stepper">
          <div class="journey-step" data-step="0"><div class="step-icon">1</div><div class="step-label">${esc(p.stepApply)}</div></div>
          <div class="journey-step" data-step="1"><div class="step-icon">2</div><div class="step-label">${esc(p.stepKyc)}</div></div>
          <div class="journey-step" data-step="2"><div class="step-icon">3</div><div class="step-label">${esc(p.stepApproval)}</div></div>
          <div class="journey-step" data-step="3"><div class="step-icon">4</div><div class="step-label">${esc(p.stepPayment)}</div></div>
          <div class="journey-step" data-step="4"><div class="step-icon">5</div><div class="step-label">${esc(p.stepVesting)}</div></div>
        </div>

        <div class="kpi-row">
          <div class="kpi-card"><div class="kpi-label">${esc(p.kpiKyc)}</div><div class="kpi-value" id="kpi-kyc">—</div></div>
          <div class="kpi-card"><div class="kpi-label">${esc(p.kpiInvested)}</div><div class="kpi-value cyan" id="kpi-invested">—</div></div>
          <div class="kpi-card"><div class="kpi-label">${esc(p.kpiAllocation)}</div><div class="kpi-value green" id="kpi-allocation">—</div></div>
          <div class="kpi-card"><div class="kpi-label">${esc(p.kpiClaim)}</div><div class="kpi-value" id="kpi-claim">—</div></div>
        </div>

        <div class="portal-grid-2">
          <div class="portal-card">
            <h3>${esc(p.kycTitle)}</h3>
            <p class="card-desc">${esc(p.kycDesc)}</p>
            <p><strong>${esc(p.kycStatusLabel)}:</strong> <span id="kpi-kyc-inline">—</span></p>
            <button type="button" class="btn primary" style="margin-top:12px;" disabled>${esc(p.kycStart)}</button>
          </div>
          <div class="portal-card">
            <h3>${esc(p.phaseTitle)}</h3>
            <p class="card-desc">${esc(p.phaseProgress)}</p>
            <div class="kpi-value cyan" id="portal-phase-label" style="font-size:18px;margin-bottom:8px;">—</div>
            <div class="portal-progress"><span id="portal-phase-progress" style="width:0%"></span></div>
          </div>
        </div>

        <div class="portal-card">
          <h3>${esc(p.paymentTitle)}</h3>
          <p class="card-desc">${esc(p.paymentDesc)}</p>
          <p><strong>${esc(p.paymentWallet)}</strong></p>
          <div class="addr-row">
            <code class="addr-mono">${PRESALE_WALLET.address}</code>
            <button type="button" class="btn btn-sm" data-copy="${PRESALE_WALLET.address}" data-copied-label="${esc(c.buttons.copied)}">${esc(c.buttons.copyAddress)}</button>
            <a class="btn btn-sm" href="${walletEtherscan(PRESALE_WALLET.address)}" target="_blank" rel="noopener">${esc(c.buttons.etherscan)}</a>
          </div>
          <p style="margin-top:14px;color:var(--portal-muted);font-size:13px;"><strong>${esc(p.paymentAssets)}:</strong> ${ACCEPTED_ASSETS.join(', ')}</p>
        </div>

        <div class="portal-grid-2">
          <div class="portal-card">
            <h3>${esc(p.allocationTitle)}</h3>
            <p class="card-desc">${esc(p.allocationDesc)}</p>
            <table class="portal-table">
              <tbody>
                <tr><td>${esc(p.allocationRound)}</td><td><strong id="detail-round">—</strong></td></tr>
                <tr><td>${esc(p.allocationWallet)}</td><td><code class="addr-mono" id="detail-wallet">—</code></td></tr>
                <tr><td>${esc(p.allocationPayment)}</td><td><strong id="detail-payment">—</strong></td></tr>
                <tr><td>${esc(p.allocationCountry)}</td><td><strong id="detail-country">—</strong></td></tr>
                <tr><td>${esc(p.allocationStatus)}</td><td><strong id="detail-status">—</strong></td></tr>
              </tbody>
            </table>
          </div>
          <div class="portal-card">
            <h3>${esc(p.vestingTitle)}</h3>
            <p class="card-desc">${esc(p.vestingDesc)}</p>
            <table class="portal-table">
              <tbody>
                <tr><td>${esc(p.vestingTge)}</td><td><strong>${esc(p.vestingTgeValue)}</strong></td></tr>
                <tr><td>${esc(p.vestingCliff)}</td><td><strong>${esc(p.vestingCliffValue)}</strong></td></tr>
                <tr><td>${esc(p.vestingRelease)}</td><td><strong>${esc(p.vestingReleaseValue)}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="portal-card">
          <h3>${esc(p.txTitle)}</h3>
          <p class="card-desc">${esc(p.txDesc)}</p>
          <div class="portal-table-wrap">
            <table class="portal-table">
              <thead><tr><th>${esc(p.txDate)}</th><th>${esc(p.txAsset)}</th><th>${esc(p.txAmount)}</th><th>${esc(p.txStatus)}</th></tr></thead>
              <tbody><tr><td colspan="4" style="text-align:center;padding:24px;">${esc(p.txEmpty)}</td></tr></tbody>
            </table>
          </div>
        </div>

        <div class="portal-card">
          <h3>${esc(p.docsTitle)}</h3>
          <p class="card-desc">${esc(p.docsDesc)}</p>
          <div class="portal-table-wrap">
            <table class="portal-table">
              <thead><tr><th>${esc(p.docsName)}</th><th>${esc(p.docsDate)}</th><th>${esc(p.docsAction)}</th></tr></thead>
              <tbody>
                <tr><td><strong>${esc(c.buttons.readRisk)}</strong></td><td>—</td><td><a href="${pagePath(lang, 'risk')}">${esc(c.risk.readFull)}</a></td></tr>
                <tr><td colspan="3" style="text-align:center;color:var(--portal-dim);">${esc(p.docsEmpty)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="portal-risk"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}
        <a href="${pagePath(lang, 'risk')}">${esc(c.risk.readFull)}</a>
      </div>
    </div>
    ${presaleConfigScript(lang, t)}`;
}

function renderApply(lang, t) {
  const p = t.pages.apply;
  const c = t.common;
  const dashPath = pagePath(lang, 'dashboard');
  return `
    ${portalBgMarkup()}
    <div class="portal-wrap wrap-narrow" style="max-width:840px;">
      <div class="portal-head">
        <div class="portal-tag"><span class="dot"></span> ${esc(p.eyebrow)}</div>
        <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
        <p class="portal-lead">${esc(p.lead)}</p>
      </div>

      <div class="portal-alert info">
        <strong>${esc(p.previewTitle)}</strong>
        ${esc(p.previewDesc)}
      </div>

      <div class="portal-card">
        <div class="portal-tabs">
          <button type="button" class="portal-tab active" data-portal-tab="apply">${esc(p.tabApply)}</button>
          <button type="button" class="portal-tab" data-portal-tab="login">${esc(p.tabLogin)}</button>
        </div>

        <div class="portal-tab-panel active" data-portal-panel="apply">
          <form id="portal-apply-form" data-dashboard-path="${dashPath}">
            <div class="portal-form-grid">
              <div class="portal-field"><label>${esc(p.fullName)} *</label><input name="fullName" required autocomplete="name" /></div>
              <div class="portal-field"><label>${esc(p.email)} *</label><input name="email" type="email" required autocomplete="email" /></div>
              <div class="portal-field"><label>${esc(p.password)} *</label><input name="password" type="password" required autocomplete="new-password" /></div>
              <div class="portal-field"><label>${esc(p.confirmPassword)} *</label><input name="confirmPassword" type="password" required autocomplete="new-password" /></div>
              <div class="portal-field"><label>${esc(p.country)} *</label>
                <select name="country" required>
                  <option value="">${esc(p.countryPlaceholder)}</option>
                  <option value="DE">Germany</option><option value="TR">Turkey</option><option value="US">United States</option>
                  <option value="GB">United Kingdom</option><option value="FR">France</option><option value="NL">Netherlands</option>
                  <option value="CH">Switzerland</option><option value="AE">UAE</option><option value="SG">Singapore</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div class="portal-field"><label>${esc(p.phone)}</label><input name="phone" type="tel" autocomplete="tel" /></div>
              <div class="portal-field" style="grid-column:1/-1;"><label>${esc(p.wallet)} *</label><input name="wallet" required placeholder="0x…" pattern="^0x[a-fA-F0-9]{40}$" /></div>
              <div class="portal-field"><label>${esc(p.round)} *</label>
                <select name="round" required>
                  <option value="early">${esc(p.roundEarly)}</option>
                  <option value="strategic">${esc(p.roundStrategic)}</option>
                  <option value="private">${esc(p.roundPrivate)}</option>
                  <option value="public">${esc(p.roundPublic)}</option>
                </select>
              </div>
              <div class="portal-field"><label>${esc(p.allocation)} *</label><input name="allocation" type="number" min="0" step="1000" required /></div>
              <div class="portal-field"><label>${esc(p.payment)} *</label>
                <select name="payment" required>
                  <option value="ETH">${esc(p.paymentEth)}</option>
                  <option value="USDC">${esc(p.paymentUsdc)}</option>
                  <option value="USDT">${esc(p.paymentUsdt)}</option>
                </select>
              </div>
              <div class="portal-field"><label>${esc(p.investorType)}</label>
                <select name="investorType">
                  <option value="individual">${esc(p.typeIndividual)}</option>
                  <option value="company">${esc(p.typeCompany)}</option>
                  <option value="accredited">${esc(p.typeAccredited)}</option>
                </select>
              </div>
              <div class="portal-field"><label>${esc(p.referral)}</label><input name="referral" /></div>
            </div>
            <div class="portal-checkbox"><input type="checkbox" name="terms" required id="chk-terms" /><label for="chk-terms">${esc(p.termsCheck)}</label></div>
            <div class="portal-checkbox"><input type="checkbox" name="risk" required id="chk-risk" /><label for="chk-risk">${esc(p.riskCheck)}</label></div>
            <div class="portal-checkbox"><input type="checkbox" name="kyc" required id="chk-kyc" /><label for="chk-kyc">${esc(p.kycCheck)}</label></div>
            <div class="portal-checkbox"><input type="checkbox" name="restricted" required id="chk-restricted" /><label for="chk-restricted">${esc(p.restrictedCheck)}</label></div>
            <button type="submit" class="btn primary btn-block" style="width:100%;margin-top:8px;">${esc(p.submitApply)}</button>
            <p style="margin-top:16px;font-size:13px;color:var(--portal-muted);">${esc(p.alreadyApplied)} <a href="#" onclick="document.querySelector('[data-portal-tab=login]').click();return false;">${esc(p.tabLogin)}</a></p>
          </form>
        </div>

        <div class="portal-tab-panel" data-portal-panel="login" id="login">
          <form id="portal-login-form" data-dashboard-path="${dashPath}">
            <div class="portal-field"><label>${esc(p.loginEmail)}</label><input name="email" type="email" required autocomplete="email" /></div>
            <div class="portal-field"><label>${esc(p.loginPassword)}</label><input name="password" type="password" required autocomplete="current-password" /></div>
            <button type="submit" class="btn primary btn-block" style="width:100%;">${esc(p.submitLogin)}</button>
            <p style="margin-top:16px;font-size:13px;color:var(--portal-muted);">${esc(p.noAccount)} <a href="${pagePath(lang, 'apply')}">${esc(p.applyLink)}</a></p>
          </form>
        </div>
      </div>

      <div class="portal-risk"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}</div>
    </div>`;
}

function renderWallets(lang, t) {
  const p = t.pages.wallets;
  const c = t.common;
  const walletRows = OFFICIAL_WALLETS.map((w) => {
    const purpose = p.purposes?.[w.purpose] || w.purpose;
    return `
      <tr>
        <td><strong>${esc(w.label)}</strong></td>
        <td>${esc(w.network)} / ${w.symbol}</td>
        <td>${esc(purpose)}</td>
        <td><code style="font-size:12px;">${w.address}</code></td>
        <td>
          <button type="button" class="btn btn-sm copy-wallet-btn" data-address="${w.address}">${esc(c.buttons.copyAddress)}</button>
          <a class="btn btn-sm" href="${walletEtherscan(w.address)}" target="_blank" rel="noopener">${esc(c.buttons.etherscan)}</a>
        </td>
      </tr>`;
  }).join('');
  const recommended = (p.recommended || []).map((r) => `
    <article class="card"><h3>${esc(r.name)}</h3><p>${esc(r.desc)}</p></article>`).join('');
  return `
    <div class="page-hero"><div class="wrap">
      <div class="eyebrow"><span class="dot"></span> ${esc(p.eyebrow)}</div>
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}</div>
      <div class="section-head"><h2>${esc(p.verifyTitle)}</h2><p>${esc(p.verifyDesc)}</p></div>
      <div class="table-panel">
        <table class="data-table">
          <thead><tr><th>${esc(c.table.category)}</th><th>${esc(c.table.network)}</th><th>${esc(p.purposeLabel)}</th><th>${esc(c.table.value)}</th><th></th></tr></thead>
          <tbody>${walletRows}</tbody>
        </table>
      </div>
      <div class="section-head" style="margin-top: 40px;"><h2>${esc(p.recommendedTitle)}</h2><p>${esc(p.recommendedDesc)}</p></div>
      <div class="cards two">${recommended}</div>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
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
              <tr><td>${esc(f.tokenName)}</td><td><strong>${esc(TOKEN_NAME)}</strong><br><span class="small" style="color:var(--ink-muted);">${esc(t.common.branding.onchainLabel)}: ${esc(TOKEN_ONCHAIN_NAME)}</span></td></tr>
              <tr><td>${esc(f.symbol)}</td><td><strong>${TOKEN_SYMBOL}</strong></td></tr>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
      <p class="lead">${esc(p.lead)}</p>
    </div></div>
    <section><div class="wrap">
      <div class="risk-banner" style="margin-bottom: 32px;"><strong>${esc(c.risk.label)}</strong> ${esc(p.riskShort)}
        <a href="${pagePath(lang, 'risk')}" style="color: var(--energy-blue-dark); font-weight: 700;">${esc(c.risk.readFull)}</a>
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
      <h1>${esc(p.h1)}${p.h1Ticker ? ` <span class="ticker-badge">${esc(p.h1Ticker)}</span>` : ''}</h1>
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
  dashboard: renderDashboard,
  apply: renderApply,
  wallets: renderWallets,
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
    : PORTAL_PAGES.has(pageId)
      ? `<a class="btn primary" href="${pagePath(lang, 'apply')}">${esc(t.common.buttons.applyAccess)}</a>`
      : `<a class="btn primary" href="${pagePath(lang, 'contract')}">${esc(t.common.buttons.viewContract)}</a>`;

  const bodyClass = PORTAL_PAGES.has(pageId) ? ' class="portal-energy"' : '';
  const energyOrb = pageId === 'home' ? '<div class="energy-orb" aria-hidden="true"></div>' : '';
  const portalScripts = PORTAL_PAGES.has(pageId)
    ? '\n  <script src="/assets/js/config.js"></script>\n  <script src="/assets/js/portal.js"></script>'
    : '';
  const presaleScripts = ['presale', 'wallets'].includes(pageId)
    ? '\n  <script src="/assets/js/dashboard.js"></script>'
    : '';
  const homeScripts = pageId === 'home'
    ? '\n  <script src="/assets/js/portal.js"></script>'
    : '';

  return `${headMeta({ lang, langInfo, pageId, t, page })}
${schemas.join('\n')}
</head>
<body${bodyClass}>
${energyOrb}
  <nav class="nav">
    <div class="wrap nav-inner">
      <a class="brand" href="${pagePath(lang, '')}" aria-label="${esc(t.common.brandHome)}">
        <span class="mark"></span>
        <span>${esc(TOKEN_NAME.replace(' Token', ''))}<div class="brand-sub">${TOKEN_SYMBOL} · enm.network</div></span>
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
  <script src="/assets/js/main.js"></script>${presaleScripts}${portalScripts}${homeScripts}
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
      const changefreq = ['presale', 'dashboard', 'apply'].includes(p.id) ? 'weekly' : 'monthly';
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
<body><p><a href="/en/">Continue to ${esc(TOKEN_NAME)}</a></p></body>
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
