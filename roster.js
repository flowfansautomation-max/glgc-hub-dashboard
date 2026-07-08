// GLGC Hub Dashboard — the 35 tracked people.
// Structure: Choir -> Governor (hub leader) -> Shepherd. Full names.
// Each person maps back to your master 102 list; grouped into their hub.
// Phones carried over from the master list where known (null otherwise).
// Rehearsal data attaches per person via SAT_TO_SHEP in model.js; per-person
// Sunday attendance is intentionally blank until the new Sunday form feeds it.

(function () {
  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  var RAW = [
    { choir: 'Love Is Large Choir', governor: 'Kiki Heward-Mills', shepherds: [
      ['Cindy Williams', '0245599923'], ['Janet Thomas', '0256875377'],
      ['Lucia Adusei', '0549556476'] ] },

    { choir: 'Love Is Large Choir', governor: 'Christiana Dzekoe', shepherds: [
      ['Christiana Dzekoe', null], ['Grace Fianu', '0535231068'] ] },

    { choir: 'Love Never Fails Choir', governor: 'RJ (Rev Jeffrey Lamptey)', shepherds: [
      ['Rev Jeffrey Lamptey', '0249405200'], ['Lawrence Adusu', '0209222199'] ] },

    { choir: 'Love Never Fails Choir', governor: 'Claudia Quayson', shepherds: [
      ['Claudia Quayson', '0549776091'], ['Elizabeth Akakpo', '0592490004'],
      ['Pascaline Obadze', '0555709524'], ['Princess Kanu', '0543207014'],
      ['Sarah Ayitey', null] ] },

    { choir: 'God So Loved Choir', governor: 'Stephanie Bediako', shepherds: [
      ['Stephanie Bediako', '0557313151'], ['Nathaniel Kwame Amissah', '0592622632'],
      ['Honesty Leticia Abba', '0546382842'] ] },

    { choir: 'God So Loved Choir', governor: 'Dorcas Poku', shepherds: [
      ['Dorcas Poku', '0208600307'] ] },

    { choir: 'Everlasting Love Choir', governor: 'Hannah-Joy Adade', shepherds: [
      ['Hannah Joy Adade', '0574061899'] ] },

    { choir: 'Love Is Kind Choir', governor: 'Keziah Ogoe', shepherds: [
      ['Keziah Ogoe', '0541508852'] ] },

    { choir: 'Abundant Love Choir', governor: 'Michelle William-Addo', shepherds: [
      ['Michelle William-Addo', '0245710529'], ['Lina Yartey', '0257574804'],
      ['Stephen Yartey', '0504153331'] ] },

    { choir: 'Abundant Love Choir', governor: 'Helen Feneku', shepherds: [
      ['Helen Feneku', '0201974618'], ['Bernice Dissou', '0532654322'],
      ['Morgan Mensah', null] ] },

    { choir: 'Peace And Love Singers', governor: 'Emmanuel Owiredu', shepherds: [
      ['Emmanuel Owiredu', '0595228643'] ] },

    { choir: 'Peace And Love Singers', governor: 'Rejoice Amartey', shepherds: [
      ['Rejoice Amartey', '0543150768'], ['Ruby Aggrey', '+233501362846'] ] },

    { choir: 'Peace And Love Singers', governor: 'Davidina Adagbe', shepherds: [
      ['Davidina Adagbe', '0207142392'] ] },

    { choir: 'Perfect Love Choir', governor: 'David Aseda Orleans-Lindsay', shepherds: [
      ['David Aseda Orleans-Lindsay', '0593435949'] ] },

    { choir: 'Steadfast Love Choir', governor: 'Johanna Nakoja', shepherds: [
      ['Johanna Nakoja', '0545068460'], ['Fortune Esedinam Adiraki Gbolo', '0205508004'] ] },

    { choir: 'Steadfast Love Choir', governor: 'Joanita Djabatey', shepherds: [
      ['Joanita Djabatey', '0553833171'], ['Papa Yaw Ashun', '0551130050'] ] },

    { choir: 'True Love Choir', governor: 'Dorcas Longdon', shepherds: [
      ['Dorcas Longdon', '0266459254'], ['David Buckman', '0248417478'],
      ['Lovelace Dadzie', '0204959173'], ['Edwin Takyi', '0240084722'] ] },

    { choir: 'Love Is Patient Choir', governor: 'Lois Nterful', shepherds: [
      ['Lois Nterful', '0559682426'], ['Celine Ayitey', '0240096784'],
      ['Patience Oriella Nortey', null], ['Christabelle Amoo-Gottfried', null],
      ['Elizabeth Amuzu', null] ] },

    { choir: 'Unfeigned Love Singers', governor: 'Ninette Dodoo', shepherds: [
      ['Ninette Dodoo', '0536153301'], ['Abigail Charis Adom-Barnor', null],
      ['Kofi Annan', '0233678900'] ] },

    { choir: 'Jesus Night Choir', governor: '—', shepherds: [
      ['Ayikaikor Ankrah', '+233209917512'], ['Sharon Rose Nartey', '+233201919670'] ] }
  ];

  var shepherds = [];
  RAW.forEach(function (hub) {
    var cslug = slug(hub.choir), gslug = slug(hub.governor);
    hub.shepherds.forEach(function (s, i) {
      shepherds.push({
        id: cslug + '__' + gslug + '__' + (i + 1),
        name: s[0], phone: s[1],
        choir: hub.choir, governor: hub.governor,
        governorId: cslug + '__' + gslug,
        photoKey: slug(s[0])
      });
    });
  });

  window.ROSTER = { hubs: RAW, shepherds: shepherds };
})();
