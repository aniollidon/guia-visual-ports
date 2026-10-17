// [clau d'imatge, nom del port, nom de la connexió (opcional)]
const groups = [
  { t: 'Dades', a: '#2563a8', items: [
    ['usb2a', 'USB 2.0 Tipus A'], ['usb2b', 'USB 2.0 Tipus B'], ['usb3a', 'USB 3.0 Tipus A'], ['usb3b', 'USB 3.0 Tipus B'],
    ['mini', 'Mini-USB'], ['micro', 'Micro-USB'], ['microb', 'Micro-USB B'], ['usbc', 'USB Tipus C'], ['lightning', 'Lightning'],
    ['tb2', 'Thunderbolt 2.0'], ['firewire', 'FireWire'],
  ]},
  { t: 'Vídeo', a: '#c8366b', items: [
    ['vga', 'VGA'], ['hdmi', 'HDMI'], ['minihdmi', 'Mini-HDMI'], ['dp', 'DisplayPort'],
    ['minidp', 'Mini-DisplayPort'], ['dvi', 'DVI'], ['svideo', 'S-Video'],
  ]},
  { t: 'Àudio', a: '#c98a00', items: [
    ['jack635', 'Jack 6,35 mm'], ['minijack', 'Minijack 3,5 mm'], ['subminijack', 'Subminijack 2,5 mm'], ['rca', 'RCA'],
  ]},
  { t: 'Àudio: tipus de jacks', a: '#c98a00', onlyCon: true, items: [
    ['ts', 'TS (mono)'], ['trs', 'TRS (estèreo)'], ['trrs', 'TRRS (estèreo + micro)'], ['trrrs', 'TRRRS'],
  ]},
  { t: 'Xarxa', a: '#2f8f5b', items: [
    ['rj45', 'RJ45'], ['lc', 'Fibra òptica (LC duplex)'], ['sc', 'Fibra òptica (SC)'], ['rj11', 'RJ11'],
  ]},
  { t: 'Alimentació', a: '#d9622b', items: [
    ['c5c6', 'C6 (entrada)', 'C5 (connector)'], ['c7c8', 'C8 (entrada)', 'C7 (connector)'],
    ['c13c14', 'C14 (entrada)', 'C13 (connector)'], ['c15c16', 'C16 (entrada)', 'C15 (connector)'],
    ['c17c18', 'C18 (entrada)', 'C17 (connector)'], ['c19c20', 'C20 (entrada)', 'C19 (connector)'],
    ['c21c22', 'C22 (entrada)', 'C21 (connector)'], ['magsafe', 'Port magnètic', 'Carregador magnètic'],
  ]},
  { t: 'Altres', a: '#6a4fb3', items: [
    ['ps2', 'PS/2'], ['sata', 'SATA'], ['esata', 'eSATA'], ['pci', 'PCI'], ['pcie16', 'PCI Express x16'],
    ['pcie1', 'PCI Express x1'], ['ata', 'ATA / IDE'], ['dimm', 'DIMM (memòria RAM)'],
    ['pga', 'Socket CPU PGA'], ['lga', 'Socket CPU LGA'],
  ]},
];

const IMG_OVERRIDE = { 'usb2a-port': 'usb-a-port.jpg', 'c15c16-port': 'c16c15-port.jpg' };

const ITEMS = groups.flatMap(g => g.items.map(([key, pn, cn]) => ({
  key, portName: pn, conName: cn || pn, group: g,
})));

const imgSrc = (key, kind) => `../images/${IMG_OVERRIDE[`${key}-${kind}`] || `${key}-${kind}.jpg`}`;
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const $ = id => document.getElementById(id);

let score = 0, streak = 0, right = 0, total = 0, queue = [], current = null, answered = false;

// Distractors: majoritàriament del mateix grup, la resta d'altres grups.
// Imatges indistingibles: tots comparteixen foto de port; minijack i TRS comparteixen foto de connexió.
const JACK_PORTS = ['minijack', 'ts', 'trs', 'trrs', 'trrrs'];
const SAME_PHOTO = {
  port: k => JACK_PORTS.includes(k) ? JACK_PORTS : [k],
  con: k => ['minijack', 'trs'].includes(k) ? ['minijack', 'trs'] : [k],
};

function distractors(item, n, uniqueBy, banned = []) {
  const ok = i => i !== item && !banned.includes(i.key);
  const same = shuffle(ITEMS.filter(i => ok(i) && i.group === item.group));
  const other = shuffle(ITEMS.filter(i => ok(i) && i.group !== item.group));
  const pool = [...same.slice(0, n), ...other];
  const out = [], seen = new Set([uniqueBy(item)]);
  for (const i of pool) {
    const v = uniqueBy(i);
    if (!seen.has(v)) { seen.add(v); out.push(i); }
    if (out.length === n) break;
  }
  return out;
}

function nextItem() {
  if (!queue.length) queue = shuffle([...ITEMS]);
  return queue.pop();
}

function newQuestion() {
  answered = false;
  const item = nextItem();
  // 0: foto del port -> nom, 1: foto de la connexió -> nom, 2: connexió -> escollir port
  // No es pregunta el nom d'una foto si no permet distingir la resposta.
  const types = item.group.onlyCon ? [1] : [0, 1, 2].filter(t => t !== 1 || item.key !== 'minijack');
  const type = types[Math.floor(Math.random() * types.length)];
  current = item;
  $('badge').textContent = item.group.t;
  $('badge').style.background = item.group.a;
  $('feedback').textContent = ''; $('feedback').className = 'feedback';
  $('next').style.display = 'none';

  const kind = type === 0 ? 'port' : 'con';
  $('photo').style.display = type === 2 ? 'none' : 'flex';
  $('photo').innerHTML = type === 2 ? '' : `<img src="${imgSrc(item.key, kind)}" alt="">`;
  const opts = $('opts'); opts.innerHTML = '';

  if (type === 2) {
    $('question').textContent = `Quin port correspon a la connexió ${item.conName}?`;
    const choices = shuffle([item, ...distractors(item, 3, i => i.key, [...SAME_PHOTO.port(item.key), ...JACK_PORTS])]);
    choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'opt img';
      b.innerHTML = `<div class="photoo"><img src="${imgSrc(c.key, 'port')}" alt=""></div>`;
      b.onclick = () => answer(b, c === item, type);
      b.dataset.correct = c === item;
      opts.appendChild(b);
    });
  } else {
    $('question').textContent = type === 0 ? 'Com es diu aquest port?' : 'Com es diu aquesta connexió?';
    const nameOf = i => type === 0 ? i.portName : i.conName;
    const choices = shuffle([item, ...distractors(item, 3, nameOf,
      // "Minijack" és la família de TS/TRS/TRRS/TRRRS: seria també una resposta vàlida.
      [...SAME_PHOTO[kind](item.key), ...(JACK_PORTS.includes(item.key) ? ['minijack'] : [])])]);
    choices.forEach(c => {
      const b = document.createElement('button');
      b.className = 'opt';
      b.textContent = nameOf(c);
      b.dataset.correct = c === item;
      b.onclick = () => answer(b, c === item, type);
      opts.appendChild(b);
    });
  }
}

function answer(btn, ok, type) {
  if (answered) return;
  answered = true; total++;
  const fb = $('feedback');
  if (ok) {
    right++; streak++;
    const pts = 10 + Math.min(streak - 1, 10) * 2;
    score += pts;
    fb.textContent = `Correcte! +${pts} punts`; fb.className = 'feedback ok';
  } else {
    streak = 0;
    const name = type === 2 ? current.portName : (type === 0 ? current.portName : current.conName);
    fb.textContent = `Incorrecte. La resposta era: ${name}`; fb.className = 'feedback ko';
  }
  [...$('opts').children].forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') b.classList.add('ok');
  });
  if (!ok) btn.classList.add('ko');
  updateStats();
  $('next').style.display = 'inline-block';
  $('next').focus();
}

function updateStats() {
  $('score').textContent = score;
  $('streak').textContent = streak;
  $('acc').textContent = `${right}/${total}`;
}

$('next').onclick = newQuestion;
newQuestion();
