(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var DAY = 86400000;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var daysAgo = function (n) { return new Date(today.getTime() - n * DAY); };
  var fmt = function (d) { return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var FACES = ['😫', '😕', '😐', '🙂', '😄'];

  // ---------- Maria's log (weekly, ending a week ago) ----------
  var raw = [
    [82.4, 6200, 3, 3, 'Yes', 'First week, sore legs'], [81.9, 7100, 4, 3, 'Yes', ''],
    [81.6, 6800, 3, 2, 'No', 'Work trip, ate out'], [81.0, 8200, 4, 4, 'Yes', 'Felt strong on squats'],
    [80.7, 8600, 4, 4, 'Yes', ''], [80.8, 7900, 3, 3, 'Yes', 'Bit stressed'],
    [80.1, 9100, 5, 5, 'Yes', 'Best week so far'], [79.8, 9400, 4, 4, 'Yes', '']
  ];
  var log = raw.map(function (r, i) {
    return { date: daysAgo(7 * (raw.length - i)), weight: r[0], steps: r[1], workouts: r[2], energy: r[3], nutri: r[4], notes: r[5] };
  });

  // ---------- other clients (for the coach view) ----------
  var others = [
    { name: 'Daniel', age: 27, goal: 'Gain', last: 2, weights: [70.1, 70.4, 70.6, 70.9, 71.2, 71.3, 71.7, 72.0], workouts: 4.4, nutri: 0.88 },
    { name: 'Linda', age: 61, goal: 'Lose', last: 21, weights: [95.0, 94.8, 95.1, 95.3, 95.0, 95.4], workouts: 1.2, nutri: 0.17 },
    { name: 'Tom', age: 45, goal: 'Maintain', last: 5, weights: [77.2, 77.0, 77.3, 77.1, 77.2, 77.0, 77.1, 77.2], workouts: 3.3, nutri: 0.88 },
    { name: 'Grace', age: 52, goal: 'Lose', last: 9, weights: [68.5, 68.3, 68.4, 68.6, 68.9, 69.1, 69.0], workouts: 1.9, nutri: 0.29 },
    { name: 'Robert', age: 68, goal: 'Maintain', last: 3, weights: [84.0, 83.8, 84.1, 83.9, 84.0, 83.8], workouts: 3.0, nutri: 0.83 },
    { name: 'Aisha', age: 23, goal: 'Lose', last: 6, weights: [63.2, 62.9, 62.6, 62.5, 62.1, 61.8], workouts: 4.0, nutri: 0.83 },
    { name: 'Ken', age: 39, goal: 'Gain', last: 4, weights: [74.5, 74.6, 74.3, 74.0, 73.8, 73.6], workouts: 3.5, nutri: 0.67 }
  ];

  function maria() {
    var w = log.map(function (r) { return r.weight; });
    var last = log[log.length - 1].date;
    return {
      name: 'Maria', age: 34, goal: 'Lose', me: true,
      last: Math.round((today - last) / DAY), weights: w,
      workouts: avg(log.map(function (r) { return r.workouts; })),
      nutri: log.filter(function (r) { return r.nutri === 'Yes'; }).length / log.length
    };
  }
  function avg(a) { return a.reduce(function (s, x) { return s + x; }, 0) / (a.length || 1); }
  function status(c) {
    var change = c.weights[c.weights.length - 1] - c.weights[0];
    if (c.last > 10) return 'Missed check-in';
    if (c.nutri < 0.6 || c.workouts < 2 || (c.goal === 'Lose' && change > 0) || (c.goal === 'Gain' && change < 0)) return 'Needs attention';
    return 'On track';
  }
  var stClass = { 'On track': 'ok', 'Needs attention': 'warn', 'Missed check-in': 'bad' };

  // ---------- spreadsheet table helper ----------
  function sheet(heads, rows, opts) {
    opts = opts || {};
    var cols = heads.length, h = '<table class="sh"><thead><tr><th class="ix"></th>';
    for (var i = 0; i < cols; i++) h += '<th class="ix">' + String.fromCharCode(65 + i) + '</th>';
    h += '</tr></thead><tbody><tr><td class="ix">1</td>';
    heads.forEach(function (x) { h += '<td class="hd">' + esc(x) + '</td>'; });
    h += '</tr>';
    rows.forEach(function (r, i) {
      h += '<tr class="' + (r.cls || '') + '"><td class="ix">' + (i + 2) + '</td>' + r.cells.join('') + '</tr>';
    });
    for (var e = 0; e < (opts.blank || 0); e++) {
      h += '<tr><td class="ix">' + (rows.length + 2 + e) + '</td>';
      for (var j = 0; j < cols; j++) h += '<td class="' + (opts.inputBlank ? 'in' : '') + '"></td>';
      h += '</tr>';
    }
    return h + '</tbody></table>';
  }
  var td = function (v, cls) { return '<td class="' + (cls || '') + '">' + v + '</td>'; };

  // ---------- views ----------
  var fresh = -1;
  function renderLog() {
    var rows = log.map(function (r, i) {
      return { cls: i === fresh ? 'new' : '', cells: [
        td(fmt(r.date), 'in'), td(r.weight.toFixed(1), 'in n'), td(r.steps.toLocaleString('en-US'), 'in n'),
        td(r.workouts, 'in n'), td(FACES[r.energy - 1] + ' ' + r.energy, 'in'), td(r.nutri, 'in'), td(esc(r.notes), 'in')] };
    });
    $('loggrid').innerHTML = sheet(['Date', 'Weight (kg)', 'Steps', 'Workouts', 'Energy', 'Nutrition', 'Notes'], rows, { blank: 3, inputBlank: true });
    var g = $('loggrid'); g.scrollTop = g.scrollHeight;
  }

  function streak() {
    var s = 1;
    for (var i = log.length - 1; i > 0; i--) { if ((log[i].date - log[i - 1].date) / DAY <= 8) s++; else break; }
    return s;
  }
  function renderStats() {
    var first = log[0], last = log[log.length - 1], ch = last.weight - first.weight;
    var last4 = log.slice(-4);
    var stats = [
      ['Check-ins so far', log.length], ['Weekly streak', streak() + ' weeks'],
      ['Starting weight (kg)', first.weight.toFixed(1)], ['Latest weight (kg)', last.weight.toFixed(1)],
      ['Change (kg)', (ch > 0 ? '+' : '') + ch.toFixed(1), ch < 0 ? 'good' : ''],
      ['Avg steps, last 4 weeks', Math.round(avg(last4.map(function (r) { return r.steps; }))).toLocaleString('en-US')],
      ['Avg workouts per week', avg(log.map(function (r) { return r.workouts; })).toFixed(1)],
      ['Nutrition on track', Math.round(log.filter(function (r) { return r.nutri === 'Yes'; }).length / log.length * 100) + '%'],
      ['Average energy', avg(log.map(function (r) { return r.energy; })).toFixed(1) + ' / 5']
    ];
    $('statgrid').innerHTML = sheet(['Measure', 'Value'], stats.map(function (s) {
      return { cells: [td(s[0], 'lab'), td(s[1], 'val ' + (s[2] || ''))] };
    }));
    lineChart(); barChart();
  }

  function lineChart() {
    var W = 520, H = 210, L = 44, R = 12, T = 12, B = 30;
    var ws = log.map(function (r) { return r.weight; });
    var lo = Math.floor(Math.min.apply(null, ws) - 0.5), hi = Math.ceil(Math.max.apply(null, ws) + 0.5);
    var x = function (i) { return L + i * (W - L - R) / Math.max(1, ws.length - 1); };
    var y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var g = '';
    for (var v = lo; v <= hi; v++) g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#E2E3E3"/><text x="' + (L - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="#5F6368" font-family="Arial">' + v + '</text>';
    var d = ws.map(function (w, i) { return (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(w).toFixed(1); }).join(' ');
    g += '<path d="' + d + '" fill="none" style="stroke:var(--brand)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>';
    ws.forEach(function (w, i) {
      g += '<circle cx="' + x(i) + '" cy="' + y(w) + '" r="' + (i === ws.length - 1 ? 5.5 : 3.5) + '" style="fill:var(--brand)" stroke="#fff" stroke-width="2"/>';
      if (i % 2 === 0 || i === ws.length - 1) g += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="' + (i === ws.length - 1 ? 'end' : i === 0 ? 'start' : 'middle') + '" font-size="11" fill="#5F6368" font-family="Arial">' + fmt(log[i].date) + '</text>';
    });
    $('c-weight').innerHTML = g;
  }
  function barChart() {
    var W = 520, H = 170, L = 30, R = 8, T = 10, B = 26, n = log.length;
    var bw = (W - L - R) / n, g = '';
    for (var v = 0; v <= 7; v += 7) g += '<text x="' + (L - 8) + '" y="' + (T + (7 - v) / 7 * (H - T - B) + 4) + '" text-anchor="end" font-size="11" fill="#5F6368" font-family="Arial">' + v + '</text>';
    log.forEach(function (r, i) {
      var h = r.workouts / 7 * (H - T - B), xx = L + i * bw + bw * 0.18;
      g += '<rect x="' + xx + '" y="' + (H - B - h) + '" width="' + bw * 0.64 + '" height="' + h + '" rx="3" style="fill:var(--brand)"/>';
      g += '<text x="' + (xx + bw * 0.32) + '" y="' + (H - B - h - 4) + '" text-anchor="middle" font-size="11" fill="#202124" font-family="Arial">' + r.workouts + '</text>';
    });
    g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '" stroke="#BDC1C6"/>';
    $('c-work').innerHTML = g;
  }

  var filter = 'all';
  function spark(ws) {
    var W = 90, H = 24, lo = Math.min.apply(null, ws), hi = Math.max.apply(null, ws), span = (hi - lo) || 1;
    var d = ws.map(function (w, i) { return (i ? 'L' : 'M') + (2 + i * (W - 4) / (ws.length - 1)).toFixed(1) + ' ' + (2 + (hi - w) / span * (H - 4)).toFixed(1); }).join(' ');
    return '<svg class="spark" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true"><path d="' + d + '" fill="none" style="stroke:var(--brand)" stroke-width="2"/></svg>';
  }
  function renderDash() {
    var all = [maria()].concat(others).map(function (c) { c.status = status(c); return c; });
    var order = { 'Missed check-in': 0, 'Needs attention': 1, 'On track': 2 };
    all.sort(function (a, b) { return order[a.status] - order[b.status] || b.last - a.last; });
    var shown = all.filter(function (c) { return filter === 'all' || c.status === filter; });
    var counts = { ok: 0, warn: 0, bad: 0 };
    all.forEach(function (c) { counts[stClass[c.status]]++; });
    $('dashsum').textContent = counts.ok + ' on track, ' + counts.warn + ' need attention, ' + counts.bad + ' missed a check-in';
    $('dashgrid').innerHTML = sheet(['Client', 'Age', 'Goal', 'Last check-in', 'Days since', 'Weight change (kg)', 'Workouts / week', 'Nutrition', 'Status', 'Weight trend'],
      shown.map(function (c) {
        var ch = c.weights[c.weights.length - 1] - c.weights[0];
        return { cls: c.me ? 'me' : '', cells: [
          td(esc(c.name) + (c.me ? ' (your check-ins)' : '')), td(c.age, 'n'), td(c.goal), td(fmt(daysAgo(c.last))),
          td(c.last, 'n' + (c.last > 10 ? ' late' : '')), td((ch > 0 ? '+' : '') + ch.toFixed(1), 'n'),
          td(c.workouts.toFixed(1), 'n'), td(Math.round(c.nutri * 100) + '%', 'n'),
          td('<span class="st ' + stClass[c.status] + '">' + c.status + '</span>'), td(spark(c.weights))] };
      }));
  }

  // ---------- form ----------
  var form = { workouts: 4, energy: 4, nutri: 'Yes' };
  function chips() {
    $('f-workouts').innerHTML = [0, 1, 2, 3, 4, 5, 6, 7].map(function (n) {
      return '<button type="button" role="radio" aria-checked="' + (n === form.workouts) + '" data-w="' + n + '">' + n + '</button>';
    }).join('');
    $('f-energy').innerHTML = FACES.map(function (f, i) {
      return '<button type="button" role="radio" aria-checked="' + (i + 1 === form.energy) + '" data-e="' + (i + 1) + '" aria-label="Energy ' + (i + 1) + ' of 5">' + f + '</button>';
    }).join('');
  }
  $('fdate').textContent = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.v && b.getAttribute('role') === 'tab') {
      document.querySelectorAll('.sheettabs [role=tab]').forEach(function (t) { t.setAttribute('aria-selected', String(t === b)); });
      document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.id !== b.dataset.v; });
      window.scrollTo(0, 0); return;
    }
    if (b.dataset.brand) {
      document.documentElement.style.setProperty('--brand', b.dataset.brand);
      document.documentElement.style.setProperty('--soft', b.dataset.soft);
      document.querySelectorAll('.swatches button').forEach(function (s) { s.setAttribute('aria-checked', String(s === b)); });
      return;
    }
    if (b.dataset.step) {
      var inp = $('f-weight'), v = parseFloat(inp.value.replace(',', '.')) || 0;
      inp.value = Math.max(0, v + parseFloat(b.dataset.step)).toFixed(1); return;
    }
    if (b.dataset.w) { form.workouts = +b.dataset.w; chips(); return; }
    if (b.dataset.e) { form.energy = +b.dataset.e; chips(); return; }
    if (b.parentNode.id === 'f-nutri') {
      form.nutri = b.dataset.v;
      b.parentNode.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      return;
    }
    if (b.dataset.f) {
      filter = b.dataset.f;
      document.querySelectorAll('.filters button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      renderDash();
    }
  });

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    var w = parseFloat($('f-weight').value.replace(',', '.')), s = parseInt($('f-steps').value.replace(/\D/g, ''), 10);
    if (!(w > 25 && w < 300)) { $('f-weight').focus(); return; }
    if (!(s >= 0)) { $('f-steps').focus(); return; }
    var last = log[log.length - 1];
    var entry = { date: new Date(today), weight: w, steps: s, workouts: form.workouts, energy: form.energy, nutri: form.nutri, notes: $('f-notes').value.trim() };
    if (+last.date === +today) log[log.length - 1] = entry; else log.push(entry);
    fresh = log.length - 1;
    $('f-notes').value = '';
    $('sent').hidden = false;
    renderAll();
  });

  function renderAll() { renderLog(); renderStats(); renderDash(); }
  chips(); renderAll();
})();
