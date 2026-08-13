// Koneksi Socket.io: otomatis ke server yang sama saat lokal, atau ke Railway saat produksi
const BACKEND_URL = window.location.hostname === 'localhost'
  ? undefined                // localhost: pakai server yang sama
  : 'https://dashboard-engine-backend.railway.app';  // ganti dengan URL Railway Anda

const socket = io(BACKEND_URL);

const UNITS = ['Unit1', 'Unit2', 'Unit3', 'Unit4', 'Unit5', 'Unit6'];

// Ikon inline SVG (stroke mengikuti currentColor)
const ICONS = {
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 2.5-6 5 0"/></svg>',
  current: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15l4-6"/><path d="M4.5 18a9 9 0 1 1 15 0"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/></svg>',
  engine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v4"/><path d="M10 14h4"/></svg>',
  wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1" fill="currentColor"/></svg>',
};

const PARAMS = {
  Active_Power: { label: 'Active Power', unit: 'kW', icon: ICONS.bolt },
  Reactive_Power: { label: 'Reactive Power', unit: 'kVAR', icon: ICONS.wave },
  Generator_Current: { label: 'Generator Current', unit: 'A', icon: ICONS.current },
  Engine_Speed: { label: 'Engine Speed', unit: 'RPM', icon: ICONS.gauge },
};

// Bangun kartu untuk semua unit
function buildDashboard() {
  const dashboard = document.getElementById('dashboard');
  UNITS.forEach((unit) => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.id = `card-${unit}`;

    let paramsHtml = '';
    for (const key of Object.keys(PARAMS)) {
      paramsHtml += `
        <div class="param">
          <div class="label">${PARAMS[key].icon}<span>${PARAMS[key].label}</span></div>
          <div class="value no-data" id="val-${unit}-${key}">--<span class="unit">${PARAMS[key].unit}</span></div>
        </div>`;
    }

    card.innerHTML = `
      <div class="card-header">
        <div class="unit-icon">${ICONS.engine}</div>
        <h2>DG-SET #${unit.replace('Unit', '')}</h2>
      </div>
      <div class="last-update" id="time-${unit}">Belum ada data</div>
      <div class="params">${paramsHtml}</div>
    `;
    dashboard.appendChild(card);
  });
}

function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function updateValue(unit, parameter, value, timestamp) {
  const el = document.getElementById(`val-${unit}-${parameter}`);
  if (!el) return;

  const unitLabel = PARAMS[parameter] ? PARAMS[parameter].unit : '';

  if (value === null || value === undefined) {
    // Nilai sentinel (sensor offline) -> tampilkan "--"
    el.innerHTML = `--<span class="unit">${unitLabel}</span>`;
    el.classList.add('no-data');
  } else {
    const display = typeof value === 'number'
      ? value.toLocaleString('id-ID', { maximumFractionDigits: 2 })
      : value;
    el.innerHTML = `${display}<span class="unit">${unitLabel}</span>`;
    el.classList.remove('no-data');
  }

  const timeEl = document.getElementById(`time-${unit}`);
  if (timeEl) timeEl.textContent = `Update: ${formatTime(timestamp)}`;

  // Efek highlight singkat saat data masuk
  const card = document.getElementById(`card-${unit}`);
  if (card) {
    card.classList.add('updated');
    setTimeout(() => card.classList.remove('updated'), 600);
  }
}

function setMqttStatus(connected) {
  const badge = document.getElementById('mqtt-status');
  const text = document.getElementById('mqtt-status-text');
  badge.className = 'status-badge ' + (connected ? 'connected' : 'disconnected');
  text.textContent = connected ? 'MQTT: Terhubung' : 'MQTT: Terputus';
}

// ---------- Event Socket.io ----------
socket.on('init', ({ data, mqttStatus }) => {
  // Isi nilai dari cache server
  for (const [unit, params] of Object.entries(data || {})) {
    for (const [parameter, entry] of Object.entries(params)) {
      updateValue(unit, parameter, entry.value, entry.timestamp);
    }
  }
  setMqttStatus(mqttStatus);
});

socket.on('data', ({ unit, parameter, value, timestamp }) => {
  updateValue(unit, parameter, value, timestamp);
});

socket.on('mqtt-status', (connected) => {
  setMqttStatus(connected);
});

buildDashboard();
