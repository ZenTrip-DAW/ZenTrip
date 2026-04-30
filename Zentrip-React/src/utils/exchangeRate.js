const _cache = new Map();
const CACHE_MS = 60 * 60 * 1000; // 1 hora

async function tryFrankfurter(from, to) {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${from}&to=${to}`);
  if (!res.ok) throw new Error(`Frankfurter ${res.status}`);
  const json = await res.json();
  const rate = json.rates?.[to];
  if (!rate) throw new Error(`Par ${from}/${to} no disponible`);
  return rate;
}

async function tryCdnApi(from, to) {
  const res = await fetch(
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${from.toLowerCase()}.json`
  );
  if (!res.ok) throw new Error(`CDN ${res.status}`);
  const json = await res.json();
  const rate = json[from.toLowerCase()]?.[to.toLowerCase()];
  if (!rate) throw new Error(`Par ${from}/${to} no disponible`);
  return rate;
}

export async function fetchExchangeRate(from, to) {
  if (from === to) return 1;
  const key = `${from}:${to}`;
  const hit = _cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_MS) return hit.rate;

  let rate;
  try {
    rate = await tryFrankfurter(from, to);
  } catch {
    rate = await tryCdnApi(from, to); // fallback automático
  }

  _cache.set(key, { rate, ts: Date.now() });
  return rate;
}
