// Mostrar secciones
function mostrarSeccion(seccion) {
  document.getElementById("horarios").style.display = "none";
  document.getElementById("calculadora").style.display = "none";
  document.getElementById("salario").style.display = "none";

  document.getElementById(seccion).style.display = "block";
}

// Guardar horario individual (hora entrada / salida)
function guardarHorario() {
  const dia = document.getElementById("dia").value;
  const tipoHora = document.getElementById("tipoHora").value;
  const entrada = document.getElementById("horaEntrada").value;
  const salida = document.getElementById("horaSalida").value;

  if (!entrada || !salida) {
    alert("Introduce hora de entrada y salida.");
    return;
  }

  const [hEnt, mEnt] = entrada.split(":").map(Number);
  const [hSal, mSal] = salida.split(":").map(Number);

  let minutos = (hSal * 60 + mSal) - (hEnt * 60 + mEnt);
  if (minutos < 0) minutos += 24 * 60; 

  const numHoras = (minutos / 60).toFixed(2);

  let horario = JSON.parse(localStorage.getItem("horarioEmpleado")) || [];
  horario.push({ dia, tipoHora, entrada, salida, numHoras });
  localStorage.setItem("horarioEmpleado", JSON.stringify(horario));

  mostrarHorario();
}

// Mostrar horario individual guardado
function mostrarHorario() {
  const horario = JSON.parse(localStorage.getItem("horarioEmpleado")) || [];
  let html = "<h3>Horario guardado:</h3><ul>";

  horario.forEach(h => {
    html += `<li>${h.dia}: ${h.entrada} - ${h.salida} (${h.numHoras} h, ${h.tipoHora})</li>`;
  });

  html += "</ul>";
  document.getElementById("horarioGuardado").innerHTML = html;
}

// Guardar salario base
function guardarSalarioBase() {
  const salarioBase = parseFloat(document.getElementById("salarioBase").value);
  if (!salarioBase || salarioBase <= 0) {
    alert("Introduce un salario base válido.");
    return;
  }

  localStorage.setItem("salarioBaseUsuario", salarioBase);
  mostrarSalarioBase();
}

// Mostrar salario base guardado
function mostrarSalarioBase() {
  const salarioBase = localStorage.getItem("salarioBaseUsuario");
  if (salarioBase) {
    document.getElementById("salarioBaseGuardado").innerHTML = `Salario base guardado: ${salarioBase} €`;
    document.getElementById("salarioBase").value = salarioBase;
  }
}

// Calculadora de nómina
function calcularNomina() {
  const base = parseFloat(document.getElementById("base").value);
  const horasComp = parseFloat(document.getElementById("horasComp").value) || 0;
  const horasFest = parseFloat(document.getElementById("horasFest").value) || 0;
  const horasNoct = parseFloat(document.getElementById("horasNoct").value) || 0;

  let ssSelect = document.getElementById("ssSelect").value;
  let ss;
  if (ssSelect === "personalizado") {
    ss = parseFloat(document.getElementById("ssPersonalizado").value) || 0;
  } else {
    ss = parseFloat(ssSelect);
  }

  const irpf = parseFloat(document.getElementById("irpf").value) || 0;
  const valorHoraComp = 9.82;
  const valorHoraFest = 10.75;
  const valorHoraNoct = 2;

  const bruto = base + (horasComp * valorHoraComp) + (horasFest * valorHoraFest) + (horasNoct * valorHoraNoct);
  const neto = bruto * (1 - (ss + irpf) / 100);

  document.getElementById("resultado").innerHTML = `
    Salario bruto: ${bruto.toFixed(2)} €<br>
    Salario neto: ${neto.toFixed(2)} €
  `;
}

// Mostrar/ocultar campo SS personalizado
function mostrarPersonalizado() {
  const ssSelect = document.getElementById("ssSelect").value;
  const ssPersonalizado = document.getElementById("ssPersonalizado");
  ssPersonalizado.style.display = (ssSelect === "personalizado") ? "block" : "none";
}

// ----- HORARIO SEMANAL -----
let horariosSemanales = JSON.parse(localStorage.getItem('horariosSemanales')) || [];

function guardarHorarioSemanal() {
  const semana = parseInt(document.getElementById("semana").value);
  if (!semana) {
    alert("Por favor, indica un número de semana válido.");
    return;
  }
  const base = parseInt(document.getElementById("baseHoraria").value);
  const entradas = document.querySelectorAll(".entradaDia");
  const salidas = document.querySelectorAll(".salidaDia");

  let dias = [];
  let total = 0;

  entradas.forEach((entradaInput, i) => {
    const diaNombre = entradaInput.dataset.dia;
    const ent = entradaInput.value;
    const sal = salidas[i].value;

    let horas = 0;
    if (ent && sal) {
      const [hEnt, mEnt] = ent.split(":").map(Number);
      const [hSal, mSal] = sal.split(":").map(Number);

      let minutos = (hSal * 60 + mSal) - (hEnt * 60 + mEnt);
      if (minutos < 0) minutos += 24 * 60;

      horas = +(minutos / 60).toFixed(2);
    }

    dias.push({
      dia: diaNombre,
      entrada: ent || null,
      salida: sal || null,
      horas
    });

    total += horas;
  });

  const complementarias = total > base ? +(total - base).toFixed(2) : 0;

  const index = horariosSemanales.findIndex(h => h.semana === semana);
  if (index >= 0) {
    horariosSemanales[index] = { semana, base, dias, total, complementarias };
  } else {
    horariosSemanales.push({ semana, base, dias, total, complementarias });
  }

  localStorage.setItem('horariosSemanales', JSON.stringify(horariosSemanales));
  renderHorariosSemanales();
  limpiarFormularioSemanal();
}

function renderHorariosSemanales() {
  const lista = document.getElementById('listaHorarios');
  lista.innerHTML = '';
  horariosSemanales.forEach((h, index) => {
    lista.innerHTML += `
      <div style="margin-bottom: 5px; padding: 4px; border: 1px solid #ccc;">
        <strong>Semana ${h.semana}</strong> - Total: ${h.total}h - Complementarias: ${h.complementarias}h
        <button onclick="editarHorarioSemanal(${index})">Editar</button>
        <button onclick="borrarHorarioSemanal(${index})">Borrar</button>
        <div>
          ${h.dias.map(d => `${d.dia}: ${d.entrada || "-"} - ${d.salida || "-"} (${d.horas}h)`).join("<br>")}
        </div>
      </div>`;
  });
}

function editarHorarioSemanal(index) {
  const h = horariosSemanales[index];
  document.getElementById("semana").value = h.semana;
  document.getElementById("baseHoraria").value = h.base;

  h.dias.forEach(dia => {
    const entInput = document.querySelector(`.entradaDia[data-dia="${dia.dia}"]`);
    const salInput = document.querySelector(`.salidaDia[data-dia="${dia.dia}"]`);
    if (entInput) entInput.value = dia.entrada || "";
    if (salInput) salInput.value = dia.salida || "";
  });
}

function borrarHorarioSemanal(index) {
  if (confirm("¿Seguro que quieres borrar este horario semanal?")) {
    horariosSemanales.splice(index, 1);
    localStorage.setItem('horariosSemanales', JSON.stringify(horariosSemanales));
    renderHorariosSemanales();
  }
}

function limpiarFormularioSemanal() {
  document.getElementById("semana").value = "";
  document.getElementById("baseHoraria").value = "12";
  document.querySelectorAll(".entradaDia").forEach(i => i.value = "");
  document.querySelectorAll(".salidaDia").forEach(i => i.value = "");
}

// Al cargar
document.addEventListener("DOMContentLoaded", () => {
  mostrarHorario();
  mostrarSalarioBase();
  renderHorariosSemanales();
});
