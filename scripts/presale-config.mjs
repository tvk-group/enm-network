/** Official ENM ecosystem wallets (Ethereum Mainnet) */
export const OFFICIAL_WALLETS = [
  {
    id: 'founder',
    label: 'EnergieMind ENM Founder',
    network: 'Ethereum',
    symbol: 'ETH',
    address: '0xB2556d7365A3657eAa9860B6d38eC96a5806E125',
    purpose: 'founder',
  },
  {
    id: 'ops',
    label: 'EnergieMind ENM OPS',
    network: 'Ethereum',
    symbol: 'ETH',
    address: '0xb7590526929c24f552Ad9E5256d433F1DaaFE5f2',
    purpose: 'operations',
  },
  {
    id: 'genesis',
    label: 'EnergieMind ENM GENESIS',
    network: 'Ethereum',
    symbol: 'ETH',
    address: '0x6047cB96256E4C07E9709C2389E2A91Bc639e8f8',
    purpose: 'genesis',
  },
  {
    id: 'treasury',
    label: 'EnergieMind ENM Treasury',
    network: 'Ethereum',
    symbol: 'ETH',
    address: '0x9dC5FeFA214F3276381b5aA6d85E6C219a5bCe66',
    purpose: 'treasury',
  },
];

/** Presale contribution wallet (verify on enm.network/wallets only) */
export const PRESALE_WALLET = OFFICIAL_WALLETS.find((w) => w.id === 'treasury');

export const PRESALE_PHASES = [
  {
    id: 'early',
    start: '2026-07-01',
    end: '2026-09-30',
    type: 'private',
    allocationNote: 'early',
  },
  {
    id: 'strategic',
    start: '2026-10-01',
    end: '2026-12-31',
    type: 'private',
    allocationNote: 'strategic',
  },
  {
    id: 'private',
    start: '2027-01-01',
    end: '2027-03-31',
    type: 'private',
    allocationNote: 'private',
  },
  {
    id: 'public',
    start: '2027-04-01',
    end: '2027-12-08',
    type: 'public',
    allocationNote: 'public',
  },
];

/** Public presale: 6 stages × 6 weeks each, starting 01.04.2027 */
export const PUBLIC_STAGES = [
  { stage: 1, start: '2027-04-01', end: '2027-05-12', weeks: 6 },
  { stage: 2, start: '2027-05-13', end: '2027-06-23', weeks: 6 },
  { stage: 3, start: '2027-06-24', end: '2027-08-04', weeks: 6 },
  { stage: 4, start: '2027-08-05', end: '2027-09-15', weeks: 6 },
  { stage: 5, start: '2027-09-16', end: '2027-10-27', weeks: 6 },
  { stage: 6, start: '2027-10-28', end: '2027-12-08', weeks: 6 },
];

export const ACCEPTED_ASSETS = ['ETH', 'USDC', 'USDT'];

export function walletEtherscan(address) {
  return `https://etherscan.io/address/${address}`;
}

export function formatDateRange(start, end, locale = 'en') {
  const fmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${fmt.format(new Date(start))} – ${fmt.format(new Date(end))}`;
}
