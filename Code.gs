/**
 * Sistema de citas LMH: guarda cada solicitud en una hoja de cálculo de Google Drive
 * y envía un aviso al correo administrativo.
 *
 * Configuración:
 * 1. Abra https://script.google.com con la cuenta de Google que administrará los datos.
 * 2. Cree un proyecto y pegue este archivo completo en Code.gs.
 * 3. Cambie ADMIN_EMAIL si la institución indica otro correo.
 * 4. Ejecute setup() manualmente una vez y autorice los permisos.
 * 5. Implemente como aplicación web: ejecutar como usted; acceso: cualquier persona.
 * 6. Copie la URL /exec a script.js en GOOGLE_APPS_SCRIPT_URL.
 *
 * Restrinja el acceso a la hoja de cálculo a personal autorizado. El formulario recoge
 * datos personales de menores: use la información solo para admisiones y según las
 * políticas institucionales de privacidad y conservación.
 */
const ADMIN_EMAIL = "2021120488@lmh.edu.hn";
const SPREADSHEET_TITLE = "Solicitudes de citas de admisión - Liceo Militar de Honduras";
const SHEET_NAME = "Solicitudes";

const HEADERS = [
  "Fecha de recepción", "Nombre del aspirante", "Fecha de nacimiento",
  "Colegio de procedencia", "Área académica", "Grado solicitado",
  "Nombre del encargado legal", "Teléfono del encargado", "Correo del encargado",
  "Dirección de residencia", "Fecha preferida", "Hora preferida",
  "Observaciones", "Consentimiento"
];

function setup() {
  const props = PropertiesService.getScriptProperties();
  let spreadsheetId = props.getProperty("SPREADSHEET_ID");
  let spreadsheet;
  if (spreadsheetId) {
    spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(SPREADSHEET_TITLE);
    spreadsheetId = spreadsheet.getId();
    props.setProperty("SPREADSHEET_ID", spreadsheetId);
  }

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#14532d")
      .setFontColor("#ffffff");
    sheet.autoResizeColumns(1, HEADERS.length);
  }
  Logger.log("Hoja de cálculo creada/configurada: " + spreadsheet.getUrl());
  Logger.log("ID guardado en las propiedades del proyecto.");
  return spreadsheet.getUrl();
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    const raw = e && e.postData && e.postData.contents;
    if (!raw) throw new Error("No se recibieron datos.");
    const data = JSON.parse(raw);

    // Validación básica en servidor.
    const required = [
      "studentName", "birthDate", "previousSchool", "academicArea", "grade",
      "guardianName", "guardianPhone", "guardianEmail", "address",
      "preferredDate", "preferredTime", "privacyConsent"
    ];
    required.forEach(key => {
      if (!data[key] || String(data[key]).trim() === "") {
        throw new Error("Falta un campo obligatorio: " + key);
      }
    });

    const allowed = {
      "Español": ["Noveno", "Décimo", "Undécimo"],
      "Bilingüe": ["Noveno", "Décimo", "Undécimo"],
      "Informática (BTPi)": ["Primero", "Segundo", "Tercero"]
    };
    if (!allowed[data.academicArea] || !allowed[data.academicArea].includes(data.grade)) {
      throw new Error("El área académica y el grado no coinciden.");
    }
    if (String(data.guardianEmail).length > 160 || !String(data.guardianEmail).includes("@")) {
      throw new Error("El correo del encargado no parece válido.");
    }
    if (data.privacyConsent !== "on" && data.privacyConsent !== true && data.privacyConsent !== "true") {
      throw new Error("No se recibió el consentimiento.");
    }

    const props = PropertiesService.getScriptProperties();
    const spreadsheetId = props.getProperty("SPREADSHEET_ID");
    if (!spreadsheetId) throw new Error("Ejecute setup() antes de recibir solicitudes.");
    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error("No se encontró la hoja de solicitudes.");

    const receivedAt = new Date();
    const row = [
      receivedAt, clean_(data.studentName), clean_(data.birthDate),
      clean_(data.previousSchool), clean_(data.academicArea), clean_(data.grade),
      clean_(data.guardianName), clean_(data.guardianPhone), clean_(data.guardianEmail),
      clean_(data.address), clean_(data.preferredDate), clean_(data.preferredTime),
      clean_(data.observations || ""), "Sí"
    ];
    sheet.appendRow(row);
    const rowNumber = sheet.getLastRow();
    sheet.getRange(rowNumber, 1).setNumberFormat("yyyy-mm-dd hh:mm:ss");

    const subject = "Nueva solicitud de cita de admisión - " + clean_(data.studentName);
    const body =
      "Se recibió una nueva solicitud de cita para exámenes de admisión del Liceo Militar de Honduras.\n\n" +
      "Aspirante: " + clean_(data.studentName) + "\n" +
      "Fecha de nacimiento: " + clean_(data.birthDate) + "\n" +
      "Colegio de procedencia: " + clean_(data.previousSchool) + "\n" +
      "Área: " + clean_(data.academicArea) + "\n" +
      "Grado: " + clean_(data.grade) + "\n\n" +
      "Encargado legal: " + clean_(data.guardianName) + "\n" +
      "Teléfono: " + clean_(data.guardianPhone) + "\n" +
      "Correo: " + clean_(data.guardianEmail) + "\n" +
      "Dirección: " + clean_(data.address) + "\n\n" +
      "Fecha preferida: " + clean_(data.preferredDate) + "\n" +
      "Hora preferida: " + clean_(data.preferredTime) + "\n" +
      "Observaciones: " + clean_(data.observations || "Ninguna") + "\n\n" +
      "La cita no está confirmada. Revise la solicitud y comuníquese con el encargado.\n\n" +
      "Hoja de solicitudes: " + SpreadsheetApp.openById(spreadsheetId).getUrl();

    MailApp.sendEmail({ to: ADMIN_EMAIL, subject: subject, body: body, replyTo: clean_(data.guardianEmail) });
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    console.error(err);
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err.message || err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function clean_(value) {
  // Evita fórmulas accidentales en celdas al comenzar con =, +, - o @.
  const s = String(value == null ? "" : value).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
