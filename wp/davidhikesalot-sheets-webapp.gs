// Google Apps Script linked to 00_Hike_All_East_Bay_Parks google sheet
// Published as a restful webapp

function getSheetRows(sheet) {
  const data = sheet.getDataRange().getValues() 
  const headers = data[0]
  headers.forEach((header, i, ary) => {
    ary[i] = header.toLowerCase().replace(/\s+/g,'')
  });
  const raw_data = data.slice(1,)
  let json = []
  raw_data.forEach(d => {
      let object = {}
      for (let i = 0; i < headers.length; i++) {
        object[headers[i]] = d[i]
      }
      json.push(object)
  });
  return json
}

function sheetToJson(sheetName) {
  const response = { status: 200, message: 'OK', rows: null }
  
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
  const sheet = spreadsheet.getSheetByName(sheetName)
  if (!sheet) {
    response.status = 400
    response.message = `Unknown sheet name: '${sheetName}'`
    return response
  }

  response.rows = getSheetRows(sheet)
  return response
}

function doGet(e) {
  const jsonData = sheetToJson(e.parameter.sheet)
  return ContentService
      .createTextOutput(JSON.stringify(jsonData))
      .setMimeType(ContentService.MimeType.JSON)
}
