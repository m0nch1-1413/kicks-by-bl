/**
 * KICKS BY BL STAFF - Application Logic
 * Refactored Architecture for Performance and Clean Code
 */

// --- ESTADO GLOBAL Y CONSTANTES ---
const APP_STATE = {
  currentSection: 'horarios',
  visibleMonth: new Date().getMonth(),
  visibleYear: new Date().getFullYear(),
  horariosSemanales: JSON.parse(localStorage.getItem('horariosSemanales')) || [],
  salarioBase: parseFloat(localStorage.getItem('salarioBaseUsuario')) || 0,
};

const BASE_SALARIAL_MAP = {
  12: 1000,
  16: 591.71,
  20: 770.59,
  24: 887.48,
  39: 2000
};

const TARIFAS = {
  complementaria: 10.28, // €/hora
  festiva: 10.75,
  nocturna: 2
};

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// --- UTILIDADES ---
const Helpers = {
  normalizeDate(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  },

  normalizeText(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  calculateHours(entrada, salida) {
    if (!entrada || !salida) return 0;
    const [hEnt, mEnt] = entrada.split(':').map(Number);
    const [hSal, mSal] = salida.split(':').map(Number);
    let min = (hSal * 60 + mSal) - (hEnt * 60 + mEnt);
    if (min < 0) min += 24 * 60;
    return +(min / 60).toFixed(2);
  },

  calculateNightHours(entrada, salida) {
    if (!entrada || !salida) return 0;
    const [hEnt, mEnt] = entrada.split(':').map(Number);
    const [hSal, mSal] = salida.split(':').map(Number);
    let iniMin = hEnt * 60 + mEnt;
    let finMin = hSal * 60 + mSal;
    if (finMin < iniMin) finMin += 24 * 60;

    if (finMin >= 1380) { // 23:00 en minutos
      let noctMin = finMin - Math.max(iniMin, 1320); // 22:00 en minutos
      return +(noctMin / 60).toFixed(2);
    }
    return 0;
  }
};

// --- NAVEGACIÓN Y SECCIONES ---
function mostrarSeccion(seccionId) {
  const secciones = ['horarios', 'calculadora', 'salario', 'calendarioVisual'];
  secciones.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === seccionId) ? 'block' : 'none';
  });

  APP_STATE.currentSection = seccionId;

  document.querySelectorAll('.bottom-nav [data-target-section]').forEach(btn => {
    if (btn.dataset.targetSection === seccionId) btn.setAttribute('aria-current', 'page');
    else btn.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);

  if (seccionId === 'horarios') renderHorariosSemanales();
  if (seccionId === 'calendarioVisual') renderCalendarioVisual();
}

// --- RENDERIZADO DINÁMICO DE FORMULARIO DIARIO ---
function renderFormularioDias() {
  const container = document.getElementById('contenedorDiasForm');
  if (!container) return;

  const fragment = document.createDocumentFragment();

  DIAS_SEMANA.forEach(dia => {
    const wrapper = document.createElement('div');
    wrapper.className = 'dia-form-group';
    wrapper.innerHTML = `
      <span class="dia-label">${dia}</span>
      <div class="dia-horas">
        <label class="campo-hora">Entrada
          <input type="time" class="entradaDia" data-dia="${dia}">
        </label>
        <label class="campo-hora">Salida
          <input type="time" class="salidaDia" data-dia="${dia}">
        </label>
      </div>
      <div class="dia-opciones">
        <label class="chip"><input type="checkbox" class="festivoDia" data-dia="${dia}"><span>Festivo</span></label>
        <label class="chip chip--libre"><input type="checkbox" class="libreDia" data-dia="${dia}"><span>Libre</span></label>
      </div>
    `;
    fragment.appendChild(wrapper);
  });

  container.innerHTML = '';
  container.appendChild(fragment);
}

// --- GESTIÓN DE HORARIOS SEMANALES ---
function guardarHorarioSemanal() {
  const semana = parseInt(document.getElementById('semana').value, 10);
  const base = parseInt(document.getElementById('baseHoraria').value, 10);
  const fechaInicioStr = document.getElementById('fechaInicioSemana').value;
  const fechaFinStr = document.getElementById('fechaFinSemana').value;

  if (!semana || !fechaInicioStr || !fechaFinStr) {
    alert('Ingresa el número de semana y el rango de fechas válido.');
    return;
  }

  const entradas = document.querySelectorAll('.entradaDia');
  const salidas = document.querySelectorAll('.salidaDia');
  const festivos = document.querySelectorAll('.festivoDia');
  const libres = document.querySelectorAll('.libreDia');

  let dias = [];
  let totalHoras = 0;
  let totalFestivas = 0;
  let totalNocturnas = 0;

  for (let i = 0; i < entradas.length; i++) {
    const diaNombre = entradas[i].dataset.dia;
    const ent = entradas[i].value;
    const sal = salidas[i].value;
    const esFestivo = festivos[i]?.checked || false;
    const esLibre = libres[i]?.checked || false;

    const horas = Helpers.calculateHours(ent, sal);
    const nocturnas = Helpers.calculateNightHours(ent, sal);

    if (esFestivo) totalFestivas += horas;
    totalNocturnas += nocturnas;
    totalHoras += horas;

    dias.push({
      dia: diaNombre,
      entrada: ent || null,
      salida: sal || null,
      horas,
      festivo: esFestivo,
      libre: esLibre,
      nocturnas
    });
  }

  const complementarias = totalHoras > base ? +(totalHoras - base).toFixed(2) : 0;

  const nuevoRegistro = {
    semana,
    base,
    dias,
    total: totalHoras,
    complementarias,
    festivas: totalFestivas,
    nocturnas: totalNocturnas,
    fechaInicio: fechaInicioStr,
    fechaFin: fechaFinStr
  };

  const index = APP_STATE.horariosSemanales.findIndex(h => h.semana === semana);
  if (index >= 0) {
    APP_STATE.horariosSemanales[index] = nuevoRegistro;
  } else {
    APP_STATE.horariosSemanales.push(nuevoRegistro);
  }

  localStorage.setItem('horariosSemanales', JSON.stringify(APP_STATE.horariosSemanales));
  renderHorariosSemanales();
  limpiarFormularioSemanal();
}

function renderHorariosSemanales() {
  const lista = document.getElementById('listaHorarios');
  if (!lista) return;

  lista.innerHTML = '';
  const fragment = document.createDocumentFragment();

  const ordenados = [...APP_STATE.horariosSemanales].sort((a, b) => b.semana - a.semana);

  ordenados.forEach((h) => {
    const card = document.createElement('div');
    card.className = 'horario-card';
    card.innerHTML = `
      <div class="horario-card-header">
        <strong>Semana ${h.semana}</strong>
        <span>Del ${h.fechaInicio} al ${h.fechaFin}</span>
      </div>
      <p class="horario-card-resumen">
        Total: <b>${h.total}h</b> | Comp: <b>${h.complementarias}h</b> | Fest: <b>${h.festivas}h</b> | Noct: <b>${h.nocturnas}h</b>
      </p>
      <div class="horario-card-acciones">
        <button type="button" class="btn-editar" data-semana="${h.semana}">Editar</button>
        <button type="button" class="btn-borrar" data-semana="${h.semana}">Borrar</button>
      </div>
      <ul class="horario-card-dias">
        ${h.dias.map(d => `
          <li>
            <b>${d.dia}:</b> ${d.entrada || '-'} - ${d.salida || '-'} 
            (${d.horas}h${d.festivo ? ', Festivo' : ''}${d.libre ? ', Libre' : ''})
          </li>
        `).join('')}
      </ul>
    `;
    fragment.appendChild(card);
  });

  lista.appendChild(fragment);
}

function manejarAccionesLista(e) {
  const target = e.target;
  const semana = parseInt(target.dataset.semana, 10);
  if (!semana) return;

  if (target.classList.contains('btn-editar')) {
    const registro = APP_STATE.horariosSemanales.find(h => h.semana === semana);
    if (!registro) return;

    document.getElementById('semana').value = registro.semana;
    document.getElementById('baseHoraria').value = registro.base;
    document.getElementById('fechaInicioSemana').value = registro.fechaInicio;
    document.getElementById('fechaFinSemana').value = registro.fechaFin;

    document.getElementById('formSemanal').scrollIntoView({ behavior: 'smooth', block: 'start' });

    registro.dias.forEach(d => {
      const entInput = document.querySelector(`.entradaDia[data-dia="${d.dia}"]`);
      const salInput = document.querySelector(`.salidaDia[data-dia="${d.dia}"]`);
      const festInput = document.querySelector(`.festivoDia[data-dia="${d.dia}"]`);
      const libreInput = document.querySelector(`.libreDia[data-dia="${d.dia}"]`);

      if (entInput) entInput.value = d.entrada || '';
      if (salInput) salInput.value = d.salida || '';
      if (festInput) festInput.checked = d.festivo || false;
      if (libreInput) libreInput.checked = d.libre || false;
    });
  }

  if (target.classList.contains('btn-borrar')) {
    if (confirm(`¿Seguro que deseas eliminar la Semana ${semana}?`)) {
      APP_STATE.horariosSemanales = APP_STATE.horariosSemanales.filter(h => h.semana !== semana);
      localStorage.setItem('horariosSemanales', JSON.stringify(APP_STATE.horariosSemanales));
      renderHorariosSemanales();
    }
  }
}

function limpiarFormularioSemanal() {
  document.getElementById('semana').value = '';
  document.getElementById('baseHoraria').value = '12';
  document.getElementById('fechaInicioSemana').value = '';
  document.getElementById('fechaFinSemana').value = '';
  document.querySelectorAll('.entradaDia, .salidaDia').forEach(i => i.value = '');
  document.querySelectorAll('.festivoDia, .libreDia').forEach(i => i.checked = false);
}

// --- CÁLCULO DE NÓMINA Y SALARIO ESPERADO ---
function calcularNomina() {
  const base = parseFloat(document.getElementById('base').value);
  const horasComp = parseFloat(document.getElementById('horasComp').value) || 0;
  const horasFest = parseFloat(document.getElementById('horasFest').value) || 0;
  const horasNoct = parseFloat(document.getElementById('horasNoct').value) || 0;

  const ssSelect = document.getElementById('ssSelect').value;
  const ss = (ssSelect === 'personalizado')
    ? (parseFloat(document.getElementById('ssPersonalizado').value) || 0)
    : parseFloat(ssSelect);

  const irpf = parseFloat(document.getElementById('irpf').value) || 0;
  const bruto = base + (horasComp * TARIFAS.complementaria) + (horasFest * TARIFAS.festiva) + (horasNoct * TARIFAS.nocturna);
  const neto = bruto * (1 - (ss + irpf) / 100);

  document.getElementById('resultado').innerHTML = `
    <p><strong>Salario Bruto:</strong> ${bruto.toFixed(2)} €</p>
    <p><strong>Salario Neto Estimado:</strong> ${neto.toFixed(2)} €</p>
  `;
}

function calcularSalarioEsperado() {
  const semanaInicio = parseInt(document.getElementById('semanaInicio').value, 10);
  const semanaFin = parseInt(document.getElementById('semanaFin').value, 10);
  const baseSel = parseInt(document.getElementById('baseSalarioEsperado').value, 10);
  const irpf = parseFloat(document.getElementById('irpfSalario').value) || 0;
  const ss = 6.48;

  const salarioBaseMensual = BASE_SALARIAL_MAP[baseSel];

  if (!semanaInicio || !semanaFin || semanaInicio > semanaFin || !salarioBaseMensual) {
    alert('Ingresa las semanas y la base horaria correctamente.');
    return;
  }

  let comp = 0, fest = 0, noct = 0;
  APP_STATE.horariosSemanales.forEach(h => {
    if (h.semana >= semanaInicio && h.semana <= semanaFin) {
      comp += h.complementarias || 0;
      fest += h.festivas || 0;
      noct += h.nocturnas || 0;
    }
  });

  const bruto = salarioBaseMensual + (comp * TARIFAS.complementaria) + (fest * TARIFAS.festiva) + (noct * TARIFAS.nocturna);
  const neto = bruto * (1 - (ss + irpf) / 100);

  document.getElementById('resultadoSalario').innerHTML = `
    <p><strong>Salario base mensual:</strong> ${salarioBaseMensual.toFixed(2)} €</p>
    <p><strong>Salario bruto total:</strong> ${bruto.toFixed(2)} €</p>
    <p><strong>Retención acumulada (SS ${ss}% + IRPF ${irpf}%):</strong> ${((ss + irpf)).toFixed(2)}%</p>
    <p class="neto-destacado"><strong>Salario neto esperado:</strong> ${neto.toFixed(2)} €</p>
  `;
}

// --- CALENDARIO VISUAL ---
function renderCalendarioVisual() {
  const contenedor = document.getElementById('contenedorCalendario');
  if (!contenedor) return;

  contenedor.innerHTML = '';

  const mesActual = APP_STATE.visibleMonth;
  const añoActual = APP_STATE.visibleYear;

  document.getElementById('mesActualLabel').textContent = `${MESES_NOMBRES[mesActual]} ${añoActual}`;

  const primerDiaMes = new Date(añoActual, mesActual, 1);
  const ultimoDiaMes = new Date(añoActual, mesActual + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  const primerDiaSemana = (primerDiaMes.getDay() + 6) % 7; // Lunes = 0

  const grid = document.createElement('div');
  grid.className = 'calendario-grid';

  // Cabecera
  ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach(dia => {
    const head = document.createElement('div');
    head.className = 'calendario-header';
    head.textContent = dia;
    grid.appendChild(head);
  });

  // Espacios vacíos
  for (let i = 0; i < primerDiaSemana; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'calendario-dia empty';
    grid.appendChild(emptyCell);
  }

  // Días del mes
  for (let dia = 1; dia <= diasEnMes; dia++) {
    const celda = document.createElement('div');
    celda.className = 'calendario-dia';

    const fechaActual = Helpers.normalizeDate(new Date(añoActual, mesActual, dia));
    if (fechaActual.getTime() === Helpers.normalizeDate(new Date()).getTime()) celda.classList.add('hoy');

    let datosSemana = APP_STATE.horariosSemanales.find(h => {
      const ini = Helpers.normalizeDate(h.fechaInicio);
      const fin = Helpers.normalizeDate(h.fechaFin);
      return fechaActual >= ini && fechaActual <= fin;
    });

    let datosDia = null;
    if (datosSemana) {
      const diaSemanaNombre = DIAS_SEMANA[(fechaActual.getDay() + 6) % 7];
      datosDia = datosSemana.dias.find(d => 
        Helpers.normalizeText(d.dia) === Helpers.normalizeText(diaSemanaNombre)
      );
    }

    let html = `<strong>${dia}</strong>`;
    if (datosDia) {
      if (datosDia.libre) {
        celda.classList.add('libre');
        html += `<div class="libre-label">Libre</div>`;
      } else {
        if (datosDia.entrada || datosDia.salida) {
          html += `<div class="hora-label"><span>${datosDia.entrada || '-'}</span><span>${datosDia.salida || '-'}</span></div>`;
        }
        if (datosDia.festivo) html += `<div class="festivo-label">Fest.</div>`;
      }
    }

    celda.innerHTML = html;
    grid.appendChild(celda);
  }

  contenedor.appendChild(grid);
}

// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
  renderFormularioDias();

  // Delegación de navegación de pestañas (Barra inferior y botones con data-target-section)
  document.querySelectorAll('[data-target-section]').forEach(button => {
    button.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.targetSection;
      mostrarSeccion(target);
    });
  });

  // Manejo de eventos del formulario semanal
  document.getElementById('btnGuardarSemana')?.addEventListener('click', guardarHorarioSemanal);
  document.getElementById('listaHorarios')?.addEventListener('click', manejarAccionesLista);

  // Calculadoras
  document.getElementById('btnCalcularSalario')?.addEventListener('click', calcularSalarioEsperado);
  document.getElementById('btnCalcularNomina')?.addEventListener('click', calcularNomina);

  document.getElementById('ssSelect')?.addEventListener('change', (e) => {
    const inputCustom = document.getElementById('ssPersonalizado');
    if (inputCustom) inputCustom.style.display = (e.target.value === 'personalizado') ? 'block' : 'none';
  });

  // Controladores de calendario
  document.getElementById('btnMesAnterior')?.addEventListener('click', () => {
    if (APP_STATE.visibleMonth === 0) {
      APP_STATE.visibleMonth = 11;
      APP_STATE.visibleYear--;
    } else {
      APP_STATE.visibleMonth--;
    }
    renderCalendarioVisual();
  });

  document.getElementById('btnMesSiguiente')?.addEventListener('click', () => {
    if (APP_STATE.visibleMonth === 11) {
      APP_STATE.visibleMonth = 0;
      APP_STATE.visibleYear++;
    } else {
      APP_STATE.visibleMonth++;
    }
    renderCalendarioVisual();
  });

  // Mostrar la sección por defecto al cargar la página
  mostrarSeccion('horarios');
});
