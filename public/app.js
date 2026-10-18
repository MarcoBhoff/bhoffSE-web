// bhoff.se – v5. Dagens datum och aktuell temperatur i Stockholm i sidhuvudet.
(function () {
  var dag = document.getElementById('dag');
  var vader = document.getElementById('vader');
  var txt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
  dag.textContent = txt.charAt(0).toUpperCase() + txt.slice(1); // "Söndag 18 oktober"

  fetch('/api/vader')
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) {
      if (typeof d.temp !== 'number') return;
      var t = Math.round(d.temp);
      vader.textContent = 'Stockholm ' + (t === 0 ? 0 : t) + ' °C';
      var kl = d.tid ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' }).format(new Date(d.tid)) : '';
      vader.title = 'Lufttemperatur från SMHI, ' + d.station + (kl ? ', uppmätt kl. ' + kl : '') + '. Avrundad till hela grader.';
      vader.hidden = false;
    })
    .catch(function () { /* inget väder visas om SMHI inte svarar */ });
})();
