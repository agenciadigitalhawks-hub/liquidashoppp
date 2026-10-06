import { createHmac } from 'crypto';

const PASS = process.env.DASH_PASS || 'Kw@1D4sh!2026';
const SECRET = process.env.DASH_SECRET || 'wH8kLp3nR7xQ2vY5';

const rateMap = new Map();
function rateLimit(ip) {
  const now = Date.now();
  let e = rateMap.get(ip);
  if (!e || now - e.start > 60000) { e = { start: now, count: 0 }; rateMap.set(ip, e); }
  e.count++;
  return e.count > 10;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || '0';
  if (rateLimit(ip)) return res.status(429).json({ error: 'too many attempts' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  if (!body || body.password !== PASS) {
    return res.status(401).json({ error: 'invalid password' });
  }

  const payload = Buffer.from(JSON.stringify({
    iat: Date.now(),
    exp: Date.now() + 12 * 60 * 60 * 1000
  })).toString('base64');

  const sig = createHmac('sha256', SECRET).update(payload).digest('hex');

  return res.status(200).json({ token: payload + '.' + sig });
}
