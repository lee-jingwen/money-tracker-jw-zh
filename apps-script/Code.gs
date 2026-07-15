// Google Apps Script Web App backend for the Money Tracker.
// Deploy this bound to a Google Sheet with a tab named "Entries" whose
// columns are, in order:
// Date | Description | Amount | PaidBy | Category | Id | Owed
// See README.md for full setup + deployment steps.

const SHEET_NAME = 'Entries';
const ID_COL = 6; // column F

// Shared passcode gate. This repo is public, so this file only ever holds
// the placeholder below — change it to your real secret directly in the
// Apps Script editor (Extensions > Apps Script), which lives on Google's
// servers and is never pushed to git. Do NOT replace this placeholder here
// and commit that change.
const PASSCODE = 'CHANGE_ME';

function isAuthorized(provided) {
  return typeof provided === 'string' && provided.length > 0 && provided === PASSCODE;
}

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Returns the 1-indexed sheet row for a given entry id, or -1 if not found.
function findRowById(sheet, id) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const ids = sheet.getRange(2, ID_COL, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) return i + 2;
  }
  return -1;
}

function doGet(e) {
  if (!isAuthorized(e.parameter.passcode)) {
    return jsonOutput({ error: 'unauthorized' });
  }

  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  rows.shift(); // drop header row

  const entries = rows
    .filter((r) => r[0] !== '')
    .map((r) => ({
      date: String(r[0]),
      description: r[1],
      amount: Number(r[2]),
      paidBy: r[3],
      category: r[4] || 'other',
      id: r[5] || '',
      owedAmount: Number(r[6]) || 0,
    }));

  return jsonOutput({ entries });
}

function doPost(e) {
  try {
    const sheet = getSheet();
    const body = JSON.parse(e.postData.contents);

    if (!isAuthorized(body.passcode)) {
      return jsonOutput({ success: false, error: 'unauthorized' });
    }

    const action = body.action || 'add';

    if (action === 'add') {
      if (!body.date || !body.description || !body.amount || !body.paidBy) {
        return jsonOutput({ success: false, error: 'Missing required field' });
      }
      const id = Utilities.getUuid();
      const row = sheet.getLastRow() + 1;
      const range = sheet.getRange(row, 1, 1, 7);
      // Force plain-text format so the date string is stored exactly as
      // sent, instead of Sheets auto-converting it to a date serial (which
      // can shift by a day once re-read through a timezone).
      range.setNumberFormat('@');
      range.setValues([[
        body.date,
        body.description,
        Number(body.amount),
        body.paidBy,
        body.category || 'other',
        id,
        Number(body.owedAmount) || 0,
      ]]);
      return jsonOutput({ success: true, id });
    }

    if (action === 'update') {
      if (!body.id) return jsonOutput({ success: false, error: 'Missing id' });
      const row = findRowById(sheet, body.id);
      if (row === -1) return jsonOutput({ success: false, error: 'Entry not found' });

      sheet.getRange(row, 1, 1, 5).setNumberFormat('@');
      sheet.getRange(row, 1, 1, 5).setValues([[
        body.date,
        body.description,
        Number(body.amount),
        body.paidBy,
        body.category || 'other',
      ]]);
      sheet.getRange(row, 7, 1, 1).setValue(Number(body.owedAmount) || 0);
      return jsonOutput({ success: true });
    }

    if (action === 'delete') {
      if (!body.id) return jsonOutput({ success: false, error: 'Missing id' });
      const row = findRowById(sheet, body.id);
      if (row === -1) return jsonOutput({ success: false, error: 'Entry not found' });

      sheet.deleteRow(row);
      return jsonOutput({ success: true });
    }

    return jsonOutput({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOutput({ success: false, error: err.message });
  }
}
