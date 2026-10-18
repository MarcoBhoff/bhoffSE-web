// bhoff.se – v5. Statiska filer serveras direkt av Cloudflare; den här koden körs bara för /api/vader.
// Källa: SMHI öppna data (CC BY 4.0), lufttemperatur senaste timmen, Stockholm-Observatoriekullen A (station 98230).
const SMHI = 'https://opendata-download-metobs.smhi.se/api/version/1.0/parameter/1/station/98230/period/latest-hour/data.json';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/vader') return env.ASSETS.fetch(request);

    try {
      const r = await fetch(SMHI, { cf: { cacheTtl: 600, cacheEverything: true } }); // max ett anrop per 10 min
      if (!r.ok) throw new Error('SMHI ' + r.status);
      const d = await r.json();
      const senaste = d.value && d.value[d.value.length - 1];
      const temp = senaste ? parseFloat(senaste.value) : NaN;
      if (!Number.isFinite(temp)) throw new Error('inget värde');
      return Response.json(
        { temp, tid: senaste.date, station: d.station?.name || 'Stockholm', kalla: 'SMHI' },
        { headers: { 'Cache-Control': 'public, max-age=600' } }
      );
    } catch (e) {
      return Response.json({ fel: 'Väder saknas just nu' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  },
};
