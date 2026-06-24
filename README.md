# enm.network

Official ENM Token website — multilingual token documentation, contract information, presale status, tokenomics, and risk disclosures.

**enm.network** = ENM token / presale / contract / token documentation  
**energiemind.com** = project / technology / energy intelligence

## Languages (25)

EN, TR, DE, FR, ES, IT, PT, NL, AR, RU, ZH-CN, ZH-TW, JA, KO, HI, UR, PL, RO, EL, SV, NO, DA, FI, HE, ID

Each language has fully translated pages at `/{lang}/` with:

- Unique title, meta description, Open Graph, and Twitter cards
- hreflang and canonical tags
- JSON-LD: Organization, WebSite, BreadcrumbList, Article, FAQPage
- Language dropdown on every page

## Pages (per language)

| Route | Description |
|-------|-------------|
| `/{lang}/` | Home |
| `/{lang}/token` | ENM Token details |
| `/{lang}/tokenomics` | Allocation structure |
| `/{lang}/presale` | Presale preparation stage |
| `/{lang}/contract` | Official contract |
| `/{lang}/roadmap` | Development milestones |
| `/{lang}/risk` | Full risk notice |
| `/{lang}/faq` | FAQ |
| `/{lang}/contact` | Contact |

## Build

```bash
npm run build
```

Generates 225 HTML pages (9 pages × 25 languages), sitemaps, and robots.txt from `locales/*.json`.

## SEO

- `/sitemap.xml` — sitemap index (25 language sitemaps)
- `/robots.txt` — Google, Bing, Yandex, Baidu
- Root `/` redirects to `/en/`

## Token

- Contract: `0x00faB8baFfF3f849dd23FF68cfE51d8E3d09937D`
- Network: Ethereum Mainnet (ERC-20)
- Max supply: 50,000,000,000 ENM

## License

MIT — TVK Group / TVK Labs & Technologies LTD
