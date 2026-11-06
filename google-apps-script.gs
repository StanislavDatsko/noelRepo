/**
 * Google Sheets receiver for NOËL landing leads.
 *
 * Setup (once):
 * 1. Create a Google Sheet, then Extensions → Apps Script, paste this file.
 * 2. Project Settings → Script properties → add SECRET = <long random string>
 *    (same value as GOOGLE_SHEETS_WEBHOOK_SECRET in .env.local / Vercel).
 * 3. Deploy → New deployment → type "Web app", Execute as: Me, Who has access: Anyone.
 * 4. Copy the Web app URL into GOOGLE_SHEETS_WEBHOOK_URL.
 * After any code change: Deploy → Manage deployments → edit → New version.
 */
const SHEET_NAME = 'Заявки';
const HEADERS = ['Дата', 'Ім’я', 'Телефон', 'utm_source', 'utm_campaign'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || data.secret !== secret) return json({ ok: false, error: 'forbidden' });

    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 3).setNumberFormat('@'); // keep the leading "+" in phone numbers
    sheet.getRange(row, 1, 1, 5).setValues([[
      Utilities.formatDate(new Date(), 'Europe/Kyiv', 'dd.MM.yyyy HH:mm:ss'),
      String(data.name || '').slice(0, 80),
      String(data.phone || ''),
      String(data.utm_source || ''),
      String(data.utm_campaign || ''),
    ]]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
