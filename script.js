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
