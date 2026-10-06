import { createServer } from 'http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, extname } from 'path';
import { createHmac, timingSafeEqual } from 'crypto';

const PORT = 3333;
const ROOT = new URL('.', import.meta.url).pathname;
const EV_DIR = join(ROOT, '.dev-events');
if (!existsSync(EV_DIR)) mkdirSync(EV_DIR, { recursive: true });

const PASS = 'Kw@1D4sh!2026';
const SECRET = 'wH8kLp3nR7xQ2vY5';
const TRACKER_TOKEN = 'k7x9m2vQ';
const WEBHOOK_SECRET = 'vega_wh_s3cr3t_2026';

const CHECKOUT_TO_PRODUCT = {
  'VCCL1O8SCTDP':'tv','VCCL1O8SCTDS':'galaxys25','VCCL1O8SCTDT':'som-alok',
  'VCCL1O8SCTDU':'iphone15','VCCL1O8SCTE7':'geladeirabrastemp','VCCL1O8SCTE9':'not',
  'VCCL1O8SCTEA':'bicicleta-austin','VCCL1O8SCTEB':'panela','VCCL1O8SD0XU':'eescorredor',
  'VCCL1O8SCTEC':'ferra','VCCL1O8SCTEE':'tablet','VCCL1O8SCTEF':'ergometrica',
  'VCCL1O8SCTEG':'jbl','VCCL1O8SCTEI':'robo','VCCL1O8SCTEL':'airfri',
  'VCCL1O8SCTEM':'patinete','VCCL1O8SCTEO':'alexa','VCCL1O8SCTEP':'ar',
  'VCCL1O8SCTEQ':'fogao','VCCL1O8SCTET':'cafeteira','VCCL1O8SD9OO':'cafeteira','VCCL1O8SCTEJ':'maleta',
  'VCCL1O8SD0XT':'eescorredor','VCCL1O8SD0W8':'upsell1',
};
const PRODUCT_PRICES = {
  tv:68.27,galaxys25:96.98,'som-alok':58.90,iphone15:124.90,
  geladeirabrastemp:99.99,not:54.05,'bicicleta-austin':87.73,
  panela:48.90,eescorredor:49.90,ferra:59.23,tablet:53.99,
  ergometrica:39.99,jbl:42.90,robo:48.99,airfri:56.90,
  patinete:41.90,alexa:38.72,ar:53.12,fogao:67.13,
  cafeteira:39.90,maleta:34.99,upsell1:0
};

const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml',
  '.gif':'image/gif','.ico':'image/x-icon','.woff2':'font/woff2',
  '.woff':'font/woff','.ttf':'font/ttf','.mp4':'video/mp4',
  '.mp3':'audio/mpeg','.jfif':'image/jpeg','.zip':'application/zip'
};

function dayFile(day) { return join(EV_DIR, day + '.ndjson'); }
function readBody(req) { return new Promise(r => { let d = ''; req.on('data', c => d += c); req.on('end', () => r(d)); }); }
function signToken(p) { return createHmac('sha256', SECRET).update(p).digest('hex'); }
function safeCompare(a, b) {
  if (!a || !b) return false;
  const ba = Buffer.from(a), bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

const rateMap = new Map();
function rateLimit(ip, max, sec) {
  const now = Date.now();
  let e = rateMap.get(ip);
  if (!e || now - e.s > sec * 1000) { e = { s: now, c: 0 }; rateMap.set(ip, e); }
  e.c++;
  return e.c > max;
}

function serveStatic(res, urlPath) {
  let fp = join(ROOT, urlPath);
  if (fp.endsWith('/')) fp = join(fp, 'index.html');
  else if (existsSync(fp) && statSync(fp).isDirectory()) fp = join(fp, 'index.html');
  if (!existsSync(fp)) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('404'); }
  const ext = extname(fp).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  res.end(readFileSync(fp));
}

function verifyAuthToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return false;
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return false;
  const [payload, sig] = parts[1].split('.');
  if (!payload || !sig) return false;
  if (!safeCompare(sig, signToken(payload))) return false;
  try {
    const d = JSON.parse(Buffer.from(payload, 'base64').toString());
    if (d.exp && d.exp < Date.now()) return false;
  } catch { return false; }
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = decodeURIComponent(url.pathname);
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || '0';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Webhook-Secret');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

  // AUTH
  if ((path === '/api/auth' || path === '/api/auth/') && req.method === 'POST') {
    if (rateLimit(ip, 60, 60)) { res.writeHead(429); return res.end('{"error":"too many attempts"}'); }
    const raw = await readBody(req);
    try {
      const body = JSON.parse(raw);
      if (body.password !== PASS) { res.writeHead(401); return res.end('{"error":"invalid"}'); }
      const payload = Buffer.from(JSON.stringify({ iat: Date.now(), exp: Date.now() + 12 * 3600000 })).toString('base64');
      const sig = signToken(payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ token: payload + '.' + sig }));
    } catch { res.writeHead(400); return res.end('{"error":"bad request"}'); }
  }

  // WEBHOOK
  if ((path === '/api/webhook' || path === '/api/webhook/') && req.method === 'POST') {
    const ws = req.headers['x-webhook-secret'];
    if (ws !== WEBHOOK_SECRET) { res.writeHead(403); return res.end('{"error":"forbidden"}'); }
    const raw = await readBody(req);
    try {
      const body = JSON.parse(raw);
      const code = body.checkout_code || body.product_code || '';
      const product = CHECKOUT_TO_PRODUCT[code] || body.product || 'unknown';
      const amount = Number(body.amount) || PRODUCT_PRICES[product] || 0;
      const status = body.status || body.payment_status || 'approved';
      if (status !== 'approved' && status !== 'paid') {
        res.writeHead(200); return res.end('{"ok":true,"skipped":true}');
      }
      const event = { e: 'sale', product, amount, ts: Date.now(), sid: String(body.order_id || '').slice(0, 64), page: 'webhook', u: {}, checkout_code: code, order_id: String(body.order_id || '').slice(0, 64) };
      if (body.utm_source) event.u.utm_source = body.utm_source;
      if (body.utm_campaign) event.u.utm_campaign = body.utm_campaign;
      const day = new Date().toISOString().slice(0, 10);
      writeFileSync(dayFile(day), JSON.stringify(event) + '\n', { flag: 'a' });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: true, product, amount }));
    } catch { res.writeHead(500); return res.end('{"error":"server error"}'); }
  }

  // EVENTS
  if (path === '/api/events' || path === '/api/events/') {
    if (req.method === 'POST') {
      if (rateLimit(ip, 600, 60)) { res.writeHead(429); return res.end('{"error":"rate limited"}'); }
      const raw = await readBody(req);
      try {
        const body = JSON.parse(raw);
        if (!body || !body.e) { res.writeHead(400); return res.end('{"error":"missing event"}'); }
        if (body.tk !== TRACKER_TOKEN) { res.writeHead(403); return res.end('{"error":"invalid token"}'); }
        const allowed = ['pageview','product_click','buy_click','coupon_claim','upsell_click','carta_view','page_leave'];
        if (!allowed.includes(body.e)) { res.writeHead(400); return res.end('{"error":"invalid event"}'); }
        const clean = { e: body.e, sid: String(body.sid || '').slice(0, 64), page: String(body.page || '').slice(0, 200), ts: Number(body.ts) || Date.now(), u: {} };
        if (body.product) clean.product = String(body.product).slice(0, 64);
        if (body.upsell) clean.upsell = String(body.upsell).slice(0, 64);
        if (body.dwell) clean.dwell = Math.min(Math.max(Number(body.dwell)||0, 0), 1800);
        const utmKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','click_id','CampaignID','pixel_id'];
        if (body.u && typeof body.u === 'object') utmKeys.forEach(k => { if (body.u[k]) clean.u[k] = String(body.u[k]).slice(0, 256); });
        const day = new Date().toISOString().slice(0, 10);
        writeFileSync(dayFile(day), JSON.stringify(clean) + '\n', { flag: 'a' });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end('{"ok":true}');
      } catch { res.writeHead(500); return res.end('{"error":"server error"}'); }
    }

    if (req.method === 'GET') {
      if (rateLimit(ip, 120, 60)) { res.writeHead(429); return res.end('{"error":"rate limited"}'); }
      if (!verifyAuthToken(req)) { res.writeHead(401); return res.end('{"error":"unauthorized"}'); }
      const from = url.searchParams.get('from') || new Date().toISOString().slice(0, 10);
      const to = url.searchParams.get('to') || from;
      const events = [];
      let d = new Date(from); const end = new Date(to);
      while (d <= end) {
        const day = d.toISOString().slice(0, 10);
        const f = dayFile(day);
        if (existsSync(f)) readFileSync(f, 'utf-8').split('\n').filter(Boolean).forEach(l => { try { events.push(JSON.parse(l)); } catch {} });
        d.setDate(d.getDate() + 1);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ events, count: events.length }));
    }
    res.writeHead(405); return res.end();
  }

  serveStatic(res, path);
});

server.listen(PORT, () => {
  console.log(`\n  Loja:     http://localhost:${PORT}/loja/`);
  console.log(`  Dash:     http://localhost:${PORT}/dash/`);
  console.log(`  Webhook:  POST http://localhost:${PORT}/api/webhook`);
  console.log(`  Senha:    ${PASS}\n`);
});
