/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */

// eslint-disable-next-line no-undef
const host = await YTApp.register();

// --- Backend bridge helpers ---
async function callApp(path, params) {
  const res = await host.fetchApp(path, Object.assign({ scope: true }, params));
  return res;
}

async function backendGetIssueId() {
  const res = await host.fetchApp('backend/getIssueId', { method: 'GET', scope: true });
  return res.issueId;
}

async function backendStartTime()     { return callApp('backend/start-time',     { method: 'POST' }); }
async function backendStopTime()      { return callApp('backend/stop-time',      { method: 'POST' }); }
async function backendGetTime()       { return callApp('backend/get-time',       { method: 'GET'  }); }
async function backendResetTracker()  { return callApp('backend/reset-tracker',  { method: 'POST' }); }

// --- REST helpers (frontend) ---
function buildWorkItemBody(minutes) {
  const mins = Math.max(0, Math.floor(minutes));
  return { duration: { minutes: mins } };
}

async function ytPostWorkItemMinutes(issueId, minutes) {
  const id = String(issueId).trim();
  const path = `issues/${id}/timeTracking/workItems`;
  const res = await host.fetchYouTrack(path, { method: 'POST', body: buildWorkItemBody(minutes) });
  return res;
}

// --- UI wiring and ticking ---
let tickingInterval = null;
let runningSince = null;
let totalSeconds = 0;
let issueId = null; // loaded from backend/getIssueId

function formatTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}m ${r}s`;
}

function computeShownSeconds() {
  if (runningSince) {
    const elapsed = Math.floor((Date.now() - runningSince) / 1000);
    return Math.max(0, totalSeconds + elapsed);
  }
  return Math.max(0, totalSeconds);
}

function render() {
  const btn = document.getElementById('start-stop-timer');
  const saveBtn = document.getElementById('save-time');
  const display = document.getElementById('timer-display');
  const isRunning = Boolean(runningSince);
  btn.textContent = isRunning ? 'Stop Timer' : 'Start Timer';
  saveBtn.style.display = isRunning ? 'none' : 'inline-block';
  display.textContent = `Time Tracked: ${formatTime(computeShownSeconds())}`;
}

function startTicking() { if (!tickingInterval) { console.log('[simple-timer] start ticking'); tickingInterval = setInterval(render, 1000); } }
function stopTicking()  { if (tickingInterval)  { console.log('[simple-timer] stop ticking');  clearInterval(tickingInterval); tickingInterval = null; } }

async function init() {
  try {
    issueId = await backendGetIssueId();
    if (!issueId) {console.error('[simple-timer] Issue ID is empty');}
  } catch (e) {
    console.error('[simple-timer] backendGetIssueId failed', e);
  }

  try {
    const state = await backendGetTime();
    totalSeconds = Math.max(0, Math.floor(state.trackedSeconds || 0));
    runningSince = state.runningSince || null;
  } catch (e) {
    console.error('[simple-timer] backendGetTime failed', e);
    totalSeconds = 0;
    runningSince = null;
  }

  const btn = document.getElementById('start-stop-timer');
  const saveBtn = document.getElementById('save-time');

  btn.addEventListener('click', async () => {
    try {
      if (!runningSince) {
        const res = await backendStartTime();
        runningSince = res.runningSince || Date.now();
        startTicking();
      } else {
        const res = await backendStopTime();
        totalSeconds = Math.max(0, Math.floor(res.totalSeconds || 0));
        runningSince = null;
        stopTicking();
      }
      render();
    } catch (e) {
      console.error('[simple-timer] Toggle timer failed', e);
    }
  });

  saveBtn.addEventListener('click', async () => {
    try {
      if (runningSince) {
        const res = await backendStopTime();
        totalSeconds = Math.max(0, Math.floor(res.totalSeconds || 0));
        runningSince = null;
        stopTicking();
      }
      render();

      const minutes = Math.max(0, Math.floor(totalSeconds / 60));
      if (minutes <= 0) { host.alert('Nothing to save yet (less than 1 minute tracked).'); return; }
      if (!issueId) { host.alert('Cannot save: issue ID is unknown.'); return; }

      await ytPostWorkItemMinutes(issueId, minutes);

      await backendResetTracker();
      totalSeconds = 0;
      runningSince = null;

      render();
      host.alert(`Saved ${minutes} minute(s) to work items.`);
    } catch (e) {
      console.error('[simple-timer] Save time failed', e);
      host.alert('Failed to save time. See console for details.');
    }
  });

  if (runningSince) {startTicking();}
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
