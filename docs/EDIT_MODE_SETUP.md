# Edit Mode Setup (Apps Script Web App)

This project can now send icon edits from `index.html` to a Google Apps Script web app.

The frontend posts JSON as a plain text body (`Content-Type: text/plain`) to avoid browser preflight/CORS issues.

## Frontend Payload

`index.html` sends:

```json
{
  "action": "set_icon",
  "token": "your-shared-token",
  "sheet": "Links",
  "row": 12,
  "icon": "mdi:airplane"
}
```

- `row` is 1-based sheet row index.
- `icon` is written to column C.
- For row deletion, payload is:

```json
{
  "action": "delete_row",
  "token": "your-shared-token",
  "sheet": "Links",
  "row": 12
}
```

- For drag/drop reorder, payload is:

```json
{
  "action": "move_row",
  "token": "your-shared-token",
  "sheet": "Links",
  "row": 12,
  "targetRow": 20
}
```

- `move_row` moves `row` so it lands immediately before `targetRow`.

- For adding a new button row, payload is:

```json
{
  "action": "add_link",
  "token": "your-shared-token",
  "sheet": "Links",
  "label": "Weather",
  "href": "https://windy.com",
  "icon": "mdi:weather-windy"
}
```

- For adding/updating a section title on an existing `<hr>` row:

```json
{
  "action": "set_section_title",
  "token": "your-shared-token",
  "sheet": "Links",
  "row": 15,
  "title": "Planning"
}
```

- For inserting a new titled section break before a row:

```json
{
  "action": "insert_section_break",
  "token": "your-shared-token",
  "sheet": "Links",
  "targetRow": 6,
  "title": "Planning"
}
```

## Apps Script `Code.gs`

Use this in your script project attached to the spreadsheet:

```javascript
const SPREADSHEET_ID = "1ZQDN58WT5hdFVYiJA7yIJocm4vbc0Gw8ecJUj1pkYwg";
const SHARED_TOKEN = "jr_icon_edit_2026_3f8cc9b17d5a4e7ea28c1d9f6ab340c2f71e5a9448b64d2c";

function doOptions() {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || "{}");
    if (body.token !== SHARED_TOKEN) {
      return jsonResponse({ ok: false, error: "Unauthorized" });
    }

    const action = String(body.action || "set_icon");
    const sheetName = String(body.sheet || "Links");
    const row = Number(body.row);
    const targetRow = Number(body.targetRow);
    const title = String(body.title || "").trim();
    const label = String(body.label || "").trim();
    const href = String(body.href || "").trim();
    const icon = String(body.icon || "");

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ ok: false, error: "Sheet not found" });
    }

    if (action === "add_link") {
      if (!label || !href) {
        return jsonResponse({ ok: false, error: "label and href are required" });
      }
      sheet.appendRow([label, href, icon || ""]);
      return jsonResponse({ ok: true, action: action });
    }

    if (action === "insert_section_break") {
      if (!targetRow || targetRow < 1) {
        return jsonResponse({ ok: false, error: "Invalid targetRow" });
      }
      const hrHtml = sectionBreakHtml(title);
      sheet.insertRowsBefore(targetRow, 1);
      sheet.getRange(targetRow, 1, 1, 3).setValues([["HTML", hrHtml, ""]]);
      return jsonResponse({ ok: true, action: action, targetRow: targetRow });
    }

    if (!row || row < 1) {
      return jsonResponse({ ok: false, error: "Invalid row" });
    }

    if (action === "delete_row") {
      if (row > sheet.getLastRow()) {
        return jsonResponse({ ok: false, error: "Row out of range" });
      }
      sheet.deleteRow(row);
      return jsonResponse({ ok: true, action: action, row: row });
    }

    if (action === "move_row") {
      if (!targetRow || targetRow < 1) {
        return jsonResponse({ ok: false, error: "Invalid targetRow" });
      }
      if (row > sheet.getLastRow() || targetRow > sheet.getLastRow()) {
        return jsonResponse({ ok: false, error: "Row out of range" });
      }
      if (row !== targetRow && row + 1 !== targetRow) {
        moveRowBefore(sheet, row, targetRow);
      }
      return jsonResponse({ ok: true, action: action, row: row, targetRow: targetRow });
    }

    if (action === "set_section_title") {
      const currentLabel = String(sheet.getRange(row, 1).getValue() || "").trim();
      if (currentLabel !== "HTML") {
        return jsonResponse({ ok: false, error: "Row is not an HTML section break" });
      }
      sheet.getRange(row, 2).setValue(sectionBreakHtml(title));
      return jsonResponse({ ok: true, action: action, row: row, title: title });
    }

    if (action === "set_icon") {
      // Column C = icon
      sheet.getRange(row, 3).setValue(icon);
      return jsonResponse({ ok: true, action: action, row: row, icon: icon });
    }

    return jsonResponse({ ok: false, error: "Unsupported action" });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function moveRowBefore(sheet, fromRow, targetRow) {
  const numCols = sheet.getLastColumn();
  const rowValues = sheet.getRange(fromRow, 1, 1, numCols).getValues();
  sheet.deleteRow(fromRow);
  const insertAt = fromRow < targetRow ? targetRow - 1 : targetRow;
  sheet.insertRowsBefore(insertAt, 1);
  sheet.getRange(insertAt, 1, 1, numCols).setValues(rowValues);
}

function sectionBreakHtml(title) {
  const safeTitle = String(title || "").trim();
  return safeTitle
    ? `<hr data-title="${safeTitle}" />`
    : "<hr />";
}
```

## Deploy Steps

1. Open Apps Script.
2. Paste code above into `Code.gs`.
3. Set your own long `SHARED_TOKEN`.
4. Deploy:
   - `Deploy -> New deployment`
   - Type: `Web app`
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the Web App URL.
6. On your site, enable `Edit Mode`, then click `Configure Save API` and paste:
   - Web App URL
   - same shared token

## Notes

- If you redeploy as a new version, update the URL in the site config.
- Keep the token private. Anyone with URL + token can write icons.
- Edit mode now supports:
  - setting/clearing column C icon values
  - deleting entire link rows from the sheet
  - drag/drop row reorder (requires `move_row` action in Apps Script)
  - adding new link buttons (`add_link`)
  - adding section titles (`set_section_title` / `insert_section_break`)
