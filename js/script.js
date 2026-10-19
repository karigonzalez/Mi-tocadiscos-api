// Web Audio API Context and State Variables
let audioCtx;
let audioElement;
let trackNode;
let gainNode;
let lowEqNode;
let midEqNode;
let highEqNode;
let analyserNode;

// Procedural Vinyl Crackle Engine
let crackleNode;

// Application State
let isPlaying = false;
let currentTrack = null;
let currentRpmMultiplier = 1.0;
let userPitchMultiplier = 1.0;

// DOM Elements
const vinylRecord = document.getElementById('vinyl-record');
const tonearm = document.getElementById('tonearm');
const powerBtn = document.getElementById('power-btn');
const powerText = document.getElementById('power-text');
const pitchSlider = document.getElementById('pitch-slider');
const pitchVal = document.getElementById('pitch-val');
const volSlider = document.getElementById('vol-slider');
const volVal = document.getElementById('vol-val');
const eqLow = document.getElementById('eq-low');
const eqMid = document.getElementById('eq-mid');
const eqHigh = document.getElementById('eq-high');
const vinylLabelImg = document.getElementById('vinyl-label-img');
const vinylLabelTitle = document.getElementById('vinyl-label-title');
const vinylLabelArtist = document.getElementById('vinyl-label-artist');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const recordShelf = document.getElementById('record-shelf');
const trackStatus = document.getElementById('track-status');
const timeDisplay = document.getElementById('time-display');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const vuL = document.getElementById('vu-l');
const vuR = document.getElementById('vu-r');

// Initial Sample Tracks
const defaultTracks = [
  {
    title: "Midnight Jazz Club",
    artist: "The Smooth Trio",
    cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=300&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
  },
  {
    title: "Retro Synthwave 1984",
    artist: "Neon Driver",
    cover: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=300&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=synthwave-80s-110045.mp3"
  },
  {
    title: "Acoustic Blues Guitar",
    artist: "Delta Roots",
    cover: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=300&q=80",
    audioUrl: "https://cdn.pixabay.com/download/audio/2021/09/06/audio_8b24a35773.mp3?filename=blues-rock-1-11883.mp3"
  }
];

// Initialize Audio Context and Nodes
function initAudioEngine() {
  if (audioCtx) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContext();

  audioElement = new Audio();
  audioElement.crossOrigin = "anonymous";

  // Create Web Audio API Processing Nodes
  trackNode = audioCtx.createMediaElementSource(audioElement);
  gainNode = audioCtx.createGain();

  // Equalizer Nodes (Biquad Filters)
  lowEqNode = audioCtx.createBiquadFilter();
  lowEqNode.type = 'lowshelf';
  lowEqNode.frequency.value = 320;

  midEqNode = audioCtx.createBiquadFilter();
  midEqNode.type = 'peaking';
  midEqNode.frequency.value = 1000;
  midEqNode.Q.value = 0.5;

  highEqNode = audioCtx.createBiquadFilter();
  highEqNode.type = 'highshelf';
  highEqNode.frequency.value = 3200;

  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 128;

  // Connect Audio Pipeline
  trackNode.connect(lowEqNode);
  lowEqNode.connect(midEqNode);
  midEqNode.connect(highEqNode);
  highEqNode.connect(gainNode);
  gainNode.connect(analyserNode);
  analyserNode.connect(audioCtx.destination);

  // Time & Status updates
  audioElement.addEventListener('timeupdate', updateTimeDisplay);
  audioElement.addEventListener('ended', () => stopTurntable());

  startVisualizer();
}

// Procedural Vinyl Noise/Crackle Generator
function createVinylCrackle() {
  if (!audioCtx) return;
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    let hiss = (Math.random() * 2 - 1) * 0.003;
    let crackle = Math.random() > 0.998 ? (Math.random() * 2 - 1) * 0.08 : 0;
    data[i] = hiss + crackle;
  }

  crackleNode = audioCtx.createBufferSource();
  crackleNode.buffer = buffer;
  crackleNode.loop = true;

  const crackleGain = audioCtx.createGain();
  crackleGain.gain.value = 0.15;

  crackleNode.connect(crackleGain);
  crackleGain.connect(audioCtx.destination);
  crackleNode.start();
}

function stopVinylCrackle() {
  if (crackleNode) {
    try { crackleNode.stop(); } catch(e) {}
    crackleNode = null;
  }
}

// Load Selected Track to the Platter
function loadTrackToPlatter(track) {
  currentTrack = track;
  vinylLabelImg.src = track.cover;
  vinylLabelTitle.textContent = track.title;
  vinylLabelArtist.textContent = track.artist;
  trackStatus.textContent = track.title;

  if (isPlaying) {
    playTurntable();
  }
}

// Play / Pause Logic
function togglePower() {
  initAudioEngine();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (isPlaying) {
    stopTurntable();
  } else {
    if (!currentTrack) {
      loadTrackToPlatter(defaultTracks[0]);
    }
    playTurntable();
  }
}

function playTurntable() {
  if (!currentTrack) return;

  audioElement.src = currentTrack.audioUrl;
  audioElement.playbackRate = currentRpmMultiplier * userPitchMultiplier;
  
  audioElement.play().then(() => {
    isPlaying = true;
    vinylRecord.classList.add('spinning');
    tonearm.classList.remove('tonearm-rest');
    tonearm.classList.add('tonearm-play');
    powerText.textContent = "STOP / CUE";
    powerBtn.classList.replace('from-red-600', 'from-amber-600');
    createVinylCrackle();
  }).catch(err => {
    console.error("Audio playback error:", err);
  });
}

function stopTurntable() {
  isPlaying = false;
  if (audioElement) audioElement.pause();
  vinylRecord.classList.remove('spinning');
  tonearm.classList.remove('tonearm-play');
  tonearm.classList.add('tonearm-rest');
  powerText.textContent = "START PLAY";
  stopVinylCrackle();
}

// Update Audio Speed
function updatePlaybackSpeed() {
  if (audioElement) {
    audioElement.playbackRate = currentRpmMultiplier * userPitchMultiplier;
  }
}

// Search Music API (iTunes API)
async function searchMusicAPI(query) {
  recordShelf.innerHTML = `<div class="col-span-2 text-center text-xs text-amber-400 py-8 animate-pulse"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Querying Music API...</div>`;

  try {
    const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=8`);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      recordShelf.innerHTML = `<div class="col-span-2 text-center text-xs text-zinc-500 py-8">No preview tracks found. Try another search.</div>`;
      return;
    }

    const tracks = data.results.map(item => ({
      title: item.trackName,
      artist: item.artistName,
      cover: item.artworkUrl100.replace('100x100bb', '300x300bb'),
      audioUrl: item.previewUrl
    }));

    renderRecordShelf(tracks);

  } catch (error) {
    console.error("API Fetch Error:", error);
    recordShelf.innerHTML = `<div class="col-span-2 text-center text-xs text-red-400 py-8">Error fetching from API. Showing default collection.</div>`;
    renderRecordShelf(defaultTracks);
  }
}

// Render Vinyl Shelf
function renderRecordShelf(tracks) {
  recordShelf.innerHTML = '';

  tracks.forEach(track => {
    const card = document.createElement('div');
    card.className = "bg-zinc-950 p-2.5 rounded-2xl border border-zinc-800/80 hover:border-amber-500/60 transition group cursor-pointer flex flex-col items-center text-center shadow-lg";
    card.draggable = true;

    card.innerHTML = `
      <div class="relative w-24 h-24 mb-2 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition transform">
        <img src="${track.cover}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <i class="fa-solid fa-play text-amber-400 text-xl"></i>
        </div>
      </div>
      <span class="text-[11px] font-bold text-zinc-200 line-clamp-1 w-full">${track.title}</span>
      <span class="text-[9px] text-amber-400/70 line-clamp-1 w-full">${track.artist}</span>
    `;

    // Click to Load
    card.addEventListener('click', () => {
      initAudioEngine();
      loadTrackToPlatter(track);
      playTurntable();
    });

    // Drag & Drop
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', JSON.stringify(track));
    });

    recordShelf.appendChild(card);
  });
}

// Real-Time Canvas Visualizer
function startVisualizer() {
  const bufferLength = analyserNode.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    requestAnimationFrame(draw);
    analyserNode.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;

      ctx.fillStyle = `rgb(245, ${158 + i * 2}, 11)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

      x += barWidth;
    }

    // VU Meter update
    if (isPlaying) {
      let avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      let level = Math.min(100, Math.max(10, (avg / 128) * 100));
      vuL.style.height = `${level}%`;
      vuR.style.height = `${Math.min(100, level * (0.9 + Math.random() * 0.2))}%`;
    } else {
      vuL.style.height = '10%';
      vuR.style.height = '10%';
    }
  }

  draw();
}

function updateTimeDisplay() {
  if (!audioElement || isNaN(audioElement.duration)) return;
  const curMins = Math.floor(audioElement.currentTime / 60);
  const curSecs = Math.floor(audioElement.currentTime % 60).toString().padStart(2, '0');
  const durMins = Math.floor(audioElement.duration / 60);
  const durSecs = Math.floor(audioElement.duration % 60).toString().padStart(2, '0');
  timeDisplay.textContent = `${curMins}:${curSecs} / ${durMins}:${durSecs}`;
}

// Event Listeners
function setupEventListeners() {
  powerBtn.addEventListener('click', togglePower);

  // RPM Controls
  document.getElementById('rpm-33').addEventListener('click', (e) => {
    currentRpmMultiplier = 1.0;
    e.target.className = "px-2 py-1 text-xs font-mono rounded bg-amber-500 text-black font-bold";
    document.getElementById('rpm-45').className = "px-2 py-1 text-xs font-mono rounded text-zinc-400 hover:text-white";
    updatePlaybackSpeed();
  });

  document.getElementById('rpm-45').addEventListener('click', (e) => {
    currentRpmMultiplier = 1.35;
    e.target.className = "px-2 py-1 text-xs font-mono rounded bg-amber-500 text-black font-bold";
    document.getElementById('rpm-33').className = "px-2 py-1 text-xs font-mono rounded text-zinc-400 hover:text-white";
    updatePlaybackSpeed();
  });

  // Pitch
  pitchSlider.addEventListener('input', (e) => {
    userPitchMultiplier = parseFloat(e.target.value);
    pitchVal.textContent = `${userPitchMultiplier.toFixed(2)}x`;
    updatePlaybackSpeed();
  });

  // Master Volume
  volSlider.addEventListener('input', (e) => {
    if (gainNode) gainNode.gain.value = parseFloat(e.target.value);
    volVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  // 3-Band EQ
  eqLow.addEventListener('input', (e) => { if (lowEqNode) lowEqNode.gain.value = parseFloat(e.target.value); });
  eqMid.addEventListener('input', (e) => { if (midEqNode) midEqNode.gain.value = parseFloat(e.target.value); });
  eqHigh.addEventListener('input', (e) => { if (highEqNode) highEqNode.gain.value = parseFloat(e.target.value); });

  // API Search Form
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (searchInput.value.trim()) {
      searchMusicAPI(searchInput.value.trim());
    }
  });

  // Quick Tags
  document.querySelectorAll('.quick-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      searchInput.value = tag.textContent;
      searchMusicAPI(tag.textContent);
    });
  });

  // Drag & Drop
  vinylRecord.addEventListener('dragover', (e) => e.preventDefault());
  vinylRecord.addEventListener('drop', (e) => {
    e.preventDefault();
    const trackData = e.dataTransfer.getData('text/plain');
    if (trackData) {
      initAudioEngine();
      loadTrackToPlatter(JSON.parse(trackData));
      playTurntable();
    }
  });
}

// On Page Load
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderRecordShelf(defaultTracks);
  loadTrackToPlatter(defaultTracks[0]);
});