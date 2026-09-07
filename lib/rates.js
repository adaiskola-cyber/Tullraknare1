const RATES_URL = 'https://open.er-api.com/v6/latest/SEK';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cache = {
  rates: null,
  base: 'SEK',
  fetchedAt: null,
};

async function fetchFreshRates() {
  const res = await fetch(RATES_URL);
  if (!res.ok) {
    throw new Error(`Valuta-API svarade med status ${res.status}`);
  }
  const data = await res.json();
  if (data.result !== 'success' || !data.rates) {
    throw new Error('Valuta-API returnerade ett oväntat svar');
  }
  return data.rates;
}

function isStale() {
  if (!cache.fetchedAt) return true;
  return Date.now() - cache.fetchedAt.getTime() > CACHE_TTL_MS;
}

async function getRates() {
  if (!isStale() && cache.rates) {
    return {
      rates: cache.rates,
      base: cache.base,
      updatedAt: cache.fetchedAt.toISOString(),
      source: 'cache',
      warning: null,
    };
  }

  try {
    const rates = await fetchFreshRates();
    cache = { rates, base: 'SEK', fetchedAt: new Date() };
    return {
      rates: cache.rates,
      base: cache.base,
      updatedAt: cache.fetchedAt.toISOString(),
      source: 'live',
      warning: null,
    };
  } catch (err) {
    if (cache.rates) {
      return {
        rates: cache.rates,
        base: cache.base,
        updatedAt: cache.fetchedAt.toISOString(),
        source: 'stale-cache',
        warning: `Kunde inte hämta nya valutakurser (${err.message}). Visar senast kända kurser från ${cache.fetchedAt.toISOString()}.`,
      };
    }
    throw err;
  }
}

module.exports = { getRates };
