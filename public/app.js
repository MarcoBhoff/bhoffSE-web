// bhoff.se – v11. Datum i sidhuvudet + väderruta i sidfoten (samma logik som mullra.se, egen text).
(function () {
  var d = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  document.getElementById('dag').textContent = d.charAt(0).toUpperCase() + d.slice(1); // "Onsdag 21 oktober"

  // Väder från SMHI (prognos snow1g) via /api/vader (Worker, cache 15 min). Rutan döljs om SMHI inte svarar.
  function ikon(k) {
    if (k === 1 || k === 2) return '☀️';
    if (k === 3 || k === 4) return '⛅';
    if (k === 5 || k === 6) return '☁️';
    if (k === 7) return '🌫️';
    if (k === 11 || k === 21) return '⛈️';
    if ((k >= 8 && k <= 10) || (k >= 18 && k <= 20)) return '🌧️';
    if ((k >= 12 && k <= 17) || k >= 22) return '🌨️';
    return '';
  }
  function dagnamn(om, datum) {
    if (om === 0) return 'i dag';
    if (om === 1) return 'i morgon';
    return 'på ' + new Intl.DateTimeFormat('sv-SE', { weekday: 'long', timeZone: 'UTC' }).format(new Date(datum + 'T12:00:00Z'));
  }
  fetch('/api/vader')
    .then(function (r) { return r.json(); })
    .then(function (v) {
      if (v.temp === null || v.temp === undefined) return;
      var om = typeof v.askaOm === 'number' ? v.askaOm : null, box = document.getElementById('vader');
      document.getElementById('vader-temp').textContent = v.temp + ' °C';
      document.getElementById('vader-ikon').textContent = v.natt ? '🌙' : ikon(v.symbol);
      document.getElementById('vader-text').textContent =
        om === 0 ? 'SMHI lovar åska i dag.'
        : om !== null ? 'SMHI lovar åska ' + dagnamn(om, v.askaDag) + '.'
        : 'SMHI lovar ingen åska den kommande veckan.';
      box.classList.toggle('aska', om === 0);
      box.hidden = false;
    })
    .catch(function () {});
})();
