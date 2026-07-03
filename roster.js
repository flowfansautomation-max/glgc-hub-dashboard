// GLGC Hub Dashboard — the fixed roster.
// Structure: Choir  ->  Governor (hub leader)  ->  Shepherds.
// This is the source of truth for WHO exists. Attendance numbers live
// separately (Google Sheet / sample data) and are matched back onto these
// shepherds by their stable id in model.js.
//
// A shepherd id is built once here as:  <choir-slug>__<governor-slug>__<n>
// so two different "Grace"s (in different hubs) never collide.
// "No phone" is stored as null.

(function () {
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  // Raw list, exactly as given. phone: null means "No phone".
  var RAW = [
    // Kiki Heward-Mills (a.k.a. "MK"). Magdalene (0551483689) is the SAME person as
    // the one under Perfect Love / David Aseda — kept out of this hub. Betty Marcella
    // (0596524798) belongs here (removed from Joanita's list per correction).
    { choir: 'Love Is Large Choir', governor: 'Kiki Heward-Mills', shepherds: [
      ['Kiki Heward-Mills', '0560332094'], ['Grace', '0243009116'], ['Cindy', '0245599923'],
      ['Patra Amoako', '0550560424'], ['Dorothy Duvor', null], ['Eyram', null],
      ['Lucia Adusei', '0549556476'], ['Wilhermina', '0597229553'],
      ['Janet Thomas', '0256875377'], ['Asabea', '0593621222'],
      ['Betty Marcella', '0596524798'], ['Cherry', '0551984813'] ] },

    { choir: 'Love Is Large Choir', governor: 'Christiana Dzekoe', shepherds: [
      ['Grace', '0535231068'], ['Abraham', '0533421056'] ] },

    { choir: 'Love Never Fails Choir', governor: 'RJ (Rev Jeffrey Lamptey)', shepherds: [
      ['Olivia', '0552534125'], ['Bernard', '0546308829'], ['Lawrence', '0209222199'],
      ['Nathan', '0536312989'], ['Yvonne', null] ] },

    { choir: 'Love Never Fails Choir', governor: 'Claudia Quayson', shepherds: [
      ['Claudia', '0549776091'], ['Elizabeth', '0592490004'], ['Sarah', '0595231190'],
      ['Mabel', '0556298994'], ['Pascaline', '0555709524'], ['Princess', '0543207014'],
      ['Jacqueline', '0537952246'], ['Beatrice', '0592747630'], ['Genevive', '0591548965'] ] },

    { choir: 'God So Loved Choir', governor: 'Stephanie Bediako', shepherds: [
      ['Stephanie', '0557313151'], ['Honesty', '0546382842'], ['Sylvester', '0545498544'],
      ['Jemima', '0543525638'], ['Christable', '0246264644'], ['Blessing', '0534212979'],
      ['Solomon Azanto', '0554079699'], ['Nathaniel', '0592622632'] ] },

    { choir: 'God So Loved Choir', governor: 'Dorcas Poku', shepherds: [
      ['Dorcas P', '0208600307'], ['Sumaila', '0599896817'] ] },

    { choir: 'Everlasting Love Choir', governor: 'Hannah-Joy Adade', shepherds: [
      ['Hannah Joy', '0574061899'], ['Johnny', '0506244979'], ['Victoria', '0530957209'],
      ['Sarah', '0509812483'], ['Christable', '0204490537'], ['Vance', '0209271016'] ] },

    { choir: 'Love Is Kind Choir', governor: 'Keziah Ogoe', shepherds: [
      ['Keziah', '0541508852'], ['Adelaide', '0509491118'] ] },

    { choir: 'Abundant Love Choir', governor: 'Michelle William-Addo', shepherds: [
      ['Michelle', '0245710529'], ['Awura Aba', '0553958588'], ['Lina', '0257574804'],
      ['Ella', '0509918628'], ['Stephen', '0504153331'] ] },

    { choir: 'Abundant Love Choir', governor: 'Helen Feneku', shepherds: [
      ['Helen Fenuku', '0201974618'], ['Bernice', '0532654322'], ['Morgan', null] ] },

    { choir: 'Peace And Love Singers', governor: 'Rejoice Amartey', shepherds: [
      ['Rejoice', '0543150768'], ['Judith Woode', '0245971577'], ['Ruby', '+233501362846'] ] },

    { choir: 'Peace And Love Singers', governor: 'Emmanuel Owiredu', shepherds: [
      ['Emmanuel Owiredu', '0595228643'], ['Solomon Onipayede', '0558330690'],
      ['Henry Wiafe', '0591097239'] ] },

    { choir: 'Peace And Love Singers', governor: 'Davidina Adagbe', shepherds: [
      ['Davidina Adagbe', '0207142392'] ] },

    { choir: 'Perfect Love Choir', governor: 'David Aseda Orleans-Lindsay', shepherds: [
      ['Aseda', '0593435949'], ['Zita', '+233546742590'], ['Abraham', '0536839423'],
      ['Magdalene', '+233551483689'] ] },

    { choir: 'Steadfast Love Choir', governor: 'Johanna Nakoja', shepherds: [
      ['Johanna Nakoja', '0545068460'], ['Faustina Wohoyi', '0592538716'],
      ['Augustina Andaful', '0554435322'], ['Joanna Shella Aba', '0544288871'],
      ['Famous Klutse', '0599900246'], ['Fortune Esedinam Adiraki Gbolo', '0205508004'] ] },

    // Betty Marcella (0596524798) removed — she belongs to Kiki's hub (same person).
    { choir: 'Steadfast Love Choir', governor: 'Joanita Djabatey', shepherds: [
      ['Joanita', '0553833171'], ['Ewuradjoa Asirifi', null], ['Kingsley Boadu', '0551986770'],
      ['Roland', '0554078115'], ['Papa Yaw', '0551130050'],
      ['Gloria Budu', '0541737442'], ['Portia Danquah', '0535552533'] ] },

    { choir: 'True Love Choir', governor: 'Dorcas Longdon', shepherds: [
      ['Dorcas Longdon', '0266459254'], ['Lovelace Dadzie', '0204959173'],
      ['Mariama Anan', '0594879960'], ['Solomon Nashir', '0504905825'],
      ['Christiana Basoah', '0538245991'], ['Edwin Takyi', '0240084722'],
      ['Jonathan', '0531221324'], ['Gifty', '0557467838'], ['Bertha', '0592899652'],
      ['David Buckman', '0248417478'], ['Esther', '0533091510'], ['Abigail Quartey', '0546780169'] ] },

    { choir: 'Love Is Patient Choir', governor: 'Lois Nterful', shepherds: [
      ['Lois', '0559682426'], ['Celine', '0240096784'], ['David', '0537753163'] ] },

    { choir: 'Unfeigned Love Singers', governor: 'Ninette Dodoo', shepherds: [
      ['Ninette', '0536153301'], ['Kofi', '0233678900'], ['Chara Anti', '0596049049'] ] },

    // Jesus Night Choir has no governor listed — the choir is its own hub.
    { choir: 'Jesus Night Choir', governor: '—', shepherds: [
      ['Ayikaikor Ankrah', '+233209917512'], ['Sharon Rose Nartey', '+233201919670'] ] }
  ];

  // Flatten into shepherd records with stable ids.
  var shepherds = [];
  RAW.forEach(function (hub) {
    var cslug = slug(hub.choir), gslug = slug(hub.governor);
    hub.shepherds.forEach(function (s, i) {
      shepherds.push({
        id: cslug + '__' + gslug + '__' + (i + 1),
        name: s[0],
        phone: s[1],
        choir: hub.choir,
        governor: hub.governor,
        governorId: cslug + '__' + gslug,
        photoKey: slug(s[0])          // photos/<photoKey>.jpg  (duplicate names share a photo)
      });
    });
  });

  window.ROSTER = { hubs: RAW, shepherds: shepherds };
})();
