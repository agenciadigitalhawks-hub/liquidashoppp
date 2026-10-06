import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createHmac, timingSafeEqual } from 'crypto';

const DIR = '/tmp/kwai-events';
const PASS = process.env.DASH_PASS || 'Kw@1D4sh!2026';
const TRACKER_TOKEN = 'k7x9m2vQ';
const SECRET = process.env.DASH_SECRET || 'wH8kLp3nR7xQ2vY5';

function ensureDir() { if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true }); }
function dayFile(d) { return join(DIR, d + '.ndjson'); }

const rateMap = new Map();
function rateLimit(ip, max, windowSec) {
  const now = Date.now();
  const key = ip;
  let entry = rateMap.get(key);
  if (!entry || now - entry.start > windowSec * 1000) {
    entry = { start: now, count: 0 };
    rateMap.set(key, entry);
  }
  entry.count++;
  return entry.count > max;
}

function signToken(payload) {
  return createHmac('sha256', SECRET).update(payload).digest('hex');
}

function safeCompare(a, b) {
  if (!a || !b) return false;
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch { return false; }
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  ensureDir();
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '0';

  if (req.method === 'POST') {
    if (rateLimit(ip, 120, 60)) return res.status(429).json({ error: 'rate limited' });

    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || !body.e) return res.status(400).json({ error: 'missing event' });
      if (body.tk !== TRACKER_TOKEN) return res.status(403).json({ error: 'invalid token' });

      const allowed = ['pageview','product_click','buy_click','coupon_claim','upsell_click','carta_view','page_leave'];
      if (!allowed.includes(body.e)) return res.status(400).json({ error: 'invalid event' });

      if (body.sid && body.sid.length > 64) return res.status(400).json({ error: 'invalid sid' });
      if (body.page && body.page.length > 200) return res.status(400).json({ error: 'invalid page' });

      const clean = {
        e: body.e,
        sid: String(body.sid || '').slice(0, 64),
        page: String(body.page || '').slice(0, 200),
        ts: Number(body.ts) || Date.now(),
        u: {},
      };
      if (body.product) clean.product = String(body.product).slice(0, 64);
      if (body.upsell) clean.upsell = String(body.upsell).slice(0, 64);
      if (body.dwell) clean.dwell = Math.min(Math.max(Number(body.dwell)||0, 0), 1800);

      const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','click_id','CampaignID','pixel_id'];
      if (body.u && typeof body.u === 'object') {
        utmKeys.forEach(k => { if (body.u[k]) clean.u[k] = String(body.u[k]).slice(0, 256); });
      }

      const day = new Date().toISOString().slice(0, 10);
      writeFileSync(dayFile(day), JSON.stringify(clean) + '\n', { flag: 'a' });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'GET') {
    if (rateLimit(ip, 30, 60)) return res.status(429).json({ error: 'rate limited' });

    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'unauthorized' });

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'unauthorized' });

    const token = parts[1];
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return res.status(401).json({ error: 'unauthorized' });

    const expectedSig = signToken(payload);
    if (!safeCompare(sig, expectedSig)) return res.status(401).json({ error: 'unauthorized' });

    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      if (decoded.exp && decoded.exp < Date.now()) return res.status(401).json({ error: 'expired' });
    } catch { return res.status(401).json({ error: 'unauthorized' }); }

    const from = req.query.from || new Date().toISOString().slice(0, 10);
    const to = req.query.to || from;
    const events = [];
    let d = new Date(from);
    const end = new Date(to);
    while (d <= end) {
      const day = d.toISOString().slice(0, 10);
      const file = dayFile(day);
      if (existsSync(file)) {
        readFileSync(file, 'utf-8').split('\n').filter(Boolean).forEach(l => {
          try { events.push(JSON.parse(l)); } catch {}
        });
      }
      d.setDate(d.getDate() + 1);
    }
    return res.status(200).json({ events, count: events.length });
  }

  return res.status(405).end();
}
