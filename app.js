// Mostrar secciones
function mostrarSeccion(seccion) {
  document.getElementById("horarios").style.display = "none";
  document.getElementById("calculadora").style.display = "none";
  document.getElementById("salario").style.display = "none";
  document.getElementById(seccion).style.display = "block";
}

// Guardar horario individual
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

function mostrarSalarioBase() {
  const salarioBase = localStorage.getItem("salarioBaseUsuario");
  if (salarioBase) {
    document.getElementById("salarioBaseGuardado").innerHTML = `Salario base guardado: ${salarioBase} €`;
    document.getElementById("salarioBase").value = salarioBase;
  }
}

// Calculadora nómina
function calcularNomina() {
  const base = parseFloat(document.getElementById("base").value);
  const horasComp = parseFloat(document.getElementById("horasComp").value) || 0;
  const horasFest = parseFloat(document.getElementById("horasFest").value) || 0;
  const horasNoct = parseFloat(document.getElementById("horasNoct").value) || 0;

  let ssSelect = document.getElementById("ssSelect").value;
  let ss = (ssSelect === "personalizado")
    ? (parseFloat(document.getElementById("ssPersonalizado").value) || 0)
    : parseFloat(ssSelect);

  const irpf = parseFloat(document.getElementById("irpf").value) || 0;
  const bruto = base + (horasComp * 9.82) + (horasFest * 10.75) + (horasNoct * 2);
  const neto = bruto * (1 - (ss + irpf) / 100);

  document.getElementById("resultado").innerHTML = `
    Salario bruto: ${bruto.toFixed(2)} €<br>
    Salario neto: ${neto.toFixed(2)} €
  `;
}

function mostrarPersonalizado() {
  const ssSelect = document.getElementById("ssSelect").value;
  document.getElementById("ssPersonalizado").style.display = (ssSelect === "personalizado") ? "block" : "none";
}

// HORARIO SEMANAL
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
  const festivos = document.querySelectorAll(".festivoDia");

  let dias = [];
  let total = 0;
  let totalFestivas = 0;
  let totalNocturnas = 0;

  entradas.forEach((entradaInput, i) => {
    const diaNombre = entradaInput.dataset.dia;
    const ent = entradaInput.value;
    const sal = salidas[i].value;
    const esFestivo = festivos[i]?.checked || false;

    let horas = 0;
    let nocturnas = 0;

    if (ent && sal) {
      const [hEnt, mEnt] = ent.split(":").map(Number);
      const [hSal, mSal] = sal.split(":").map(Number);
      let min = (hSal * 60 + mSal) - (hEnt * 60 + mEnt);
      if (min < 0) min += 24 * 60;
      horas = +(min / 60).toFixed(2);

      let iniMin = hEnt * 60 + mEnt;
      let finMin = hSal * 60 + mSal;
      if (finMin < iniMin) finMin += 24 * 60;

      // Lógica ajustada: si termina al menos a las 23:00, cuenta nocturnas desde las 22:00
      if (finMin >= 1380) { // 1380 = 23:00
        let noctMin = finMin - Math.max(iniMin, 1320); // 1320 = 22:00
        nocturnas = +(noctMin / 60).toFixed(2);
      }
    }

    if (esFestivo) totalFestivas += horas;
    totalNocturnas += nocturnas;
    total += horas;

    dias.push({
      dia: diaNombre,
      entrada: ent || null,
      salida: sal || null,
      horas,
      festivo: esFestivo,
      nocturnas
    });
  });

  const comp = total > base ? +(total - base).toFixed(2) : 0;

  const index = horariosSemanales.findIndex(h => h.semana === semana);
  const obj = { semana, base, dias, total, complementarias: comp, festivas: totalFestivas, nocturnas: totalNocturnas };
  if (index >= 0) horariosSemanales[index] = obj;
  else horariosSemanales.push(obj);

  localStorage.setItem('horariosSemanales', JSON.stringify(horariosSemanales));
  renderHorariosSemanales();
  limpiarFormularioSemanal();
}

function renderHorariosSemanales() {
  const lista = document.getElementById('listaHorarios');
  lista.innerHTML = '';

  // Ordenar el array por semana descendente (más nuevo primero)
  const horariosOrdenados = [...horariosSemanales].sort((a, b) => b.semana - a.semana);

  horariosOrdenados.forEach(h => {
    // Buscar índice real en el array original para usar en botones
    const index = horariosSemanales.findIndex(item => item.semana === h.semana);

    lista.innerHTML += `
      <div style="border:1px solid #ccc; padding:4px; margin:5px 0;">
        <strong>Semana ${h.semana}</strong> - Total: ${h.total}h - Comp: ${h.complementarias}h - Fest: ${h.festivas}h - Noct: ${h.nocturnas}h
        <button onclick="editarHorarioSemanal(${index})">Editar</button>
        <button onclick="borrarHorarioSemanal(${index})">Borrar</button>
        <div>${h.dias.map(d => 
          `${d.dia}: ${d.entrada || "-"} - ${d.salida || "-"} (${d.horas}h${d.festivo ? ", Festivo" : ""}${d.nocturnas ? `, Noct: ${d.nocturnas}h` : ""})`
        ).join("<br>")}</div>
      </div>`;
  });
}

function editarHorarioSemanal(index) {
  const h = horariosSemanales[index];
  document.getElementById("semana").value = h.semana;
  document.getElementById("baseHoraria").value = h.base;
  h.dias.forEach(d => {
    document.querySelector(`.entradaDia[data-dia="${d.dia}"]`).value = d.entrada || "";
    document.querySelector(`.salidaDia[data-dia="${d.dia}"]`).value = d.salida || "";
    document.querySelector(`.festivoDia[data-dia="${d.dia}"]`).checked = d.festivo || false;
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
  document.querySelectorAll(".festivoDia").forEach(i => i.checked = false);
}

// SALARIO ESPERADO
function calcularSalarioEsperado() {
  const semanaInicio = parseInt(document.getElementById("semanaInicio").value);
  const semanaFin = parseInt(document.getElementById("semanaFin").value);
  const baseSel = parseInt(document.getElementById("baseSalarioEsperado").value);
  const irpf = parseFloat(document.getElementById("irpfSalario").value) || 0;
  const ss = 6.48;

  const baseMap = {12: 1000, 16: 591.71, 20: 739.52, 24: 887.48, 39: 2000};
  const salarioBaseMensual = baseMap[baseSel];

  if (!semanaInicio || !semanaFin || semanaInicio > semanaFin || !salarioBaseMensual) {
    alert("Rellena correctamente los campos.");
    return;
  }

  let comp = 0, fest = 0, noct = 0;
  horariosSemanales.forEach(h => {
    if (h.semana >= semanaInicio && h.semana <= semanaFin) {
      comp += h.complementarias || 0;
      fest += h.festivas || 0;
      noct += h.nocturnas || 0;
    }
  });

  const bruto = salarioBaseMensual + (comp * 9.82) + (fest * 10.75) + (noct * 2);
  const neto = bruto * (1 - (ss + irpf) / 100);

  document.getElementById("resultadoSalario").innerHTML = `
    Salario bruto esperado: ${bruto.toFixed(2)} €<br>
    Seguridad Social: ${ss}%<br>
    IRPF: ${irpf}%<br>
    Salario neto esperado: ${neto.toFixed(2)} €
  `;
}

// Al cargar
document.addEventListener("DOMContentLoaded", () => {
  mostrarHorario();
  mostrarSalarioBase();
  renderHorariosSemanales();
});
