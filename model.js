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

  // Saturday rehearsal LEADER -> roster governor. Many rehearsals are led by a
  // shepherd, not the governor, so this maps each leader to the hub they belong
  // to (per your list, confirmed by location where names repeat). Unknown leaders
  // are left out until added here.
  var SAT_TO_GOV = {
    // governors leading their own hub's rehearsal
    'christiana dzekoe':'Christiana Dzekoe', 'dorcas longdon':'Dorcas Longdon',
    'hannah-joy adade':'Hannah-Joy Adade', 'joanita djabatey':'Joanita Djabatey',
    'johanna nakoja':'Johanna Nakoja', 'kezia ogoe':'Keziah Ogoe', 'keziah ogoe':'Keziah Ogoe',
    'lois nterful':'Lois Nterful', 'michelle william-addo':'Michelle William-Addo',
    'stephanie bediako':'Stephanie Bediako', 'david aseda':'David Aseda Orleans-Lindsay',
    // shepherds who led a rehearsal -> their governor
    'grace fianu':'Christiana Dzekoe',           // Mempeasem
    'janet thomas':'Kiki Heward-Mills',           // First Love Center
    'pascaline obaze':'Claudia Quayson',          // Manhea
    'princess kanu':'Claudia Quayson',            // Ablaykuma
    'elizabeth akakpo':'Claudia Quayson',         // Kasoa
    'claudia apaloo':'Claudia Quayson',
    'sarah ayitey':'Claudia Quayson',             // North Kaneshie
    'celine ayitey':'Lois Nterful',
    'elizabeth amuzu':'Lois Nterful',             // Kasoa Dumas school
    'patience oriella':'Lois Nterful',            // Bubiashie
    'abigail charis':'Ninette Dodoo',             // Gh Media
    'lina yartey':'Michelle William-Addo',        // Taifa
    'lovelace dadzie':'Dorcas Longdon',           // Kolebu
    'ayikaikor ankrah':'—', 'sharon-rose nartey':'—'   // Jesus Night hub
  };

  // Same rehearsal rows, but attributed to the individual SHEPHERD who led them,
  // so each shepherd's own rehearsal turnout + offering shows on their page.
  // [governor, shepherd name]  (governor-led rows land on the governor's own entry)
  var SAT_TO_SHEP = {
    'grace fianu':['Christiana Dzekoe','Grace'],
    'janet thomas':['Kiki Heward-Mills','Janet Thomas'],
    'pascaline obaze':['Claudia Quayson','Pascaline'],
    'princess kanu':['Claudia Quayson','Princess'],
    'elizabeth akakpo':['Claudia Quayson','Elizabeth'],
    'claudia apaloo':['Claudia Quayson','Claudia'],
    'sarah ayitey':['Claudia Quayson','Sarah Ayitey'],
    'celine ayitey':['Lois Nterful','Celine'],
    'elizabeth amuzu':['Lois Nterful','Elizabeth Amuzu'],
    'patience oriella':['Lois Nterful','Patience Oriella'],
    'abigail charis':['Ninette Dodoo','Abigail Charis'],
    'lina yartey':['Michelle William-Addo','Lina'],
    'lovelace dadzie':['Dorcas Longdon','Lovelace Dadzie'],
    'ayikaikor ankrah':['—','Ayikaikor Ankrah'],
    'sharon-rose nartey':['—','Sharon Rose Nartey'],
    'dorcas longdon':['Dorcas Longdon','Dorcas Longdon'],
    'hannah-joy adade':['Hannah-Joy Adade','Hannah Joy'],
    'joanita djabatey':['Joanita Djabatey','Joanita Djabatey'],
    'johanna nakoja':['Johanna Nakoja','Johanna Nakoja'],
    'kezia ogoe':['Keziah Ogoe','Keziah'],
    'lois nterful':['Lois Nterful','Lois'],
    'michelle william-addo':['Michelle William-Addo','Michelle'],
    'stephanie bediako':['Stephanie Bediako','Stephanie'],
    'david aseda':['David Aseda Orleans-Lindsay','Aseda']
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
      if(got.sun && got.sat && !done){
        done=true;
        try { cb(build(parseSun(got.sun), parseSat(got.sat))); }
        catch(e){ (onErr||function(){})(e); }
      }
    }
    window.__glgcSun=function(r){ got.sun=r; ready(); };
    window.__glgcSat=function(r){ got.sat=r; ready(); };
    inject('https://docs.google.com/spreadsheets/d/'+SUN_ID+
      '/gviz/tq?tqx=out:json;responseHandler:__glgcSun&sheet='+encodeURIComponent(SUN_SHEET)+
      '&range=A2:AZ500&headers=1', fail);
    inject('https://docs.google.com/spreadsheets/d/'+SAT_ID+
      '/gviz/tq?tqx=out:json;responseHandler:__glgcSat', fail);
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
        iAtt=find('attendance'), iOff=find('offering');
    var rows=[];
    (resp.table.rows||[]).forEach(function(r){
      var c=r.c||[];
      var leader=norm(c[iLeader]&&c[iLeader].v); if(!leader) return;
      var d=parseGvizDate(c[iDate]&&c[iDate].v); if(!d) return;
      rows.push({ leader:leader, date:d,
        att:+(c[iAtt]&&c[iAtt].v)||0, off:+(c[iOff]&&c[iOff].v)||0 });
    });
    return rows;
  }

  // ---- build MODEL onto the roster ------------------------------------------
  function build(sun, sat){
    // canonical weeks = the Sunday columns; rehearsal Saturday = day before
    var weeks=sun.weekCols.map(function(w){
      var sunD=w.date, satD=new Date(sunD.getTime()-86400000);
      return { week:isoWeek(sunD), sunDate:sunD, satDate:satD,
               sunLabel:fmt(sunD), satLabel:fmt(satD), label:'WK '+isoWeek(sunD)+' · '+fmt(sunD) };
    });
    // week index for a rehearsal date (nearest Sunday within 4 days)
    function weekIndexFor(date){
      var best=-1, bestGap=5;
      weeks.forEach(function(w,i){ var gap=Math.abs(w.sunDate-date)/86400000; if(gap<bestGap){ bestGap=gap; best=i; } });
      return best;
    }

    // shepherds skeleton + a (governor|name -> shepherd) lookup for attribution
    var shepByKey={};
    var shepherds=ROSTER.shepherds.map(function(s){
      var o={ id:s.id, name:s.name, phone:s.phone, choir:s.choir,
        governor:s.governor, governorId:s.governorId, photoKey:s.photoKey, _sat:{} };
      shepByKey[s.governor+'|'+s.name]=o;
      return o;
    });

    // aggregate each rehearsal row onto its hub (governor) AND the leader (shepherd)
    var satByGov={};
    sat.forEach(function(row){
      var i=weekIndexFor(row.date); if(i<0) return;
      var gov=SAT_TO_GOV[row.leader];
      if(gov){ var g=satByGov[gov]||(satByGov[gov]={}); var cg=g[i]||(g[i]={att:0,off:0}); cg.att+=row.att; cg.off+=row.off; }
      var sk=SAT_TO_SHEP[row.leader];
      if(sk){ var so=shepByKey[sk[0]+'|'+sk[1]]; if(so){ var cs=so._sat[i]||(so._sat[i]={att:0,off:0}); cs.att+=row.att; cs.off+=row.off; } }
    });

    // shepherd points — their own rehearsal turnout + offering (Sunday per-shepherd not tracked yet)
    shepherds.forEach(function(s){
      s.points=weeks.map(function(w,i){
        var c=s._sat[i];
        return { week:w.week, label:w.label, satPresent:(c?c.att:null),
                 offering:(c?c.off:null), sunPresent:null, roster:1 };
      });
      s.hasData=s.points.some(function(p){ return p.satPresent!=null||p.offering!=null; });
      delete s._sat;
    });
    var byId={}; shepherds.forEach(function(s){ byId[s.id]=s; });

    // governors (hubs) — real Sunday + Saturday points where matched
    var govMap={};
    ROSTER.hubs.forEach(function(hub){
      var shepIds=shepherds.filter(function(s){
        return s.choir===hub.choir && s.governor===hub.governor;
      }).map(function(s){ return s.id; });
      if(!shepIds.length) return;
      var gid=slug(hub.choir)+'__'+slug(hub.governor);
      var sunVals=sun.byGov[hub.governor]||null;
      var satVals=satByGov[hub.governor]||null;
      var points=weeks.map(function(w,i){
        var sp=sunVals?sunVals[i]:null;
        var sat=satVals&&satVals[i]?satVals[i]:null;
        return { week:w.week, label:w.label,
          sunPresent:(sp==null?null:sp),
          satPresent:(sat?sat.att:null),
          offering:(sat?sat.off:null),
          roster:shepIds.length };
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
             governors:governors, choirs:choirs, weekly:weekly };
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
