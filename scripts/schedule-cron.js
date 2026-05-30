/**
 * Schedule Cron - Server-side schedule execution via MQTT
 * 
 * Runs every 60 seconds, checks MongoDB for enabled schedules,
 * and publishes MQTT relay commands when it's time.
 * 
 * Usage: node scripts/schedule-cron.js
 *   or:  npm run cron
 * 
 * Environment variables (same as the Next.js app):
 *   MONGODB_URI  - MongoDB connection string (default: mongodb://localhost:27017)
 *   MQTT_BROKER_URL - MQTT broker URL (default: mqtt://localhost:1883)
 *   MQTT_USERNAME   - MQTT username (optional)
 *   MQTT_PASSWORD   - MQTT password (optional)
 */

const { MongoClient } = require('mongodb');
const mqtt = require('mqtt');

// ── Configuration ──────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'smartdwell';
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds

// ── State ──────────────────────────────────────────────────────────
let mongoClient = null;
let db = null;
let mqttClient = null;

// ── MongoDB helpers ────────────────────────────────────────────────
async function connectMongo() {
  if (mongoClient) return db;
  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  db = mongoClient.db(DB_NAME);
  console.log('[Cron] ✅ Connected to MongoDB');
  return db;
}

function getSchedulesCollection() {
  return db.collection('schedules');
}

// ── MQTT helpers ───────────────────────────────────────────────────
function connectMqtt() {
  return new Promise((resolve, reject) => {
    const opts = {
      clientId: `schedule-cron-${Date.now()}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 5000,
    };
    if (MQTT_USERNAME) {
      opts.username = MQTT_USERNAME;
      opts.password = MQTT_PASSWORD;
    }

    console.log(`[Cron] Connecting to MQTT broker ${MQTT_BROKER_URL}...`);
    mqttClient = mqtt.connect(MQTT_BROKER_URL, opts);

    mqttClient.on('connect', () => {
      console.log('[Cron] ✅ Connected to MQTT broker');
      resolve(mqttClient);
    });

    mqttClient.on('error', (err) => {
      console.error('[Cron] ❌ MQTT error:', err.message);
    });

    mqttClient.on('reconnect', () => {
      console.log('[Cron] 🔄 Reconnecting to MQTT...');
    });

    // Timeout fallback
    setTimeout(() => {
      if (!mqttClient.connected) {
        reject(new Error('MQTT connection timeout'));
      }
    }, 10000);
  });
}

function publishRelay(mac, relayNum, state) {
  return new Promise((resolve) => {
    if (!mqttClient || !mqttClient.connected) {
      console.error('[Cron] ❌ MQTT not connected, cannot publish');
      resolve(false);
      return;
    }

    const topic = `sdwell/${mac}/cmd/relay`;
    const payload = JSON.stringify({ relay: relayNum, state });

    mqttClient.publish(topic, payload, { qos: 0 }, (err) => {
      if (err) {
        console.error(`[Cron] ❌ Publish error: ${err.message}`);
        resolve(false);
      } else {
        console.log(`[Cron] 📡 Published: ${topic} → ${payload}`);
        resolve(true);
      }
    });
  });
}

// ── Time helpers ───────────────────────────────────────────────────
function getCurrentHHMM() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getCurrentDayShort() {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return days[new Date().getDay()];
}

function getOffTime(onTime, durationMinutes) {
  if (!onTime || !durationMinutes) return null;
  const [h, m] = onTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const offH = Math.floor(totalMinutes / 60) % 24;
  const offM = totalMinutes % 60;
  return `${String(offH).padStart(2, '0')}:${String(offM).padStart(2, '0')}`;
}

function getTodayDateStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function wasRunRecently(lastRun, windowMinutes = 2) {
  if (!lastRun) return false;
  const lastRunDate = new Date(lastRun);
  const now = new Date();
  const diffMs = now.getTime() - lastRunDate.getTime();
  return diffMs < windowMinutes * 60 * 1000;
}

// ── Schedule evaluation ────────────────────────────────────────────
function shouldRunNow(schedule, currentTime, currentDay, todayDate) {
  switch (schedule.scheduleType) {
    case 'daily':
      return true; // daily schedules run every day

    case 'weekly':
      if (!schedule.days || !Array.isArray(schedule.days)) return false;
      return schedule.days.includes(currentDay);

    case 'once':
      if (!schedule.date) return false;
      return schedule.date === todayDate;

    case 'interval':
      // Interval schedules: run if enough time has passed since lastRun
      if (!schedule.intervalMinutes) return false;
      if (!schedule.lastRun) return true; // never run, run now
      const lastRun = new Date(schedule.lastRun);
      const now = new Date();
      const elapsedMinutes = (now.getTime() - lastRun.getTime()) / 60000;
      return elapsedMinutes >= schedule.intervalMinutes;

    default:
      return false;
  }
}

// ── Main cron tick ─────────────────────────────────────────────────
async function tick() {
  try {
    const collection = getSchedulesCollection();
    const schedules = await collection.find({ enabled: true }).toArray();

    if (schedules.length === 0) {
      return; // Nothing to do
    }

    const currentTime = getCurrentHHMM();
    const currentDay = getCurrentDayShort();
    const todayDate = getTodayDateStr();

    console.log(`\n[Cron] ⏰ Tick at ${currentTime} (${currentDay}, ${todayDate}) — ${schedules.length} enabled schedule(s)`);

    for (const schedule of schedules) {
      // Skip schedules without a device MAC
      if (!schedule.mac) {
        continue;
      }

      // Extract relay number from relayId (e.g. "relay-3" → 3)
      const relayNum = parseInt((schedule.relayId || '').split('-')[1], 10);
      if (!relayNum || relayNum < 1 || relayNum > 6) {
        console.warn(`[Cron] ⚠️  Schedule "${schedule.name}" has invalid relayId: ${schedule.relayId}`);
        continue;
      }

      // Check if this schedule should be active today/now based on type
      if (!shouldRunNow(schedule, currentTime, currentDay, todayDate)) {
        continue;
      }

      const onTime = schedule.time;
      const offTime = getOffTime(onTime, schedule.durationMinutes);

      // --- Handle interval schedules separately ---
      if (schedule.scheduleType === 'interval') {
        if (!wasRunRecently(schedule.lastRun, 2)) {
          console.log(`[Cron] 🔁 Interval trigger: "${schedule.name}" → Relay ${relayNum} ON on ${schedule.mac}`);
          await publishRelay(schedule.mac, relayNum, 'on');

          // If duration is set, schedule an OFF after durationMinutes
          if (schedule.durationMinutes) {
            const offDelayMs = schedule.durationMinutes * 60 * 1000;
            setTimeout(async () => {
              console.log(`[Cron] ⏹️  Interval OFF: "${schedule.name}" → Relay ${relayNum} OFF on ${schedule.mac}`);
              await publishRelay(schedule.mac, relayNum, 'off');
            }, offDelayMs);
          }

          // Update lastRun
          await collection.updateOne(
            { id: schedule.id },
            {
              $set: {
                lastRun: new Date().toISOString(),
                nextRun: new Date(Date.now() + schedule.intervalMinutes * 60000).toISOString(),
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
        continue;
      }

      // --- Handle time-based schedules (daily, weekly, once) ---

      // Check ON time
      if (onTime === currentTime) {
        // Prevent duplicate runs within 2 minutes
        const lastRunKey = `lastRun_on`;
        if (schedule[lastRunKey] && wasRunRecently(schedule[lastRunKey], 2)) {
          continue;
        }

        console.log(`[Cron] 🟢 ON trigger: "${schedule.name}" → Relay ${relayNum} ON on ${schedule.mac}`);
        const success = await publishRelay(schedule.mac, relayNum, 'on');

        if (success) {
          await collection.updateOne(
            { id: schedule.id },
            {
              $set: {
                lastRun: new Date().toISOString(),
                lastRun_on: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
      }

      // Check OFF time
      if (offTime && offTime === currentTime) {
        const lastRunKey = `lastRun_off`;
        if (schedule[lastRunKey] && wasRunRecently(schedule[lastRunKey], 2)) {
          continue;
        }

        console.log(`[Cron] 🔴 OFF trigger: "${schedule.name}" → Relay ${relayNum} OFF on ${schedule.mac}`);
        const success = await publishRelay(schedule.mac, relayNum, 'off');

        if (success) {
          await collection.updateOne(
            { id: schedule.id },
            {
              $set: {
                lastRun_off: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            }
          );
        }
      }

      // Disable 'once' schedules after they've run
      if (schedule.scheduleType === 'once' && onTime === currentTime) {
        console.log(`[Cron] 📌 Disabling one-time schedule: "${schedule.name}"`);
        await collection.updateOne(
          { id: schedule.id },
          { $set: { enabled: false, updatedAt: new Date().toISOString() } }
        );
      }
    }
  } catch (error) {
    console.error('[Cron] ❌ Tick error:', error);
  }
}

// ── Startup ────────────────────────────────────────────────────────
async function start() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  SmartDwell Schedule Cron Service');
  console.log('  Checking schedules every 60 seconds');
  console.log('═══════════════════════════════════════════════════');

  try {
    await connectMongo();
    await connectMqtt();

    // Run first tick immediately
    await tick();

    // Then run every CHECK_INTERVAL_MS
    setInterval(tick, CHECK_INTERVAL_MS);

    console.log(`[Cron] ✅ Cron running. Checking every ${CHECK_INTERVAL_MS / 1000}s`);
  } catch (error) {
    console.error('[Cron] ❌ Failed to start:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[Cron] Shutting down...');
  if (mqttClient) mqttClient.end();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[Cron] Shutting down...');
  if (mqttClient) mqttClient.end();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

start();
