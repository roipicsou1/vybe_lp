/**
 * Extensions → Apps Script on VYBE_Waitinglist, then Deploy → Web app.
 * Execute as: Me
 * Who has access: Anyone
 * Put the /exec URL in SHEETS_WEBHOOK_URL. The Next.js server calls it.
 * Credentials never leave Google.
 */
var SHEET_ID = "1GfRltSqlTZZyFgrMYgWqELmdscKPjmJQPAm5T9A3c68";

var HEADERS = [
  "Received at",
  "First name",
  "Last name",
  "City",
  "Journey",
  "What are you building",
  "Role",
  "Ambitions",
  "Email",
  "UTM source",
  "UTM medium",
  "UTM campaign",
  "UTM content",
  "UTM term",
  "Submission id",
];

function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false });
  }

  var sheet = SpreadsheetApp.openById(SHEET_ID).getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  var email = String(data.email || "").toLowerCase();
  var last = sheet.getLastRow();
  if (email && last > 1) {
    var emails = sheet.getRange(2, 9, last - 1, 1).getValues();
    for (var i = 0; i < emails.length; i++) {
      if (String(emails[i][0]).toLowerCase() === email) {
        return json({ ok: true, duplicate: true });
      }
    }
  }

  sheet.appendRow([
    data.receivedAt || new Date(),
    data.firstName || "",
    data.lastName || "",
    data.city || "",
    data.journey || "",
    data.company || "",
    data.role || "",
    data.ambitions || "",
    email,
    data.utmSource || "",
    data.utmMedium || "",
    data.utmCampaign || "",
    data.utmContent || "",
    data.utmTerm || "",
    data.submissionId || "",
  ]);

  return json({ ok: true });
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(
    ContentService.MimeType.JSON
  );
}
