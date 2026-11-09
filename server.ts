import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asia/Dhaka survey helper for server-side scheduling
function getDhakaServerCycle() {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const date = parseInt(map.day, 10);
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const day = weekdayMap[map.weekday] ?? 0;
  const daysSinceSaturday = (day + 1) % 7;

  const d = new Date();
  d.setTime(d.getTime() - daysSinceSaturday * 24 * 60 * 60 * 1000);
  const satParts = formatter.formatToParts(d);
  const satMap: Record<string, string> = {};
  for (const p of satParts) {
    if (p.type !== 'literal') satMap[p.type] = p.value;
  }

  const satYear = parseInt(satMap.year, 10);
  const satMonth = parseInt(satMap.month, 10);
  const satDate = parseInt(satMap.day, 10);

  const satMonthStr = satMonth < 10 ? `0${satMonth}` : `${satMonth}`;
  const satDateStr = satDate < 10 ? `0${satDate}` : `${satDate}`;
  const surveyDate = `${satYear}-${satMonthStr}-${satDateStr}`;

  const jan1 = new Date(Date.UTC(satYear, 0, 1));
  const satUtc = new Date(Date.UTC(satYear, satMonth - 1, satDate));
  const dayOfYear = Math.floor((satUtc.getTime() - jan1.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  const weekNumber = Math.max(1, Math.min(53, Math.ceil(dayOfYear / 7)));
  const weekNumberStr = weekNumber < 10 ? `0${weekNumber}` : `${weekNumber}`;
  const weekId = `${satYear}-W${weekNumberStr}`;

  return {
    weekId,
    surveyDate,
    currentDhakaTime: `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second} Asia/Dhaka`,
    isSaturday: day === 6,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // 1. Health check & Survey status API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'HSC Academic Tracker',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/potential/survey-status', (req, res) => {
    const cycle = getDhakaServerCycle();
    res.json({
      status: 'active',
      timezone: 'Asia/Dhaka (UTC+6)',
      currentCycle: {
        weekId: cycle.weekId,
        surveyDate: cycle.surveyDate,
        dhakaTime: cycle.currentDhakaTime,
        isSaturdayToday: cycle.isSaturday,
      },
      scheduling: {
        mode: 'Automated Hourly Check + Reconciliation Engine',
        cronTarget: 'Every Saturday 00:00:00 Asia/Dhaka',
        externalEndpoint: '/api/potential/auto-carry-forward',
      },
    });
  });

  // 2. Scheduled webhook endpoint for external cron / Cloud Scheduler
  app.post('/api/potential/auto-carry-forward', (req, res) => {
    const cycle = getDhakaServerCycle();
    console.log(`[Scheduler] Automatic carry-forward check executed for ${cycle.weekId} (${cycle.surveyDate})`);
    res.json({
      success: true,
      message: `Survey cycle check registered for ${cycle.weekId}`,
      cycle,
      timestamp: new Date().toISOString(),
    });
  });

  // 3. Periodic Background Server Heartbeat (Hourly check)
  const HOURLY_INTERVAL_MS = 60 * 60 * 1000;
  setInterval(() => {
    try {
      const cycle = getDhakaServerCycle();
      console.log(`[Server Scheduler Heartbeat] Active Dhaka week: ${cycle.weekId}, surveyDate: ${cycle.surveyDate}`);
    } catch (err) {
      console.error('[Server Scheduler Heartbeat] Error checking cycle:', err);
    }
  }, HOURLY_INTERVAL_MS);

  // 4. Vite middleware for development vs static serve for production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    const cycle = getDhakaServerCycle();
    console.log(`[HSC Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[HSC Server] Active Asia/Dhaka Survey Week: ${cycle.weekId} (${cycle.surveyDate})`);
  });
}

startServer().catch((err) => {
  console.error('[HSC Server] Failed to start server:', err);
  process.exit(1);
});
