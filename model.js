// GLGC Hub Dashboard — model + shared helpers (LIVE data).
// Structure comes from the fixed ROSTER (roster.js, your 100-shepherd list).
// Real numbers come from two live Google Sheets, matched onto your roster
// GOVERNORS by name. Anything with no matching data is left blank.
//   • Sunday attendance  — the "GLGC 2026 Attendance" matrix (per governor, per Sunday)
//   • Saturday rehearsal + offering — the rehearsal form responses (per leader, per week)
//
// Per-shepherd attendance does not exist in either sheet yet, so individual
// shepherd graphs stay blank until the Sunday form starts collecting it.

window.GLGC = (function () {

  // ---- live sources ---------------------------------------------------------
  var SUN_ID = '1rXQDsGNKxZFZBa7PA_aMmwrgRIwAiJiHcRo-pC2y05o', SUN_SHEET = 'Attendance';
  var SAT_ID = '1ZVpZ9LtsKZX0h3_bbXb3OLuTKrVxG5W3KJS8UEMdUgg';
  // New per-shepherd Sunday form (responses), live from 5 July 2026 onward.
  var SUN2_ID = '1WPWrsr1ZjLJS2TfculSceh3cDMz4ZiRcCZTnhMNrQog';

  // Normalized sheet name -> your roster governor's display name.
  // Handles the spelling differences between the sheets and your list.
  var SHEET_TO_GOV = {
    'kiki heward-mills':'Kiki Heward-Mills', 'kiki heward mills':'Kiki Heward-Mills',
    'lois dorothy nteful':'Lois Nterful', 'lois nterful':'Lois Nterful', 'lois nteful':'Lois Nterful',
    'ninette dodoo':'Ninette Dodoo',
    'keziah ogoe':'Keziah Ogoe', 'kezia ogoe':'Keziah Ogoe',
    'christiana dzekoe':'Christiana Dzekoe',
    'jeffrey lamptey':'RJ (Rev Jeffrey Lamptey)', 'rev jeffrey lamptey':'RJ (Rev Jeffrey Lamptey)',
    'claudia quayson':'Claudia Quayson',
    'stephanie bediako':'Stephanie Bediako',
    'dorcas oppong poku':'Dorcas Poku', 'dorcas poku':'Dorcas Poku',
    'hannah-joy adade':'Hannah-Joy Adade', 'hannah joy adade':'Hannah-Joy Adade',
    'michelle william-addo':'Michelle William-Addo',
    'helen fenuku':'Helen Feneku', 'helen feneku':'Helen Feneku',
    'johanna nakoja':'Johanna Nakoja',
    'joanita bentil':'Joanita Djabatey', 'joanita djabatey':'Joanita Djabatey',
    'david orleans-lindsay':'David Aseda Orleans-Lindsay', 'david aseda':'David Aseda Orleans-Lindsay',
    'david aseda orleans-lindsay':'David Aseda Orleans-Lindsay',
    'dorcas longdon':'Dorcas Longdon',
    'rejoice amartey':'Rejoice Amartey',
    'davidina adagbe':'Davidina Adagbe',
    'emmanuel owiredu':'Emmanuel Owiredu'
  };

  // Rehearsal leaders & Sunday submitters are matched to a roster shepherd BY NAME
  // (they now use full names). This alias table only covers spelling variants where
  // the form name differs from the roster name — everything else matches directly,
  // so new reporters are picked up automatically. Value = the roster shepherd's name.
  var SHEP_ALIAS = {
    'helen fenuku':'Helen Feneku',
    'kezia ogoe':'Keziah Ogoe',
    'david aseda':'David Aseda Orleans-Lindsay',
    'sharon-rose nartey':'Sharon Rose Nartey',
    'pascaline obaze':'Pascaline Obadze',
    'hannah-joy adade':'Hannah Joy Adade',
    'abigail charis':'Abigail Charis Adom-Barnor',
    'patience oriella':'Patience Oriella Nortey'
  };

  function norm(s){ return String(s == null ? '' : s).toLowerCase().replace(/\s+/g,' ').trim(); }
  function slug(s){ return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  var MONTHS = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,
                 september:8,october:9,november:10,december:11 };

  function fmt(d){ var p=function(n){return('0'+n).slice(-2);};
    return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(-2); }
  function isoWeek(d){ var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
    var day=(t.getUTCDay()+6)%7; t.setUTCDate(t.getUTCDate()-day+3);
    var f=new Date(Date.UTC(t.getUTCFullYear(),0,4));
    return 1+Math.round(((t-f)/86400000-3+((f.getUTCDay()+6)%7))/7); }

  // "08 February 2026", "5th April 2026", "31st May 2026" -> Date, else null.
  function parseSunLabel(label){
    var s=String(label||'').replace(/,/g,' ').replace(/\s+/g,' ').trim();
    var m=s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(\d{4})$/);
    if(!m) return null;
    var mo=MONTHS[m[2].toLowerCase()]; if(mo==null) return null;
    return new Date(+m[3], mo, +m[1]);
  }
  // gviz date cell: "Date(2026,5,27)" -> Date
  function parseGvizDate(v){
    if(v instanceof Date) return v;
    var m=String(v||'').match(/Date\((\d+),(\d+),(\d+)/);
    return m ? new Date(+m[1], +m[2], +m[3]) : null;
  }

  // ---- fetch both sheets via gviz JSONP, then build -------------------------
  function load(cb, onErr){
    var got={}, done=false;
    function fail(e){ if(!done){ done=true; (onErr||function(){})(e); } }
    function ready(){
      if(got.sun && got.sat && got.sun2 && !done){
        done=true;
        try { cb(build(parseSun(got.sun), parseSat(got.sat), parseSun2(got.sun2))); }
        catch(e){ (onErr||function(){})(e); }
      }
    }
    window.__glgcSun=function(r){ got.sun=r; ready(); };
    window.__glgcSat=function(r){ got.sat=r; ready(); };
    window.__glgcSun2=function(r){ got.sun2=r; ready(); };
    inject('https://docs.google.com/spreadsheets/d/'+SUN_ID+
      '/gviz/tq?tqx=out:json;responseHandler:__glgcSun&sheet='+encodeURIComponent(SUN_SHEET)+
      '&range=A2:AZ500&headers=1', fail);
    inject('https://docs.google.com/spreadsheets/d/'+SAT_ID+
      '/gviz/tq?tqx=out:json;responseHandler:__glgcSat', fail);
    inject('https://docs.google.com/spreadsheets/d/'+SUN2_ID+
      '/gviz/tq?tqx=out:json;responseHandler:__glgcSun2', fail);
  }
  function inject(url, fail){
    var s=document.createElement('script'); s.src=url;
    s.onerror=function(){ fail(new Error('Could not reach a sheet')); };
    document.body.appendChild(s);
  }

  // ---- parse Sunday matrix into per-governor weekly attendance --------------
  function parseSun(resp){
    var cols=resp.table.cols, weekCols=[];
    for(var i=2;i<cols.length;i++){
      var d=parseSunLabel(cols[i].label);
      if(d) weekCols.push({ idx:i, date:d });
    }
    weekCols.sort(function(a,b){ return a.date-b.date; });
    var byGov={};
    (resp.table.rows||[]).forEach(function(r){
      var c=r.c||[];
      var a=c[0]&&c[0].v, b=c[1]&&c[1].v;
      if(a==null&&b==null) return;
      if(b==='GRAND TOTAL'||b==='TOTAL'||a===b) return;   // totals / service headers
      var gov=SHEET_TO_GOV[norm(b)]; if(!gov) return;      // only names we can place
      var vals=weekCols.map(function(w){
        var v=c[w.idx]&&c[w.idx].v; return (v==null||v==='')?null:(+v);
      });
      byGov[gov]=vals;   // one governor row per governor in this sheet
    });
    return { weekCols:weekCols, byGov:byGov };
  }

  // ---- parse Saturday form into matched (governor, date, att, off) rows -----
  function parseSat(resp){
    var cols=resp.table.cols.map(function(c){ return norm(c.label); });
    function find(){ for(var i=0;i<arguments.length;i++){ var k=cols.indexOf(arguments[i]); if(k>=0) return k; } return -1; }
    var iDate=find('date'), iLeader=find('name of leader who had the service'),
        iAtt=find('attendance'), iOff=find('offering'), iHub=find('hub location');
    var rows=[];
    (resp.table.rows||[]).forEach(function(r){
      var c=r.c||[];
      var leaderRaw=String((c[iLeader]&&c[iLeader].v)||'').trim();
      var leader=norm(leaderRaw); if(!leader) return;
      var d=parseGvizDate(c[iDate]&&c[iDate].v); if(!d) return;
      rows.push({ leader:leader, leaderRaw:leaderRaw,
        location:String((c[iHub]&&c[iHub].v)||'').trim(), date:d,
        att:+(c[iAtt]&&c[iAtt].v)||0, off:+(c[iOff]&&c[iOff].v)||0 });
    });
    return rows;
  }

  // ---- parse the new per-shepherd Sunday form ------------------------------
  // Columns: Timestamp | Date | Service | Name of Choir | Name of Shepherd | Attendance | ...
  function parseSun2(resp){
    var cols=resp.table.cols.map(function(c){ return norm(c.label); });
    function find(){ for(var i=0;i<arguments.length;i++){ var k=cols.indexOf(arguments[i]); if(k>=0) return k; } return -1; }
    var iDate=find('date'), iChoir=find('name of choir'), iShep=find('name of shepherd'), iAtt=find('attendance');
    var rows=[];
    (resp.table.rows||[]).forEach(function(r){
      var c=r.c||[];
      var d=parseGvizDate(c[iDate]&&c[iDate].v); if(!d) return;
      var shepRaw=String((c[iShep]&&c[iShep].v)||'').trim(); if(!shepRaw) return;
      var choirRaw=String((c[iChoir]&&c[iChoir].v)||'').trim();
      rows.push({ date:d, choirRaw:choirRaw, choir:norm(choirRaw),
        shepRaw:shepRaw, shep:norm(shepRaw), att:+(c[iAtt]&&c[iAtt].v)||0 });
    });
    return rows;
  }

  // ---- build MODEL onto the roster ------------------------------------------
  function build(sun, sat, sun2){
    sun2 = sun2 || [];
    // The service Sunday for any rehearsal date = the Sunday on/after it.
    function nextSunday(d){
      var x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
      x.setDate(x.getDate()+((7-x.getDay())%7));
      return x;
    }
    // Weeks = the Sunday columns PLUS any newer week that already has rehearsal
    // or per-shepherd Sunday data, so "this week" appears even before its column exists.
    var weekMap={};
    sun.weekCols.forEach(function(w){ weekMap[w.date.getTime()]=w.date; });
    sat.forEach(function(row){ var s=nextSunday(row.date); weekMap[s.getTime()]=s; });
    sun2.forEach(function(row){ var s=nextSunday(row.date); weekMap[s.getTime()]=s; });
    var weeks=Object.keys(weekMap).map(function(k){ return weekMap[k]; })
      .sort(function(a,b){ return a-b; })
      .map(function(sunD){
        var satD=new Date(sunD.getTime()-86400000);
        return { week:isoWeek(sunD), sunDate:sunD, satDate:satD,
                 sunLabel:fmt(sunD), satLabel:fmt(satD), label:'WK '+isoWeek(sunD)+' · '+fmt(sunD) };
      });
    // Sunday values are keyed by date (the columns don't cover the newest weeks).
    var sunIdxByTime={};
    sun.weekCols.forEach(function(w,i){ sunIdxByTime[w.date.getTime()]=i; });
    // exact week index for a rehearsal date
    function weekIndexFor(date){
      var s=nextSunday(date).getTime();
      for(var i=0;i<weeks.length;i++){ if(weeks[i].sunDate.getTime()===s) return i; }
      return -1;
    }

    // shepherds skeleton + lookups for attribution
    var shepByKey={};   // governor|name (for Saturday SAT_TO_SHEP)
    var shepByCS={};    // choirNorm|nameNorm (for the Sunday form)
    var shepByName={};  // nameNorm -> shepherd if unique
    var shepherds=ROSTER.shepherds.map(function(s){
      var o={ id:s.id, name:s.name, phone:s.phone, choir:s.choir,
        governor:s.governor, governorId:s.governorId, photoKey:s.photoKey, _sat:{}, _sun:{} };
      shepByKey[s.governor+'|'+s.name]=o;
      shepByCS[norm(s.choir)+'|'+norm(s.name)]=o;
      var nk=norm(s.name);
      shepByName[nk] = shepByName[nk] ? null : o;   // null marks an ambiguous name
      return o;
    });

    // resolve a reporter name (rehearsal leader or Sunday submitter) to a roster shepherd.
    function resolveShep(normName){
      var canon=SHEP_ALIAS[normName];
      var s=shepByName[canon?norm(canon):normName];
      return (s && typeof s==='object') ? s : null;   // null = unmatched or an ambiguous name
    }
    var unmatched={};

    // Rehearsal (Saturday) -> the shepherd who led it. Governor & choir totals are the
    // SUM of their shepherds, so a choir's attendance always equals its shepherds added up.
    var satWeekly=weeks.map(function(){ return {}; });   // weekIdx -> raw per-submission (for the by-hub view)
    sat.forEach(function(row){
      var i=weekIndexFor(row.date); if(i<0) return;
      var sh=resolveShep(row.leader);
      if(sh){ var cs=sh._sat[i]||(sh._sat[i]={att:0,off:0}); cs.att+=row.att; cs.off+=row.off; }
      else if(row.leader) unmatched['rehearsal — '+row.leaderRaw]=1;
      var key=row.leader+'|'+row.location.toLowerCase();
      var cell=satWeekly[i][key]||(satWeekly[i][key]={name:row.leaderRaw, location:row.location, att:0, off:0});
      cell.att+=row.att; cell.off+=row.off;
    });
    satWeekly=satWeekly.map(function(b){
      return Object.keys(b).map(function(k){ return b[k]; })
        .sort(function(a,b){ return a.name.localeCompare(b.name); });
    });

    // Per-shepherd Sunday form (from 5 Jul) -> the shepherd who submitted.
    sun2.forEach(function(row){
      var i=weekIndexFor(row.date); if(i<0) return;
      var sh=resolveShep(row.shep);
      if(sh){ sh._sun[i]=(sh._sun[i]||0)+row.att; }
      else if(row.shep) unmatched['sunday — '+row.shepRaw]=1;
    });

    // shepherd points — rehearsal turnout + offering, and (from 5 Jul) Sunday attendance
    shepherds.forEach(function(s){
      s.points=weeks.map(function(w,i){
        var c=s._sat[i], su=s._sun[i];
        return { week:w.week, label:w.label, satPresent:(c?c.att:null),
                 offering:(c?c.off:null), sunPresent:(su==null?null:su), roster:1 };
      });
      s.hasData=s.points.some(function(p){ return p.satPresent!=null||p.offering!=null||p.sunPresent!=null; });
      delete s._sat; delete s._sun;
    });
    var byId={}; shepherds.forEach(function(s){ byId[s.id]=s; });

    // governors (hubs) — every total is the SUM of the hub's shepherds. Sunday also
    // uses the historical per-governor matrix for pre-July weeks where it exists.
    var govMap={};
    ROSTER.hubs.forEach(function(hub){
      var hubShep=shepherds.filter(function(s){ return s.choir===hub.choir && s.governor===hub.governor; });
      if(!hubShep.length) return;
      var shepIds=hubShep.map(function(s){ return s.id; });
      var gid=slug(hub.choir)+'__'+slug(hub.governor);
      var sunVals=sun.byGov[hub.governor]||null;
      var points=weeks.map(function(w,i){
        var satP=null, off=null, sunP=null;
        hubShep.forEach(function(s){
          var p=s.points[i];
          if(p.satPresent!=null) satP=(satP||0)+p.satPresent;
          if(p.offering!=null)   off=(off||0)+p.offering;
          if(p.sunPresent!=null) sunP=(sunP||0)+p.sunPresent;
        });
        var si=sunIdxByTime[w.sunDate.getTime()];
        var mSun=(sunVals && si!=null)?sunVals[si]:null;   // historical hub headcount
        if(mSun!=null) sunP=mSun;
        return { week:w.week, label:w.label, satPresent:satP, offering:off, sunPresent:sunP, roster:shepIds.length };
      });
      govMap[gid]={ id:gid, governor:hub.governor, choir:hub.choir,
        shepherdIds:shepIds, roster:shepIds.length, membership:shepIds.length,
        points:points,
        hasData:points.some(function(p){ return p.sunPresent!=null||p.satPresent!=null||p.offering!=null; }) };
    });
    var governors=Object.keys(govMap).map(function(k){ return govMap[k]; });

    // choirs — sum their governors (null treated as nothing)
    var choirNames=[];
    shepherds.forEach(function(s){ if(choirNames.indexOf(s.choir)<0) choirNames.push(s.choir); });
    function sumField(list,i,f){
      var any=false, tot=0;
      list.forEach(function(g){ var v=g.points[i][f]; if(v!=null){ any=true; tot+=v; } });
      return any?tot:null;
    }
    var choirs=choirNames.map(function(cn){
      var govs=governors.filter(function(g){ return g.choir===cn; });
      var shepIds=[]; govs.forEach(function(g){ shepIds=shepIds.concat(g.shepherdIds); });
      var points=weeks.map(function(w,i){
        // every choir total = sum of its governors, which each = sum of their shepherds
        return { week:w.week, label:w.label,
          sunPresent:sumField(govs,i,'sunPresent'),
          satPresent:sumField(govs,i,'satPresent'),
          offering:sumField(govs,i,'offering'),
          roster:shepIds.length };
      });
      return { choir:cn, governorIds:govs.map(function(g){return g.id;}),
        shepherdIds:shepIds, roster:shepIds.length, membership:shepIds.length,
        points:points,
        hasData:points.some(function(p){ return p.sunPresent!=null||p.satPresent!=null||p.offering!=null; }) };
    });

    // whole-ministry weekly totals
    var weekly=weeks.map(function(w,i){
      return { week:w.week, label:w.label,
        sunPresent:sumField(choirs,i,'sunPresent')||0,
        satPresent:sumField(choirs,i,'satPresent')||0,
        offering:sumField(choirs,i,'offering')||0,
        roster:shepherds.length };
    });

    return { weeks:weeks, shepherds:shepherds, byId:byId,
             governors:governors, choirs:choirs, weekly:weekly, satWeekly:satWeekly,
             unmatched:Object.keys(unmatched).sort() };
  }

  // ---- shared chart helpers -------------------------------------------------
  var C={ blue:'#1f5fff', gold:'#e6c878', red:'#e2574c', green:'#38b26a', sun:'#f5c518' };

  var valueLabels={
    id:'valueLabels',
    afterDatasetsDraw:function(chart){
      var ctx=chart.ctx;
      chart.data.datasets.forEach(function(ds,di){
        var meta=chart.getDatasetMeta(di); if(meta.hidden) return;
        meta.data.forEach(function(bar,i){
          var v=ds.data[i]; if(v==null||v===0) return;
          ctx.save(); ctx.fillStyle='#fff'; ctx.font='bold 12px Arial'; ctx.textAlign='center';
          ctx.fillText(v, bar.x, bar.y-6); ctx.restore();
        });
      });
    }
  };
  var valueLabelsH={
    id:'valueLabelsH',
    afterDatasetsDraw:function(chart){
      var ctx=chart.ctx;
      chart.data.datasets.forEach(function(ds,di){
        var meta=chart.getDatasetMeta(di); if(meta.hidden) return;
        meta.data.forEach(function(bar,i){
          var v=ds.data[i]; if(v==null) return;
          ctx.save(); ctx.fillStyle='#fff'; ctx.font='bold 12px Arial';
          ctx.textAlign='left'; ctx.textBaseline='middle';
          ctx.fillText(v, bar.x+6, bar.y); ctx.restore();
        });
      });
    }
  };

  function initials(name){
    return name.split(/[\s\-]+/).filter(Boolean).slice(0,2)
      .map(function(w){ return w.charAt(0); }).join('').toUpperCase();
  }
  function setAvatar(imgEl, initEl, key, name){
    var exts=['jpg','jpeg','png','webp'], i=0;
    initEl.textContent=initials(name); initEl.style.display='flex'; imgEl.style.display='none';
    (function tryNext(){
      if(i>=exts.length) return;
      imgEl.onload=function(){ imgEl.style.display='block'; initEl.style.display='none'; };
      imgEl.onerror=function(){ i++; tryNext(); };
      imgEl.src='photos/'+encodeURIComponent(key)+'.'+exts[i];
    })();
  }

  return { load:load, valueLabels:valueLabels, valueLabelsH:valueLabelsH, colors:C,
           initials:initials, setAvatar:setAvatar };
})();
