# bhoff.se – v8

En enda statisk sida. Inget byggsteg: allt i `public/` publiceras som det är.

- `public/index.html` – sidan (text, stil, LinkedIn-länk)
- `public/media/` – bakgrundsvideo (60 s loop, 1080p ca 4,9 MB, 720p ca 1,9 MB för mobil) + stillbild
- `public/fonts/` – Figtree 500/800 (Google Fonts, OFL-1.1), självhostad
- `public/app.js` – datum och temperatur i sidhuvudet
- `src/worker.js` – `/api/vader`: hämtar lufttemperatur från SMHI (Stockholm-Observatoriekullen A, öppna data CC BY 4.0), cachas 10 min
- `wrangler.jsonc` – Cloudflare Workers, statiska filer från `public/`

Cloudflare: Workers-projekt kopplat till repot. Build command: tomt. Deploy command: `npx wrangler deploy`.
