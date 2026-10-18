# bhoff.se – v1

En enda statisk sida. Inget byggsteg: allt i `public/` publiceras som det är.

- `public/index.html` – sidan (text, stil, LinkedIn-länk)
- `public/media/` – bakgrundsvideo (60 s loop, 1080p ca 4,9 MB, 720p ca 1,9 MB för mobil) + stillbild
- `public/fonts/` – Figtree 500/800 (Google Fonts, OFL-1.1), självhostad
- `wrangler.jsonc` – Cloudflare Workers, statiska filer från `public/`

Cloudflare: Workers-projekt kopplat till repot. Build command: tomt. Deploy command: `npx wrangler deploy`.
