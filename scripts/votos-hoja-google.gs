function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function sheetVotes() {
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  return SpreadsheetApp.openById(id).getSheetByName("votes") || SpreadsheetApp.openById(id).insertSheet("votes");
}

function doGet(e) {
  try {
    var want = PropertiesService.getScriptProperties().getProperty("TOKEN");
    if (want && String(e.parameter.token || "") !== want) {
      return jsonResponse({ error: "token" });
    }
    var sh = sheetVotes();
    var values = sh.getDataRange().getValues();
    if (values.length === 0) {
      sh.appendRow(["voter_slug", "target_slug", "scores_json", "updated_at"]);
      return jsonResponse([]);
    }
    var header = values[0];
    if (header[0] !== "voter_slug") {
      sh.clear();
      sh.appendRow(["voter_slug", "target_slug", "scores_json", "updated_at"]);
      return jsonResponse([]);
    }
    var out = [];
    for (var r = 1; r < values.length; r++) {
      var row = values[r];
      var scores = {};
      try {
        scores = JSON.parse(String(row[2] || "{}"));
      } catch (x) {
        scores = {};
      }
      out.push({
        voter_slug: String(row[0] || ""),
        target_slug: String(row[1] || ""),
        scores: scores,
        updated_at: row[3] ? String(row[3]) : undefined,
      });
    }
    return jsonResponse(out);
  } catch (err) {
    return jsonResponse({ error: String(err && err.message ? err.message : err) });
  }
}

function doPost(e) {
  try {
    var want = PropertiesService.getScriptProperties().getProperty("TOKEN");
    if (want && String(e.parameter.token || "") !== want) {
      return jsonResponse({ error: "token" });
    }
    var body = JSON.parse(e.postData.contents);
    var voter = String(body.voter_slug || "");
    var target = String(body.target_slug || "");
    var scores = body.scores || {};
    var updated = String(body.updated_at || new Date().toISOString());
    var sh = sheetVotes();
    var values = sh.getDataRange().getValues();
    if (values.length === 0) {
      sh.appendRow(["voter_slug", "target_slug", "scores_json", "updated_at"]);
      values = sh.getDataRange().getValues();
    }
    var rowIndex = -1;
    for (var r = 1; r < values.length; r++) {
      if (String(values[r][0]) === voter && String(values[r][1]) === target) {
        rowIndex = r + 1;
        break;
      }
    }
    var payload = JSON.stringify(scores);
    if (rowIndex > 0) {
      sh.getRange(rowIndex, 1, rowIndex, 4).setValues([[voter, target, payload, updated]]);
    } else {
      sh.appendRow([voter, target, payload, updated]);
    }
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: String(err && err.message ? err.message : err) });
  }
}
