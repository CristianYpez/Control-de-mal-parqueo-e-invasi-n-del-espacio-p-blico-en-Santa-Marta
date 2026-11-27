import { calcularCriticidad } from "./criticidad.js?v=7";
import { ubicarCuadra, CUADRA_FUERA_DE_ZONA } from "./cuadras.js?v=1";
import { filtrarReportes } from "./filtros.js?v=6";
import { resumirPorCuadra } from "./resumen.js?v=6";
import { estaDentroDelPerimetro } from "./mapa.js?v=29";

const CLAVE_ALMACENAMIENTO = "santaMartaReportesV1";
const CLAVE_TEMA = "santaMartaTema";
const CLAVE_DISPOSITIVO = "santaMartaDispositivo";
const formulario = document.querySelector("#formulario-reporte");
const entradaDireccion = document.querySelector("#reporte-direccion");
const opcionesCuadrasFiltro = document.querySelector("#opciones-cuadras-filtro");
const botonTema = document.querySelector("#boton-tema");
const entradaFoto = document.querySelector("#reporte-foto");
const entradaFotoCamara = document.querySelector("#reporte-foto-camara");
const editorCensura = document.querySelector("#editor-censura");
const lienzoCensura = document.querySelector("#canvas-censura");
const marcoSeleccionCensura = document.querySelector("#marco-seleccion-censura");
const botonDeshacerCensura = document.querySelector("#boton-deshacer-censura");
const botonConfirmarFoto = document.querySelector("#boton-confirmar-foto");
const confirmacionPrivacidadFoto = document.querySelector("#confirmar-privacidad-foto");
const contadorCensura = document.querySelector("#contador-censura");
const botonGuardarReporte = document.querySelector("#boton-guardar-reporte");
const botonTomarFoto = document.querySelector("#boton-tomar-foto");
const botonGaleriaFoto = document.querySelector("#boton-galeria-foto");
const botonElegirOtraFoto = document.querySelector("#boton-elegir-otra-foto");
const botonTomarOtraFoto = document.querySelector("#boton-tomar-otra-foto");
const botonCancelarCensura = document.querySelector("#boton-cancelar-censura");
const botonToggleFiltros = document.querySelector("#boton-toggle-filtros");
const contenedorFiltros = document.querySelector("#contenedor-filtros");
const estadoFoto = document.querySelector("#estado-foto");
const estadoCensura = document.querySelector("#estado-censura");
const estadoCaptura = document.querySelector("#estado-captura");
const estadoUbicacion = document.querySelector("#estado-ubicacion");
const botonGeolocalizacion = document.querySelector("#boton-geolocalizacion");
const botonLimpiarUbicacion = document.querySelector("#boton-limpiar-ubicacion");
const botonVistaCaptura = document.querySelector("#boton-vista-captura");
const botonVistaTablero = document.querySelector("#boton-vista-tablero");
const botonVistaGraficas = document.querySelector("#boton-vista-graficas");
const botonNavMovilCaptura = document.querySelector("#boton-nav-movil-captura");
const botonNavMovilTablero = document.querySelector("#boton-nav-movil-tablero");
const botonNavMovilGraficas = document.querySelector("#boton-nav-movil-graficas");
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
const elementosDashboard = {
  total: document.querySelector("#kpi-dash-total"),
  alta: document.querySelector("#kpi-dash-alta"),
  altaConteo: document.querySelector("#kpi-dash-alta-conteo"),
  pico: document.querySelector("#kpi-dash-pico"),
  picoConteo: document.querySelector("#kpi-dash-pico-conteo"),
  actor: document.querySelector("#kpi-dash-actor"),
  actorConteo: document.querySelector("#kpi-dash-actor-conteo"),
  canvasFranjas: document.querySelector("#chart-franjas-canvas"),
  canvasCriticidad: document.querySelector("#chart-criticidad-canvas"),
  canvasCategorias: document.querySelector("#chart-categorias-canvas"),
  canvasActores: document.querySelector("#chart-actores-canvas"),
  canvasDias: document.querySelector("#chart-dias-canvas"),
  canvasOrigenes: document.querySelector("#chart-origenes-canvas"),
};
let instanciasGraficas = {
  franjas: null,
  criticidad: null,
  categorias: null,
  actores: null,
  dias: null,
  origenes: null,
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
let reporteEnEdicionCensura = null;

function aplicarTema(tema, guardar = false) {
  const esOscuro = tema === "oscuro";
  document.documentElement.dataset.tema = esOscuro ? "oscuro" : "claro";
  document.documentElement.setAttribute("data-theme", esOscuro ? "dark" : "light");
  const textoTema = botonTema.querySelector(".texto-modo-tema");
  if (textoTema) {
    textoTema.textContent = esOscuro ? "Claro" : "Oscuro";
  } else {
    botonTema.textContent = esOscuro ? "Claro" : "Oscuro";
  }
  botonTema.setAttribute("aria-label", `Cambiar a modo ${esOscuro ? "claro" : "oscuro"}`);
  botonTema.setAttribute("aria-pressed", String(esOscuro));
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.content = esOscuro ? "#0B1116" : "#F1F5F9";
  }
  window.dispatchEvent(new CustomEvent("tema:cambiado", { detail: { tema, esOscuro } }));
  if (guardar) {
    localStorage.setItem(CLAVE_TEMA, esOscuro ? "oscuro" : "claro");
    if (datosListos && !vistaGraficas.hidden) {
      renderizarGraficas(obtenerReportesActuales());
    }
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
  if (location.protocol === "file:") {
    throw new Error(
      "La app se abrió con doble clic y el navegador bloquea los archivos JSON. Ábrela con Live Server o desde GitHub Pages.",
    );
  }

  const respuesta = await fetch(ruta, { cache: "no-store" });
  if (!respuesta.ok) {
    throw new Error(`No se encontró ${ruta.replace("./", "")} (HTTP ${respuesta.status}).`);
  }
  const texto = await respuesta.text();
  try {
    return JSON.parse(texto);
  } catch (error) {
    // Se muestra el error tal cual para que se vea qué se dañó al editar el archivo.
    throw new Error(`${ruta.replace("./", "")} tiene un error de formato: ${error.message}`);
  }
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
  if (typeof reporte.id !== "string" || !/^MP-(?:[A-Z0-9]{3}-)?\d+$/.test(reporte.id)) {
    throw new Error("El reporte tiene un ID inválido; se esperaba MP-### o MP-XXX-###.");
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

  // La cuadra sale de vias.json, nunca de lo que escriba el usuario. Si el reporte no trae
  // una cuadra conocida (por ejemplo, uno nuevo o uno importado de una versión vieja),
  // se busca por sus coordenadas.
  let cuadra = typeof reporte.cuadra === "string" ? reporte.cuadra.trim() : "";
  if (!vias.some((via) => via.id === cuadra)) {
    cuadra = ubicarCuadra(reporte.lat, reporte.lng, vias)?.id ?? CUADRA_FUERA_DE_ZONA;
  }

  // Si el reporte no tiene foto o viene vacía, asociarle foto por defecto según su ID si existe
  let foto = typeof reporte.foto === "string" ? reporte.foto.trim() : "";
  if (!foto) {
    const numMatch = /MP-(?:[A-Z0-9]{3}-)?0*(\d+)/i.exec(reporte.id || "");
    if (numMatch) {
      foto = `datos/fotos/reporte${numMatch[1].padStart(2, "0")}.jpeg`;
    }
  }

  const criticidad = calcularCriticidad({ ...reporte, cuadra }, vias, criterios);
  return {
    id: reporte.id,
    origen: reporte.origen,
    fecha_hora: reporte.fecha_hora,
    lat: reporte.lat,
    lng: reporte.lng,
    cuadra,
    direccion: reporte.direccion?.trim() ?? "",
    categoria: reporte.categoria,
    actor: reporte.actor,
    foto,
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
  if (!elemento) return;
  if (conteos.length === 0 || conteos[0].cantidad === 0) {
    elemento.textContent = "Sin datos";
    elemento.title = "Sin datos";
    return;
  }

  const cantidad = conteos[0].cantidad;
  const ganadores = conteos
    .filter((conteo) => conteo.cantidad === cantidad)
    .map((conteo) => conteo.etiqueta);
  const prefijo = ganadores.length > 1 ? "Empate: " : "";
  const unidad = cantidad === 1 ? "reporte" : "reportes";
  const texto = `${prefijo}${ganadores.join(", ")} (${cantidad} ${unidad})`;
  elemento.textContent = texto;
  elemento.title = texto;
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
  if (!elemento) return;
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

function renderizarDashboardInteractivo(
  reportes,
  conteosFranjas,
  conteosNiveles,
  conteosCategorias,
  conteosActores,
  conteosDias,
  conteosOrigenes,
) {
  const total = reportes.length;
  const altaCount = reportes.filter((r) => r.criticidad?.nivel === "Alto").length;
  const altaPorcentaje = total > 0 ? Math.round((altaCount / total) * 100) : 0;

  const picoCount = reportes.filter((r) => {
    try {
      return obtenerFranjaActual(r.fecha_hora) === "pico";
    } catch {
      return false;
    }
  }).length;
  const picoPorcentaje = total > 0 ? Math.round((picoCount / total) * 100) : 0;

  const actorGanador = conteosActores[0]?.cantidad > 0 ? conteosActores[0].etiqueta : "Sin datos";
  const actorCantidad = conteosActores[0]?.cantidad ?? 0;

  if (elementosDashboard.total) elementosDashboard.total.textContent = String(total);
  if (elementosDashboard.alta) elementosDashboard.alta.textContent = `${altaPorcentaje}% Alta`;
  if (elementosDashboard.altaConteo) {
    elementosDashboard.altaConteo.textContent = `${altaCount} caso(s) prioritario(s)`;
  }
  if (elementosDashboard.pico) elementosDashboard.pico.textContent = `${picoPorcentaje}% Pico`;
  if (elementosDashboard.picoConteo) {
    elementosDashboard.picoConteo.textContent = `${picoCount} en franja congestionada`;
  }
  if (elementosDashboard.actor) elementosDashboard.actor.textContent = actorGanador;
  if (elementosDashboard.actorConteo) {
    elementosDashboard.actorConteo.textContent = `${actorCantidad} reporte(s)`;
  }

  if (!window.Chart) {
    return;
  }

  const esOscuro = document.documentElement.dataset.tema !== "claro" && document.documentElement.getAttribute("data-theme") !== "light";
  const estilo = getComputedStyle(document.documentElement);
  const colorTexto = estilo.getPropertyValue("--text-primary").trim() || (esOscuro ? "#F1F5F9" : "#0F172A");
  const colorSecundario = estilo.getPropertyValue("--text-secondary").trim() || (esOscuro ? "#94A3B8" : "#475569");
  const colorRejilla = estilo.getPropertyValue("--border-subtle").trim() || (esOscuro ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)");
  const colorAcento = estilo.getPropertyValue("--accent-primary").trim() || (esOscuro ? "#2DD4BF" : "#0D9488");
  const colorSuperficie = estilo.getPropertyValue("--bg-surface").trim() || (esOscuro ? "#121A22" : "#FFFFFF");

  // 1. Reportes por Franja Horaria
  if (elementosDashboard.canvasFranjas) {
    if (instanciasGraficas.franjas) instanciasGraficas.franjas.destroy();
    const mapaColoresFranja = {
      "Hora pico": esOscuro ? "#F59E0B" : "#D97706",
      "Hora valle": esOscuro ? "#2DD4BF" : "#0D9488",
    };
    instanciasGraficas.franjas = new window.Chart(elementosDashboard.canvasFranjas, {
      type: "doughnut",
      data: {
        labels: conteosFranjas.map((c) => c.etiqueta),
        datasets: [
          {
            data: conteosFranjas.map((c) => c.cantidad),
            backgroundColor: conteosFranjas.map(
              (c) => mapaColoresFranja[c.etiqueta] || colorAcento,
            ),
            borderWidth: 2,
            borderColor: colorSuperficie,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colorTexto, boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });
  }

  // 2. Reportes por Nivel de Criticidad
  if (elementosDashboard.canvasCriticidad) {
    if (instanciasGraficas.criticidad) instanciasGraficas.criticidad.destroy();
    const mapaColoresNivel = {
      "Nivel alto": esOscuro ? "#EF4444" : "#DC2626",
      "Nivel medio": esOscuro ? "#F59E0B" : "#D97706",
      "Nivel bajo": esOscuro ? "#10B981" : "#059669",
    };
    instanciasGraficas.criticidad = new window.Chart(elementosDashboard.canvasCriticidad, {
      type: "doughnut",
      data: {
        labels: conteosNiveles.map((c) => c.etiqueta),
        datasets: [
          {
            data: conteosNiveles.map((c) => c.cantidad),
            backgroundColor: conteosNiveles.map(
              (c) => mapaColoresNivel[c.etiqueta] || colorAcento,
            ),
            borderWidth: 2,
            borderColor: colorSuperficie,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colorTexto, boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });
  }

  // 3. Reportes por Categoría
  if (elementosDashboard.canvasCategorias) {
    if (instanciasGraficas.categorias) instanciasGraficas.categorias.destroy();
    instanciasGraficas.categorias = new window.Chart(elementosDashboard.canvasCategorias, {
      type: "doughnut",
      data: {
        labels: conteosCategorias.map((c) => c.etiqueta),
        datasets: [
          {
            data: conteosCategorias.map((c) => c.cantidad),
            backgroundColor: [colorAcento, esOscuro ? "#F59E0B" : "#D97706", esOscuro ? "#EF4444" : "#DC2626"],
            borderWidth: 2,
            borderColor: colorSuperficie,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colorTexto, boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });
  }

  // 4. Reportes por Tipo de Actor
  if (elementosDashboard.canvasActores) {
    if (instanciasGraficas.actores) instanciasGraficas.actores.destroy();
    instanciasGraficas.actores = new window.Chart(elementosDashboard.canvasActores, {
      type: "bar",
      data: {
        labels: conteosActores.map((c) => c.etiqueta),
        datasets: [
          {
            label: "Reportes",
            data: conteosActores.map((c) => c.cantidad),
            backgroundColor: colorAcento,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: colorSecundario, font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: colorSecundario, stepSize: 1 },
            grid: { color: colorRejilla },
          },
        },
      },
    });
  }

  // 5. Reportes por Día de la Semana
  if (elementosDashboard.canvasDias) {
    if (instanciasGraficas.dias) instanciasGraficas.dias.destroy();
    instanciasGraficas.dias = new window.Chart(elementosDashboard.canvasDias, {
      type: "bar",
      data: {
        labels: conteosDias.map((c) => c.etiqueta),
        datasets: [
          {
            label: "Reportes",
            data: conteosDias.map((c) => c.cantidad),
            backgroundColor: esOscuro ? "#38BDF8" : "#0284C7",
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: colorSecundario, font: { size: 10 } },
            grid: { display: false },
          },
          y: {
            beginAtZero: true,
            ticks: { color: colorSecundario, stepSize: 1 },
            grid: { color: colorRejilla },
          },
        },
      },
    });
  }

  // 6. Reportes por Origen
  if (elementosDashboard.canvasOrigenes) {
    if (instanciasGraficas.origenes) instanciasGraficas.origenes.destroy();
    instanciasGraficas.origenes = new window.Chart(elementosDashboard.canvasOrigenes, {
      type: "doughnut",
      data: {
        labels: conteosOrigenes.map((c) => c.etiqueta),
        datasets: [
          {
            data: conteosOrigenes.map((c) => c.cantidad),
            backgroundColor: [colorAcento, esOscuro ? "#6366F1" : "#4F46E5"],
            borderWidth: 2,
            borderColor: colorSuperficie,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { color: colorTexto, boxWidth: 12, font: { size: 11 } },
          },
        },
      },
    });
  }
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

  renderizarDashboardInteractivo(
    reportes,
    conteosFranjas,
    conteosNiveles,
    conteosCategorias,
    conteosActores,
    conteosDias,
    conteosOrigenes,
  );

  if (elementosGraficas.total) elementosGraficas.total.textContent = String(reportes.length);
  if (elementosGraficas.cuadra) mostrarFrecuenciaMaxima(elementosGraficas.cuadra, conteosCuadras);
  if (elementosGraficas.categoria) mostrarFrecuenciaMaxima(elementosGraficas.categoria, conteosCategorias);
  if (elementosGraficas.actor) mostrarFrecuenciaMaxima(elementosGraficas.actor, conteosActores);

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
  const via = ubicacionSeleccionada
    ? ubicarCuadra(ubicacionSeleccionada.lat, ubicacionSeleccionada.lng, vias)
    : null;
  const cuadraSeleccionada = via?.id ?? CUADRA_FUERA_DE_ZONA;
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
  datosVistaCriticidad.tipoVia.textContent = !ubicacionSeleccionada
    ? "Marca el punto en el mapa"
    : via
      ? `${via.tipo === "arterial" ? "Arterial" : "Secundaria"} · ${via.id}`
      : "Fuera de la zona (no suma puntos)";
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
  if (!barrasCategorias) {
    return;
  }
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
  try {
    sessionStorage.setItem("santaMartaVistaActiva", nombreVista);
  } catch { }

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
  if (botonNavMovilCaptura) botonNavMovilCaptura.setAttribute("aria-pressed", String(mostrarCaptura || mostrarCensura));
  if (botonNavMovilTablero) botonNavMovilTablero.setAttribute("aria-pressed", String(mostrarTablero));
  if (botonNavMovilGraficas) botonNavMovilGraficas.setAttribute("aria-pressed", String(mostrarGraficas));

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

function obtenerFuenteFoto(foto) {
  if (!foto || typeof foto !== "string") {
    return "";
  }
  const limpia = foto.trim();
  if (/^data:image\/(?:jpeg|png|webp|gif|svg\+xml);base64,/i.test(limpia)) {
    return limpia;
  }
  if (limpia.startsWith("blob:")) {
    return limpia;
  }
  try {
    const enlace = document.createElement("a");
    enlace.href = limpia;
    if (["http:", "https:", "file:"].includes(enlace.protocol)) {
      return enlace.href;
    }
  } catch (error) {
    // Si la URL no puede ser analizada, continuamos
  }
  return limpia;
}

function abrirVisorFoto(reporte) {
  if (!reporte) return;
  const modal = document.getElementById("modal-visor-foto");
  if (!modal) return;

  const fuente = obtenerFuenteFoto(reporte.foto);
  const imgElem = document.getElementById("modal-foto-img");
  if (imgElem) {
    imgElem.src = fuente || "";
    imgElem.alt = `Foto de infracción ${reporte.id} censurada`;
  }

  const idElem = document.getElementById("modal-foto-id");
  if (idElem) idElem.textContent = `#${reporte.id}`;

  const critElem = document.getElementById("modal-foto-criticidad");
  if (critElem) {
    const nivel = (reporte.criticidad?.nivel || "Sin nivel").toLowerCase();
    const puntaje = reporte.criticidad?.puntaje !== undefined ? ` · ${reporte.criticidad.puntaje} PTS` : "";
    critElem.textContent = `NIVEL ${nivel.toUpperCase()}${puntaje}`;
    critElem.className = `badge-modal-crit badge-modal-crit--${nivel}`;
  }

  // Título: Tipo de Infracción (Regla de jerarquía inversa)
  const nombresCat = {
    doble_fila: "Doble fila / vía prohibida",
    bloqueo_rampa_cebra_paradero: "Bloqueo de rampa, cebra o paradero",
    invasion_anden: "Invasión de andén peatonal",
  };
  const tipoInfraccion = nombresCat[reporte.categoria] || reporte.categoria || "Infracción de estacionamiento";

  const tituloElem = document.getElementById("modal-foto-titulo");
  if (tituloElem) {
    tituloElem.textContent = tipoInfraccion;
  }

  // Subtítulo: Dirección completa
  const dirTexto = reporte.direccion || `Cuadra ${reporte.cuadra || "No especificada"}`;
  const subtituloTextoElem = document.getElementById("modal-foto-direccion-texto");
  if (subtituloTextoElem) {
    subtituloTextoElem.textContent = `${dirTexto}, Santa Marta, Magdalena`;
  } else {
    const subtituloElem = document.getElementById("modal-foto-subtitulo");
    if (subtituloElem) subtituloElem.textContent = `${dirTexto}, Santa Marta, Magdalena`;
  }

  // Grilla de Metadatos (4 celdas sin duplicar dirección):
  // 1. UBICACIÓN / SECTOR
  const cuadraElem = document.getElementById("modal-foto-cuadra");
  if (cuadraElem) {
    cuadraElem.textContent = reporte.cuadra ? `Sector: ${reporte.cuadra}` : "Santa Marta · Zona urbana";
  }

  // 2. ACTOR VIAL
  const actorElem = document.getElementById("modal-foto-actor");
  if (actorElem) {
    const nombresActor = {
      vehiculo_particular: "Vehículo particular",
      motocicleta: "Motocicleta",
      carga_descargando: "Carga descargando",
      mobiliario_comercial: "Mobiliario comercial",
    };
    actorElem.textContent = nombresActor[reporte.actor] || reporte.actor || "Vehículo";
  }

  // 3. FECHA Y HORA
  const fechaElem = document.getElementById("modal-foto-fecha");
  if (fechaElem) {
    if (reporte.fecha_hora) {
      const partes = reporte.fecha_hora.split("T");
      const fechaParte = partes[0] || "";
      const horaParte = partes[1] ? partes[1].slice(0, 5) : "";
      fechaElem.textContent = `${fechaParte} · ${horaParte}`;
    } else {
      fechaElem.textContent = "Sin fecha registrada";
    }
  }

  // 4. ORIGEN
  const origenElem = document.getElementById("modal-foto-origen");
  if (origenElem) {
    origenElem.textContent = reporte.origen === "campo" ? "Operativo en campo" : "Reporte ciudadano";
  }

  // Botón ampliar foto en ventana / pestaña
  const btnZoomFoto = document.getElementById("btn-modal-media-zoom");
  if (btnZoomFoto) {
    btnZoomFoto.onclick = () => {
      if (fuente) {
        window.open(fuente, "_blank", "noopener,noreferrer");
      }
    };
  }

  const btnEditarFoto = document.getElementById("btn-modal-editar-foto");
  if (btnEditarFoto) {
    if (reporte.foto && reporte.foto.trim()) {
      btnEditarFoto.style.display = "";
      btnEditarFoto.onclick = () => {
        iniciarEdicionFotoReporte(reporte);
      };
    } else {
      btnEditarFoto.style.display = "none";
    }
  }

  const btnVerMapa = document.getElementById("btn-modal-ver-en-mapa");
  if (btnVerMapa) {
    btnVerMapa.onclick = () => {
      cerrarVisorFoto();
      if (Number.isFinite(reporte.lat) && Number.isFinite(reporte.lng)) {
        window.dispatchEvent(
          new CustomEvent("mapa:centrar-coordenadas", {
            detail: { lat: reporte.lat, lng: reporte.lng, zoom: 18, reporteId: reporte.id },
          }),
        );
        const mapaElem = document.querySelector("#mapa-tablero");
        if (mapaElem) {
          mapaElem.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    };
  }

  if (typeof modal.showModal === "function") {
    modal.showModal();
  } else {
    modal.setAttribute("open", "");
  }
}

function cerrarVisorFoto() {
  const modal = document.getElementById("modal-visor-foto");
  if (!modal) return;
  if (typeof modal.close === "function") {
    modal.close();
  } else {
    modal.removeAttribute("open");
  }
}

function restaurarTextosEditorCensura() {
  const tituloCensura = document.querySelector("#titulo-censura");
  if (tituloCensura) tituloCensura.textContent = "Censura de foto";
  botonCancelarCensura.textContent = "Volver al reporte";
  botonConfirmarFoto.textContent = "Usar esta foto";
  const btnGaleria = document.querySelector("#boton-elegir-otra-foto");
  const btnCamara = document.querySelector("#boton-tomar-otra-foto");
  if (btnGaleria) btnGaleria.style.display = "";
  if (btnCamara) btnCamara.style.display = "";
}

function iniciarEdicionFotoReporte(reporte) {
  if (!reporte || !reporte.foto) return;
  reporteEnEdicionCensura = reporte;
  cerrarVisorFoto();

  const numeroActual = ++numeroCargaFoto;
  historialCensura = [];
  seleccionCensura = null;
  confirmacionPrivacidadFoto.checked = false;
  contadorCensura.textContent = "0 zonas censuradas";
  marcoSeleccionCensura.style.display = "none";
  botonDeshacerCensura.disabled = true;
  botonConfirmarFoto.disabled = true;
  lienzoCensura.width = 0;
  lienzoCensura.height = 0;

  const tituloCensura = document.querySelector("#titulo-censura");
  if (tituloCensura) tituloCensura.textContent = `Censurar foto · Reporte #${reporte.id}`;
  botonCancelarCensura.textContent = "Volver al tablero";
  botonConfirmarFoto.textContent = "Guardar foto censurada";

  const btnGaleria = document.querySelector("#boton-elegir-otra-foto");
  const btnCamara = document.querySelector("#boton-tomar-otra-foto");
  if (btnGaleria) btnGaleria.style.display = "none";
  if (btnCamara) btnCamara.style.display = "none";

  cambiarVista("censura");
  estadoCensura.textContent = "Cargando foto del reporte para censurar…";

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    if (numeroActual !== numeroCargaFoto) return;
    const ancho = Math.min(img.naturalWidth || img.width, ANCHO_MAXIMO_FOTO);
    const alto = Math.max(1, Math.round(((img.naturalHeight || img.height) * ancho) / (img.naturalWidth || img.width)));
    lienzoCensura.width = ancho;
    lienzoCensura.height = alto;

    const contexto = obtenerContextoCensura();
    contexto.imageSmoothingEnabled = true;
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, ancho, alto);
    contexto.drawImage(img, 0, 0, ancho, alto);

    botonConfirmarFoto.disabled = !confirmacionPrivacidadFoto.checked;
    estadoCensura.textContent = "Arrastra sobre la imagen para pixelar placas o rostros. Marca la confirmación y guarda.";
  };
  img.onerror = () => {
    if (numeroActual !== numeroCargaFoto) return;
    estadoCensura.textContent = "No se pudo cargar la imagen para editar.";
  };
  img.src = obtenerFuenteFoto(reporte.foto);
}

let reportesParaResumen = [];
let indicePaginacionResumen = 0;
const TAMANO_PAGINA_RESUMEN = 6;
let observadorScrollResumen = null;

function renderizarElementoReporte(reporte, nombresCategorias, nombresActores) {
  const elemento = document.createElement("li");
  const nivelCrit = (reporte.criticidad?.nivel || "Sin nivel").toLowerCase();

  // Clases semánticas SaaS Hero-Banner
  elemento.classList.add(
    "tarjeta-resumen-cuadra",
    "report-card-vertical",
    "tarjeta-reporte-item",
    `criticidad--${nivelCrit}`,
    `severity--${nivelCrit}`,
  );
  elemento.setAttribute("data-id", reporte.id);

  const fuente = obtenerFuenteFoto(reporte.foto);
  const puntajeTxt = reporte.criticidad?.puntaje !== undefined ? `${reporte.criticidad.puntaje} PTS` : "";
  const nivelLabel = nivelCrit.toUpperCase();
  const tipoInfraccion = nombresCategorias[reporte.categoria] || reporte.categoria || "Infracción";
  const dirTexto = reporte.direccion?.trim() || `Cuadra ${reporte.cuadra || "No especificada"}`;
  const actorTexto = nombresActores[reporte.actor] || reporte.actor || "Vehículo particular";
  const origenTexto = reporte.origen === "campo" ? "Operativo campo" : "Ciudadano";
  const sectorTexto = reporte.cuadra ? `Cuadra ${reporte.cuadra}` : "Fuera de la zona";

  let fechaCorta = "Sin fecha";
  if (reporte.fecha_hora) {
    const p = reporte.fecha_hora.split("T");
    fechaCorta = `${p[0]} · ${p[1] ? p[1].slice(0, 5) : ""}`;
  }

  elemento.innerHTML = `
    <!-- Banner Superior Hero -->
    <div class="card-hero">
      <img
        class="card-hero__img"
        src="${fuente || ""}"
        alt="Evidencia fotográfica ${reporte.id}"
        loading="lazy"
        onerror="this.onerror=null; this.src='data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22200%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22%23161D26%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20fill%3D%22%2364748B%22%20font-family%3D%22sans-serif%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20dy%3D%22.3em%22%3EEvidencia%20Censurada%3C%2Ftext%3E%3C%2Fsvg%3E';"
      />
      <span class="hero-tag hero-tag--id font-mono">#${reporte.id}</span>
      <span class="hero-tag hero-tag--severity severity--${nivelCrit}">
        <span class="severity-dot"></span>
        ${nivelLabel} · ${puntajeTxt}
      </span>
      <button type="button" class="hero-tag hero-btn-expand" data-action="expand" title="Ampliar foto">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
        <span>Ampliar foto</span>
      </button>
    </div>

    <!-- Cuerpo de Información -->
    <div class="card-body">
      <div class="card-header-info">
        <span class="card-date font-mono">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          ${fechaCorta}
        </span>
        <h4 class="card-title">${tipoInfraccion}</h4>
        <p class="card-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${dirTexto}</span>
        </p>
      </div>

      <!-- Tira de 3 Columnas (Meta Strip) -->
      <div class="meta-strip">
        <div class="meta-col">
          <div class="meta-col-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span class="meta-label">ACTOR</span>
          </div>
          <span class="meta-value" title="${actorTexto}">${actorTexto}</span>
        </div>
        <div class="meta-col">
          <div class="meta-col-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span class="meta-label">ORIGEN</span>
          </div>
          <span class="meta-value" title="${origenTexto}">${origenTexto}</span>
        </div>
        <div class="meta-col">
          <div class="meta-col-header">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
            <span class="meta-label">SECTOR</span>
          </div>
          <span class="meta-value" title="${sectorTexto}">${sectorTexto}</span>
        </div>
      </div>

      <!-- Footer Inferior -->
      <div class="card-footer">
        <div class="footer-coords font-mono">
          <svg class="pin-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${Number.isFinite(reporte.lat) && Number.isFinite(reporte.lng) ? `${reporte.lat.toFixed(4)}, ${reporte.lng.toFixed(4)}` : "Sin coordenadas"}</span>
        </div>
        <button type="button" class="btn-map" data-action="map">
          <span>Ver en mapa</span>
          <span>&rarr;</span>
        </button>
      </div>
    </div>
  `;

  // Eventos
  const btnExpand = elemento.querySelector('[data-action="expand"]');
  if (btnExpand) {
    btnExpand.addEventListener("click", (e) => {
      e.stopPropagation();
      abrirVisorFoto(reporte);
    });
  }

  const btnMap = elemento.querySelector('[data-action="map"]');
  const accionarMapa = (e) => {
    e.stopPropagation();
    if (Number.isFinite(reporte.lat) && Number.isFinite(reporte.lng)) {
      window.dispatchEvent(
        new CustomEvent("mapa:centrar-coordenadas", {
          detail: { lat: reporte.lat, lng: reporte.lng, zoom: 18, reporteId: reporte.id },
        }),
      );
      const mapaElem = document.querySelector("#mapa-tablero");
      if (mapaElem) {
        mapaElem.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  if (btnMap) {
    btnMap.addEventListener("click", accionarMapa);
  }

  // Clic en la tarjeta abre el visor
  elemento.addEventListener("click", (e) => {
    if (e.target.closest("button") || e.target.closest("a")) return;
    abrirVisorFoto(reporte);
  });

  return elemento;
}

function cargarSiguienteLoteResumen() {
  if (indicePaginacionResumen >= reportesParaResumen.length) {
    removerCentinelaScrollResumen();
    return;
  }

  const nombresCategorias = {
    doble_fila: "Doble fila / vía prohibida",
    bloqueo_rampa_cebra_paradero: "Rampa, cebra o paradero",
    invasion_anden: "Invasión de andén",
  };

  const nombresActores = {
    vehiculo_particular: "Vehículo particular",
    motocicleta: "Motocicleta",
    vehiculo_carga: "Carga descargando",
    carga_descargando: "Carga descargando",
    mobiliario_comercial: "Mobiliario comercial",
  };

  const centinela = document.getElementById("centinela-scroll-resumen");
  const fragmento = document.createDocumentFragment();
  const fin = Math.min(indicePaginacionResumen + TAMANO_PAGINA_RESUMEN, reportesParaResumen.length);

  for (let i = indicePaginacionResumen; i < fin; i++) {
    const card = renderizarElementoReporte(reportesParaResumen[i], nombresCategorias, nombresActores);
    fragmento.append(card);
  }

  indicePaginacionResumen = fin;

  if (centinela && centinela.parentNode === listaResumen) {
    listaResumen.insertBefore(fragmento, centinela);
  } else {
    listaResumen.append(fragmento);
  }

  if (indicePaginacionResumen >= reportesParaResumen.length) {
    removerCentinelaScrollResumen();
  }
}

function removerCentinelaScrollResumen() {
  if (observadorScrollResumen) {
    observadorScrollResumen.disconnect();
    observadorScrollResumen = null;
  }
  const centinela = document.getElementById("centinela-scroll-resumen");
  if (centinela) {
    centinela.remove();
  }
}

function configurarScrollInfinitoResumen() {
  removerCentinelaScrollResumen();

  if (indicePaginacionResumen >= reportesParaResumen.length) {
    return;
  }

  const centinela = document.createElement("li");
  centinela.id = "centinela-scroll-resumen";
  centinela.className = "centinela-scroll-resumen";
  centinela.setAttribute("aria-hidden", "true");
  centinela.innerHTML = `
    <span class="centinela-scroll-spinner"></span>
    <span>Cargando más reportes...</span>
  `;
  listaResumen.append(centinela);

  if ("IntersectionObserver" in window) {
    observadorScrollResumen = new IntersectionObserver(
      (entries) => {
        const entrada = entries[0];
        if (entrada && entrada.isIntersecting) {
          cargarSiguienteLoteResumen();
        }
      },
      {
        root: null, // viewport global de la ventana
        rootMargin: "250px",
        threshold: 0.1,
      },
    );
    observadorScrollResumen.observe(centinela);
  } else {
    // Fallback con scroll listener global
    const onScroll = () => {
      const scrollPos = window.innerHeight + window.scrollY;
      const threshold = document.documentElement.scrollHeight - 300;
      if (scrollPos >= threshold) {
        cargarSiguienteLoteResumen();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }
}

function renderizarResumen(reportes) {
  removerCentinelaScrollResumen();
  listaResumen.replaceChildren();

  const badgeTotal = document.getElementById("badge-total-resumen");

  if (!reportes || reportes.length === 0) {
    if (badgeTotal) badgeTotal.textContent = "0 reportes";
    const elementoVacio = document.createElement("li");
    elementoVacio.className = "resumen-vacio";
    elementoVacio.innerHTML = `
      <div class="resumen-vacio-icono">ℹ️</div>
      <p>No hay reportes para mostrar con los filtros seleccionados.</p>
    `;
    listaResumen.append(elementoVacio);
    return;
  }

  // Ordenar todos los reportes del más reciente al más antiguo
  reportesParaResumen = [...reportes].sort((a, b) =>
    (b.fecha_hora || "").localeCompare(a.fecha_hora || "")
  );

  if (badgeTotal) {
    badgeTotal.textContent = `${reportesParaResumen.length} reporte(s) · Más recientes`;
  }

  indicePaginacionResumen = 0;
  cargarSiguienteLoteResumen();
  configurarScrollInfinitoResumen();
}

function agregarFotoInfraccion(tarjeta, reporte) {
  const fuente = obtenerFuenteFoto(reporte.foto);
  if (!reporte.foto || !fuente) {
    return;
  }

  const figura = document.createElement("figure");
  figura.className = "foto-infraccion-thumb-wrap";
  figura.tabIndex = 0;
  figura.setAttribute("role", "button");
  figura.setAttribute("aria-label", `Ver foto ampliada de infracción ${reporte.id} en ${reporte.cuadra}`);

  const imagen = document.createElement("img");
  imagen.alt = `Foto de infracción ${reporte.id}`;
  imagen.loading = "lazy";
  imagen.referrerPolicy = "no-referrer";
  imagen.src = fuente;
  imagen.addEventListener("error", () => {
    figura.classList.add("foto-error");
    figura.innerHTML = `<span class="foto-error-msg">⚠️ Error al cargar imagen</span>`;
  });

  const overlay = document.createElement("div");
  overlay.className = "foto-infraccion-overlay";
  overlay.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
    <span>Ver foto</span>
  `;

  const zoomPill = document.createElement("span");
  zoomPill.className = "foto-infraccion-zoom-pill";
  zoomPill.innerHTML = `
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      <line x1="11" y1="8" x2="11" y2="14"></line>
      <line x1="8" y1="11" x2="14" y2="11"></line>
    </svg>
    <span>Ver</span>
  `;

  const tagId = document.createElement("span");
  tagId.className = "foto-infraccion-tag";
  tagId.textContent = `#${reporte.id}`;

  figura.append(imagen, overlay, zoomPill, tagId);

  const accionarModal = (e) => {
    e.stopPropagation();
    abrirVisorFoto(reporte);
  };

  figura.addEventListener("click", accionarModal);
  figura.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      accionarModal(e);
    }
  });

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

// Cada celular tiene un prefijo de 3 letras que se crea la primera vez y se guarda.
// Así dos celulares nunca generan el mismo ID (MP-K7Q-001 y MP-B2X-001 son distintos)
// y al importar no se pierde ningún reporte por creerlo repetido.
function obtenerPrefijoDispositivo() {
  let prefijo = localStorage.getItem(CLAVE_DISPOSITIVO);
  if (!/^[A-Z0-9]{3}$/.test(prefijo ?? "")) {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const azar = crypto.getRandomValues(new Uint8Array(3));
    prefijo = [...azar].map((n) => caracteres[n % caracteres.length]).join("");
    localStorage.setItem(CLAVE_DISPOSITIVO, prefijo);
  }
  return prefijo;
}

function generarIdUnico(reportes) {
  const prefijo = obtenerPrefijoDispositivo();
  const idsUsados = new Set(reportes.map((reporte) => reporte.id));
  let mayorNumero = 0;
  for (const id of idsUsados) {
    const coincidencia = new RegExp(`^MP-${prefijo}-(\\d+)$`).exec(id);
    if (coincidencia) {
      mayorNumero = Math.max(mayorNumero, Number(coincidencia[1]));
    }
  }

  let numero = mayorNumero + 1;
  let id = `MP-${prefijo}-${String(numero).padStart(3, "0")}`;
  while (idsUsados.has(id)) {
    numero += 1;
    id = `MP-${prefijo}-${String(numero).padStart(3, "0")}`;
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
  const archivo = entradaFoto.files[0] || entradaFotoCamara?.files[0];
  botonGuardarReporte.disabled = Boolean(archivo);
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
  if (reporteEnEdicionCensura) {
    if (
      !lienzoCensura.width ||
      seleccionCensura ||
      !confirmacionPrivacidadFoto.checked
    ) {
      estadoCensura.textContent =
        "Termina la selección de zonas y confirma que la foto no muestra rostros ni placas.";
      return;
    }

    try {
      const nuevaFoto = lienzoCensura.toDataURL("image/jpeg", 0.75);
      if (!nuevaFoto.startsWith("data:image/jpeg;base64,")) {
        throw new Error("El navegador no pudo exportar la foto censurada.");
      }
      const idEditado = reporteEnEdicionCensura.id;
      reporteEnEdicionCensura.foto = nuevaFoto;

      const idxIni = reportesIniciales.findIndex((r) => r.id === idEditado);
      if (idxIni !== -1) {
        reportesIniciales[idxIni].foto = nuevaFoto;
      }

      const idxLoc = reportesLocales.findIndex((r) => r.id === idEditado);
      if (idxLoc !== -1) {
        reportesLocales[idxLoc].foto = nuevaFoto;
      } else {
        reportesLocales.push({ ...reporteEnEdicionCensura, foto: nuevaFoto });
      }

      try {
        guardarReportesLocales(reportesLocales);
      } catch (err) {
        console.warn("No se pudo persistir en localStorage:", err);
      }

      publicarReportesActualizados();
      restaurarTextosEditorCensura();
      reporteEnEdicionCensura = null;
      cambiarVista("tablero");

      const actualizado = obtenerReportesActuales().find((r) => r.id === idEditado);
      if (actualizado) {
        setTimeout(() => abrirVisorFoto(actualizado), 200);
      }
      return;
    } catch (error) {
      console.error("No se pudo exportar la foto censurada.", error);
      estadoCensura.textContent = `No se pudo confirmar la foto: ${error.message}`;
      return;
    }
  }

  const archivo = entradaFoto.files[0] || entradaFotoCamara?.files[0];
  if (
    !archivo ||
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
    estadoFoto.textContent = "Foto censurada y confirmada.";
    estadoCensura.textContent = "Foto confirmada. Se guardará únicamente esta versión censurada.";
    actualizarPreviewFotoFormulario(fotoConfirmada);
    cambiarVista("captura");
  } catch (error) {
    fotoConfirmada = "";
    botonGuardarReporte.disabled = true;
    console.error("No se pudo exportar la foto censurada.", error);
    estadoCensura.textContent = `No se pudo confirmar la foto: ${error.message}`;
  }
}

function actualizarPreviewFotoFormulario(dataUrl) {
  const contenedorPreview = document.querySelector("#preview-foto-captura");
  const imgPreview = document.querySelector("#img-preview-captura");
  const contenedorAcciones = document.querySelector("#contenedor-foto-acciones");
  if (dataUrl) {
    if (imgPreview) imgPreview.src = dataUrl;
    if (contenedorPreview) contenedorPreview.classList.remove("oculto");
    if (contenedorAcciones) contenedorAcciones.classList.add("oculto");
  } else {
    if (imgPreview) imgPreview.src = "";
    if (contenedorPreview) contenedorPreview.classList.add("oculto");
    if (contenedorAcciones) contenedorAcciones.classList.remove("oculto");
  }
}

function reiniciarEditorCensura() {
  numeroCargaFoto += 1;
  fotoConfirmada = "";
  historialCensura = [];
  seleccionCensura = null;
  marcoSeleccionCensura.style.display = "none";
  confirmacionPrivacidadFoto.checked = false;
  actualizarPreviewFotoFormulario(null);
  contadorCensura.textContent = "0 zonas censuradas";
  lienzoCensura.width = 0;
  lienzoCensura.height = 0;
  botonDeshacerCensura.disabled = true;
  botonConfirmarFoto.disabled = true;
  botonGuardarReporte.disabled = false;
  estadoFoto.textContent = "No se adjuntó una foto.";
  estadoCensura.textContent = "";
}

function abrirSelectorFoto(modo = "galeria") {
  entradaFoto.value = "";
  if (entradaFotoCamara) entradaFotoCamara.value = "";
  reiniciarEditorCensura();
  cambiarVista("captura");
  if (modo === "camara" && entradaFotoCamara) {
    estadoFoto.textContent = "Abre la cámara para tomar la foto.";
    entradaFotoCamara.click();
  } else {
    estadoFoto.textContent = "Selecciona una foto de la galería para censurar.";
    entradaFoto.click();
  }
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
  const badgeEstadoDir = document.querySelector("#badge-estado-direccion");
  const btnLimpiarDir = document.querySelector("#boton-limpiar-ubicacion");

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    mostrarEstado(estadoUbicacion, "El mapa devolvió una ubicación inválida. Selecciona otro punto.");
    ubicacionSeleccionada = null;
    if (badgeEstadoDir) {
      badgeEstadoDir.textContent = "Haz clic en el mapa";
      badgeEstadoDir.className = "badge-estado-direccion";
    }
    if (btnLimpiarDir) btnLimpiarDir.classList.add("oculto");
    return;
  }

  ubicacionSeleccionada = { lat, lng };
  entradaDireccion.value = "";
  if (badgeEstadoDir) {
    badgeEstadoDir.textContent = "Buscando…";
    badgeEstadoDir.className = "badge-estado-direccion badge-estado-direccion--buscando";
  }
  if (btnLimpiarDir) btnLimpiarDir.classList.remove("oculto");
  actualizarVistaCriticidad();
  void buscarDireccion(lat, lng);
}

async function buscarDireccion(lat, lng) {
  controladorGeocodificacion?.abort();
  controladorGeocodificacion = new AbortController();
  const controlador = controladorGeocodificacion;
  const solicitud = ++numeroGeocodificacion;
  const badgeEstadoDir = document.querySelector("#badge-estado-direccion");
  mostrarEstado(estadoUbicacion, "Buscando la dirección del punto en el mapa…");

  try {
    let direccion = "";

    // 1. Intentar con Photon (Komoot)
    try {
      const url = new URL("https://photon.komoot.io/reverse");
      url.searchParams.set("lat", String(lat));
      url.searchParams.set("lon", String(lng));
      const respuesta = await fetch(url, {
        signal: controlador.signal,
        headers: { Accept: "application/json" },
      });
      if (respuesta.ok) {
        const resultado = await respuesta.json();
        const propiedades = resultado.features?.[0]?.properties;
        if (propiedades) {
          const calle = [propiedades.street, propiedades.housenumber].filter(Boolean).join(" ");
          const localidad =
            propiedades.suburb ||
            propiedades.district ||
            propiedades.locality ||
            propiedades.city;
          direccion = [calle || propiedades.name, localidad, propiedades.state]
            .filter((parte, indice, partes) => parte && partes.indexOf(parte) === indice)
            .join(", ");
        }
      }
    } catch {
      // Intentar con respaldo Nominatim
    }

    // 2. Respaldo con OpenStreetMap Nominatim si Photon no responde
    if (!direccion && !controlador.signal.aborted) {
      try {
        const urlOsm = new URL("https://nominatim.openstreetmap.org/reverse");
        urlOsm.searchParams.set("format", "jsonv2");
        urlOsm.searchParams.set("lat", String(lat));
        urlOsm.searchParams.set("lon", String(lng));
        const respuestaOsm = await fetch(urlOsm, {
          signal: controlador.signal,
          headers: { Accept: "application/json" },
        });
        if (respuestaOsm.ok) {
          const datosOsm = await respuestaOsm.json();
          if (datosOsm?.display_name) {
            direccion = datosOsm.display_name.split(",").slice(0, 3).join(",").trim();
          }
        }
      } catch {
        // Fallback silenciado
      }
    }

    if (solicitud !== numeroGeocodificacion) {
      return;
    }

    if (direccion) {
      entradaDireccion.value = direccion;
      if (ubicacionSeleccionada) {
        ubicacionSeleccionada.direccion = direccion;
      }
      actualizarVistaCriticidad();
      mostrarEstado(estadoUbicacion, `✓ Dirección identificada: ${direccion}`);
      if (badgeEstadoDir) {
        badgeEstadoDir.textContent = "✓ Ubicación fijada";
        badgeEstadoDir.className = "badge-estado-direccion badge-estado-direccion--ok";
      }
    } else {
      mostrarEstado(
        estadoUbicacion,
        "Punto marcado en el mapa. Puedes escribir o ajustar la dirección en el campo.",
      );
      if (badgeEstadoDir) {
        badgeEstadoDir.textContent = "✓ Punto en mapa";
        badgeEstadoDir.className = "badge-estado-direccion badge-estado-direccion--ok";
      }
    }
  } catch (error) {
    if (error.name === "AbortError" || solicitud !== numeroGeocodificacion) {
      return;
    }
    mostrarEstado(
      estadoUbicacion,
      "Punto marcado. Escribe la dirección en el campo.",
    );
    if (badgeEstadoDir) {
      badgeEstadoDir.textContent = "✓ Punto en mapa";
      badgeEstadoDir.className = "badge-estado-direccion badge-estado-direccion--ok";
    }
  }
}

async function buscarDireccionEnMapa(texto) {
  if (!texto || !texto.trim()) return;
  const query = texto.trim();
  mostrarEstado(estadoUbicacion, `Buscando "${query}" en Santa Marta…`);
  const badgeEstadoDir = document.querySelector("#badge-estado-direccion");
  if (badgeEstadoDir) {
    badgeEstadoDir.textContent = "Buscando…";
    badgeEstadoDir.className = "badge-estado-direccion badge-estado-direccion--buscando";
  }
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query + " Santa Marta")}&lat=11.24&lon=-74.2&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      const coords = data.features?.[0]?.geometry?.coordinates;
      if (coords && coords.length >= 2) {
        const [lng, lat] = coords;
        window.dispatchEvent(
          new CustomEvent("mapa:solicitar-ubicacion", {
            detail: { lat, lng },
          }),
        );
        return;
      }
    }
  } catch (err) {
    console.warn("Fallo geocodificación Photon:", err);
  }
  mostrarEstado(estadoUbicacion, "No se encontró el punto exacto. Toca directamente en el mapa.");
  if (badgeEstadoDir) {
    badgeEstadoDir.textContent = "Escribe o marca mapa";
    badgeEstadoDir.className = "badge-estado-direccion";
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
  const archivoFoto = entradaFoto.files[0] || entradaFotoCamara?.files[0];
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
      cuadra: "",
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
    actualizarPreviewFotoFormulario(null);
    const badgeEstadoDir = document.querySelector("#badge-estado-direccion");
    if (badgeEstadoDir) {
      badgeEstadoDir.textContent = "Haz clic en el mapa";
      badgeEstadoDir.className = "badge-estado-direccion";
    }
    document.querySelector("#boton-limpiar-ubicacion")?.classList.add("oculto");
    document.querySelectorAll(".btn-atajo-sector").forEach((b) => b.classList.remove("btn-atajo-sector--activo"));
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

  // Cada reporte se valida por separado: si uno tiene un error, se avisa cuál
  // y los demás se siguen mostrando.
  const problemas = [];
  reportesIniciales = [];
  for (const reporte of reportes) {
    try {
      reportesIniciales.push(normalizarReporte(reporte));
    } catch (error) {
      problemas.push(`${reporte?.id ?? "sin ID"} (reportes.json): ${error.message}`);
    }
  }
  const idsIniciales = new Set(reportesIniciales.map((reporte) => reporte.id));
  reportesLocales = [];
  try {
    const guardados = leerReportesLocales();
    for (const item of guardados) {
      try {
        const norm = normalizarReporte(item, false);
        const idxInicial = reportesIniciales.findIndex((r) => r.id === norm.id);
        if (idxInicial !== -1) {
          const fotoActual = reportesIniciales[idxInicial].foto;
          const fotoNorm = norm.foto && norm.foto.trim() !== "" ? norm.foto : fotoActual;
          reportesIniciales[idxInicial] = {
            ...reportesIniciales[idxInicial],
            ...norm,
            foto: fotoNorm,
          };
        } else if (!idsIniciales.has(norm.id)) {
          if (!norm.foto || norm.foto.trim() === "") {
            const numMatch = /MP-(?:[A-Z0-9]{3}-)?0*(\d+)/i.exec(norm.id || "");
            if (numMatch) {
              norm.foto = `datos/fotos/reporte${numMatch[1].padStart(2, "0")}.jpeg`;
            }
          }
          idsIniciales.add(norm.id);
          reportesLocales.push(norm);
        }
        } catch (error) {
          problemas.push(`${item?.id ?? "sin ID"} (guardado en este celular): ${error.message}`);
        }
      }
  } catch (error) {
      problemas.push(`Reportes guardados en este celular: ${error.message}`);
      reportesLocales = [];
    }

    datosListos = true;
    publicarReportesActualizados();
    actualizarVistaCriticidad();
    mostrarEstado(
      estadoUbicacion,
      "Al elegir un punto, sus coordenadas se consultarán con OpenStreetMap/Photon para obtener la dirección.",
    );
    if (problemas.length > 0) {
      const aviso = `${problemas.length} reporte(s) no se cargaron: ${problemas.join(" · ")}`;
      mostrarEstado(estadoCaptura, aviso);
      mostrarEstado(estadoTablero, aviso);
      console.error(aviso);
    } else {
      mostrarEstado(estadoCaptura, "Listo para registrar un reporte.");
    }

    try {
      const vistaGuardada = sessionStorage.getItem("santaMartaVistaActiva");
      if (vistaGuardada && ["captura", "tablero", "graficas"].includes(vistaGuardada)) {
        cambiarVista(vistaGuardada);
      } else {
        cambiarVista("captura");
      }
    } catch {
      cambiarVista("captura");
    }
  }

formulario.addEventListener("submit", guardarReporte);
  entradaFoto.addEventListener("change", () => {
    if (entradaFoto.files[0]) prepararFotoParaCensura(entradaFoto.files[0]);
  });
  if (entradaFotoCamara) {
    entradaFotoCamara.addEventListener("change", () => {
      if (entradaFotoCamara.files[0]) prepararFotoParaCensura(entradaFotoCamara.files[0]);
    });
  }
  if (botonGaleriaFoto) {
    botonGaleriaFoto.addEventListener("click", () => abrirSelectorFoto("galeria"));
  }
  botonTomarFoto.addEventListener("click", () => abrirSelectorFoto("camara"));
  botonElegirOtraFoto.addEventListener("click", () => abrirSelectorFoto("galeria"));
  if (botonTomarOtraFoto) {
    botonTomarOtraFoto.addEventListener("click", () => abrirSelectorFoto("camara"));
  }
  if (botonToggleFiltros && contenedorFiltros) {
    botonToggleFiltros.addEventListener("click", () => {
      const estaOculto = contenedorFiltros.classList.toggle("filtros--ocultos-movil");
      botonToggleFiltros.setAttribute("aria-expanded", String(!estaOculto));
      botonToggleFiltros.textContent = estaOculto ? "Mostrar filtros" : "Ocultar filtros";
    });
  }
  botonCancelarCensura.addEventListener("click", () => {
    if (reporteEnEdicionCensura) {
      restaurarTextosEditorCensura();
      const idRegreso = reporteEnEdicionCensura.id;
      reporteEnEdicionCensura = null;
      reiniciarEditorCensura();
      cambiarVista("tablero");
      const rep = obtenerReportesActuales().find((r) => r.id === idRegreso);
      if (rep) {
        setTimeout(() => abrirVisorFoto(rep), 150);
      }
      return;
    }
    entradaFoto.value = "";
    if (entradaFotoCamara) entradaFotoCamara.value = "";
    reiniciarEditorCensura();
    cambiarVista("captura");
  });
  confirmacionPrivacidadFoto.addEventListener("change", () => {
    if (!confirmacionPrivacidadFoto.checked) {
      fotoConfirmada = "";
      botonGuardarReporte.disabled = Boolean(entradaFoto.files[0] || entradaFotoCamara?.files[0]);
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
    const badgeEstadoDir = document.querySelector("#badge-estado-direccion");
    if (badgeEstadoDir) {
      badgeEstadoDir.textContent = "Haz clic en el mapa";
      badgeEstadoDir.className = "badge-estado-direccion";
    }
    botonLimpiarUbicacion.classList.add("oculto");
    document.querySelectorAll(".btn-atajo-sector").forEach((b) => b.classList.remove("btn-atajo-sector--activo"));
    actualizarVistaCriticidad();
  });

  // Atajos rápidos de sectores en el mapa
  document.querySelectorAll(".btn-atajo-sector").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lat = parseFloat(btn.dataset.sectorLat);
      const lng = parseFloat(btn.dataset.sectorLng);
      const zoom = parseInt(btn.dataset.sectorZoom, 10) || 16;
      if (!isNaN(lat) && !isNaN(lng)) {
        window.dispatchEvent(
          new CustomEvent("mapa:volar-a", {
            detail: { lat, lng, zoom },
          }),
        );
        document.querySelectorAll(".btn-atajo-sector").forEach((b) => b.classList.remove("btn-atajo-sector--activo"));
        btn.classList.add("btn-atajo-sector--activo");
      }
    });
  });

  // Búsqueda de dirección con botón o Enter
  const botonBuscarDir = document.querySelector("#boton-buscar-direccion");
  if (botonBuscarDir) {
    botonBuscarDir.addEventListener("click", () => {
      buscarDireccionEnMapa(entradaDireccion.value);
    });
  }
  entradaDireccion.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      buscarDireccionEnMapa(entradaDireccion.value);
    }
  });

  // Gestión de preview de foto en el formulario
  const btnEliminarPreview = document.querySelector("#boton-eliminar-foto-preview");
  if (btnEliminarPreview) {
    btnEliminarPreview.addEventListener("click", () => {
      fotoConfirmada = "";
      entradaFoto.value = "";
      if (entradaFotoCamara) entradaFotoCamara.value = "";
      reiniciarEditorCensura();
      actualizarPreviewFotoFormulario(null);
      mostrarEstado(estadoFoto, "Foto eliminada. Puedes adjuntar otra si deseas.");
    });
  }

  const btnReeditarCensura = document.querySelector("#boton-reeditar-censura");
  if (btnReeditarCensura) {
    btnReeditarCensura.addEventListener("click", () => {
      if (fotoConfirmada) {
        cambiarVista("censura");
      }
    });
  }
  botonVistaCaptura.addEventListener("click", () => cambiarVista("captura"));
  botonVistaTablero.addEventListener("click", () => cambiarVista("tablero"));
  botonVistaGraficas.addEventListener("click", () => cambiarVista("graficas"));
  if (botonNavMovilCaptura) botonNavMovilCaptura.addEventListener("click", () => cambiarVista("captura"));
  if (botonNavMovilTablero) botonNavMovilTablero.addEventListener("click", () => cambiarVista("tablero"));
  if (botonNavMovilGraficas) botonNavMovilGraficas.addEventListener("click", () => cambiarVista("graficas"));
  window.addEventListener("resize", () => {
    window.dispatchEvent(new Event("captura:activar"));
    window.dispatchEvent(new Event("tablero:activar"));
  });
  botonNuevoReporte.addEventListener("click", () => cambiarVista("captura"));
  botonGraficasNuevoReporte.addEventListener("click", () => cambiarVista("captura"));
  botonGraficasVerTablero.addEventListener("click", () => cambiarVista("tablero"));
  for (const control of Object.values(controlesFiltros)) {
    control.addEventListener("change", actualizarTablero);
    control.addEventListener("input", actualizarTablero);
  }
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

  // Soporte para Visor Modal de Fotos de Infracción
  const modalVisor = document.getElementById("modal-visor-foto");
  if (modalVisor) {
    const btnCerrar = document.getElementById("btn-cerrar-modal-foto");
    if (btnCerrar) {
      btnCerrar.addEventListener("click", cerrarVisorFoto);
    }
    modalVisor.addEventListener("click", (e) => {
      // Si se hace clic en el backdrop fuera de la tarjeta
      if (e.target === modalVisor) {
        cerrarVisorFoto();
      }
    });
  }
  window.addEventListener("foto:abrir-visor", (e) => {
    if (e.detail?.reporte) {
      abrirVisorFoto(e.detail.reporte);
    }
  });

  inicializarTema();
  botonTema.addEventListener("click", () => {
    aplicarTema(document.documentElement.dataset.tema === "oscuro" ? "claro" : "oscuro", true);
  });

  inicializar().catch((error) => {
    const aviso = `No se pudieron cargar los datos. ${error.message}`;
    mostrarEstado(estadoCaptura, aviso);
    mostrarEstado(estadoTablero, aviso);
    console.error(error);
  });
