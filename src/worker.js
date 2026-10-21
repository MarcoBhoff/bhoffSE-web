// bhoff.se – v11. Worker framför de statiska filerna: bara /api/vader hamnar här, allt annat serveras som filer.
// Samma väderlogik som mullra.se (MarcoBhoff/mullraSE-web, src/worker/index.js).
// /api/vader: hämtar SMHI:s prognos (snow1g) på servern, så att webbläsaren inte behöver nå SMHI (CORS). Cachas 15 min.
const SMHI = 'https://opendata-download-metfcst.smhi.se/api/category/snow1g/version/1/geotype/point/lon/18.07/lat/59.33/data.json';

function svar(data, status, sekunder) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=' + sekunder } });
}
const dag = (d) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);

// Solens höjd i grader över horisonten (förenklad astronomisk formel, fel < ca 0,1°).
export function solhojd(ms, lat = 59.33, lon = 18.07) {
  const r = Math.PI / 180, d = ms / 86400000 - 10957.5;
  const g = (357.529 + 0.98560028 * d) * r, q = 280.459 + 0.98564736 * d;
  const L = (q + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * r, e = (23.439 - 0.00000036 * d) * r;
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
  const lha = ((18.697374558 + 24.06570982441908 * d) * 15 + lon) * r - ra;
  return Math.asin(Math.sin(lat * r) * Math.sin(dec) + Math.cos(lat * r) * Math.cos(dec) * Math.cos(lha)) / r;
}

// Månen visas (1) alltid 21:30–05:00 svensk tid, och (2) när det är mörkt ute (solen mer än 6° under horisonten,
// dvs. efter borgerlig skymning) men bara mellan 18:00 och 08:00, så att vintereftermiddagar inte får måne för tidigt.
export function arNatt(nu) {
  const [h, m] = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(nu)).split(':').map(Number);
  const min = h * 60 + m;
  if (min >= 21 * 60 + 30 || min < 5 * 60) return true;
  return solhojd(nu) < -6 && (min >= 18 * 60 || min < 8 * 60);
}

// Åska: högsta sannolikhet per dag (svensk tid) från nu och 7 dagar framåt. askaOm = antal dagar till första dagen med minst 30 %.
const ASKGRANS = 30;
export function tolka(j, nu = Date.now()) {
  let temp = null, diff = Infinity, symbol = null;
  const dagar = [...Array(7)].map((_, k) => dag(new Date(nu + k * 86400000))), max = {};
  for (const e of j.timeSeries || []) {
    const tid = new Date(e.time).getTime(), d = e.data || {};
    const t = d.air_temperature;
    if (typeof t === 'number' && t !== 9999 && Math.abs(tid - nu) < diff) { diff = Math.abs(tid - nu); temp = t; symbol = typeof d.symbol_code === 'number' ? d.symbol_code : null; }
    const p = d.thunderstorm_probability, dd = dag(new Date(tid));
    if (typeof p === 'number' && p !== 9999 && tid > nu - 3600 * 1000 && dagar.includes(dd)) max[dd] = Math.max(max[dd] ?? 0, p);
  }
  if (diff >= 3 * 3600 * 1000) { temp = null; symbol = null; }
  const k = dagar.findIndex((dd) => (max[dd] ?? 0) >= ASKGRANS);
  return {
    temp: temp === null ? null : Math.round(temp) || 0, symbol, natt: arNatt(nu),
    aska: max[dagar[0]] ?? null,            // i dag, %
    askaOm: k === -1 ? null : k,            // 0 = i dag, 1 = i morgon …
    askaDag: k === -1 ? null : dagar[k],    // datum (ÅÅÅÅ-MM-DD)
    prognosDagar: Object.keys(max).length,  // hur många dagar SMHI gav åskdata för
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/vader') {
      const cache = caches.default, nyckel = new Request(url.origin + '/api/vader');
      const sparad = await cache.match(nyckel);
      if (sparad) return sparad;
      try {
        const r = await fetch(SMHI, { headers: { 'user-agent': 'bhoff.se (opendata)' } });
        if (!r.ok) return svar({ temp: null }, 200, 60);
        const res = svar(tolka(await r.json()), 200, 900);
        ctx.waitUntil(cache.put(nyckel, res.clone()));
        return res;
      } catch (e) {
        return svar({ temp: null }, 200, 60);
      }
    }
    if (url.pathname.startsWith('/api/')) return svar({ fel: 'saknas' }, 404, 60);
    return env.ASSETS.fetch(request);
  },
};
