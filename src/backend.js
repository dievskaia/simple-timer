/* eslint-disable no-magic-numbers */
function loadData(ctx) {
  try { return JSON.parse(ctx.issue.extensionProperties.timeTracking || "{}") || {}; } catch { return {}; }
}
function saveData(ctx, data) { ctx.issue.extensionProperties.timeTracking = JSON.stringify(data || {}); }
const nowMs = () => Date.now();
const floorMinutesFromSeconds = s => Math.floor((s || 0) / 60);

exports.httpHandler = {
  endpoints: [
    {
      scope: 'issue',
      method: 'GET',
      path: 'getIssueId',
      handle: function handle(ctx) {
        const issueId = ctx.issue.id;
        ctx.response.json({issueId});
      }
    },
    {
      scope: 'issue',
      method: 'GET',
      path: 'get-time',
      handle: function handle(ctx) {
        const d = loadData(ctx);
        const totalSeconds = Math.max(0, Math.floor(d.totalSeconds || 0));
        return ctx.response.json({ success: true, trackedSeconds: totalSeconds, trackedMinutes: floorMinutesFromSeconds(totalSeconds), runningSince: d.runningSince || null });
      }},

    {
      scope: 'issue',
      method: 'POST',
      path: 'start-time',
      handle: function handle(ctx) {
        const d = loadData(ctx);
        if (!d.runningSince) {
          d.runningSince = nowMs();
          d.totalSeconds = Math.max(0, Math.floor(d.totalSeconds || 0));
          saveData(ctx, d);
        }
        return ctx.response.json({ success: true, runningSince: d.runningSince });
      }},

    {
      scope: 'issue',
      method: 'POST',
      path: 'stop-time',
      handle: function handle(ctx) {
        const d = loadData(ctx);
        if (d.runningSince) {
          const elapsed = Math.max(0, Math.floor((nowMs() - d.runningSince) / 1000));
          d.totalSeconds = Math.max(0, Math.floor(d.totalSeconds || 0)) + elapsed;
          d.runningSince = null;
          saveData(ctx, d);
        }
        const s = Math.max(0, Math.floor(d.totalSeconds || 0));
        return ctx.response.json({ success: true, totalSeconds: s, totalMinutes: floorMinutesFromSeconds(s) });
      }},

    {
      scope: 'issue',
      method: 'POST',
      path: 'reset-tracker',
      handle: function handle(ctx) {
        saveData(ctx, { totalSeconds: 0, entries: [], runningSince: null });
        return ctx.response.json({ success: true });
      }}
  ]
};
