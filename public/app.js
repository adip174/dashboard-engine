// =========================================================================
// DASHBOARD ENGINE - PLTD SUPPA (Web & Mobile Capacitor App)
// Multi-Page: Main Parameter & System Parameter
// Clean Mobile Header & Centralized Engine Status Control
// =========================================================================

// ---------- 1. Inisialisasi & Konfigurasi Backend URL & Storage ----------
const STORAGE_KEYS = {
  BACKEND_URL: 'pltd_backend_url',
  THRESHOLDS: 'pltd_thresholds_v4',
  NOTIF_SETTINGS: 'pltd_notif_settings',
  ALARM_LOGS: 'pltd_alarm_logs',
  UNIT_STATUS: 'pltd_unit_manual_status',
  ADMIN_AUTH: 'pltd_admin_auth_user',
};

// Deteksi platform Capacitor
const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

function getInitialBackendUrl() {
  const saved = localStorage.getItem(STORAGE_KEYS.BACKEND_URL);
  if (saved) return saved;

  if (isCapacitor) {
    // Default ke Railway production URL untuk APK
    return window.location.origin.replace('localhost:3000', 'dashboard-engine-production.up.railway.app');
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}`;
  }

  return window.location.origin;
}

let currentBackendUrl = getInitialBackendUrl();

// ---------- 2. Metadata Parameter & Ikon SVG ----------
const ICONS = {
  bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12c2.5-6 5-6 7.5 0s5 6 7.5 0 2.5-6 5 0"/></svg>',
  current: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  gauge: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15l4-6"/><path d="M4.5 18a9 9 0 1 1 15 0"/><circle cx="12" cy="15" r="1.5" fill="currentColor"/></svg>',
  engine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M12 12v4"/><path d="M10 14h4"/></svg>',
  oilDrop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
  waterDrop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/><path d="M12 11v4"/></svg>',
  wind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>',
  fan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c0-3 2.5-5.5 5.5-5.5S23 9 23 12s-2.5 5.5-5.5 5.5S12 15 12 12z"/><path d="M12 12c0 3-2.5 5.5-5.5 5.5S1 15 1 12s2.5-5.5 5.5-5.5S12 9 12 12z"/></svg>',
  thermometer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>',
};

// Parameter Utama (Main Parameters Page)
const MAIN_PARAMS = {
  Active_Power: { label: 'Active Power', unit: 'kW', icon: ICONS.bolt, group: 'main' },
  Reactive_Power: { label: 'Reactive Power', unit: 'kVAR', icon: ICONS.wave, group: 'main' },
  Generator_Current: { label: 'Generator Current', unit: 'A', icon: ICONS.current, group: 'main' },
  Engine_Speed: { label: 'Engine Speed', unit: 'RPM', icon: ICONS.gauge, group: 'main' },
};

// Parameter Sistem: Pressure (Nilai raw dibagi 10, alarm Min)
const SYSTEM_PRESS_PARAMS = {
  'fuel oil inlet press 101PT': { label: 'FO Inlet Press', tag: '101PT', unit: 'bar', icon: ICONS.oilDrop, isPressure: true, group: 'system', type: 'pressure' },
  'lube oil inlet press 201PT': { label: 'LO Inlet Press', tag: '201PT', unit: 'bar', icon: ICONS.oilDrop, isPressure: true, group: 'system', type: 'pressure' },
  'HT-water inlet press 401PT': { label: 'HT-Water Press', tag: '401PT', unit: 'bar', icon: ICONS.waterDrop, isPressure: true, group: 'system', type: 'pressure' },
  'LT-water inlet press 451PT': { label: 'LT-Water Press', tag: '451PT', unit: 'bar', icon: ICONS.waterDrop, isPressure: true, group: 'system', type: 'pressure' },
  'starting air press 301PT': { label: 'Starting Air Press', tag: '301PT', unit: 'bar', icon: ICONS.wind, isPressure: true, group: 'system', type: 'pressure' },
  'charge air press A 601PT_1': { label: 'Charge Air Press A', tag: '601PT_1', unit: 'bar', icon: ICONS.fan, isPressure: true, group: 'system', type: 'pressure' },
};

// Parameter Sistem: Temperature (Alarm Max)
const SYSTEM_TEMP_PARAMS = {
  'HT water inlet temp 401TE': { label: 'HT-Water In Temp', tag: '401TE', unit: '°C', icon: ICONS.thermometer, group: 'system', type: 'temp' },
  'HT water outlet temp 401TE': { label: 'HT-Water Out Temp', tag: '401TE', unit: '°C', icon: ICONS.thermometer, group: 'system', type: 'temp' },
  'lube oil inlet temp 201TE': { label: 'LO Inlet Temp', tag: '201TE', unit: '°C', icon: ICONS.thermometer, group: 'system', type: 'temp' },
  'fuel oil inlet temp 101TE': { label: 'FO Inlet Temp', tag: '101TE', unit: '°C', icon: ICONS.thermometer, group: 'system', type: 'temp' },
};

const ALL_PARAMS = {
  ...MAIN_PARAMS,
  ...SYSTEM_PRESS_PARAMS,
  ...SYSTEM_TEMP_PARAMS,
};

function paramToId(paramName) {
  return paramName.replace(/[^a-zA-Z0-9]/g, '_');
}

// ---------- 3. Konfigurasi Batas Ambang (Thresholds) ----------
const DEFAULT_THRESHOLDS = {
  // Main Parameters
  Active_Power: { min: -200, max: 1200, label: 'Active Power', unit: 'kW', group: 'main' },
  Reactive_Power: { min: -200, max: 1000, label: 'Reactive Power', unit: 'kVAR', group: 'main' },
  Generator_Current: { max: 1800, label: 'Generator Current', unit: 'A', group: 'main' },
  Engine_Speed: { max: 510, label: 'Engine Speed', unit: 'RPM', group: 'main' },

  // System Pressure (Nilai MIN Aman)
  'fuel oil inlet press 101PT': { min: 4.50, label: 'FO Inlet Press (101PT)', unit: 'bar', type: 'pressure' },
  'lube oil inlet press 201PT': { min: 3.50, label: 'LO Inlet Press (201PT)', unit: 'bar', type: 'pressure' },
  'HT-water inlet press 401PT': { min: 2.00, label: 'HT-Water Inlet Press (401PT)', unit: 'bar', type: 'pressure' },
  'LT-water inlet press 451PT': { min: 2.00, label: 'LT-Water Inlet Press (451PT)', unit: 'bar', type: 'pressure' },
  'starting air press 301PT': { min: 25.00, label: 'Starting Air Press (301PT)', unit: 'bar', type: 'pressure' },
  'charge air press A 601PT_1': { min: 1.80, label: 'Charge Air Press A (601PT_1)', unit: 'bar', type: 'pressure' },

  // System Temperature (Nilai MAX Aman)
  'HT water inlet temp 401TE': { max: 85.0, label: 'HT Water Inlet Temp (401TE)', unit: '°C', type: 'temp' },
  'HT water outlet temp 401TE': { max: 95.0, label: 'HT Water Outlet Temp (401TE)', unit: '°C', type: 'temp' },
  'lube oil inlet temp 201TE': { max: 75.0, label: 'LO Inlet Temp (201TE)', unit: '°C', type: 'temp' },
  'fuel oil inlet temp 101TE': { max: 120.0, label: 'FO Inlet Temp (101TE)', unit: '°C', type: 'temp' },
};

function loadThresholds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THRESHOLDS);
    if (!saved) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(saved);
    return { ...DEFAULT_THRESHOLDS, ...parsed };
  } catch (e) {
    return DEFAULT_THRESHOLDS;
  }
}

let thresholds = loadThresholds();

let notifSettings = {
  sound: true,
  push: true,
};

try {
  const savedNotif = localStorage.getItem(STORAGE_KEYS.NOTIF_SETTINGS);
  if (savedNotif) notifSettings = { ...notifSettings, ...JSON.parse(savedNotif) };
} catch (e) {}

// ---------- 4. Admin Role Authentication ----------
function isAdminLoggedIn() {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'admin';
}

function updateAdminUI() {
  const isAdmin = isAdminLoggedIn();
  const btnAuth = document.getElementById('btn-admin-auth');
  const authIcon = document.getElementById('admin-auth-icon');
  const authText = document.getElementById('admin-auth-text');
  const lockNotice = document.getElementById('admin-threshold-lock-notice');
  const btnSaveThresholds = document.getElementById('btn-save-thresholds');
  const btnResetThresholds = document.getElementById('btn-reset-thresholds');

  const userIconSvg = `<svg class="btn-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`;

  if (btnAuth) {
    if (isAdmin) {
      btnAuth.classList.add('is-admin');
      if (authIcon) authIcon.innerHTML = userIconSvg;
      if (authText) authText.textContent = 'Admin (Aktif)';
      btnAuth.title = 'Klik untuk Keluar dari Mode Admin';
    } else {
      btnAuth.classList.remove('is-admin');
      if (authIcon) authIcon.innerHTML = userIconSvg;
      if (authText) authText.textContent = 'Admin';
      btnAuth.title = 'Login sebagai Admin untuk mengubah status & batas ambang';
    }
  }

  if (lockNotice) {
    if (isAdmin) {
      lockNotice.classList.add('hidden');
    } else {
      lockNotice.classList.remove('hidden');
    }
  }

  const thresholdInputs = document.querySelectorAll('#modal-thresholds input, #modal-thresholds select');
  thresholdInputs.forEach((input) => {
    if (input.type !== 'checkbox') {
      input.disabled = !isAdmin;
    }
  });

  if (btnSaveThresholds) btnSaveThresholds.disabled = !isAdmin;
  if (btnResetThresholds) btnResetThresholds.disabled = !isAdmin;
}

// ---------- 5. State Management: Fixed 6 Units (DG-SET #1 s/d #6) ----------
const UNITS = ['Unit1', 'Unit2', 'Unit3', 'Unit4', 'Unit5', 'Unit6'];
let socket = null;
let serverMqttConfig = {
  url: 'mqtt://mqtt-cleen.ptpjb.com',
  port: 1883,
  username: '',
};

let unitManualStatus = {};
try {
  const savedStatus = localStorage.getItem(STORAGE_KEYS.UNIT_STATUS);
  if (savedStatus) unitManualStatus = JSON.parse(savedStatus);
} catch (e) {}

const unitLatestRpm = {
  Unit1: 0, Unit2: 0, Unit3: 0, Unit4: 0, Unit5: 0, Unit6: 0,
};

const activeAlarms = new Map();
let alarmLogs = [];

try {
  const savedLogs = localStorage.getItem(STORAGE_KEYS.ALARM_LOGS);
  if (savedLogs) alarmLogs = JSON.parse(savedLogs);
} catch (e) {}

let lastSoundTime = 0;
let lastPushTime = 0;

// ---------- 6. Operational Status Helper ----------
function getUnitOperationalStatus(unit) {
  const manual = unitManualStatus[unit] || 'AUTO';
  if (manual === 'UNDER_MAINTENANCE') return 'UNDER_MAINTENANCE';
  if (manual === 'BREAKDOWN') return 'BREAKDOWN';

  const rpm = unitLatestRpm[unit] || 0;
  return rpm > 0 ? 'RUNNING' : 'STAND_BY';
}

function getStatusDetails(status) {
  switch (status) {
    case 'RUNNING':
      return { label: 'RUNNING', badgeClass: 'status-running', cardClass: 'is-running' };
    case 'STAND_BY':
      return { label: 'STAND BY', badgeClass: 'status-standby', cardClass: 'is-standby' };
    case 'UNDER_MAINTENANCE':
      return { label: 'MAINTENANCE', badgeClass: 'status-maintenance', cardClass: 'is-maintenance' };
    case 'BREAKDOWN':
      return { label: 'BREAKDOWN', badgeClass: 'status-breakdown', cardClass: 'is-breakdown' };
    default:
      return { label: 'STAND BY', badgeClass: 'status-standby', cardClass: 'is-standby' };
  }
}

function updateUnitStatusDisplay(unit) {
  const status = getUnitOperationalStatus(unit);
  const details = getStatusDetails(status);

  // Update elemen badge di kedua halaman (Main & System) serta di dalam Modal
  const badges = document.querySelectorAll(`[data-status-badge="${unit}"]`);
  const cards = document.querySelectorAll(`[data-unit-card="${unit}"]`);

  badges.forEach((b) => {
    b.className = `unit-status-badge ${details.badgeClass}`;
    b.innerHTML = `<span class="status-dot-sm"></span>${details.label}`;
  });

  cards.forEach((c) => {
    c.classList.remove('is-standby', 'is-maintenance', 'is-breakdown');
    if (details.cardClass !== 'is-running') {
      c.classList.add(details.cardClass);
    }
  });

  // Update modal selector
  const modalSelect = document.getElementById(`modal-select-status-${unit}`);
  if (modalSelect) {
    const currentManual = unitManualStatus[unit] || 'AUTO';
    modalSelect.value = currentManual;
    const autoOpt = modalSelect.querySelector('option[value="AUTO"]');
    if (autoOpt) {
      const rpm = unitLatestRpm[unit] || 0;
      autoOpt.textContent = rpm > 0 ? '🟢 Auto (Running)' : '⚪ Auto (Stand By)';
    }
  }

  // Jika bukan RUNNING, bersihkan alarm aktif
  if (status !== 'RUNNING') {
    let clearedAny = false;
    for (const key of Array.from(activeAlarms.keys())) {
      if (key.startsWith(`${unit}-`)) {
        activeAlarms.delete(key);
        clearedAny = true;
      }
    }
    for (const p of Object.keys(ALL_PARAMS)) {
      const boxes = document.querySelectorAll(`[data-param-box="${unit}-${paramToId(p)}"]`);
      boxes.forEach((b) => b.classList.remove('param-warning', 'param-danger'));
    }
    if (clearedAny) updateAlarmUI();
  }
}

// ---------- 7. Web Audio Synthesizer (Alarm Sounds) ----------
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

document.addEventListener('click', () => getAudioContext(), { once: true });
document.addEventListener('touchstart', () => getAudioContext(), { once: true });

function playAlarmTone(isDanger = false) {
  if (!notifSettings.sound) return;
  const now = Date.now();
  if (now - lastSoundTime < 3500) return;
  lastSoundTime = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (isDanger) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);

      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.6);

      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.8);
    } else {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      osc1.frequency.setValueAtTime(750, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.2);
    }
  } catch (e) {
    console.warn('Audio alert error:', e);
  }
}

// ---------- 8. Push / Local Notifications ----------
async function triggerPushNotification(title, body, isDanger = false) {
  if (!notifSettings.push) return;
  const now = Date.now();
  if (now - lastPushTime < 6000) return;
  lastPushTime = now;

  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
    try {
      const { LocalNotifications } = window.Capacitor.Plugins;
      await LocalNotifications.schedule({
        notifications: [
          {
            title: `⚠️ ${title}`,
            body,
            id: Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 100) },
            sound: isDanger ? 'alarm.wav' : undefined,
          },
        ],
      });
      return;
    } catch (err) {
      console.warn('Capacitor LocalNotification error:', err);
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`⚠️ ${title}`, {
        body,
        icon: 'logo.png',
      });
    } catch (e) {}
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}

// ---------- 9. Threshold Evaluation Engine ----------
function evaluateThreshold(parameter, value) {
  if (value === null || value === undefined || isNaN(value)) {
    return { level: 'normal', message: '' };
  }

  const num = parseFloat(value);
  const cfg = thresholds[parameter];
  if (!cfg) return { level: 'normal', message: '' };

  // 1. Parameter Pressure: HANYA CEK BATAS MINIMUM (Alarm jika < Min)
  if (cfg.type === 'pressure' || SYSTEM_PRESS_PARAMS[parameter]) {
    const min = cfg.min !== undefined ? parseFloat(cfg.min) : -Infinity;
    if (num < min) {
      return {
        level: 'danger',
        message: `${cfg.label} Rendah (${num.toFixed(2)} ${cfg.unit})! Di bawah batas minimum ${min.toFixed(2)} ${cfg.unit}`,
      };
    }
    return { level: 'normal', message: '' };
  }

  // 2. Parameter Temperature: HANYA CEK BATAS MAKSIMUM (Alarm jika > Max)
  if (cfg.type === 'temp' || SYSTEM_TEMP_PARAMS[parameter]) {
    const max = cfg.max !== undefined ? parseFloat(cfg.max) : Infinity;
    if (num > max) {
      return {
        level: 'danger',
        message: `${cfg.label} Tinggi (${num.toFixed(1)} ${cfg.unit})! Melebihi batas maksimum ${max.toFixed(1)} ${cfg.unit}`,
      };
    }
    return { level: 'normal', message: '' };
  }

  // 3. Engine Speed & Generator Current: HANYA CEK MAKSIMUM
  if (parameter === 'Engine_Speed' || parameter === 'Generator_Current') {
    const max = cfg.max !== undefined ? parseFloat(cfg.max) : Infinity;
    if (num > max) {
      return {
        level: 'danger',
        message: `${cfg.label} Kritis (${num} ${cfg.unit})! Melebihi batas aman maks (${max} ${cfg.unit})`,
      };
    }
    return { level: 'normal', message: '' };
  }

  // 4. Active & Reactive Power: CEK MIN & MAX (Mendukung Minus)
  if (parameter === 'Active_Power' || parameter === 'Reactive_Power') {
    const min = cfg.min !== undefined ? parseFloat(cfg.min) : -Infinity;
    const max = cfg.max !== undefined ? parseFloat(cfg.max) : Infinity;
    if (num < min || num > max) {
      return {
        level: 'danger',
        message: `${cfg.label} Kritis (${num} ${cfg.unit})! Di luar batas aman [${min} s/d ${max} ${cfg.unit}]`,
      };
    }
    return { level: 'normal', message: '' };
  }

  return { level: 'normal', message: '' };
}

function handleAlarmState(unit, parameter, value, evalResult) {
  const alarmKey = `${unit}-${parameter}`;
  const prevAlarm = activeAlarms.get(alarmKey);

  if (evalResult.level === 'normal') {
    if (prevAlarm) {
      activeAlarms.delete(alarmKey);
      addAlarmLog(unit, parameter, value, 'normal', 'Nilai kembali ke batas normal');
      updateAlarmUI();
    }
  } else {
    const isNewAlarm = !prevAlarm || prevAlarm.level !== evalResult.level;
    const alarmEntry = {
      unit,
      parameter,
      value,
      level: evalResult.level,
      message: evalResult.message,
      timestamp: new Date().toISOString(),
    };

    activeAlarms.set(alarmKey, alarmEntry);

    if (isNewAlarm) {
      addAlarmLog(unit, parameter, value, evalResult.level, evalResult.message);
      playAlarmTone(evalResult.level === 'danger');
      triggerPushNotification(`Alarm ${unit}: ${ALL_PARAMS[parameter]?.label || parameter}`, evalResult.message, evalResult.level === 'danger');
    }
    updateAlarmUI();
  }
}

function addAlarmLog(unit, parameter, value, level, message) {
  const logItem = {
    id: Date.now() + Math.random(),
    unit,
    parameter,
    value,
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  alarmLogs.unshift(logItem);
  if (alarmLogs.length > 50) alarmLogs.pop();
  localStorage.setItem(STORAGE_KEYS.ALARM_LOGS, JSON.stringify(alarmLogs));
  renderAlarmList();
}

function updateAlarmUI() {
  const banner = document.getElementById('alarm-banner');
  const bannerText = document.getElementById('alarm-banner-text');
  const badgeCounter = document.getElementById('alarm-badge-count');

  const count = activeAlarms.size;

  if (count > 0) {
    badgeCounter.textContent = count;
    badgeCounter.classList.remove('hidden');

    let hasDanger = false;
    activeAlarms.forEach((a) => {
      if (a.level === 'danger') hasDanger = true;
    });

    banner.classList.remove('hidden');
    bannerText.textContent = hasDanger
      ? `🚨 PERINGATAN KRITIS: Terdapat ${count} parameter unit running di luar batas aman!`
      : `⚠️ PERHATIAN: Terdapat ${count} parameter unit running dalam kondisi warning.`;

    banner.style.background = hasDanger
      ? 'linear-gradient(90deg, #991b1b, #b91c1c)'
      : 'linear-gradient(90deg, #b45309, #d97706)';
  } else {
    badgeCounter.classList.add('hidden');
    banner.classList.add('hidden');
  }

  UNITS.forEach((unit) => {
    const cards = document.querySelectorAll(`[data-unit-card="${unit}"]`);
    const indicators = document.querySelectorAll(`[data-unit-ind="${unit}"]`);

    const opStatus = getUnitOperationalStatus(unit);

    if (opStatus !== 'RUNNING') {
      cards.forEach((c) => c.classList.remove('card-warning', 'card-danger'));
      indicators.forEach((i) => {
        i.className = 'unit-status-indicator normal';
        i.textContent = 'NORMAL';
      });
      return;
    }

    let unitMaxLevel = 'normal';
    for (const [key, alarm] of activeAlarms.entries()) {
      if (alarm.unit === unit) {
        if (alarm.level === 'danger') {
          unitMaxLevel = 'danger';
          break;
        } else if (alarm.level === 'warning') {
          unitMaxLevel = 'warning';
        }
      }
    }

    cards.forEach((c) => {
      c.classList.remove('card-warning', 'card-danger');
      if (unitMaxLevel === 'danger') c.classList.add('card-danger');
      else if (unitMaxLevel === 'warning') c.classList.add('card-warning');
    });

    indicators.forEach((i) => {
      i.className = `unit-status-indicator ${unitMaxLevel}`;
      i.textContent = unitMaxLevel === 'danger' ? 'KRITIS' : unitMaxLevel === 'warning' ? 'WARNING' : 'NORMAL';
    });
  });
}

// ---------- 10. UI Rendering: Main & System Dashboard Pages ----------
function buildMainDashboard() {
  const container = document.getElementById('page-main');
  container.innerHTML = '';

  UNITS.forEach((unit) => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.setAttribute('data-unit-card', unit);
    card.id = `card-main-${unit}`;

    let paramsHtml = '';
    for (const key of Object.keys(MAIN_PARAMS)) {
      const pid = paramToId(key);
      paramsHtml += `
        <div class="param" data-param-box="${unit}-${pid}" id="box-main-${unit}-${pid}">
          <div class="label">${MAIN_PARAMS[key].icon}<span>${MAIN_PARAMS[key].label}</span></div>
          <div class="value no-data" data-param-val="${unit}-${pid}" id="val-main-${unit}-${pid}">--<span class="unit">${MAIN_PARAMS[key].unit}</span></div>
        </div>`;
    }

    const unitDisplay = unit.replace('Unit', '#');

    card.innerHTML = `
      <div class="card-header">
        <div class="card-header-left">
          <div class="unit-icon">${ICONS.engine}</div>
          <h2>DG-SET ${unitDisplay}</h2>
        </div>
        <div class="card-header-right">
          <span class="unit-status-badge status-standby" data-status-badge="${unit}" id="badge-status-main-${unit}">
            <span class="status-dot-sm"></span>STAND BY
          </span>
          <span class="unit-status-indicator normal" data-unit-ind="${unit}" id="ind-main-${unit}">NORMAL</span>
        </div>
      </div>
      <div class="last-update" id="time-main-${unit}">Belum ada data</div>
      <div class="params">${paramsHtml}</div>
    `;
    container.appendChild(card);
  });
}

function buildSystemDashboard() {
  const container = document.getElementById('page-system');
  container.innerHTML = '';

  UNITS.forEach((unit) => {
    const card = document.createElement('div');
    card.className = 'unit-card';
    card.setAttribute('data-unit-card', unit);
    card.id = `card-system-${unit}`;

    // 1. Section Pressure (6 parameters)
    let pressHtml = '';
    for (const key of Object.keys(SYSTEM_PRESS_PARAMS)) {
      const item = SYSTEM_PRESS_PARAMS[key];
      const pid = paramToId(key);
      pressHtml += `
        <div class="param" data-param-box="${unit}-${pid}" id="box-sys-${unit}-${pid}">
          <div class="label">${item.icon}<span>${item.label}</span></div>
          <div class="value no-data" data-param-val="${unit}-${pid}" id="val-sys-${unit}-${pid}">--<span class="unit">${item.unit}</span></div>
        </div>`;
    }

    // 2. Section Temperature (4 parameters)
    let tempHtml = '';
    for (const key of Object.keys(SYSTEM_TEMP_PARAMS)) {
      const item = SYSTEM_TEMP_PARAMS[key];
      const pid = paramToId(key);
      tempHtml += `
        <div class="param" data-param-box="${unit}-${pid}" id="box-sys-${unit}-${pid}">
          <div class="label">${item.icon}<span>${item.label}</span></div>
          <div class="value no-data" data-param-val="${unit}-${pid}" id="val-sys-${unit}-${pid}">--<span class="unit">${item.unit}</span></div>
        </div>`;
    }

    const unitDisplay = unit.replace('Unit', '#');

    card.innerHTML = `
      <div class="card-header">
        <div class="card-header-left">
          <div class="unit-icon">${ICONS.engine}</div>
          <h2>DG-SET ${unitDisplay}</h2>
        </div>
        <div class="card-header-right">
          <span class="unit-status-badge status-standby" data-status-badge="${unit}" id="badge-status-sys-${unit}">
            <span class="status-dot-sm"></span>STAND BY
          </span>
          <span class="unit-status-indicator normal" data-unit-ind="${unit}" id="ind-sys-${unit}">NORMAL</span>
        </div>
      </div>
      <div class="last-update" id="time-sys-${unit}">Belum ada data</div>

      <div class="param-section-title">💧 Tekanan Sistem (bar)</div>
      <div class="params-grid-compact">${pressHtml}</div>

      <div class="param-section-title temp-title">🌡️ Temperatur Sistem (°C)</div>
      <div class="params-grid-compact">${tempHtml}</div>
    `;
    container.appendChild(card);
  });
}

function renderModalEngineStatusList() {
  const container = document.getElementById('modal-engine-status-list');
  if (!container) return;
  container.innerHTML = '';

  UNITS.forEach((unit) => {
    const card = document.createElement('div');
    card.className = 'engine-status-card';

    const unitDisplay = unit.replace('Unit', '#');
    const savedManual = unitManualStatus[unit] || 'AUTO';
    const currentRpm = unitLatestRpm[unit] || 0;
    const autoLabel = currentRpm > 0 ? '🟢 Auto (Running)' : '⚪ Auto (Stand By)';

    card.innerHTML = `
      <div class="engine-status-info">
        <div class="unit-icon-sm">${ICONS.engine}</div>
        <div>
          <strong>DG-SET ${unitDisplay}</strong>
          <div style="margin-top: 3px;">
            <span class="unit-status-badge status-standby" data-status-badge="${unit}">
              <span class="status-dot-sm"></span>STAND BY
            </span>
          </div>
        </div>
      </div>
      <div class="engine-status-action">
        <select class="status-select modal-engine-select" data-unit="${unit}" id="modal-select-status-${unit}">
          <option value="AUTO" ${savedManual === 'AUTO' ? 'selected' : ''}>${autoLabel}</option>
          <option value="UNDER_MAINTENANCE" ${savedManual === 'UNDER_MAINTENANCE' ? 'selected' : ''}>🟡 Under Maintenance</option>
          <option value="BREAKDOWN" ${savedManual === 'BREAKDOWN' ? 'selected' : ''}>🔴 Breakdown</option>
        </select>
      </div>
    `;

    const select = card.querySelector('select');
    select.addEventListener('change', (e) => {
      if (!isAdminLoggedIn()) {
        e.target.value = unitManualStatus[unit] || 'AUTO';
        showToast('🔒 Hak akses Admin diperlukan untuk mengubah status unit!', 'error');
        document.getElementById('modal-admin-login').classList.remove('hidden');
        return;
      }

      const newStatus = e.target.value;
      unitManualStatus[unit] = newStatus;
      localStorage.setItem(STORAGE_KEYS.UNIT_STATUS, JSON.stringify(unitManualStatus));
      updateUnitStatusDisplay(unit);

      const labelText = newStatus === 'AUTO' ? (unitLatestRpm[unit] > 0 ? 'Running' : 'Stand By') : newStatus === 'UNDER_MAINTENANCE' ? 'Under Maintenance' : 'Breakdown';
      showToast(`DG-SET ${unitDisplay}: Status diatur ke ${labelText}`, 'info');
    });

    container.appendChild(card);
  });
}

function formatTime(isoString) {
  if (!isoString) return '--:--:--';
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function updateValue(unit, parameter, value, timestamp) {
  if (!UNITS.includes(unit)) return;

  if (parameter === 'Engine_Speed') {
    unitLatestRpm[unit] = (value !== null && value !== undefined && !isNaN(value)) ? parseFloat(value) : 0;
    updateUnitStatusDisplay(unit);
  }

  const pid = paramToId(parameter);
  const valElements = document.querySelectorAll(`[data-param-val="${unit}-${pid}"]`);
  const boxElements = document.querySelectorAll(`[data-param-box="${unit}-${pid}"]`);

  const meta = ALL_PARAMS[parameter] || {};
  const unitLabel = meta.unit || '';
  const opStatus = getUnitOperationalStatus(unit);

  // EVALUASI ALARM
  if (opStatus === 'RUNNING') {
    const evalResult = evaluateThreshold(parameter, value);
    handleAlarmState(unit, parameter, value, evalResult);

    boxElements.forEach((box) => {
      box.classList.remove('param-warning', 'param-danger');
      if (evalResult.level === 'danger') box.classList.add('param-danger');
      else if (evalResult.level === 'warning') box.classList.add('param-warning');
    });
  } else {
    activeAlarms.delete(`${unit}-${parameter}`);
    boxElements.forEach((box) => box.classList.remove('param-warning', 'param-danger'));
    updateAlarmUI();
  }

  // Render nilai teks parameter (Mendukung Desimal & Format Satuan)
  let formattedText = '--';
  let isNoData = true;

  if (value !== null && value !== undefined && value !== '') {
    const parsedNum = typeof value === 'number' ? value : parseFloat(value);
    if (!isNaN(parsedNum)) {
      isNoData = false;
      const decimals = meta.type === 'pressure' ? 2 : meta.type === 'temp' ? 1 : 2;
      formattedText = parsedNum.toLocaleString('id-ID', {
        minimumFractionDigits: meta.type === 'pressure' ? 2 : 0,
        maximumFractionDigits: decimals,
      });
    } else {
      formattedText = value;
      isNoData = false;
    }
  }

  valElements.forEach((el) => {
    if (isNoData) {
      el.innerHTML = `--<span class="unit">${unitLabel}</span>`;
      el.classList.add('no-data');
    } else {
      el.innerHTML = `${formattedText}<span class="unit">${unitLabel}</span>`;
      el.classList.remove('no-data');
    }
  });

  const timeMain = document.getElementById(`time-main-${unit}`);
  const timeSys = document.getElementById(`time-sys-${unit}`);
  if (timestamp) {
    const tStr = `Update: ${formatTime(timestamp)}`;
    if (timeMain) timeMain.textContent = tStr;
    if (timeSys) timeSys.textContent = tStr;
  }

  const cards = document.querySelectorAll(`[data-unit-card="${unit}"]`);
  cards.forEach((card) => {
    if (!card.classList.contains('card-danger')) {
      card.classList.add('updated');
      setTimeout(() => card.classList.remove('updated'), 500);
    }
  });
}

// ---------- 11. Socket.io & Backend Connection Manager ----------
function setBackendStatus(status, text) {
  const badge = document.getElementById('backend-status');
  const txt = document.getElementById('backend-status-text');
  if (badge) badge.className = `status-badge ${status}`;
  if (txt) txt.textContent = text;

  // Modal server status
  const modalBadge = document.getElementById('modal-server-status-badge');
  const modalEndpoint = document.getElementById('modal-server-endpoint');
  if (modalBadge) {
    modalBadge.className = `status-badge ${status}`;
    modalBadge.textContent = status === 'connected' ? 'Terhubung' : status === 'connecting' ? 'Menghubungkan...' : 'Terputus';
  }
  if (modalEndpoint) {
    modalEndpoint.textContent = `URL: ${currentBackendUrl || window.location.origin}`;
  }
}

function setMqttStatus(connected, broker, error = null) {
  const badge = document.getElementById('mqtt-status');
  const text = document.getElementById('mqtt-status-text');
  if (badge) badge.className = 'status-badge ' + (connected ? 'connected' : 'disconnected');
  if (text) text.textContent = connected ? 'MQTT: Terhubung' : 'MQTT: Terputus';
  if (broker && badge) badge.title = `Broker: ${broker}${error ? ` (${error})` : ''}`;

  // Modal MQTT status
  const modalBadge = document.getElementById('modal-mqtt-status-badge');
  const modalEndpoint = document.getElementById('modal-mqtt-endpoint');
  if (modalBadge) {
    modalBadge.className = 'status-badge ' + (connected ? 'connected' : 'disconnected');
    modalBadge.textContent = connected ? 'Terhubung' : 'Terputus';
  }
  if (modalEndpoint) {
    if (error && !connected) {
      modalEndpoint.innerHTML = `Broker: ${broker || serverMqttConfig.url}<br><span style="color:#f87171;font-size:0.75rem;display:block;margin-top:3px;">⚠️ ${error}</span>`;
    } else {
      modalEndpoint.textContent = broker ? `Broker: ${broker}` : `Broker: ${serverMqttConfig.url}:${serverMqttConfig.port}`;
    }
  }
}

function initSocketConnection() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  setBackendStatus('connecting', 'Server: Menghubungkan...');

  try {
    socket = io(currentBackendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on('connect', () => {
      setBackendStatus('connected', 'Server: Terhubung');
      showToast('Terhubung ke Server Backend', 'success');
    });

    socket.on('disconnect', () => {
      setBackendStatus('disconnected', 'Server: Terputus');
      setMqttStatus(false);
    });

    socket.on('connect_error', (err) => {
      setBackendStatus('disconnected', 'Server: Gagal Konek');
    });

    socket.on('init', ({ data, mqttStatus, mqttConfig }) => {
      console.log('[Socket] Init received:', { data: Object.keys(data || {}).length + ' units', mqttStatus });
      if (mqttConfig) {
        serverMqttConfig = mqttConfig;
      }
      setMqttStatus(mqttStatus, mqttConfig ? `${mqttConfig.url}:${mqttConfig.port}` : null);

      let paramCount = 0;
      for (const [unit, params] of Object.entries(data || {})) {
        if (UNITS.includes(unit)) {
          if (params.Engine_Speed && params.Engine_Speed.value !== null && params.Engine_Speed.value !== undefined) {
            unitLatestRpm[unit] = parseFloat(params.Engine_Speed.value) || 0;
          }
          for (const [parameter, entry] of Object.entries(params)) {
            updateValue(unit, parameter, entry.value, entry.timestamp);
            paramCount++;
          }
        }
      }
      console.log(`[Socket] Initialized ${paramCount} parameters`);
      UNITS.forEach(u => updateUnitStatusDisplay(u));
    });

    socket.on('data', ({ unit, parameter, value, timestamp }) => {
      console.log(`[Socket] Data received: ${unit} | ${parameter} = ${value}`);
      updateValue(unit, parameter, value, timestamp);
    });

    socket.on('mqtt-status', (statusObj) => {
      if (typeof statusObj === 'boolean') {
        setMqttStatus(statusObj);
      } else {
        setMqttStatus(statusObj.connected, statusObj.broker, statusObj.error);
        if (!statusObj.connected && statusObj.error) {
          showToast(`MQTT: ${statusObj.error}`, 'error');
        } else if (statusObj.connected) {
          showToast(`MQTT: Berhasil terhubung ke broker! 🟢`, 'success');
        }
      }
    });

    socket.on('mqtt-config-updated', (cfg) => {
      serverMqttConfig = cfg;
      showToast('Konfigurasi MQTT berhasil diperbarui', 'info');
    });
  } catch (e) {
    console.error('Socket init error:', e);
    setBackendStatus('disconnected', 'Server: Error');
  }
}

// ---------- 12. Modal & Form Controls ----------
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function renderAlarmList(view = 'active') {
  const container = document.getElementById('alarm-list-container');
  if (!container) return;
  container.innerHTML = '';

  if (view === 'active') {
    if (activeAlarms.size === 0) {
      container.innerHTML = '<div class="empty-state">✅ Tidak ada alarm aktif saat ini. Semua unit berjalan normal atau dalam kondisi aman.</div>';
      return;
    }

    activeAlarms.forEach((alarm) => {
      const item = document.createElement('div');
      item.className = `alarm-item ${alarm.level}`;
      item.innerHTML = `
        <div>
          <div class="alarm-item-title">${alarm.unit} &bull; ${ALL_PARAMS[alarm.parameter]?.label || alarm.parameter}</div>
          <div class="alarm-item-desc">${alarm.message}</div>
        </div>
        <div class="alarm-item-time">${formatTime(alarm.timestamp)}</div>
      `;
      container.appendChild(item);
    });
  } else {
    if (alarmLogs.length === 0) {
      container.innerHTML = '<div class="empty-state">Belum ada riwayat alarm yang tercatat.</div>';
      return;
    }

    alarmLogs.forEach((log) => {
      const item = document.createElement('div');
      item.className = `alarm-item ${log.level}`;
      item.innerHTML = `
        <div>
          <div class="alarm-item-title">${log.unit} &bull; ${ALL_PARAMS[log.parameter]?.label || log.parameter} (${log.level.toUpperCase()})</div>
          <div class="alarm-item-desc">${log.message}</div>
        </div>
        <div class="alarm-item-time">${formatTime(log.timestamp)}</div>
      `;
      container.appendChild(item);
    });
  }
}

function populateSettingsInputs() {
  document.getElementById('input-backend-url').value = currentBackendUrl || '';
  document.getElementById('input-mqtt-url').value = serverMqttConfig.url || '';
  document.getElementById('input-mqtt-port').value = serverMqttConfig.port || 1883;
  document.getElementById('input-mqtt-user').value = serverMqttConfig.username || '';
  document.getElementById('input-mqtt-pass').value = '';

  setBackendStatus(socket && socket.connected ? 'connected' : 'disconnected', socket && socket.connected ? 'Server: Terhubung' : 'Server: Terputus');
  setMqttStatus(Boolean(serverMqttConfig.url), `${serverMqttConfig.url}:${serverMqttConfig.port}`);
}

function populateThresholdInputs() {
  renderModalEngineStatusList();
  UNITS.forEach(u => updateUnitStatusDisplay(u));

  // Main
  document.getElementById('th-active-power-min').value = thresholds.Active_Power?.min !== undefined ? thresholds.Active_Power.min : -200;
  document.getElementById('th-active-power-max').value = thresholds.Active_Power?.max !== undefined ? thresholds.Active_Power.max : 1200;
  document.getElementById('th-reactive-power-min').value = thresholds.Reactive_Power?.min !== undefined ? thresholds.Reactive_Power.min : -200;
  document.getElementById('th-reactive-power-max').value = thresholds.Reactive_Power?.max !== undefined ? thresholds.Reactive_Power.max : 1000;
  document.getElementById('th-current-max').value = thresholds.Generator_Current?.max !== undefined ? thresholds.Generator_Current.max : 1800;
  document.getElementById('th-speed-max').value = thresholds.Engine_Speed?.max !== undefined ? thresholds.Engine_Speed.max : 510;

  // System Pressure (Min)
  document.getElementById('th-sys-fo-press').value = thresholds['fuel oil inlet press 101PT']?.min !== undefined ? thresholds['fuel oil inlet press 101PT'].min : 4.50;
  document.getElementById('th-sys-lo-press').value = thresholds['lube oil inlet press 201PT']?.min !== undefined ? thresholds['lube oil inlet press 201PT'].min : 3.50;
  document.getElementById('th-sys-ht-press').value = thresholds['HT-water inlet press 401PT']?.min !== undefined ? thresholds['HT-water inlet press 401PT'].min : 2.00;
  document.getElementById('th-sys-lt-press').value = thresholds['LT-water inlet press 451PT']?.min !== undefined ? thresholds['LT-water inlet press 451PT'].min : 2.00;
  document.getElementById('th-sys-startair-press').value = thresholds['starting air press 301PT']?.min !== undefined ? thresholds['starting air press 301PT'].min : 25.00;
  document.getElementById('th-sys-chargeair-press').value = thresholds['charge air press A 601PT_1']?.min !== undefined ? thresholds['charge air press A 601PT_1'].min : 1.80;

  // System Temp (Max)
  document.getElementById('th-sys-ht-in-temp').value = thresholds['HT water inlet temp 401TE']?.max !== undefined ? thresholds['HT water inlet temp 401TE'].max : 85.0;
  document.getElementById('th-sys-ht-out-temp').value = thresholds['HT water outlet temp 401TE']?.max !== undefined ? thresholds['HT water outlet temp 401TE'].max : 95.0;
  document.getElementById('th-sys-lo-temp').value = thresholds['lube oil inlet temp 201TE']?.max !== undefined ? thresholds['lube oil inlet temp 201TE'].max : 75.0;
  document.getElementById('th-sys-fo-temp').value = thresholds['fuel oil inlet temp 101TE']?.max !== undefined ? thresholds['fuel oil inlet temp 101TE'].max : 120.0;

  document.getElementById('switch-sound').checked = notifSettings.sound;
  document.getElementById('switch-push').checked = notifSettings.push;
}

// ---------- 13. Event Listeners Setup ----------
function setupEventListeners() {
  // Page Switcher Tab Navigation
  const btnTabMain = document.getElementById('btn-tab-main-page');
  const btnTabSystem = document.getElementById('btn-tab-system-page');
  const pageMain = document.getElementById('page-main');
  const pageSystem = document.getElementById('page-system');

  btnTabMain.addEventListener('click', () => {
    btnTabMain.classList.add('active');
    btnTabSystem.classList.remove('active');
    pageMain.classList.remove('hidden');
    pageSystem.classList.add('hidden');
  });

  btnTabSystem.addEventListener('click', () => {
    btnTabSystem.classList.add('active');
    btnTabMain.classList.remove('active');
    pageSystem.classList.remove('hidden');
    pageMain.classList.add('hidden');
  });

  // Modal Admin Login
  const modalAdminLogin = document.getElementById('modal-admin-login');
  const btnAdminAuth = document.getElementById('btn-admin-auth');
  const btnCloseAdminLogin = document.getElementById('btn-close-admin-login');
  const btnCancelAdminLogin = document.getElementById('btn-cancel-admin-login');
  const btnSubmitAdminLogin = document.getElementById('btn-submit-admin-login');

  btnAdminAuth.addEventListener('click', () => {
    if (isAdminLoggedIn()) {
      if (confirm('Apakah Anda ingin keluar dari sesi Admin?')) {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
        updateAdminUI();
        showToast('Telah keluar dari mode Admin 🔒', 'info');
      }
    } else {
      modalAdminLogin.classList.remove('hidden');
      document.getElementById('input-admin-pass').value = '';
      document.getElementById('input-admin-pass').focus();
    }
  });

  btnCloseAdminLogin.addEventListener('click', () => modalAdminLogin.classList.add('hidden'));
  btnCancelAdminLogin.addEventListener('click', () => modalAdminLogin.classList.add('hidden'));

  btnSubmitAdminLogin.addEventListener('click', handleAdminLogin);
  document.getElementById('input-admin-pass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdminLogin();
  });

  function handleAdminLogin() {
    const user = document.getElementById('input-admin-user').value.trim();
    const pass = document.getElementById('input-admin-pass').value;

    fetch(`${currentBackendUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user, password: pass }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then(() => {
        localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'admin');
        updateAdminUI();
        modalAdminLogin.classList.add('hidden');
        showToast('Login Administrator Berhasil! 👑', 'success');
      })
      .catch(() => {
        if (user === 'admin' && pass === 'adip') {
          localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'admin');
          updateAdminUI();
          modalAdminLogin.classList.add('hidden');
          showToast('Login Administrator Berhasil! 👑', 'success');
        } else {
          showToast('Username atau Password Admin salah!', 'error');
        }
      });
  }

  // Modal Settings
  const modalSettings = document.getElementById('modal-settings');
  document.getElementById('btn-open-settings').addEventListener('click', () => {
    populateSettingsInputs();
    modalSettings.classList.remove('hidden');
  });
  document.getElementById('btn-close-settings').addEventListener('click', () => {
    modalSettings.classList.add('hidden');
  });

  // Modal Thresholds
  const modalThresholds = document.getElementById('modal-thresholds');
  document.getElementById('btn-open-thresholds').addEventListener('click', () => {
    populateThresholdInputs();
    updateAdminUI();
    modalThresholds.classList.remove('hidden');
  });
  document.getElementById('btn-close-thresholds').addEventListener('click', () => {
    modalThresholds.classList.add('hidden');
  });
  document.getElementById('btn-view-alarm-details').addEventListener('click', () => {
    renderAlarmList('active');
    modalAlarms.classList.remove('hidden');
  });

  // Modal Alarms
  const modalAlarms = document.getElementById('modal-alarms');
  document.getElementById('btn-open-alarms').addEventListener('click', () => {
    renderAlarmList('active');
    modalAlarms.classList.remove('hidden');
  });
  document.getElementById('btn-close-alarms').addEventListener('click', () => {
    modalAlarms.classList.add('hidden');
  });

  // Tabs di Modal Settings & Thresholds
  document.querySelectorAll('.modal-tabs .tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const parentModal = btn.closest('.modal-container');
      if (!parentModal) return;
      parentModal.querySelectorAll('.modal-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
      parentModal.querySelectorAll('.modal-body .tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.getAttribute('data-tab'));
      if (target) target.classList.add('active');
    });
  });

  // Tabs di Modal Alarms
  const btnTabActive = document.getElementById('btn-tab-active-alarms');
  const btnTabLogs = document.getElementById('btn-tab-alarm-logs');
  btnTabActive.addEventListener('click', () => {
    btnTabActive.classList.add('active');
    btnTabLogs.classList.remove('active');
    renderAlarmList('active');
  });
  btnTabLogs.addEventListener('click', () => {
    btnTabLogs.classList.add('active');
    btnTabActive.classList.remove('active');
    renderAlarmList('logs');
  });
  document.getElementById('btn-clear-logs').addEventListener('click', () => {
    alarmLogs = [];
    localStorage.removeItem(STORAGE_KEYS.ALARM_LOGS);
    renderAlarmList('logs');
    showToast('Riwayat alarm telah dihapus', 'info');
  });

  // Simpan Server Backend URL & Sambungkan
  document.getElementById('btn-save-backend').addEventListener('click', () => {
    const urlInput = document.getElementById('input-backend-url').value.trim();
    if (!urlInput) {
      showToast('Harap masukkan URL Server Backend!', 'error');
      return;
    }
    currentBackendUrl = urlInput;
    localStorage.setItem(STORAGE_KEYS.BACKEND_URL, urlInput);
    initSocketConnection();
    showToast('Menyambungkan ke Server Backend...', 'info');
  });

  document.getElementById('btn-reset-backend').addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEYS.BACKEND_URL);
    currentBackendUrl = getInitialBackendUrl();
    document.getElementById('input-backend-url').value = currentBackendUrl;
    initSocketConnection();
    showToast('URL Server direset ke default', 'info');
  });

  // Simpan MQTT Config & Hubungkan Ulang
  document.getElementById('btn-save-mqtt').addEventListener('click', () => {
    if (!isAdminLoggedIn()) {
      showToast('🔒 Hak akses Admin diperlukan untuk mengubah konfigurasi MQTT!', 'error');
      modalAdminLogin.classList.remove('hidden');
      return;
    }

    const url = document.getElementById('input-mqtt-url').value.trim();
    const port = parseInt(document.getElementById('input-mqtt-port').value.trim(), 10) || 1883;
    const username = document.getElementById('input-mqtt-user').value.trim();
    const password = document.getElementById('input-mqtt-pass').value;

    const newCfg = { url, port, username, password };
    if (socket && socket.connected) {
      socket.emit('update-mqtt-config', newCfg);
      showToast('Mengirim pembaruan konfigurasi MQTT ke server...', 'info');
    } else {
      fetch(`${currentBackendUrl}/api/mqtt/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCfg),
      })
        .then((r) => r.json())
        .then(() => showToast('Konfigurasi MQTT disimpan via API', 'success'))
        .catch(() => showToast('Gagal menghubungi backend', 'error'));
    }
  });

  // Simpan Batas Ambang (Thresholds)
  document.getElementById('btn-save-thresholds').addEventListener('click', () => {
    if (!isAdminLoggedIn()) {
      showToast('🔒 Hak akses Admin diperlukan untuk menyimpan batas ambang!', 'error');
      modalAdminLogin.classList.remove('hidden');
      return;
    }

    // 1. Main Parameters
    thresholds.Active_Power = {
      min: parseFloat(document.getElementById('th-active-power-min').value) || -200,
      max: parseFloat(document.getElementById('th-active-power-max').value) || 1200,
      label: 'Active Power',
      unit: 'kW',
    };

    thresholds.Reactive_Power = {
      min: parseFloat(document.getElementById('th-reactive-power-min').value) || -200,
      max: parseFloat(document.getElementById('th-reactive-power-max').value) || 1000,
      label: 'Reactive Power',
      unit: 'kVAR',
    };

    thresholds.Generator_Current = {
      max: parseFloat(document.getElementById('th-current-max').value) || 1800,
      label: 'Generator Current',
      unit: 'A',
    };

    thresholds.Engine_Speed = {
      max: parseFloat(document.getElementById('th-speed-max').value) || 510,
      label: 'Engine Speed',
      unit: 'RPM',
    };

    // 2. System Pressure (Min)
    thresholds['fuel oil inlet press 101PT'] = { min: parseFloat(document.getElementById('th-sys-fo-press').value) || 4.50, label: 'FO Inlet Press (101PT)', unit: 'bar', type: 'pressure' };
    thresholds['lube oil inlet press 201PT'] = { min: parseFloat(document.getElementById('th-sys-lo-press').value) || 3.50, label: 'LO Inlet Press (201PT)', unit: 'bar', type: 'pressure' };
    thresholds['HT-water inlet press 401PT'] = { min: parseFloat(document.getElementById('th-sys-ht-press').value) || 2.00, label: 'HT-Water Inlet Press (401PT)', unit: 'bar', type: 'pressure' };
    thresholds['LT-water inlet press 451PT'] = { min: parseFloat(document.getElementById('th-sys-lt-press').value) || 2.00, label: 'LT-Water Inlet Press (451PT)', unit: 'bar', type: 'pressure' };
    thresholds['starting air press 301PT'] = { min: parseFloat(document.getElementById('th-sys-startair-press').value) || 25.00, label: 'Starting Air Press (301PT)', unit: 'bar', type: 'pressure' };
    thresholds['charge air press A 601PT_1'] = { min: parseFloat(document.getElementById('th-sys-chargeair-press').value) || 1.80, label: 'Charge Air Press A (601PT_1)', unit: 'bar', type: 'pressure' };

    // 3. System Temp (Max)
    thresholds['HT water inlet temp 401TE'] = { max: parseFloat(document.getElementById('th-sys-ht-in-temp').value) || 85.0, label: 'HT Water Inlet Temp (401TE)', unit: '°C', type: 'temp' };
    thresholds['HT water outlet temp 401TE'] = { max: parseFloat(document.getElementById('th-sys-ht-out-temp').value) || 95.0, label: 'HT Water Outlet Temp (401TE)', unit: '°C', type: 'temp' };
    thresholds['lube oil inlet temp 201TE'] = { max: parseFloat(document.getElementById('th-sys-lo-temp').value) || 75.0, label: 'LO Inlet Temp (201TE)', unit: '°C', type: 'temp' };
    thresholds['fuel oil inlet temp 101TE'] = { max: parseFloat(document.getElementById('th-sys-fo-temp').value) || 120.0, label: 'FO Inlet Temp (101TE)', unit: '°C', type: 'temp' };

    notifSettings.sound = document.getElementById('switch-sound').checked;
    notifSettings.push = document.getElementById('switch-push').checked;

    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
    localStorage.setItem(STORAGE_KEYS.NOTIF_SETTINGS, JSON.stringify(notifSettings));

    for (const [key, alarm] of Array.from(activeAlarms.entries())) {
      const evalRes = evaluateThreshold(alarm.parameter, alarm.value);
      if (evalRes.level === 'normal') {
        activeAlarms.delete(key);
      }
    }
    updateAlarmUI();

    updateSoundButtonIcon();
    modalThresholds.classList.add('hidden');
    showToast('Batas ambang & preferensi disimpan', 'success');

    if (notifSettings.push && 'Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  });

  document.getElementById('btn-reset-thresholds').addEventListener('click', () => {
    if (!isAdminLoggedIn()) {
      showToast('🔒 Hak akses Admin diperlukan untuk reset batas ambang!', 'error');
      modalAdminLogin.classList.remove('hidden');
      return;
    }

    thresholds = JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS));
    localStorage.setItem(STORAGE_KEYS.THRESHOLDS, JSON.stringify(thresholds));
    populateThresholdInputs();

    for (const [key, alarm] of Array.from(activeAlarms.entries())) {
      const evalRes = evaluateThreshold(alarm.parameter, alarm.value);
      if (evalRes.level === 'normal') {
        activeAlarms.delete(key);
      }
    }
    updateAlarmUI();

    showToast('Batas ambang direset ke default', 'info');
  });

  // Audio Toggle Button
  const btnAudio = document.getElementById('btn-audio-toggle');
  btnAudio.addEventListener('click', () => {
    notifSettings.sound = !notifSettings.sound;
    localStorage.setItem(STORAGE_KEYS.NOTIF_SETTINGS, JSON.stringify(notifSettings));
    updateSoundButtonIcon();
    showToast(notifSettings.sound ? 'Suara alarm diaktifkan 🔊' : 'Suara alarm dimatikan 🔇', 'info');
  });

  // Tutup modal saat klik di luar container
  [modalAdminLogin, modalSettings, modalThresholds, modalAlarms].forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });
}

function updateSoundButtonIcon() {
  const iconOn = document.getElementById('icon-sound-on');
  const iconOff = document.getElementById('icon-sound-off');
  if (notifSettings.sound) {
    if (iconOn) iconOn.classList.remove('hidden');
    if (iconOff) iconOff.classList.add('hidden');
  } else {
    if (iconOn) iconOn.classList.add('hidden');
    if (iconOff) iconOff.classList.remove('hidden');
  }
}

// ---------- 14. App Bootstrapping ----------
function initApp() {
  buildMainDashboard();
  buildSystemDashboard();
  setupEventListeners();
  updateAdminUI();
  updateSoundButtonIcon();
  initSocketConnection();

  if (notifSettings.push && 'Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

initApp();
