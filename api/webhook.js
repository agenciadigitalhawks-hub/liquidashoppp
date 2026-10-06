import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DIR = '/tmp/kwai-events';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'vega_wh_s3cr3t_2026';

function ensureDir() { if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true }); }
function dayFile(d) { return join(DIR, d + '.ndjson'); }

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

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Webhook-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const secret = req.headers['x-webhook-secret'];
  if (secret !== WEBHOOK_SECRET) return res.status(403).json({ error: 'forbidden' });

  ensureDir();

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const checkoutCode = body.checkout_code || body.product_code || '';
    const product = CHECKOUT_TO_PRODUCT[checkoutCode] || body.product || 'unknown';
    const amount = Number(body.amount) || PRODUCT_PRICES[product] || 0;
    const status = body.status || body.payment_status || 'approved';

    if (status !== 'approved' && status !== 'paid') {
      return res.status(200).json({ ok: true, skipped: true, reason: 'not approved' });
    }

    const event = {
      e: 'sale',
      product: String(product).slice(0, 64),
      amount: amount,
      ts: Date.now(),
      sid: String(body.customer_id || body.order_id || '').slice(0, 64),
      page: 'webhook',
      u: {},
      checkout_code: String(checkoutCode).slice(0, 32),
      order_id: String(body.order_id || '').slice(0, 64),
    };

    if (body.utm_source) event.u.utm_source = String(body.utm_source).slice(0, 256);
    if (body.utm_campaign) event.u.utm_campaign = String(body.utm_campaign).slice(0, 256);

    const day = new Date().toISOString().slice(0, 10);
    writeFileSync(dayFile(day), JSON.stringify(event) + '\n', { flag: 'a' });

    return res.status(200).json({ ok: true, product, amount });
  } catch (e) {
    return res.status(500).json({ error: 'server error' });
  }
}
