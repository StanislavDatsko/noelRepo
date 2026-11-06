const recentOrders = new Map();
const DEDUPE_WINDOW_MS = 10 * 60 * 1000;

function readPayload(response) {
  return response.text().then(text => { if (!text) return {}; try { return JSON.parse(text); } catch { return { raw: text }; } });
}
function confirmed(payload) {
  if (!payload || typeof payload !== 'object') return false;
  if (typeof payload.raw === 'string' && /^(ok|success|saved)$/i.test(payload.raw.trim())) return true;
  if (payload.ok === true || payload.success === true) return true;
  return ['ok', 'success', 'saved'].includes(String(payload.status || payload.result || '').toLowerCase());
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { name, phone, consent, website, traffic = {} } = req.body || {};
  if (website) return res.status(400).json({ error: 'Invalid request' });
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80 || typeof phone !== 'string' || !/^\+380\d{9}$/.test(phone) || consent !== 'on') {
    return res.status(400).json({ error: 'Invalid form data' });
  }
  const cleanName = name.trim();
  const duplicateKey = `${phone}:${cleanName.toLocaleLowerCase('uk-UA')}`;
  const previous = recentOrders.get(duplicateKey);
  if (previous && Date.now() - previous < DEDUPE_WINDOW_MS) return res.status(409).json({ error: 'Заявка вже прийнята. Ми скоро зателефонуємо.' });

  const sheetsUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const sheetsSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;
  const sheetsEnabled = Boolean(sheetsUrl && sheetsSecret);
  const telegramEnabled = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
  // At least one receiver must be configured, otherwise a lead would be silently lost.
  if (!sheetsEnabled && !telegramEnabled) return res.status(503).json({ error: 'Order integrations are not configured' });

  const now = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' });
  const safeTraffic = traffic && typeof traffic === 'object' ? traffic : {};
  const utmSource = typeof safeTraffic.utm_source === 'string' ? safeTraffic.utm_source.slice(0, 160) : '';
  const utmCampaign = typeof safeTraffic.utm_campaign === 'string' ? safeTraffic.utm_campaign.slice(0, 160) : '';
  const source = Object.entries(safeTraffic).filter(([k, v]) => /^(utm_|gclid$|fbclid$|ttclid$)/.test(k) && typeof v === 'string').map(([k, v]) => `${k}: ${v.slice(0, 160)}`).join(', ') || 'прямий захід';
  const message = `🎄 НОВЕ НОВОРІЧНЕ ЗАМОВЛЕННЯ!\n\n👤 Ім’я: ${cleanName}\n📞 Телефон: ${phone}\n🎁 Товар: Різдвяний магнітний мініпрогравач\n💰 Ціна: 1 422,98 грн\n📅 Дата: ${now}\n📢 Джерело: ${source}`;

  const sheetsRequest = !sheetsEnabled ? Promise.resolve() : fetch(sheetsUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: cleanName, phone, utm_source: utmSource, utm_campaign: utmCampaign, secret: sheetsSecret }) }).then(async response => {
    const payload = await readPayload(response);
    if (!response.ok || !confirmed(payload)) throw new Error('Google Sheets was not confirmed');
  });
  const telegramRequest = telegramEnabled ? fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message }) }).then(async response => { const payload = await readPayload(response); if (!response.ok || payload.ok !== true) throw new Error('Telegram failed'); }) : Promise.resolve();
  // Deliver to every configured channel. The lead counts as received if at least one
  // channel confirmed it, so a temporary outage of one channel never loses the order
  // (and never makes the customer resubmit and create duplicates in the other channel).
  const results = await Promise.allSettled([sheetsRequest, telegramRequest]);
  const failed = results.filter(r => r.status === 'rejected');
  failed.forEach(r => console.error('Order delivery channel failed:', r.reason?.message));
  const channels = [sheetsEnabled, telegramEnabled].filter(Boolean).length;
  if (failed.length >= channels) return res.status(502).json({ error: 'Order delivery failed' });
  recentOrders.set(duplicateKey, Date.now());
  for (const [key, timestamp] of recentOrders) if (Date.now() - timestamp > DEDUPE_WINDOW_MS) recentOrders.delete(key);
  return res.status(200).json({ ok: true });
}
