// Mostrar secciones
function mostrarSeccion(seccion) {
  document.getElementById("horarios").style.display = "none";
  document.getElementById("calculadora").style.display = "none";
  document.getElementById("salario").style.display = "none";

  document.getElementById(seccion).style.display = "block";
}

// Guardar horario con hora entrada/salida
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
  if (minutos < 0) minutos += 24 * 60; // Si pasa de medianoche

  const numHoras = (minutos / 60).toFixed(2);

  let horario = JSON.parse(localStorage.getItem("horarioEmpleado")) || [];
  horario.push({ dia, tipoHora, entrada, salida, numHoras });
  localStorage.setItem("horarioEmpleado", JSON.stringify(horario));

  mostrarHorario();
}

// Mostrar horario guardado
function mostrarHorario() {
  const horario = JSON.parse(localStorage.getItem("horarioEmpleado")) || [];
  let html = "<h3>Horario guardado:</h3><ul>";

  horario.forEach(h => {
    html += `<li>${h.dia}: ${h.entrada} - ${h.salida} (${h.numHoras} h, ${h.tipoHora})</li>`;
  });

  html += "</ul>";
  document.getElementById("horarioGuardado").innerHTML = html;
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

// Mostrar/ocultar campo personalizado SS
function mostrarPersonalizado() {
  const ssSelect = document.getElementById("ssSelect").value;
  const ssPersonalizado = document.getElementById("ssPersonalizado");
  ssPersonalizado.style.display = (ssSelect === "personalizado") ? "block" : "none";
}

// Mostrar horario al cargar
mostrarHorario();
function guardarSalarioBase() {
  const salarioBase = parseFloat(document.getElementById("salarioBase").value);
  if (!salarioBase || salarioBase <= 0) {
    alert("Introduce un salario base válido.");
    return;
  }

  localStorage.setItem("salarioBaseUsuario", salarioBase);
  mostrarSalarioBase();
}

function mostrarSalarioBase() {
  const salarioBase = localStorage.getItem("salarioBaseUsuario");
  if (salarioBase) {
    document.getElementById("salarioBaseGuardado").innerHTML = `Salario base guardado: ${salarioBase} €`;
    document.getElementById("salarioBase").value = salarioBase;
  }
}

// Mostrar al cargar
mostrarSalarioBase();