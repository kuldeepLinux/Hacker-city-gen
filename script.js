const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let cityData = null;
let audioCtx = null;
let map = null;
let overlayLayer = null;
let overlayOn = false;

function initMatrix() {
  const m = document.getElementById('matrix');
  const c = document.createElement('canvas');
  c.width = window.innerWidth;
  c.height = window.innerHeight;
  c.style.width = '100%';
  c.style.height = '100%';
  m.appendChild(c);
  const mx = c.getContext('2d');
  const chars = '0123456789ABCDEF';
  const fontSize = 14;
  const cols = c.width / fontSize;
  const drops = Array(Math.floor(cols)).fill(1);
  function draw() {
    mx.fillStyle = 'rgba(0,0,0,0.05)';
    mx.fillRect(0, 0, c.width, c.height);
    mx.fillStyle = '#00ff41';
    mx.font = fontSize + 'px monospace';
    for (let i = 0; i < drops.length; i++) {
      const t = chars[Math.floor(Math.random() * chars.length)];
      mx.fillText(t, i * fontSize, drops[i] * fontSize);
      if (drops[i] * fontSize > c.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  }
  setInterval(draw, 55);
}

function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function tick() {
  initAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'square';
  o.frequency.value = 800 + Math.random() * 400;
  g.gain.setValueAtTime(0.02, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.04);
}
function boom() {
  initAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(180, audioCtx.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.4);
  g.gain.setValueAtTime(0.15, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.4);
}
function beep(freq) {
  freq = freq || 1200;
  initAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.08, audioCtx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.08);
}
function alarm() {
  initAudio();
  for (let i = 0; i < 3; i++) {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    const t = audioCtx.currentTime + i * 0.15;
    g.gain.setValueAtTime(0.1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + 0.12);
  }
}

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function drawCity(c, size, density, heightMult, seed) {
  const cx = c.getContext('2d');
  const rand = mulberry32(seed);
  const cell = c.width / size;
  const buildings = [];
  const heights = [];
  cx.fillStyle = '#001a08';
  cx.fillRect(0, 0, c.width, c.height);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x * cell, py = y * cell;
      let color;
      if (x % 5 === 0 || y % 5 === 0) {
        color = '#003b17';
      } else if (rand() < density / 12) {
        const h = 50 + Math.floor(rand() * heightMult * 25);
        const g = 100 + h * 1.5;
        color = 'rgb(0,' + Math.min(255, g) + ',' + Math.floor(g * 0.4) + ')';
        buildings.push({ x: x, y: y, h: h });
        heights.push(h);
      } else if (rand() < 0.15) {
        color = '#005522';
      } else {
        color = '#000d04';
      }
      cx.fillStyle = color;
      cx.fillRect(px, py, cell, cell);
    }
  }
  const popPerBuilding = 8 + Math.floor(rand() * 25);
  const population = buildings.length * popPerBuilding;
  const areaKm2 = (size * 10 * size * 10) / 1e6;
  const avgHeight = heights.length ? Math.round(heights.reduce(function(a,b){return a+b;},0) / heights.length) : 0;
  return { size: size, density: density, heightMult: heightMult, seed: seed, buildings: buildings.length, population: population, areaKm2: areaKm2, avgHeight: avgHeight, heights: heights };
}

function generateCity() {
  boom();
  const size = +document.getElementById('size').value;
  const density = +document.getElementById('density').value;
  const heightMult = +document.getElementById('height').value;
  const seed = +document.getElementById('seed').value;
  cityData = drawCity(canvas, size, density, heightMult, seed);
  cityData.author = 'Kuldeep';
  document.getElementById('stats').textContent =
'--- SCAN COMPLETE ---\n' +
'BUILDINGS : ' + cityData.buildings + '\n' +
'POPULATION: ' + cityData.population + '\n' +
'AREA      : ' + cityData.areaKm2.toFixed(2) + ' km2\n' +
'DENSITY   : ' + Math.round(cityData.population / cityData.areaKm2) + '/km2\n' +
'AVG_HEIGHT: ' + cityData.avgHeight + 'm\n' +
'AUTHOR    : KULDEEP';
}

document.querySelectorAll('.tab').forEach(function(t) {
  t.onclick = function() {
    beep(1000);
    document.querySelectorAll('.tab').forEach(function(x) { x.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(x) { x.style.display = 'none'; });
    t.classList.add('active');
    document.getElementById('tab-' + t.dataset.tab).style.display = 'block';
    if (t.dataset.tab === 'stats') renderChart();
    if (t.dataset.tab === 'saved') renderSaved();
    if (t.dataset.tab === 'map') setTimeout(initRealMap, 100);
  };
});

function renderChart() {
  if (!cityData || !cityData.heights) return;
  const c = document.getElementById('chart');
  const cx = c.getContext('2d');
  cx.fillStyle = '#000';
  cx.fillRect(0, 0, c.width, c.height);
  const buckets = 10;
  const maxH = Math.max.apply(null, cityData.heights);
  const counts = Array(buckets).fill(0);
  cityData.heights.forEach(function(h) {
    const i = Math.min(buckets - 1, Math.floor((h / maxH) * buckets));
    counts[i]++;
  });
  const maxC = Math.max.apply(null, counts);
  const bw = c.width / buckets;
  counts.forEach(function(v, i) {
    const bh = (v / maxC) * (c.height - 40);
    cx.fillStyle = '#00ff41';
    cx.fillRect(i * bw + 4, c.height - bh - 20, bw - 8, bh);
    cx.fillStyle = '#00aa2a';
    cx.font = '10px monospace';
    cx.fillText(v, i * bw + bw/2 - 8, c.height - bh - 25);
  });
  cx.fillStyle = '#00aa2a';
  cx.font = '10px monospace';
  cx.fillText('HEIGHT DISTRIBUTION', 10, 15);
}

document.getElementById('duel').onclick = function() {
  boom();
  const size = +document.getElementById('size').value;
  const density = +document.getElementById('density').value;
  const heightMult = +document.getElementById('height').value;
  const a = drawCity(document.getElementById('canvasA'), size, density, heightMult, +document.getElementById('seedA').value);
  const b = drawCity(document.getElementById('canvasB'), size, density, heightMult, +document.getElementById('seedB').value);
  const winner = a.population > b.population ? 'CITY A' : (b.population > a.population ? 'CITY B' : 'TIE');
  document.getElementById('duelResult').textContent =
'--- DUEL RESULT ---\n' +
'CITY A: ' + a.population + ' pop, ' + a.buildings + ' bldgs\n' +
'CITY B: ' + b.population + ' pop, ' + b.buildings + ' bldgs\n' +
'WINNER: ' + winner;
};

function getSaved() { return JSON.parse(localStorage.getItem('hcg_saved') || '[]'); }
document.getElementById('save').onclick = function() {
  beep(1800);
  const saved = getSaved();
  saved.push(Object.assign({}, cityData, { timestamp: Date.now() }));
  localStorage.setItem('hcg_saved', JSON.stringify(saved));
  alert('City saved!');
};
function renderSaved() {
  const saved = getSaved();
  const el = document.getElementById('savedList');
  if (!saved.length) { el.textContent = 'No cities saved yet.'; return; }
  el.innerHTML = saved.map(function(s, i) {
    return '<div style="border-bottom:1px dashed #00aa2a;padding:6px 0;">' +
      '<b>#' + (i+1) + '</b> SEED:' + s.seed + ' | POP:' + s.population +
      ' <button onclick="deleteSaved(' + i + ')" style="float:right;padding:2px 8px;font-size:0.7rem;">X</button></div>';
  }).join('');
}
window.deleteSaved = function(i) {
  const saved = getSaved();
  saved.splice(i, 1);
  localStorage.setItem('hcg_saved', JSON.stringify(saved));
  renderSaved();
  beep(600);
};
document.getElementById('clearSaved').onclick = function() {
  if (confirm('Delete all saved cities?')) {
    localStorage.removeItem('hcg_saved');
    renderSaved();
    beep(400);
  }
};

document.getElementById('loadMap').onclick = function() {
  const lat = +document.getElementById('lat').value;
  const lon = +document.getElementById('lon').value;
  if (!map) {
    map = L.map('realMap', { center: [lat, lon], zoom: 13 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'OpenStreetMap', maxZoom: 19
    }).addTo(map);
  }
  map.setView([lat, lon], 14);
  L.marker([lat, lon]).addTo(map).bindPopup('TARGET').openPopup();
  document.getElementById('mapStatus').textContent =
    '--- MAP LOCKED ---\nLAT: ' + lat + '\nLON: ' + lon + '\nSTATUS: LIVE';
  beep(1800);
};

document.getElementById('myLocation').onclick = function() {
  if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
  document.getElementById('mapStatus').textContent = '> ACQUIRING GPS...';
  navigator.geolocation.getCurrentPosition(function(pos) {
    const lat = pos.coords.latitude.toFixed(4);
    const lon = pos.coords.longitude.toFixed(4);
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;
    if (!map) {
      map = L.map('realMap', { center: [lat, lon], zoom: 15 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap', maxZoom: 19
      }).addTo(map);
    }
    map.setView([lat, lon], 15);
    L.marker([lat, lon]).addTo(map).bindPopup('YOU ARE HERE').openPopup();
    document.getElementById('mapStatus').textContent =
      '--- GPS LOCKED ---\nLAT: ' + lat + '\nLON: ' + lon;
    beep(2000);
  }, function(err) {
    document.getElementById('mapStatus').textContent = '> GPS ERROR: ' + err.message;
    alarm();
  });
};

document.getElementById('searchBtn').onclick = function() {
  const q = document.getElementById('searchCity').value.trim();
  if (!q) return;
  document.getElementById('mapStatus').textContent = '> SEARCHING...';
  beep(1000);
  fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(q))
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (!data.length) {
        document.getElementById('mapStatus').textContent = '> CITY NOT FOUND';
        alarm();
        return;
      }
      const lat = parseFloat(data[0].lat);
      const lon = parseFloat(data[0].lon);
      document.getElementById('lat').value = lat.toFixed(4);
      document.getElementById('lon').value = lon.toFixed(4);
      if (!map) {
        map = L.map('realMap', { center: [lat, lon], zoom: 12 });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'OpenStreetMap', maxZoom: 19
        }).addTo(map);
      }
      map.setView([lat, lon], 12);
      L.marker([lat, lon]).addTo(map).bindPopup(data[0].display_name.split(',')[0]).openPopup();
      document.getElementById('mapStatus').textContent =
        '--- FOUND ---\n' + data[0].display_name;
      beep(2000);
    })
    .catch(function() {
      document.getElementById('mapStatus').textContent = '> SEARCH FAILED';
      alarm();
    });
};

document.getElementById('toggleOverlay').onclick = function() {
  if (!map) { alert('Pehle map load karo'); return; }
  if (!overlayOn) {
    overlayLayer = L.layerGroup();
    const lat = +document.getElementById('lat').value;
    const lon = +document.getElementById('lon').value;
    const size = +document.getElementById('size').value;
    const density = +document.getElementById('density').value;
    const seed = +document.getElementById('seed').value;
    const rand = mulberry32(seed);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (x % 5 === 0 || y % 5 === 0) continue;
        if (rand() > density / 12) continue;
        const px = lat + (y - size/2) * 0.00008;
        const py = lon + (x - size/2) * 0.0001;
        L.circle([px, py], {
          radius: 30, color: '#00ff41',
          fillColor: '#00ff41', fillOpacity: 0.4, weight: 1
        }).addTo(overlayLayer);
      }
    }
    overlayLayer.addTo(map);
    overlayOn = true;
    beep(1200);
  } else {
    if (overlayLayer) map.removeLayer(overlayLayer);
    overlayOn = false;
    beep(600);
  }
};

['size','density','height'].forEach(function(id) {
  document.getElementById(id).oninput = function(e) {
    document.getElementById(id + 'Val').textContent = e.target.value;
    tick();
  };
});
document.getElementById('generate').onclick = generateCity;

document.getElementById('exportPng').onclick = function() {
  beep(1800);
  const a = document.createElement('a');
  a.download = 'hacker_city_kuldeep_' + cityData.seed + '.png';
  a.href = canvas.toDataURL();
  a.click();
};

document.getElementById('exportJson').onclick = function() {
  beep(1400);
  const blob = new Blob([JSON.stringify(cityData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.download = 'hacker_city_kuldeep_' + cityData.seed + '.json';
  a.href = URL.createObjectURL(blob);
  a.click();
};

window.addEventListener('load', function() {
  initMatrix();
  document.body.addEventListener('touchstart', initAudio, { once: true });
  document.body.addEventListener('click', initAudio, { once: true });
  generateCity();
  document.getElementById('tabs').style.display = 'flex';
  document.getElementById('tab-gen').style.display = 'block';
});
