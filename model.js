// GLGC Hub Dashboard — model + shared helpers.
// Turns the fixed ROSTER (roster.js) + attendance records into one MODEL
// object that every page reads. Records come from EITHER:
//   1. a published Google Sheet (set SHEET_CSV_URL + USE_SAMPLE=false), or
//   2. built-in sample data (default), so the site works before any sheet exists.
//
// MODEL shape:
//   weeks     [{ week, satDate, satLabel, sunDate, sunLabel, label }]
//   shepherds [{ id,name,choir,governor,photoKey, rec:{week:{sat,sun}}, satRate, sunRate }]
//   governors [{ id,governor,choir, shepherdIds, roster, points:[{week,satPresent,sunPresent,offering,roster}] }]
//   choirs    [{ choir, governorIds, shepherdIds, roster, points:[...] }]
//   weekly    [{ week,label, satPresent,sunPresent,offering,roster }]

window.GLGC = (function () {

  // ---- CONFIG ---------------------------------------------------------------
  var USE_SAMPLE = true;                 // flip to false once the sheet is live
  var SHEET_CSV_URL = '';                // published-to-web CSV of the sheet

  // ---- weeks ----------------------------------------------------------------
  // Eight recent weeks. Saturday = rehearsal day; Sunday = the next day.
  // Dates are fixed (no Date.now) so the view is stable.
  var WEEK_DEFS = [
    { week: 22, sat: '2026-05-30' },
    { week: 23, sat: '2026-06-06' },
    { week: 24, sat: '2026-06-13' },
    { week: 25, sat: '2026-06-20' },
    { week: 26, sat: '2026-06-27' },
    { week: 27, sat: '2026-07-04' }
  ];

  function fmt(d) {
    var dd = ('0' + d.getDate()).slice(-2);
    var mm = ('0' + (d.getMonth() + 1)).slice(-2);
    var yy = String(d.getFullYear()).slice(-2);
    return dd + '/' + mm + '/' + yy;
  }

  function buildWeeks() {
    return WEEK_DEFS.map(function (w) {
      var sat = new Date(w.sat + 'T00:00:00');
      var sun = new Date(sat.getTime() + 24 * 3600 * 1000);
      return {
        week: w.week,
        satDate: sat, sunDate: sun,
        satLabel: fmt(sat), sunLabel: fmt(sun),
        label: 'WK ' + w.week + ' · ' + fmt(sat)
      };
    });
  }

  // ---- deterministic pseudo-random (stable screenshots) ---------------------
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h;
  }
  function rand01(seed) { return (hash(seed) % 1000) / 1000; }

  // ---- sample records -------------------------------------------------------
  // Each shepherd has a "reliability" that shapes how often they show up.
  function sampleRecords(weeks) {
    var rec = {};       // shId -> { week -> {sat,sun} }
    var offering = {};  // govId -> { week -> GHS }
    ROSTER.shepherds.forEach(function (s) {
      var reliab = 0.55 + rand01(s.id + 'r') * 0.4;          // 0.55–0.95
      rec[s.id] = {};
      weeks.forEach(function (w) {
        var sat = rand01(s.id + 'sat' + w.week) < reliab;
        // Sunday attendance a touch higher than Saturday rehearsal.
        var sun = rand01(s.id + 'sun' + w.week) < Math.min(0.97, reliab + 0.1);
        rec[s.id][w.week] = { sat: sat, sun: sun };
      });
    });
    // Offering: per hub per week, roughly GHS 8–20 per shepherd present on Saturday.
    ROSTER.shepherds.forEach(function (s) {
      if (!offering[s.governorId]) offering[s.governorId] = {};
    });
    return { rec: rec, offering: offering };
  }

  // ---- build MODEL ----------------------------------------------------------
  function build(records) {
    var weeks = buildWeeks();
    var rec = records.rec;

    // shepherds
    var shepherds = ROSTER.shepherds.map(function (s) {
      var r = rec[s.id] || {};
      var satN = 0, sunN = 0, wk = 0;
      weeks.forEach(function (w) {
        var e = r[w.week];
        if (e) { wk++; if (e.sat) satN++; if (e.sun) sunN++; }
      });
      return {
        id: s.id, name: s.name, phone: s.phone, choir: s.choir,
        governor: s.governor, governorId: s.governorId, photoKey: s.photoKey,
        rec: r,
        satPresent: satN, sunPresent: sunN, weeksTracked: wk,
        satRate: wk ? Math.round(satN / wk * 100) : 0,
        sunRate: wk ? Math.round(sunN / wk * 100) : 0
      };
    });
    var byId = {};
    shepherds.forEach(function (s) { byId[s.id] = s; });

    // governors (hubs)
    var govMap = {};
    ROSTER.hubs.forEach(function (hub) {
      var id = shepherds.filter(function (s) {
        return s.choir === hub.choir && s.governor === hub.governor;
      });
      if (!id.length) return;
      var gid = id[0].governorId;
      var shepIds = id.map(function (s) { return s.id; });
      var points = weeks.map(function (w) {
        var satP = 0, sunP = 0;
        shepIds.forEach(function (sid) {
          var e = byId[sid].rec[w.week];
          if (e) { if (e.sat) satP++; if (e.sun) sunP++; }
        });
        // Hub offering derived from Saturday turnout (sample). Real value overrides later.
        var off = Math.round(satP * (10 + rand01(gid + w.week) * 10));
        return { week: w.week, label: w.label, satPresent: satP, sunPresent: sunP,
                 offering: off, roster: shepIds.length };
      });
      govMap[gid] = { id: gid, governor: hub.governor, choir: hub.choir,
                      shepherdIds: shepIds, roster: shepIds.length,
                      membership: shepIds.length, points: points };
    });
    var governors = Object.keys(govMap).map(function (k) { return govMap[k]; });

    // choirs
    var choirNames = [];
    shepherds.forEach(function (s) { if (choirNames.indexOf(s.choir) < 0) choirNames.push(s.choir); });
    var choirs = choirNames.map(function (cn) {
      var govs = governors.filter(function (g) { return g.choir === cn; });
      var shepIds = [];
      govs.forEach(function (g) { shepIds = shepIds.concat(g.shepherdIds); });
      var points = weeks.map(function (w, i) {
        var satP = 0, sunP = 0, off = 0;
        govs.forEach(function (g) {
          satP += g.points[i].satPresent; sunP += g.points[i].sunPresent;
          off += g.points[i].offering;
        });
        return { week: w.week, label: w.label, satPresent: satP, sunPresent: sunP,
                 offering: off, roster: shepIds.length };
      });
      return { choir: cn, governorIds: govs.map(function (g) { return g.id; }),
               shepherdIds: shepIds, roster: shepIds.length,
               membership: shepIds.length, points: points };
    });

    // ministry weekly totals
    var weekly = weeks.map(function (w, i) {
      var satP = 0, sunP = 0, off = 0;
      choirs.forEach(function (c) {
        satP += c.points[i].satPresent; sunP += c.points[i].sunPresent;
        off += c.points[i].offering;
      });
      return { week: w.week, label: w.label, satPresent: satP, sunPresent: sunP,
               offering: off, roster: shepherds.length };
    });

    return { weeks: weeks, shepherds: shepherds, byId: byId,
             governors: governors, choirs: choirs, weekly: weekly };
  }

  // ---- public load ----------------------------------------------------------
  function load(onOk, onErr) {
    try {
      if (USE_SAMPLE || !SHEET_CSV_URL) {
        var weeks = buildWeeks();
        onOk(build(sampleRecords(weeks)));
        return;
      }
      // Live sheet path — parse CSV into records. (Wired in the deploy step.)
      fetch(SHEET_CSV_URL).then(function (r) { return r.text(); })
        .then(function (csv) { onOk(build(parseSheet(csv))); })
        .catch(onErr || function () {});
    } catch (e) { (onErr || function () {})(e); }
  }

  // Placeholder — filled in when the real sheet layout is fixed.
  function parseSheet(csv) { return sampleRecords(buildWeeks()); }

  // ---- shared chart helpers -------------------------------------------------
  var C = { blue: '#1f5fff', gold: '#e6c878', red: '#e2574c', green: '#38b26a', grey: '#5a5a5a' };

  // Prints the value on top of each bar.
  var valueLabels = {
    id: 'valueLabels',
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach(function (bar, i) {
          var v = ds.data[i];
          if (v == null || v === 0) return;
          ctx.save();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(ds.label && ds.label.indexOf('Offering') >= 0 ? v : v, bar.x, bar.y - 6);
          ctx.restore();
        });
      });
    }
  };

  // Same, for horizontal (indexAxis:'y') bars — label sits to the right of each bar.
  var valueLabelsH = {
    id: 'valueLabelsH',
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx;
      chart.data.datasets.forEach(function (ds, di) {
        var meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach(function (bar, i) {
          var v = ds.data[i];
          if (v == null) return;
          ctx.save();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(v, bar.x + 6, bar.y);
          ctx.restore();
        });
      });
    }
  };

  function initials(name) {
    return name.split(/[\s\-]+/).filter(Boolean).slice(0, 2)
      .map(function (w) { return w.charAt(0); }).join('').toUpperCase();
  }

  // photos/<key>.jpg|jpeg|png|webp, else initials circle.
  function setAvatar(imgEl, initEl, key, name) {
    var exts = ['jpg', 'jpeg', 'png', 'webp'], i = 0;
    initEl.textContent = initials(name);
    initEl.style.display = 'flex';
    imgEl.style.display = 'none';
    (function tryNext() {
      if (i >= exts.length) return;
      imgEl.onload = function () { imgEl.style.display = 'block'; initEl.style.display = 'none'; };
      imgEl.onerror = function () { i++; tryNext(); };
      imgEl.src = 'photos/' + encodeURIComponent(key) + '.' + exts[i];
    })();
  }

  return { load: load, valueLabels: valueLabels, valueLabelsH: valueLabelsH, colors: C,
           initials: initials, setAvatar: setAvatar };
})();
