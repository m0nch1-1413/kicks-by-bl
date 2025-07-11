// Mostrar secciones
function mostrarSeccion(seccion) {
  document.getElementById("horarios").style.display = "none";
  document.getElementById("calculadora").style.display = "none";
  document.getElementById("salario").style.display = "none";
  document.getElementById("calendarioVisual").style.display = "none";

  document.getElementById(seccion).style.display = "block";

  if (seccion === "calendarioVisual") {
    mostrarCalendarioVisual();
  }
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

// Variables globales para mes y año visibles
let mesVisible = new Date().getMonth();
let añoVisible = new Date().getFullYear();

const mesesNombres = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// HORARIO SEMANAL
let horariosSemanales = JSON.parse(localStorage.getItem('horariosSemanales')) || [];

function esHoraValida(hora) {
  if (!hora) return true;
  const [h, m] = hora.split(":").map(Number);
  return m === 0 || m === 30;
}

function guardarHorarioSemanal() {
  const semana = parseInt(document.getElementById("semana").value);
  const base = parseInt(document.getElementById("baseHoraria").value);

  const fechaInicioStr = document.getElementById("fechaInicioSemana").value;
  const fechaFinStr = document.getElementById("fechaFinSemana").value;

  if (!fechaInicioStr || !fechaFinStr) {
    alert("Debes indicar fecha de inicio y fin de la semana.");
    return;
  }

  const fechaInicio = new Date(fechaInicioStr);
  const fechaFin = new Date(fechaFinStr);

  if (!semana) {
    alert("Por favor, indica un número de semana válido.");
    return;
  }

  const entradas = document.querySelectorAll(".entradaDia");
  const salidas = document.querySelectorAll(".salidaDia");
  const festivos = document.querySelectorAll(".festivoDia");
  const libres = document.querySelectorAll(".libreDia");

  for (let i = 0; i < entradas.length; i++) {
    const ent = entradas[i].value;
    const sal = salidas[i].value;

    if (!esHoraValida(ent) || !esHoraValida(sal)) {
      alert("Solo se permiten horas enteras o y media (ej. 08:00, 09:30, etc.)");
      return;
    }
  }

  let dias = [];
  let total = 0;
  let totalFestivas = 0;
  let totalNocturnas = 0;

  entradas.forEach((entradaInput, i) => {
    const diaNombre = entradaInput.dataset.dia.toLowerCase();
    const ent = entradaInput.value;
    const sal = salidas[i].value;
    const esFestivo = festivos[i]?.checked || false;
    const esLibre = libres[i]?.checked || false;

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

      if (finMin >= 1380) {
        let noctMin = finMin - Math.max(iniMin, 1320);
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
      libre: esLibre,
      nocturnas
    });
  });

  const comp = total > base ? +(total - base).toFixed(2) : 0;

  const index = horariosSemanales.findIndex(h => h.semana === semana);
  const obj = { semana, base, dias, total, complementarias: comp, festivas: totalFestivas, nocturnas: totalNocturnas, fechaInicio: fechaInicioStr, fechaFin: fechaFinStr };
  if (index >= 0) horariosSemanales[index] = obj;
  else horariosSemanales.push(obj);

  localStorage.setItem('horariosSemanales', JSON.stringify(horariosSemanales));
  renderHorariosSemanales();
  limpiarFormularioSemanal();
}

function renderHorariosSemanales() {
  const lista = document.getElementById('listaHorarios');
  lista.innerHTML = '';
  horariosSemanales
    .sort((a, b) => b.semana - a.semana)
    .forEach((h, index) => {
      lista.innerHTML += `
        <div class="horario-card">
          <strong>Semana ${h.semana}</strong><br>
          Total: ${h.total}h - Comp: ${h.complementarias}h - Fest: ${h.festivas}h - Noct: ${h.nocturnas}h
          <div style="margin-top: 0.5rem;">
            <button onclick="editarHorarioSemanal(${index})">Editar</button>
            <button onclick="borrarHorarioSemanal(${index})">Borrar</button>
          </div>
          <div style="margin-top: 0.5rem;">${h.dias.map(d => 
            `${d.dia}: ${d.entrada || "-"} - ${d.salida || "-"} (${d.horas}h${d.festivo ? ", Festivo" : ""}${d.libre ? ", Libre" : ""}${d.nocturnas ? `, Noct: ${d.nocturnas}h` : ""})`
          ).join("<br>")}</div>
        </div>`;
    });
}

function editarHorarioSemanal(index) {
  const h = horariosSemanales[index];
  document.getElementById("semana").value = h.semana;
  document.getElementById("baseHoraria").value = h.base;
  h.dias.forEach(d => {
    const diaCapitalizado = d.dia.charAt(0).toUpperCase() + d.dia.slice(1);
    document.querySelector(`.entradaDia[data-dia="${diaCapitalizado}"]`).value = d.entrada || "";
    document.querySelector(`.salidaDia[data-dia="${diaCapitalizado}"]`).value = d.salida || "";
    document.querySelector(`.festivoDia[data-dia="${diaCapitalizado}"]`).checked = d.festivo || false;
    document.querySelector(`.libreDia[data-dia="${diaCapitalizado}"]`).checked = d.libre || false;
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
  document.querySelectorAll(".libreDia").forEach(i => i.checked = false);
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

// CALENDARIO VISUAL
function mostrarCalendarioVisual() {
  const contenedor = document.getElementById("contenedorCalendario");
  contenedor.innerHTML = "";

  const primerLunes = new Date("2025-02-03");
  const horarios = JSON.parse(localStorage.getItem("horariosSemanales")) || [];

  const añoActual = añoVisible;
  const mesActual = mesVisible;

  // Mostrar mes y año en el label
  document.getElementById("mesActualLabel").textContent = mesesNombres[mesActual] + " " + añoActual;

  const primerDiaMes = new Date(añoActual, mesActual, 1);
  const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0);

  const diasEnMes = ultimoDiaMes.getDate();
  const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7; // ajustar para lunes como día 0

  const calendario = document.createElement("div");
  calendario.className = "calendario-grid";

  // Cabecera días de la semana
  ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach(dia => {
    const celda = document.createElement("div");
    celda.className = "calendario-header";
    celda.textContent = dia;
    calendario.appendChild(celda);
  });

  // Celdas vacías previas
  for (let i = 0; i < primerDiaSemana; i++) {
    const celdaVacia = document.createElement("div");
    celdaVacia.className = "calendario-dia empty";
    calendario.appendChild(celdaVacia);
  }

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const celda = document.createElement("div");
    celda.className = "calendario-dia";
    const fechaActual = new Date(añoActual, mesActual, dia);

    let datosDia = null;
    let datosSemana = horarios.find(h => {
      const ini = new Date(h.fechaInicio);
      const fin = new Date(h.fechaFin);
      return fechaActual >= ini && fechaActual <= fin;
    });
    if (datosSemana) {
      const nombresDias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
      let diaNombre = nombresDias[fechaActual.getDay()];
      diaNombre = diaNombre
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      console.log("Buscando día:", diaNombre);

      datosSemana.dias.forEach(d => {
        console.log("Día en datos:", d.dia);
      });

      datosDia = datosSemana.dias.find(d =>
        d.dia
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") === diaNombre
      );
    }

    let contenido = `<strong>${dia}</strong>`;
    if (datosDia) {
      contenido += `<div style="font-size:0.75rem;">${datosDia.entrada || "-"} - ${datosDia.salida || "-"}</div>`;
      if (datosDia.festivo) contenido += `<div class="festivo-label">Festivo</div>`;
      if (datosDia.libre) contenido += `<div class="libre-label">Día libre</div>`;
    }
    if (datosDia && datosDia.libre) {
      celda.classList.add("libre");
    }

    celda.innerHTML = contenido;
    calendario.appendChild(celda);
  }

  contenedor.appendChild(calendario);
}

// Navegación mes calendario
document.getElementById("btnMesAnterior").addEventListener("click", () => {
  if (mesVisible === 0) {
    mesVisible = 11;
    añoVisible--;
  } else {
    mesVisible--;
  }
  mostrarCalendarioVisual();
});

document.getElementById("btnMesSiguiente").addEventListener("click", () => {
  if (mesVisible === 11) {
    mesVisible = 0;
    añoVisible++;
  } else {
    mesVisible++;
  }
  mostrarCalendarioVisual();
});

// Al cargar
document.addEventListener("DOMContentLoaded", () => {
  mostrarHorario();
  mostrarSalarioBase();
  renderHorariosSemanales();
  mostrarCalendarioVisual();
});
