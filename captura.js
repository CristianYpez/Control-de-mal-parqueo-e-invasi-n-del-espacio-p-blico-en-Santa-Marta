import { calcularCriticidad } from "./criticidad.js?v=6";
import { filtrarReportes } from "./filtros.js?v=6";
import { resumirPorCuadra } from "./resumen.js?v=6";
import { estaDentroDelPerimetro } from "./mapa.js?v=6";

const CLAVE_ALMACENAMIENTO = "santaMartaReportesV1";
const CLAVE_TEMA = "santaMartaTema";
const formulario = document.querySelector("#formulario-reporte");
const entradaDireccion = document.querySelector("#reporte-direccion");
const opcionesCuadrasFiltro = document.querySelector("#opciones-cuadras-filtro");
const botonTema = document.querySelector("#boton-tema");
const entradaFoto = document.querySelector("#reporte-foto");
const editorCensura = document.querySelector("#editor-censura");
const lienzoCensura = document.querySelector("#canvas-censura");
const marcoSeleccionCensura = document.querySelector("#marco-seleccion-censura");
const botonDeshacerCensura = document.querySelector("#boton-deshacer-censura");
const botonConfirmarFoto = document.querySelector("#boton-confirmar-foto");
const confirmacionPrivacidadFoto = document.querySelector("#confirmar-privacidad-foto");
const contadorCensura = document.querySelector("#contador-censura");
const botonGuardarReporte = document.querySelector("#boton-guardar-reporte");
const botonTomarFoto = document.querySelector("#boton-tomar-foto");
const botonElegirOtraFoto = document.querySelector("#boton-elegir-otra-foto");
const botonCancelarCensura = document.querySelector("#boton-cancelar-censura");
const estadoFoto = document.querySelector("#estado-foto");
const estadoCensura = document.querySelector("#estado-censura");
const estadoCaptura = document.querySelector("#estado-captura");
const estadoUbicacion = document.querySelector("#estado-ubicacion");
const botonGeolocalizacion = document.querySelector("#boton-geolocalizacion");
const botonLimpiarUbicacion = document.querySelector("#boton-limpiar-ubicacion");
const botonVistaCaptura = document.querySelector("#boton-vista-captura");
const botonVistaTablero = document.querySelector("#boton-vista-tablero");
const botonVistaGraficas = document.querySelector("#boton-vista-graficas");
const botonNuevoReporte = document.querySelector("#boton-nuevo-reporte");
const vistaCaptura = document.querySelector("#vista-captura");
const vistaTablero = document.querySelector("#vista-tablero");
const vistaGraficas = document.querySelector("#vista-graficas");
const botonGraficasNuevoReporte = document.querySelector("#boton-graficas-nuevo-reporte");
const botonGraficasVerTablero = document.querySelector("#boton-graficas-ver-tablero");
const estadoGraficas = document.querySelector("#estado-graficas");
const estadoTablero = document.querySelector("#estado-tablero");
const listaResumen = document.querySelector("#lista-resumen");
const textoConteoReportes = document.querySelector("#texto-conteo-reportes");
const conteosTablero = {
  total: document.querySelector("#conteo-reportes"),
  alto: document.querySelector("#conteo-alto"),
  medio: document.querySelector("#conteo-medio"),
  bajo: document.querySelector("#conteo-bajo"),
};
const barrasCategorias = document.querySelector("#barras-categorias");
const insigniaCriticidad = document.querySelector("#insignia-criticidad");
const datosVistaCriticidad = {
  puntaje: document.querySelector("#vista-puntaje"),
  nivel: document.querySelector("#vista-nivel"),
  categoria: document.querySelector("#vista-categoria"),
  tipoVia: document.querySelector("#vista-tipo-via"),
  franja: document.querySelector("#vista-franja"),
};
const botonesCategoria = [...document.querySelectorAll("[data-seleccion-categoria]")];
const botonesActor = [...document.querySelectorAll("[data-seleccion-actor]")];
const botonesModoMapa = {
  calor: document.querySelector("#modo-mapa-calor"),
  puntos: document.querySelector("#modo-mapa-puntos"),
};
const controlPuntos = document.querySelector("#mostrar-puntos");
const elementosGraficas = {
  total: document.querySelector("#graficas-total"),
  cuadra: document.querySelector("#graficas-cuadra"),
  categoria: document.querySelector("#graficas-categoria"),
  actor: document.querySelector("#graficas-actor"),
  cuadras: document.querySelector("#grafica-cuadras"),
  categorias: document.querySelector("#grafica-categorias"),
  actores: document.querySelector("#grafica-actores"),
  franjas: document.querySelector("#grafica-franjas"),
  niveles: document.querySelector("#grafica-niveles"),
  origenes: document.querySelector("#grafica-origenes"),
  dias: document.querySelector("#grafica-dias"),
  matriz: document.querySelector("#tabla-matriz-comparativa"),
};
const selectorArchivoImportar = document.querySelector("#archivo-importar");
const controlesFiltros = {
  cuadra: document.querySelector("#filtro-cuadra"),
  franja: document.querySelector("#filtro-franja"),
  categoria: document.querySelector("#filtro-categoria"),
  actor: document.querySelector("#filtro-actor"),
};
const categoriasPermitidas = new Set([
  "doble_fila",
  "bloqueo_rampa_cebra_paradero",
  "invasion_anden",
]);
const nombresCategorias = {
  doble_fila: "Doble fila / vía prohibida",
  bloqueo_rampa_cebra_paradero: "Rampa, cebra o paradero",
  invasion_anden: "Invasión de andén",
};
const nombresActores = {
  vehiculo_particular: "Vehículo particular",
  motocicleta: "Motocicleta",
  vehiculo_carga: "Carga descargando",
  mobiliario_comercial: "Mobiliario comercial",
};
const nombresFranjas = {
  pico: "Hora pico",
  valle: "Hora valle",
};
const nombresNiveles = {
  Alto: "Nivel alto",
  Medio: "Nivel medio",
  Bajo: "Nivel bajo",
};
const nombresOrigenes = {
  campo: "Campo",
  ciudadano: "Ciudadano",
};
const nombresDiasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const ANCHO_MAXIMO_FOTO = 800;
const TAMANO_BLOQUE_CENSURA = 12;
const actoresPermitidos = new Set([
  "vehiculo_particular",
  "motocicleta",
  "vehiculo_carga",
  "mobiliario_comercial",
]);

let vias = [];
let criterios = null;
let reportesIniciales = [];
let reportesLocales = [];
let ubicacionSeleccionada = null;
let datosListos = false;
let fotoConfirmada = "";
let historialCensura = [];
let seleccionCensura = null;
let numeroCargaFoto = 0;
let controladorGeocodificacion = null;
let numeroGeocodificacion = 0;

function aplicarTema(tema, guardar = false) {
  const esOscuro = tema === "oscuro";
  document.documentElement.dataset.tema = esOscuro ? "oscuro" : "claro";
  botonTema.textContent = esOscuro ? "Claro" : "Oscuro";
  botonTema.setAttribute("aria-label", `Cambiar a modo ${esOscuro ? "claro" : "oscuro"}`);
  botonTema.setAttribute("aria-pressed", String(esOscuro));
  document.querySelector('meta[name="theme-color"]').content = esOscuro ? "#121B20" : "#F5F2EA";
  if (guardar) {
    localStorage.setItem(CLAVE_TEMA, esOscuro ? "oscuro" : "claro");
  }
}

function inicializarTema() {
  const temaGuardado = localStorage.getItem(CLAVE_TEMA);
  const temaPreferido =
    temaGuardado === "oscuro" || temaGuardado === "claro"
      ? temaGuardado
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "oscuro"
        : "claro";
  aplicarTema(temaPreferido);
}

function mostrarEstado(elemento, mensaje) {
  elemento.textContent = mensaje;
}

async function cargarJSON(ruta) {
  const respuesta = await fetch(ruta);
  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar ${ruta} (HTTP ${respuesta.status}).`);
  }
  return respuesta.json();
}

function leerReportesLocales() {
  const contenido = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (contenido === null) {
    return [];
  }

  const reportes = JSON.parse(contenido);
  if (!Array.isArray(reportes)) {
    throw new Error("Los reportes guardados en este dispositivo tienen un formato inválido.");
  }
  return reportes;
}

function normalizarReporte(reporte, validarPerimetro = true) {
  if (!reporte || typeof reporte !== "object" || Array.isArray(reporte)) {
    throw new Error("El reporte debe ser un objeto JSON.");
  }
  if (typeof reporte.id !== "string" || !/^MP-\d+$/.test(reporte.id)) {
    throw new Error("El reporte tiene un ID inválido; se esperaba el formato MP-###.");
  }
  if (reporte.origen !== "campo" && reporte.origen !== "ciudadano") {
    throw new Error(`El reporte ${reporte.id} tiene un origen inválido.`);
  }
  if (!categoriasPermitidas.has(reporte.categoria)) {
    throw new Error(`El reporte ${reporte.id} tiene una categoría inválida.`);
  }
  if (!actoresPermitidos.has(reporte.actor)) {
    throw new Error(`El reporte ${reporte.id} tiene un tipo de actor inválido.`);
  }
  if (typeof reporte.foto !== "string") {
    throw new Error(`El reporte ${reporte.id} debe tener una ruta de foto o una cadena vacía.`);
  }
  if (reporte.direccion !== undefined && typeof reporte.direccion !== "string") {
    throw new Error(`La dirección del reporte ${reporte.id} debe ser texto.`);
  }
  if (
    !Number.isFinite(reporte.lat) ||
    !Number.isFinite(reporte.lng) ||
    (validarPerimetro && !estaDentroDelPerimetro(reporte.lat, reporte.lng))
  ) {
    throw new Error(`El reporte ${reporte.id} está fuera del perímetro urbano aproximado.`);
  }

  const criticidad = calcularCriticidad(reporte, vias, criterios);
  return {
    id: reporte.id,
    origen: reporte.origen,
    fecha_hora: reporte.fecha_hora,
    lat: reporte.lat,
    lng: reporte.lng,
    cuadra: reporte.cuadra?.trim() || reporte.direccion?.trim() || "Sin clasificar",
    direccion: reporte.direccion?.trim() ?? "",
    categoria: reporte.categoria,
    actor: reporte.actor,
    foto: reporte.foto,
    criticidad,
  };
}

function obtenerReportesActuales() {
  const reportesPorId = new Map();
  for (const reporte of [...reportesIniciales, ...reportesLocales]) {
    reportesPorId.set(reporte.id, reporte);
  }
  return [...reportesPorId.values()];
}

function contarPor(reportes, campo, etiquetas = {}) {
  const conteos = new Map();
  for (const reporte of reportes) {
    const codigo = reporte[campo] ?? "";
    conteos.set(codigo, (conteos.get(codigo) ?? 0) + 1);
  }

  return [...conteos.entries()]
    .map(([codigo, cantidad]) => ({
      etiqueta: (etiquetas[codigo] ?? codigo) || "Sin especificar",
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, "es"));
}

function mostrarFrecuenciaMaxima(elemento, conteos) {
  if (conteos.length === 0 || conteos[0].cantidad === 0) {
    elemento.textContent = "Sin datos";
    return;
  }

  const cantidad = conteos[0].cantidad;
  const ganadores = conteos
    .filter((conteo) => conteo.cantidad === cantidad)
    .map((conteo) => conteo.etiqueta);
  const prefijo = ganadores.length > 1 ? "Empate: " : "";
  const unidad = cantidad === 1 ? "reporte" : "reportes";
  elemento.textContent = `${prefijo}${ganadores.join(", ")} · ${cantidad} ${unidad}`;
}

function contarConUniverso(reportes, campo, valores, etiquetas = {}, ordenar = true) {
  const conteos = new Map(valores.map((valor) => [valor, 0]));
  for (const reporte of reportes) {
    const valor = reporte[campo] ?? "";
    conteos.set(valor, (conteos.get(valor) ?? 0) + 1);
  }

  const lista = [...conteos.entries()].map(([valor, cantidad]) => ({
    etiqueta: (etiquetas[valor] ?? valor) || "Sin especificar",
    cantidad,
  }));
  return ordenar
    ? lista.sort(
        (a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, "es"),
      )
    : lista;
}

function obtenerDiaSemana(fechaHora) {
  const coincidencia = /^(\d{4})-(\d{2})-(\d{2})T/.exec(fechaHora ?? "");
  if (!coincidencia) {
    return "Sin fecha";
  }

  const fecha = new Date(
    Number(coincidencia[1]),
    Number(coincidencia[2]) - 1,
    Number(coincidencia[3]),
  );
  if (Number.isNaN(fecha.getTime())) {
    return "Sin fecha";
  }
  return nombresDiasSemana[fecha.getDay()];
}

function renderizarGraficaBarras(elemento, conteos, total, descripcion) {
  elemento.replaceChildren();
  elemento.setAttribute("aria-label", descripcion);

  if (total === 0 || conteos.every(({ cantidad }) => cantidad === 0)) {
    const vacio = document.createElement("p");
    vacio.className = "ayuda";
    vacio.textContent = "No hay reportes para mostrar.";
    elemento.append(vacio);
    return;
  }

  for (const { etiqueta, cantidad } of conteos) {
    const porcentaje = Math.round((cantidad / total) * 100);
    const fila = document.createElement("div");
    fila.className = "barra-categoria";
    fila.setAttribute("role", "listitem");

    const cabecera = document.createElement("div");
    cabecera.className = "barra-categoria__cabecera";
    const nombre = document.createElement("span");
    nombre.className = "barra-categoria__nombre";
    nombre.textContent = etiqueta;
    const valor = document.createElement("span");
    valor.className = "barra-categoria__porcentaje";
    valor.textContent = `${cantidad} · ${porcentaje}%`;
    cabecera.append(nombre, valor);

    const pista = document.createElement("div");
    pista.className = "barra-categoria__pista";
    pista.setAttribute("role", "img");
    pista.setAttribute(
      "aria-label",
      `${etiqueta}: ${cantidad} de ${total} reportes (${porcentaje}%)`,
    );
    const barra = document.createElement("div");
    barra.className = "barra-categoria__valor";
    barra.style.width = `${porcentaje}%`;
    pista.append(barra);
    fila.append(cabecera, pista);
    elemento.append(fila);
  }
}

function renderizarMatrizCategoriasActores(reportes) {
  const tabla = elementosGraficas.matriz;
  tabla.replaceChildren();
  const actores = Object.keys(nombresActores);
  const categorias = Object.keys(nombresCategorias);
  const conteos = new Map();
  for (const reporte of reportes) {
    const clave = `${reporte.categoria}|${reporte.actor}`;
    conteos.set(clave, (conteos.get(clave) ?? 0) + 1);
  }

  const thead = document.createElement("thead");
  const filaEncabezado = document.createElement("tr");
  const celdaVacia = document.createElement("th");
  celdaVacia.scope = "col";
  celdaVacia.textContent = "Categoría";
  filaEncabezado.append(celdaVacia);
  for (const actor of actores) {
    const celda = document.createElement("th");
    celda.scope = "col";
    celda.textContent = nombresActores[actor];
    filaEncabezado.append(celda);
  }
  const celdaTotalEncabezado = document.createElement("th");
  celdaTotalEncabezado.scope = "col";
  celdaTotalEncabezado.textContent = "Total";
  filaEncabezado.append(celdaTotalEncabezado);
  thead.append(filaEncabezado);
  tabla.append(thead);

  const tbody = document.createElement("tbody");
  const totalesActores = new Map(actores.map((actor) => [actor, 0]));
  let totalGeneral = 0;
  for (const categoria of categorias) {
    const fila = document.createElement("tr");
    const celdaCategoria = document.createElement("th");
    celdaCategoria.scope = "row";
    celdaCategoria.textContent = nombresCategorias[categoria];
    fila.append(celdaCategoria);
    let totalCategoria = 0;
    for (const actor of actores) {
      const cantidad = conteos.get(`${categoria}|${actor}`) ?? 0;
      totalCategoria += cantidad;
      totalesActores.set(actor, totalesActores.get(actor) + cantidad);
      const celda = document.createElement("td");
      celda.textContent = String(cantidad);
      fila.append(celda);
    }
    totalGeneral += totalCategoria;
    const celdaTotalCategoria = document.createElement("td");
    celdaTotalCategoria.className = "tabla-matriz__total";
    celdaTotalCategoria.textContent = String(totalCategoria);
    fila.append(celdaTotalCategoria);
    tbody.append(fila);
  }
  tabla.append(tbody);

  const tfoot = document.createElement("tfoot");
  const filaTotales = document.createElement("tr");
  const celdaTotales = document.createElement("th");
  celdaTotales.scope = "row";
  celdaTotales.textContent = "Total";
  filaTotales.append(celdaTotales);
  for (const actor of actores) {
    const celda = document.createElement("td");
    celda.textContent = String(totalesActores.get(actor));
    filaTotales.append(celda);
  }
  const celdaTotalGeneral = document.createElement("td");
  celdaTotalGeneral.textContent = String(totalGeneral);
  filaTotales.append(celdaTotalGeneral);
  tfoot.append(filaTotales);
  tabla.append(tfoot);
}

function renderizarGraficas(reportes) {
  const conteosCuadras = contarPor(reportes, "cuadra");
  const conteosCategorias = contarConUniverso(
    reportes,
    "categoria",
    Object.keys(nombresCategorias),
    nombresCategorias,
  );
  const conteosActores = contarConUniverso(
    reportes,
    "actor",
    Object.keys(nombresActores),
    nombresActores,
  );
  const reportesConFranja = reportes.map((reporte) => ({
    ...reporte,
    franja: obtenerFranjaActual(reporte.fecha_hora),
  }));
  const conteosFranjas = contarConUniverso(
    reportesConFranja,
    "franja",
    Object.keys(nombresFranjas),
    nombresFranjas,
  );
  const reportesConNivel = reportes.map((reporte) => ({
    ...reporte,
    nivel: reporte.criticidad?.nivel ?? "",
  }));
  const conteosNiveles = contarConUniverso(
    reportesConNivel,
    "nivel",
    Object.keys(nombresNiveles),
    nombresNiveles,
  );
  const conteosOrigenes = contarConUniverso(
    reportes,
    "origen",
    Object.keys(nombresOrigenes),
    nombresOrigenes,
  );
  const reportesConDia = reportes.map((reporte) => ({
    ...reporte,
    dia: obtenerDiaSemana(reporte.fecha_hora),
  }));
  const conteosDias = contarConUniverso(reportesConDia, "dia", nombresDiasSemana, {}, false);

  elementosGraficas.total.textContent = String(reportes.length);
  mostrarFrecuenciaMaxima(elementosGraficas.cuadra, conteosCuadras);
  mostrarFrecuenciaMaxima(elementosGraficas.categoria, conteosCategorias);
  mostrarFrecuenciaMaxima(elementosGraficas.actor, conteosActores);

  renderizarGraficaBarras(
    elementosGraficas.cuadras,
    conteosCuadras,
    reportes.length,
    "Reportes por cuadra",
  );
  renderizarGraficaBarras(
    elementosGraficas.categorias,
    conteosCategorias,
    reportes.length,
    "Reportes por categoría",
  );
  renderizarGraficaBarras(
    elementosGraficas.actores,
    conteosActores,
    reportes.length,
    "Reportes por tipo de actor",
  );
  renderizarGraficaBarras(
    elementosGraficas.franjas,
    conteosFranjas,
    reportes.length,
    "Reportes por franja horaria",
  );
  renderizarGraficaBarras(
    elementosGraficas.niveles,
    conteosNiveles,
    reportes.length,
    "Reportes por nivel de criticidad",
  );
  renderizarGraficaBarras(
    elementosGraficas.origenes,
    conteosOrigenes,
    reportes.length,
    "Reportes por origen",
  );
  renderizarGraficaBarras(
    elementosGraficas.dias,
    conteosDias,
    reportes.length,
    "Reportes por día de la semana",
  );
  renderizarMatrizCategoriasActores(reportes);
  mostrarEstado(estadoGraficas, `Gráficas calculadas con ${reportes.length} reporte(s).`);
}

function publicarReportesActualizados() {
  const reportes = obtenerReportesActuales();
  cargarOpcionesFiltroCuadra(reportes);
  window.dispatchEvent(
    new CustomEvent("reportes:actualizados", {
      detail: {
        reportes,
        vias,
        criterios,
      },
    }),
  );
  actualizarTablero();
  renderizarGraficas(reportes);
}

function cargarOpcionesFiltroCuadra(reportes) {
  opcionesCuadrasFiltro.replaceChildren();
  const ubicaciones = new Set([
    ...vias.map((via) => via.id),
    ...reportes.map((reporte) => reporte.cuadra),
  ]);
  for (const ubicacion of ubicaciones) {
    const opcionFiltro = document.createElement("option");
    opcionFiltro.value = ubicacion;
    opcionesCuadrasFiltro.append(opcionFiltro);
  }
}

function actualizarSeleccionGrupo(botones, valor) {
  for (const boton of botones) {
    const seleccionado =
      boton.dataset.seleccionCategoria === valor ||
      boton.dataset.seleccionActor === valor;
    boton.setAttribute("aria-pressed", String(seleccionado));
  }
}

function obtenerFranjaActual(fechaHora) {
  const coincidencia = /T(\d{2}):(\d{2})$/.exec(fechaHora);
  if (!coincidencia || !Array.isArray(criterios?.horas_pico)) {
    throw new Error("No se pudo interpretar la hora local del reporte.");
  }

  const minutosActuales = Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
  const estaEnPico = criterios.horas_pico.some((rango) => {
    const coincidenciaRango = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(rango);
    if (!coincidenciaRango) {
      throw new Error(`El rango de hora pico "${rango}" no tiene el formato HH:mm-HH:mm.`);
    }

    const [, horaInicio, minutoInicio, horaFin, minutoFin] = coincidenciaRango;
    const horasInicio = Number(horaInicio);
    const minutosInicio = Number(minutoInicio);
    const horasFin = Number(horaFin);
    const minutosFin = Number(minutoFin);
    const inicio = horasInicio * 60 + minutosInicio;
    const fin = horasFin * 60 + minutosFin;
    if (
      horasInicio > 23 ||
      horasFin > 23 ||
      minutosInicio > 59 ||
      minutosFin > 59 ||
      inicio >= fin
    ) {
      throw new Error(`El rango de hora pico "${rango}" no es válido.`);
    }
    return minutosActuales >= inicio && minutosActuales < fin;
  });
  return estaEnPico ? "pico" : "valle";
}

function actualizarVistaCriticidad() {
  const categoria = document.querySelector("#reporte-categoria").value;
  const cuadraSeleccionada = entradaDireccion.value.trim();
  const via = vias.find((elemento) => elemento.id === cuadraSeleccionada);
  const fechaActual = new Date();
  const fechaHoraActual = formatearFechaHoraLocal(fechaActual);
  let nombreFranja = "";
  try {
    nombreFranja = criterios ? obtenerFranjaActual(fechaHoraActual) : "";
  } catch (error) {
    mostrarEstado(estadoCaptura, `No se pudo determinar la franja horaria: ${error.message}`);
    datosVistaCriticidad.puntaje.textContent = "—";
    datosVistaCriticidad.nivel.textContent = "Error";
    insigniaCriticidad.removeAttribute("data-nivel");
    return;
  }

  datosVistaCriticidad.categoria.textContent =
    nombresCategorias[categoria] ?? "Elige una categoría";
  datosVistaCriticidad.tipoVia.textContent =
    via?.tipo === "arterial"
      ? "Arterial"
      : via?.tipo === "secundaria"
        ? "Secundaria"
        : "Sin clasificar desde el mapa";
  datosVistaCriticidad.franja.textContent = nombreFranja
    ? `${nombreFranja === "pico" ? "Hora pico" : "Hora valle"} · ${fechaActual.toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : "Se determina por la hora";

  if (!criterios || !categoria || !ubicacionSeleccionada) {
    datosVistaCriticidad.puntaje.textContent = "—";
    datosVistaCriticidad.nivel.textContent = "Sin calcular";
    insigniaCriticidad.removeAttribute("data-nivel");
    return;
  }

  try {
    const criticidad = calcularCriticidad(
      {
        categoria,
        cuadra: cuadraSeleccionada,
        fecha_hora: fechaHoraActual,
      },
      vias,
      criterios,
    );
    datosVistaCriticidad.puntaje.textContent = String(criticidad.puntaje);
    datosVistaCriticidad.nivel.textContent = criticidad.nivel;
    insigniaCriticidad.dataset.nivel = criticidad.nivel;
  } catch (error) {
    datosVistaCriticidad.puntaje.textContent = "—";
    datosVistaCriticidad.nivel.textContent = "Error";
    insigniaCriticidad.removeAttribute("data-nivel");
    mostrarEstado(estadoCaptura, `No se pudo calcular la criticidad: ${error.message}`);
  }
}

function renderizarBarrasCategorias(reportes) {
  const cantidades = new Map(
    Object.keys(nombresCategorias).map((categoria) => [categoria, 0]),
  );
  for (const reporte of reportes) {
    cantidades.set(reporte.categoria, (cantidades.get(reporte.categoria) ?? 0) + 1);
  }

  const total = reportes.length;
  barrasCategorias.replaceChildren();
  for (const [categoria, nombre] of Object.entries(nombresCategorias)) {
    const cantidad = cantidades.get(categoria);
    const porcentaje = total === 0 ? 0 : Math.round((cantidad / total) * 100);
    const fila = document.createElement("div");
    fila.className = "barra-categoria";

    const cabecera = document.createElement("div");
    cabecera.className = "barra-categoria__cabecera";
    const etiqueta = document.createElement("span");
    etiqueta.className = "barra-categoria__nombre";
    etiqueta.textContent = nombre;
    const valor = document.createElement("span");
    valor.className = "barra-categoria__porcentaje";
    valor.textContent = `${cantidad} · ${porcentaje}%`;
    cabecera.append(etiqueta, valor);

    const pista = document.createElement("div");
    pista.className = "barra-categoria__pista";
    pista.setAttribute("role", "img");
    pista.setAttribute("aria-label", `${nombre}: ${porcentaje}%`);
    const barra = document.createElement("div");
    barra.className = "barra-categoria__valor";
    barra.style.width = `${porcentaje}%`;
    pista.append(barra);
    fila.append(cabecera, pista);
    barrasCategorias.append(fila);
  }
}

function cambiarVista(nombreVista) {
  const mostrarCaptura = nombreVista === "captura";
  const mostrarTablero = nombreVista === "tablero";
  const mostrarGraficas = nombreVista === "graficas";
  const mostrarCensura = nombreVista === "censura";
  vistaCaptura.hidden = !mostrarCaptura;
  vistaTablero.hidden = !mostrarTablero;
  vistaGraficas.hidden = !mostrarGraficas;
  editorCensura.hidden = !mostrarCensura;
  botonVistaCaptura.setAttribute("aria-pressed", String(mostrarCaptura || mostrarCensura));
  botonVistaTablero.setAttribute("aria-pressed", String(mostrarTablero));
  botonVistaGraficas.setAttribute("aria-pressed", String(mostrarGraficas));

  if (mostrarCaptura) {
    window.dispatchEvent(new Event("tablero:desactivar"));
    window.dispatchEvent(new Event("captura:activar"));
  } else if (mostrarCensura) {
    window.dispatchEvent(new Event("tablero:desactivar"));
  } else if (mostrarTablero) {
    window.dispatchEvent(new Event("tablero:activar"));
  } else if (mostrarGraficas) {
    window.dispatchEvent(new Event("tablero:desactivar"));
    renderizarGraficas(obtenerReportesActuales());
  }
}

function obtenerFiltrosActivos() {
  return Object.fromEntries(
    Object.entries(controlesFiltros).map(([nombre, control]) => [nombre, control.value]),
  );
}

function cambiarModoMapa(modo) {
  const mostrarPuntos = modo === "puntos";
  botonesModoMapa.calor.setAttribute("aria-pressed", String(!mostrarPuntos));
  botonesModoMapa.puntos.setAttribute("aria-pressed", String(mostrarPuntos));
  controlPuntos.checked = mostrarPuntos;
  controlPuntos.dispatchEvent(new Event("change"));
  window.dispatchEvent(
    new CustomEvent("mapa:modo-visualizacion", {
      detail: { modo },
    }),
  );
}

function renderizarResumen(reportes) {
  const resumen = resumirPorCuadra(reportes, criterios);
  listaResumen.replaceChildren();

  if (resumen.length === 0) {
    const elementoVacio = document.createElement("li");
    elementoVacio.textContent = "No hay reportes para mostrar con estos filtros.";
    listaResumen.append(elementoVacio);
    return;
  }

  for (const [indice, prioridad] of resumen.entries()) {
    const elemento = document.createElement("li");
    const titulo = document.createElement("strong");
    titulo.textContent = `${indice + 1}. ${prioridad.cuadra}`;
    elemento.append(titulo);

    const puntaje = document.createElement("p");
    puntaje.textContent =
      `Puntaje total: ${prioridad.puntajeTotal} · ${prioridad.cantidadReportes} reporte(s)`;
    elemento.append(puntaje);

    const recomendacion = document.createElement("p");
    recomendacion.textContent =
      prioridad.recomendacion ?? "Sin recomendación específica por las reglas configuradas.";
    elemento.append(recomendacion);

    const regla = document.createElement("p");
    regla.className = "ayuda";
    regla.textContent = prioridad.regla
      ? `Regla aplicada: ${prioridad.regla}`
      : "Regla aplicada: ninguna; no se cumplieron las condiciones.";
    elemento.append(regla);

    const fotosDeCuadra = reportes
      .filter(
        (reporte) =>
          reporte.cuadra === prioridad.cuadra &&
          typeof reporte.foto === "string" &&
          reporte.foto.length > 0,
      )
      .sort((primero, segundo) => segundo.fecha_hora.localeCompare(primero.fecha_hora));
    if (fotosDeCuadra.length > 0) {
      const tituloFotos = document.createElement("p");
      tituloFotos.className = "ayuda";
      tituloFotos.textContent = `Fotos censuradas (${fotosDeCuadra.length})`;
      elemento.append(tituloFotos);

      const galeria = document.createElement("div");
      galeria.className = "resumen-fotos";
      galeria.setAttribute("role", "group");
      galeria.setAttribute("aria-label", `Fotos censuradas de ${prioridad.cuadra}`);
      galeria.style.display = "flex";
      galeria.style.gap = "0.5rem";
      galeria.style.maxWidth = "100%";
      galeria.style.marginTop = "0.4rem";
      galeria.style.overflowX = "auto";

      for (const reporte of fotosDeCuadra) {
        agregarFotoInfraccion(galeria, reporte);
      }
      elemento.append(galeria);
    }

    listaResumen.append(elemento);
  }
}

function agregarFotoInfraccion(tarjeta, reporte) {
  const figura = document.createElement("figure");
  figura.className = "foto-infraccion";
  figura.style.flex = "0 0 220px";
  figura.style.maxWidth = "80%";
  figura.style.margin = "0";
  let fuente = "";
  if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(reporte.foto)) {
    fuente = reporte.foto;
  } else if (reporte.foto) {
    const enlace = document.createElement("a");
    enlace.href = reporte.foto;
    if (["http:", "https:"].includes(enlace.protocol) && enlace.origin === window.location.origin) {
      fuente = enlace.href;
    }
  }
  const pie = document.createElement("figcaption");

  if (!reporte.foto) {
    pie.textContent = "No se adjuntó una foto.";
  } else if (!fuente) {
    pie.textContent = "No se puede mostrar la foto guardada.";
  } else {
    const imagen = document.createElement("img");
    imagen.alt = `Foto censurada del reporte ${reporte.id}`;
    imagen.loading = "lazy";
    imagen.referrerPolicy = "no-referrer";
    imagen.style.display = "block";
    imagen.style.width = "100%";
    imagen.style.height = "140px";
    imagen.style.maxWidth = "100%";
    imagen.style.objectFit = "contain";
    imagen.style.borderRadius = "8px";
    imagen.addEventListener("error", () => {
      figura.replaceChildren();
      pie.textContent = "No se pudo cargar la foto del reporte.";
      figura.append(pie);
    });
    imagen.src = fuente;
    figura.append(imagen);
    pie.textContent = `Foto del reporte ${reporte.id}`;
  }

  figura.append(pie);
  tarjeta.append(figura);
}

function actualizarTablero() {
  if (!datosListos) {
    return;
  }

  const reportesFiltrados = filtrarReportes(
    obtenerReportesActuales(),
    obtenerFiltrosActivos(),
    criterios,
  );
  const reportesCompletos = obtenerReportesActuales();
  textoConteoReportes.textContent =
    `Mostrando ${reportesFiltrados.length} de ${reportesCompletos.length} reportes`;
  conteosTablero.total.textContent = String(reportesFiltrados.length);
  for (const nivel of ["alto", "medio", "bajo"]) {
    conteosTablero[nivel].textContent = String(
      reportesFiltrados.filter(
        (reporte) => reporte.criticidad.nivel.toLowerCase() === nivel,
      ).length,
    );
  }
  renderizarBarrasCategorias(reportesFiltrados);
  window.dispatchEvent(
    new CustomEvent("reportes:filtrados", {
      detail: { reportes: reportesFiltrados },
    }),
  );
  renderizarResumen(reportesFiltrados);
}

function formatearFechaHoraLocal(fecha) {
  const dosDigitos = (numero) => String(numero).padStart(2, "0");
  return [
    fecha.getFullYear(),
    "-",
    dosDigitos(fecha.getMonth() + 1),
    "-",
    dosDigitos(fecha.getDate()),
    "T",
    dosDigitos(fecha.getHours()),
    ":",
    dosDigitos(fecha.getMinutes()),
  ].join("");
}

function generarIdUnico(reportes) {
  const idsUsados = new Set(reportes.map((reporte) => reporte.id));
  let mayorNumero = 0;
  for (const id of idsUsados) {
    const coincidencia = /^MP-(\d+)$/.exec(id);
    if (coincidencia) {
      mayorNumero = Math.max(mayorNumero, Number(coincidencia[1]));
    }
  }

  let numero = mayorNumero + 1;
  let id = `MP-${String(numero).padStart(3, "0")}`;
  while (idsUsados.has(id)) {
    numero += 1;
    id = `MP-${String(numero).padStart(3, "0")}`;
  }
  return id;
}

function cargarImagenDesdeArchivo(archivo) {
  return new Promise((resolver, rechazar) => {
    const direccionTemporal = URL.createObjectURL(archivo);
    const imagen = new Image();
    imagen.addEventListener(
      "load",
      () => {
        URL.revokeObjectURL(direccionTemporal);
        resolver(imagen);
      },
      { once: true },
    );
    imagen.addEventListener(
      "error",
      () => {
        URL.revokeObjectURL(direccionTemporal);
        rechazar(new Error("El navegador no pudo abrir esta imagen."));
      },
      { once: true },
    );
    imagen.src = direccionTemporal;
  });
}

function obtenerContextoCensura() {
  const contexto = lienzoCensura.getContext("2d", { willReadFrequently: true });
  if (!contexto) {
    throw new Error("El navegador no pudo preparar el editor de censura.");
  }
  return contexto;
}

function invalidarConfirmacionFoto() {
  fotoConfirmada = "";
  botonGuardarReporte.disabled = Boolean(entradaFoto.files[0]);
}

async function prepararFotoParaCensura(archivo) {
  const numeroActual = ++numeroCargaFoto;
  fotoConfirmada = "";
  historialCensura = [];
  seleccionCensura = null;
  confirmacionPrivacidadFoto.checked = false;
  contadorCensura.textContent = "0 zonas censuradas";
  marcoSeleccionCensura.style.display = "none";
  botonDeshacerCensura.disabled = true;
  botonConfirmarFoto.disabled = true;
  lienzoCensura.width = 0;
  lienzoCensura.height = 0;

  if (!archivo) {
    cambiarVista("captura");
    botonGuardarReporte.disabled = false;
    estadoCensura.textContent = "";
    return;
  }

  cambiarVista("censura");
  botonGuardarReporte.disabled = true;
  estadoFoto.textContent = "Foto pendiente de censura.";
  estadoCensura.textContent = "Cargando la foto para censurar…";
  if (!archivo.type.startsWith("image/")) {
    estadoCensura.textContent = "El archivo seleccionado no es una imagen.";
    return;
  }

  try {
    const imagen = await cargarImagenDesdeArchivo(archivo);
    if (numeroActual !== numeroCargaFoto) {
      return;
    }

    if (!imagen.naturalWidth || !imagen.naturalHeight) {
      throw new Error("La imagen no tiene dimensiones válidas.");
    }

    const ancho = Math.min(imagen.naturalWidth, ANCHO_MAXIMO_FOTO);
    const alto = Math.max(1, Math.round((imagen.naturalHeight * ancho) / imagen.naturalWidth));
    lienzoCensura.width = ancho;
    lienzoCensura.height = alto;

    const contexto = obtenerContextoCensura();
    contexto.imageSmoothingEnabled = true;
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(imagen, 0, 0, ancho, alto);

    botonConfirmarFoto.disabled = !confirmacionPrivacidadFoto.checked;
    estadoCensura.textContent =
      "Pixeliza las zonas necesarias y marca la confirmación de privacidad para continuar.";
  } catch (error) {
    if (numeroActual !== numeroCargaFoto) {
      return;
    }
    console.error("No se pudo preparar la foto para censura.", error);
    estadoCensura.textContent = `No se pudo preparar la foto: ${error.message}`;
  }
}

function obtenerPuntoCensura(evento) {
  const limites = lienzoCensura.getBoundingClientRect();
  if (limites.width <= 0 || limites.height <= 0) {
    return null;
  }

  const xVisible = Math.max(0, Math.min(limites.width, evento.clientX - limites.left));
  const yVisible = Math.max(0, Math.min(limites.height, evento.clientY - limites.top));
  return {
    x: (xVisible * lienzoCensura.width) / limites.width,
    y: (yVisible * lienzoCensura.height) / limites.height,
    xVisible,
    yVisible,
  };
}

function actualizarMarcoSeleccion(xInicial, yInicial, xFinal, yFinal) {
  marcoSeleccionCensura.style.display = "block";
  marcoSeleccionCensura.style.left = `${Math.min(xInicial, xFinal)}px`;
  marcoSeleccionCensura.style.top = `${Math.min(yInicial, yFinal)}px`;
  marcoSeleccionCensura.style.width = `${Math.abs(xFinal - xInicial)}px`;
  marcoSeleccionCensura.style.height = `${Math.abs(yFinal - yInicial)}px`;
}

function manejarInicioSeleccion(evento) {
  if (!lienzoCensura.width || !evento.isPrimary) {
    return;
  }
  const punto = obtenerPuntoCensura(evento);
  if (!punto) {
    return;
  }

  evento.preventDefault();
  invalidarConfirmacionFoto();
  confirmacionPrivacidadFoto.checked = false;
  botonConfirmarFoto.disabled = true;
  seleccionCensura = {
    pointerId: evento.pointerId,
    xInicial: punto.x,
    yInicial: punto.y,
    xFinal: punto.x,
    yFinal: punto.y,
    xVisibleInicial: punto.xVisible,
    yVisibleInicial: punto.yVisible,
    xVisibleFinal: punto.xVisible,
    yVisibleFinal: punto.yVisible,
  };
  lienzoCensura.setPointerCapture(evento.pointerId);
  actualizarMarcoSeleccion(punto.xVisible, punto.yVisible, punto.xVisible, punto.yVisible);
}

function manejarMovimientoSeleccion(evento) {
  if (!seleccionCensura || evento.pointerId !== seleccionCensura.pointerId) {
    return;
  }
  const punto = obtenerPuntoCensura(evento);
  if (!punto) {
    return;
  }

  seleccionCensura.xFinal = punto.x;
  seleccionCensura.yFinal = punto.y;
  seleccionCensura.xVisibleFinal = punto.xVisible;
  seleccionCensura.yVisibleFinal = punto.yVisible;
  actualizarMarcoSeleccion(
    seleccionCensura.xVisibleInicial,
    seleccionCensura.yVisibleInicial,
    punto.xVisible,
    punto.yVisible,
  );
}

function manejarFinSeleccion(evento) {
  if (!seleccionCensura || evento.pointerId !== seleccionCensura.pointerId) {
    return;
  }
  const punto = obtenerPuntoCensura(evento);
  if (punto) {
    seleccionCensura.xFinal = punto.x;
    seleccionCensura.yFinal = punto.y;
  }

  const x = Math.max(0, Math.floor(Math.min(seleccionCensura.xInicial, seleccionCensura.xFinal)));
  const y = Math.max(0, Math.floor(Math.min(seleccionCensura.yInicial, seleccionCensura.yFinal)));
  const ancho = Math.min(lienzoCensura.width, Math.ceil(Math.max(seleccionCensura.xInicial, seleccionCensura.xFinal))) - x;
  const alto = Math.min(lienzoCensura.height, Math.ceil(Math.max(seleccionCensura.yInicial, seleccionCensura.yFinal))) - y;
  seleccionCensura = null;
  marcoSeleccionCensura.style.display = "none";
  botonConfirmarFoto.disabled = !confirmacionPrivacidadFoto.checked;

  if (ancho < TAMANO_BLOQUE_CENSURA || alto < TAMANO_BLOQUE_CENSURA) {
    estadoCensura.textContent = "El área debe medir al menos 12 × 12 píxeles para censurarla.";
    return;
  }

  try {
    const contexto = obtenerContextoCensura();
    // Guardamos los píxeles originales del área para permitir deshacer la censura.
    const copia = contexto.getImageData(x, y, ancho, alto);
    const anchoReducido = Math.max(1, Math.floor(ancho / TAMANO_BLOQUE_CENSURA));
    const altoReducido = Math.max(1, Math.floor(alto / TAMANO_BLOQUE_CENSURA));
    const lienzoPixelado = document.createElement("canvas");
    lienzoPixelado.width = anchoReducido;
    lienzoPixelado.height = altoReducido;

    const contextoPixelado = lienzoPixelado.getContext("2d");
    if (!contextoPixelado) {
      throw new Error("El navegador no pudo pixelar el área seleccionada.");
    }
    contextoPixelado.imageSmoothingEnabled = false;
    contextoPixelado.drawImage(lienzoCensura, x, y, ancho, alto, 0, 0, anchoReducido, altoReducido);
    contexto.imageSmoothingEnabled = false;
    contexto.drawImage(lienzoPixelado, 0, 0, anchoReducido, altoReducido, x, y, ancho, alto);

    historialCensura.push({ x, y, copia });
    contadorCensura.textContent =
      `${historialCensura.length} ${historialCensura.length === 1 ? "zona censurada" : "zonas censuradas"}`;
    botonDeshacerCensura.disabled = false;
    confirmacionPrivacidadFoto.checked = false;
    botonConfirmarFoto.disabled = true;
    estadoCensura.textContent = "Área censurada. Puedes marcar otra zona o deshacer.";
  } catch (error) {
    console.error("No se pudo censurar el área seleccionada.", error);
    estadoCensura.textContent = `No se pudo censurar el área: ${error.message}`;
  }
}

function manejarCancelacionSeleccion(evento) {
  if (!seleccionCensura || evento.pointerId !== seleccionCensura.pointerId) {
    return;
  }
  seleccionCensura = null;
  marcoSeleccionCensura.style.display = "none";
  botonConfirmarFoto.disabled = !confirmacionPrivacidadFoto.checked;
  estadoCensura.textContent = "Selección cancelada. Puedes volver a marcar el área.";
}

function deshacerCensura() {
  const ultimaCensura = historialCensura.pop();
  if (!ultimaCensura) {
    return;
  }

  try {
    obtenerContextoCensura().putImageData(ultimaCensura.copia, ultimaCensura.x, ultimaCensura.y);
    invalidarConfirmacionFoto();
    confirmacionPrivacidadFoto.checked = false;
    botonConfirmarFoto.disabled = true;
    botonDeshacerCensura.disabled = historialCensura.length === 0;
    contadorCensura.textContent =
      `${historialCensura.length} ${historialCensura.length === 1 ? "zona censurada" : "zonas censuradas"}`;
    estadoCensura.textContent = "Se deshizo la última censura. Confirma la foto antes de guardar.";
  } catch (error) {
    historialCensura.push(ultimaCensura);
    console.error("No se pudo deshacer la censura.", error);
    estadoCensura.textContent = `No se pudo deshacer la censura: ${error.message}`;
  }
}

function confirmarFotoCensurada() {
  if (
    !entradaFoto.files[0] ||
    !lienzoCensura.width ||
    seleccionCensura ||
    !confirmacionPrivacidadFoto.checked
  ) {
    estadoCensura.textContent =
      "Termina la selección de zonas y confirma que la foto no muestra rostros ni placas.";
    return;
  }

  try {
    fotoConfirmada = lienzoCensura.toDataURL("image/jpeg", 0.7);
    if (!fotoConfirmada.startsWith("data:image/jpeg;base64,")) {
      throw new Error("El navegador no pudo exportar la foto censurada.");
    }
    botonGuardarReporte.disabled = false;
    estadoFoto.textContent = "Foto censurada lista.";
    estadoCensura.textContent = "Foto confirmada. Se guardará únicamente esta versión censurada.";
    cambiarVista("captura");
  } catch (error) {
    fotoConfirmada = "";
    botonGuardarReporte.disabled = true;
    console.error("No se pudo exportar la foto censurada.", error);
    estadoCensura.textContent = `No se pudo confirmar la foto: ${error.message}`;
  }
}

function reiniciarEditorCensura() {
  numeroCargaFoto += 1;
  fotoConfirmada = "";
  historialCensura = [];
  seleccionCensura = null;
  marcoSeleccionCensura.style.display = "none";
  confirmacionPrivacidadFoto.checked = false;
  contadorCensura.textContent = "0 zonas censuradas";
  lienzoCensura.width = 0;
  lienzoCensura.height = 0;
  botonDeshacerCensura.disabled = true;
  botonConfirmarFoto.disabled = true;
  botonGuardarReporte.disabled = false;
  estadoFoto.textContent = "No se adjuntó una foto.";
  estadoCensura.textContent = "";
}

function abrirSelectorFoto() {
  entradaFoto.value = "";
  reiniciarEditorCensura();
  cambiarVista("captura");
  estadoFoto.textContent = "Selecciona una foto para censurar.";
  entradaFoto.click();
}

function mensajeErrorAlmacenamiento(error) {
  if (error?.name === "QuotaExceededError" || error?.name === "NS_ERROR_DOM_QUOTA_REACHED") {
    return "No hay espacio disponible en este dispositivo. Intenta guardar el reporte sin foto o liberar espacio.";
  }
  return "No se pudo guardar en este dispositivo. Revisa la configuración de almacenamiento del navegador.";
}

function guardarReportesLocales(reportes) {
  try {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(reportes));
  } catch (error) {
    throw new Error(mensajeErrorAlmacenamiento(error));
  }
}

function exportarReportes() {
  if (!datosListos) {
    mostrarEstado(estadoTablero, "Espera a que terminen de cargar los reportes para exportar.");
    return;
  }

  const contenido = JSON.stringify(obtenerReportesActuales(), null, 2);
  const archivo = new Blob([contenido], { type: "application/json" });
  const direccion = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = direccion;
  enlace.download = "reportes-santa-marta.json";
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(direccion), 1000);
  mostrarEstado(estadoTablero, "Se descargó el archivo JSON de reportes.");
}

async function importarReportes(archivo) {
  if (!datosListos) {
    mostrarEstado(estadoTablero, "Espera a que carguen los datos antes de importar.");
    return;
  }
  if (!archivo) {
    return;
  }

  try {
    const reportesDelArchivo = JSON.parse(await archivo.text());
    if (!Array.isArray(reportesDelArchivo)) {
      throw new Error("El archivo debe contener una lista JSON de reportes.");
    }

    const idsConocidos = new Set(obtenerReportesActuales().map((reporte) => reporte.id));
    const nuevosReportes = [];
    let cantidadDuplicados = 0;

    for (const [indice, reporteDelArchivo] of reportesDelArchivo.entries()) {
      if (
        reporteDelArchivo &&
        typeof reporteDelArchivo.id === "string" &&
        idsConocidos.has(reporteDelArchivo.id)
      ) {
        cantidadDuplicados += 1;
        continue;
      }

      try {
        const reporteNormalizado = normalizarReporte(reporteDelArchivo);
        idsConocidos.add(reporteNormalizado.id);
        nuevosReportes.push(reporteNormalizado);
      } catch (error) {
        throw new Error(`Reporte ${indice + 1}: ${error.message}`);
      }
    }

    if (nuevosReportes.length > 0) {
      const reportesLocalesActualizados = [...reportesLocales, ...nuevosReportes];
      guardarReportesLocales(reportesLocalesActualizados);
      reportesLocales = reportesLocalesActualizados;
      publicarReportesActualizados();
    }

    mostrarEstado(
      estadoTablero,
      `Importados ${nuevosReportes.length} reporte(s); omitidos ${cantidadDuplicados} duplicado(s).`,
    );
  } catch (error) {
    mostrarEstado(estadoTablero, `No se pudo importar el archivo: ${error.message}`);
  }
}

function manejarUbicacionSeleccionada(evento) {
  const { lat, lng } = evento.detail ?? {};
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    mostrarEstado(estadoUbicacion, "El mapa devolvió una ubicación inválida. Selecciona otro punto.");
    ubicacionSeleccionada = null;
    return;
  }

  ubicacionSeleccionada = { lat, lng };
  entradaDireccion.value = "";
  actualizarVistaCriticidad();
  void buscarDireccion(lat, lng);
}

async function buscarDireccion(lat, lng) {
  controladorGeocodificacion?.abort();
  controladorGeocodificacion = new AbortController();
  const controlador = controladorGeocodificacion;
  const solicitud = ++numeroGeocodificacion;
  mostrarEstado(estadoUbicacion, "Buscando la dirección del punto en el mapa…");

  try {
    const url = new URL("https://photon.komoot.io/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    const respuesta = await fetch(url, {
      signal: controlador.signal,
      headers: { Accept: "application/json" },
    });
    if (!respuesta.ok) {
      throw new Error(`El servicio de direcciones respondió HTTP ${respuesta.status}.`);
    }

    const resultado = await respuesta.json();
    const propiedades = resultado.features?.[0]?.properties;
    if (!propiedades) {
      throw new Error("No se encontró una dirección para el punto seleccionado.");
    }
    const calle = [propiedades.street, propiedades.housenumber].filter(Boolean).join(" ");
    const localidad =
      propiedades.suburb ||
      propiedades.district ||
      propiedades.locality ||
      propiedades.city;
    const direccion = [calle || propiedades.name, localidad, propiedades.state]
      .filter((parte, indice, partes) => parte && partes.indexOf(parte) === indice)
      .join(", ");
    if (!direccion) {
      throw new Error("El servicio no devolvió una dirección reconocible.");
    }
    if (solicitud !== numeroGeocodificacion) {
      return;
    }

    entradaDireccion.value = direccion;
    if (ubicacionSeleccionada) {
      ubicacionSeleccionada.direccion = direccion;
    }
    actualizarVistaCriticidad();
    mostrarEstado(estadoUbicacion, `Dirección del punto: ${direccion}`);
  } catch (error) {
    if (error.name === "AbortError" || solicitud !== numeroGeocodificacion) {
      return;
    }
    mostrarEstado(
      estadoUbicacion,
      `No se pudo obtener la dirección automáticamente. Escríbela en el campo. (${error.message})`,
    );
  }
}

function cancelarBusquedaDireccion() {
  controladorGeocodificacion?.abort();
  controladorGeocodificacion = null;
  numeroGeocodificacion += 1;
}

function pedirGeolocalizacion() {
  if (!navigator.geolocation) {
    mostrarEstado(estadoUbicacion, "Este navegador no ofrece geolocalización.");
    return;
  }

  mostrarEstado(estadoUbicacion, "Solicitando permiso para obtener tu ubicación…");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      window.dispatchEvent(
        new CustomEvent("mapa:solicitar-ubicacion", {
          detail: { lat: coords.latitude, lng: coords.longitude },
        }),
      );
    },
    (error) => {
      const mensajes = {
        1: "No se concedió permiso para usar la ubicación.",
        2: "El dispositivo no pudo determinar la ubicación.",
        3: "Se agotó el tiempo de espera al obtener la ubicación.",
      };
      mostrarEstado(estadoUbicacion, mensajes[error.code] ?? "No se pudo obtener la ubicación.");
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

function guardarReporte(evento) {
  evento.preventDefault();
  mostrarEstado(estadoCaptura, "");

  if (!formulario.reportValidity()) {
    return;
  }
  const datos = new FormData(formulario);
  if (!categoriasPermitidas.has(datos.get("categoria"))) {
    mostrarEstado(estadoCaptura, "Elige una categoría antes de enviar el reporte.");
    botonesCategoria[0]?.focus();
    return;
  }
  if (!actoresPermitidos.has(datos.get("actor"))) {
    mostrarEstado(estadoCaptura, "Elige un tipo de actor antes de enviar el reporte.");
    botonesActor[0]?.focus();
    return;
  }
  const archivoFoto = entradaFoto.files[0];
  if (archivoFoto && !fotoConfirmada) {
    mostrarEstado(estadoCaptura, "Confirma la foto censurada antes de guardar el reporte.");
    botonConfirmarFoto.focus();
    return;
  }
  if (!ubicacionSeleccionada) {
    mostrarEstado(estadoCaptura, "Marca una ubicación válida en el mapa antes de guardar.");
    return;
  }

  const direccion = String(datos.get("direccion") ?? "").trim();
  if (!direccion) {
    mostrarEstado(estadoCaptura, "Indica la dirección de la infracción.");
    entradaDireccion.focus();
    return;
  }

  try {
    const reportesActuales = obtenerReportesActuales();
    const reporte = normalizarReporte({
      id: generarIdUnico(reportesActuales),
      origen: "ciudadano",
      fecha_hora: formatearFechaHoraLocal(new Date()),
      lat: ubicacionSeleccionada.lat,
      lng: ubicacionSeleccionada.lng,
      cuadra: direccion,
      direccion,
      categoria: datos.get("categoria"),
      actor: datos.get("actor"),
      foto: archivoFoto ? fotoConfirmada : "",
    });

    const nuevosReportesLocales = [...reportesLocales, reporte];
    guardarReportesLocales(nuevosReportesLocales);
    reportesLocales = nuevosReportesLocales;
    publicarReportesActualizados();
    formulario.reset();
    ubicacionSeleccionada = null;
    cancelarBusquedaDireccion();
    window.dispatchEvent(new Event("mapa:limpiar-seleccion"));
    reiniciarEditorCensura();
    for (const boton of [...botonesCategoria, ...botonesActor]) {
      boton.setAttribute("aria-pressed", "false");
    }
    document.querySelector("#reporte-categoria").value = "";
    document.querySelector("#reporte-actor").value = "";
    actualizarVistaCriticidad();
    mostrarEstado(estadoCaptura, `Reporte ${reporte.id} guardado en este dispositivo.`);
  } catch (error) {
    mostrarEstado(estadoCaptura, `No se pudo guardar el reporte: ${error.message}`);
  }
}

async function inicializar() {
  const [reportes, viasCargadas, criteriosCargados] = await Promise.all([
    cargarJSON("./datos/reportes.json"),
    cargarJSON("./datos/vias.json"),
    cargarJSON("./datos/criterios.json"),
  ]);
  if (!Array.isArray(reportes) || !Array.isArray(viasCargadas)) {
    throw new Error("Los archivos de reportes y vías deben contener listas JSON.");
  }

  vias = viasCargadas;
  criterios = criteriosCargados;
  reportesIniciales = reportes.map((reporte) => normalizarReporte(reporte));
  const idsIniciales = new Set(reportesIniciales.map((reporte) => reporte.id));
  reportesLocales = leerReportesLocales().map((reporte) => {
    const reporteNormalizado = normalizarReporte(reporte, false);
    if (idsIniciales.has(reporteNormalizado.id)) {
      throw new Error(`El ID ${reporteNormalizado.id} ya existe en los datos de ejemplo.`);
    }
    idsIniciales.add(reporteNormalizado.id);
    return reporteNormalizado;
  });

  datosListos = true;
  publicarReportesActualizados();
  actualizarVistaCriticidad();
  mostrarEstado(
    estadoUbicacion,
    "Al elegir un punto, sus coordenadas se consultarán con OpenStreetMap/Photon para obtener la dirección.",
  );
  mostrarEstado(estadoCaptura, "Listo para registrar un reporte.");
}

formulario.addEventListener("submit", guardarReporte);
entradaFoto.addEventListener("change", () => prepararFotoParaCensura(entradaFoto.files[0]));
botonTomarFoto.addEventListener("click", abrirSelectorFoto);
botonElegirOtraFoto.addEventListener("click", abrirSelectorFoto);
botonCancelarCensura.addEventListener("click", () => {
  entradaFoto.value = "";
  reiniciarEditorCensura();
  cambiarVista("captura");
});
confirmacionPrivacidadFoto.addEventListener("change", () => {
  if (!confirmacionPrivacidadFoto.checked) {
    fotoConfirmada = "";
    botonGuardarReporte.disabled = Boolean(entradaFoto.files[0]);
  }
  botonConfirmarFoto.disabled =
    !confirmacionPrivacidadFoto.checked || !lienzoCensura.width || Boolean(seleccionCensura);
});
lienzoCensura.addEventListener("pointerdown", manejarInicioSeleccion);
lienzoCensura.addEventListener("pointermove", manejarMovimientoSeleccion);
lienzoCensura.addEventListener("pointerup", manejarFinSeleccion);
lienzoCensura.addEventListener("pointercancel", manejarCancelacionSeleccion);
botonDeshacerCensura.addEventListener("click", deshacerCensura);
botonConfirmarFoto.addEventListener("click", confirmarFotoCensurada);
document.querySelector("#reporte-categoria").addEventListener("change", actualizarVistaCriticidad);
document.querySelector("#reporte-actor").addEventListener("change", actualizarVistaCriticidad);
entradaDireccion.addEventListener("input", actualizarVistaCriticidad);
for (const boton of botonesCategoria) {
  boton.addEventListener("click", () => {
    document.querySelector("#reporte-categoria").value = boton.dataset.seleccionCategoria;
    actualizarSeleccionGrupo(botonesCategoria, boton.dataset.seleccionCategoria);
    actualizarVistaCriticidad();
  });
}
for (const boton of botonesActor) {
  boton.addEventListener("click", () => {
    document.querySelector("#reporte-actor").value = boton.dataset.seleccionActor;
    actualizarSeleccionGrupo(botonesActor, boton.dataset.seleccionActor);
  });
}
botonGeolocalizacion.addEventListener("click", pedirGeolocalizacion);
botonLimpiarUbicacion.addEventListener("click", () => {
  ubicacionSeleccionada = null;
  cancelarBusquedaDireccion();
  entradaDireccion.value = "";
  window.dispatchEvent(new Event("mapa:limpiar-seleccion"));
  mostrarEstado(estadoUbicacion, "Toca el mapa o usa tu ubicación.");
});
botonVistaCaptura.addEventListener("click", () => cambiarVista("captura"));
botonVistaTablero.addEventListener("click", () => cambiarVista("tablero"));
botonVistaGraficas.addEventListener("click", () => cambiarVista("graficas"));
botonNuevoReporte.addEventListener("click", () => cambiarVista("captura"));
botonGraficasNuevoReporte.addEventListener("click", () => cambiarVista("captura"));
botonGraficasVerTablero.addEventListener("click", () => cambiarVista("tablero"));
for (const control of Object.values(controlesFiltros)) {
  control.addEventListener("change", actualizarTablero);
  control.addEventListener("input", actualizarTablero);
}
botonesModoMapa.calor.addEventListener("click", () => cambiarModoMapa("calor"));
botonesModoMapa.puntos.addEventListener("click", () => cambiarModoMapa("puntos"));
document.querySelector("#boton-exportar").addEventListener("click", exportarReportes);
document.querySelector("#boton-importar").addEventListener("click", () => {
  selectorArchivoImportar.click();
});
selectorArchivoImportar.addEventListener("change", async (evento) => {
  const entrada = evento.currentTarget;
  await importarReportes(entrada.files[0]);
  entrada.value = "";
});
document.querySelector("#boton-imprimir").addEventListener("click", () => window.print());
window.addEventListener("mapa:ubicacion-seleccionada", manejarUbicacionSeleccionada);
// mapa.js valida el perímetro y emite este evento solo para puntos aceptados.
window.addEventListener("mapa:ubicacion-rechazada", ({ detail }) => {
  ubicacionSeleccionada = null;
  cancelarBusquedaDireccion();
  entradaDireccion.value = "";
  actualizarVistaCriticidad();
  mostrarEstado(estadoUbicacion, detail?.mensaje ?? "La ubicación está fuera del área permitida.");
});

inicializarTema();
botonTema.addEventListener("click", () => {
  aplicarTema(document.documentElement.dataset.tema === "oscuro" ? "claro" : "oscuro", true);
});

inicializar().catch((error) => {
  mostrarEstado(estadoCaptura, `No se pudo iniciar la captura: ${error.message}`);
  console.error(error);
});
