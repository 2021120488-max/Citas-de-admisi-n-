// IMPORTANTE: pega aquí la URL de tu aplicación web de Google Apps Script.
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyK1HOVYsCk9sNM0Aqjzg6CoD0XSjG9d1U2hi934BebxFlxqNVmOnmF65lKYGVkIff-/exec";

const form = document.getElementById("appointmentForm");
const areaSelect = document.getElementById("academicArea");
const gradeSelect = document.getElementById("grade");
const dateInput = document.getElementById("preferredDate");
const statusMessage = document.getElementById("statusMessage");
const submitButton = document.getElementById("submitButton");

const gradesByArea = {
  "Español": ["Noveno", "Décimo", "Undécimo"],
  "Bilingüe": ["Noveno", "Décimo", "Undécimo"],
  "Informática (BTPi)": ["Primero", "Segundo", "Tercero"]
};

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.min = localToday;
form.elements.birthDate.max = localToday;

areaSelect.addEventListener("change", () => {
  gradeSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = areaSelect.value ? "Seleccione un grado" : "Primero seleccione el área";
  gradeSelect.appendChild(placeholder);
  const grades = gradesByArea[areaSelect.value] || [];
  grades.forEach(grade => {
    const option = document.createElement("option");
    option.value = grade;
    option.textContent = grade;
    gradeSelect.appendChild(option);
  });
  gradeSelect.disabled = grades.length === 0;
});

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.hidden = false;
  statusMessage.scrollIntoView({ behavior: "smooth", block: "center" });
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!GOOGLE_APPS_SCRIPT_URL.startsWith("https://script.google.com/macros/s/")) {
    showStatus("Falta configurar la URL de Google Apps Script. Sigue los pasos del archivo INSTRUCCIONES_GOOGLE_DRIVE.txt.", "error");
    return;
  }
  if (dateInput.value < localToday) {
    showStatus("Selecciona una fecha de cita igual o posterior a hoy.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = "<span>Enviando solicitud…</span>";
  statusMessage.hidden = true;

  const data = Object.fromEntries(new FormData(form).entries());
  data.submittedAt = new Date().toISOString();

  try {
    // Apps Script recibe el formulario; no-cors impide leer su respuesta desde otro dominio.
    // Por eso se informa que el envío se ha intentado, no que la institución confirmó la cita.
    await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    });

    showStatus("La solicitud se envió al servicio de registro. Esto no confirma la cita; la institución deberá revisarla y comunicarse con usted. Si no recibe seguimiento, contacte directamente al Liceo Militar.", "success");
    form.reset();
    gradeSelect.innerHTML = '<option value="">Primero seleccione el área</option>';
    gradeSelect.disabled = true;
    dateInput.min = localToday;
  } catch (error) {
    showStatus("No se pudo enviar la solicitud. Compruebe su conexión e inténtelo nuevamente o comuníquese con la institución.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = "<span>Enviar solicitud</span><span aria-hidden=\"true\">→</span>";
  }
});
