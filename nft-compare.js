/**
 * NFT Floor Price Comparator
 * Fetches historical and live floor prices via OpenSea API v2
 * and computes mirrored ratios between collections.
 */

const COLLECTIONS = {
  pudgy: {
    name: 'Pudgy Penguins',
    slug: 'pudgypenguins',
    address: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
    color: '#00d4ff',
  },
  azuki: {
    name: 'Azuki',
    slug: 'azuki',
    address: '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
    color: '#ff4499',
  },
  punks: {
    name: 'CryptoPunks',
    slug: 'cryptopunks',
    address: '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
    color: '#ff6b6b',
  },
  bayc: {
    name: 'Bored Ape Yacht Club',
    slug: 'boredapeyachtclub',
    address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    color: '#FFD700',
  },
};

const OPENSEA_BASE = 'https://api.opensea.io/api/v2';

/**
 * Fetch JSON from OpenSea API with rate-limit retry.
 * @param {string} path - API path (e.g. /collections/pudgypenguins/stats)
 * @param {string} apiKey - OpenSea API key
 */
async function openSeaFetch(path, apiKey, retries = 3) {
  const res = await fetch(`${OPENSEA_BASE}${path}`, {
    headers: { 'X-API-KEY': apiKey, accept: 'application/json' },
  });

  if (res.status === 429) {
    if (retries === 0) throw new Error('Rate limit exceeded');
    await sleep(3000);
    return openSeaFetch(path, apiKey, retries - 1);
  }

  if (!res.ok) throw new Error(`OpenSea API error ${res.status}`);
  return res.json();
}

/**
 * Get the current floor price for a collection (in ETH).
 * @param {string} slug - OpenSea collection slug
 * @param {string} apiKey
 * @returns {number|null}
 */
async function getLiveFloor(slug, apiKey) {
  const data = await openSeaFetch(`/collections/${slug}/stats`, apiKey);
  const floor = parseFloat(data?.total?.floor_price);
  return isNaN(floor) ? null : floor;
}

/**
 * Get the floor price for a specific month using listing events.
 * Returns the minimum listing price found in that month (true floor).
 * @param {string} slug - OpenSea collection slug
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @param {string} apiKey
 * @returns {number|null}
 */
async function getMonthFloor(slug, year, month, apiKey) {
  const after  = Math.floor(new Date(year, month, 1).getTime() / 1000);
  const before = Math.floor(new Date(year, month + 1, 0, 23, 59, 59).getTime() / 1000);

  const path = `/events/collection/${slug}?event_type=listing&after=${after}&before=${before}&limit=50`;
  const data = await openSeaFetch(path, apiKey);

  let minFloor = null;
  for (const event of data?.asset_events ?? []) {
    const price = parseFloat(event?.payment?.quantity ?? 0) / 1e18;
    if (price > 0.01 && (minFloor === null || price < minFloor)) {
      minFloor = price;
    }
  }

  return minFloor;
}

/**
 * Mirrored ratio between two floor prices.
 * Positive  → other is more expensive than base
 * Negative  → base is more expensive than other
 * @param {number} other
 * @param {number} base
 * @returns {number}
 */
function mirroredRatio(other, base) {
  if (!other || !base) return null;
  return other >= base ? other / base : -(base / other);
}

/**
 * Build a full history object for all collections from Jan 2023 to now.
 * @param {string} apiKey
 * @param {function} onProgress - called with (done, total, label)
 * @returns {{ pudgy: number[], azuki: number[], punks: number[], bayc: number[] }}
 */
async function buildHistory(apiKey, onProgress = () => {}) {
  const months = getMonthRange(new Date(2023, 0, 1), new Date());
  const keys   = Object.keys(COLLECTIONS);
  const total  = keys.length * months.length;
  let done     = 0;

  const history = Object.fromEntries(keys.map(k => [k, []]));

  for (const key of keys) {
    for (const { year, month } of months) {
      const floor = await getMonthFloor(COLLECTIONS[key].slug, year, month, apiKey);
      history[key].push(floor);
      done++;
      onProgress(done, total, `${COLLECTIONS[key].name} · ${formatMonth(year, month)}`);
      await sleep(260);
    }
  }

  return history;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getMonthRange(start, end) {
  const months = [];
  let d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push({ year: d.getFullYear(), month: d.getMonth() });
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  }
  return months;
}

function formatMonth(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

// ── Exports (for use in browser or Node.js) ───────────────────────────────────

if (typeof module !== 'undefined') {
  module.exports = { COLLECTIONS, getLiveFloor, getMonthFloor, mirroredRatio, buildHistory };
}
