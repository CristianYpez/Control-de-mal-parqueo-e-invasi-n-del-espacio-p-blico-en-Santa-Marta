import { calcularCriticidad } from "./criticidad.js";
import { filtrarReportes } from "./filtros.js";
import { resumirPorCuadra } from "./resumen.js";
import { estaDentroDelPerimetro } from "./mapa.js";

const CLAVE_ALMACENAMIENTO = "santaMartaReportesV1";
const formulario = document.querySelector("#formulario-reporte");
const selectorCuadra = document.querySelector("#reporte-cuadra");
const entradaFoto = document.querySelector("#reporte-foto");
const estadoCaptura = document.querySelector("#estado-captura");
const estadoUbicacion = document.querySelector("#estado-ubicacion");
const botonGeolocalizacion = document.querySelector("#boton-geolocalizacion");
const botonLimpiarUbicacion = document.querySelector("#boton-limpiar-ubicacion");
const botonVistaCaptura = document.querySelector("#boton-vista-captura");
const botonVistaTablero = document.querySelector("#boton-vista-tablero");
const vistaCaptura = document.querySelector("#vista-captura");
const vistaTablero = document.querySelector("#vista-tablero");
const estadoTablero = document.querySelector("#estado-tablero");
const listaResumen = document.querySelector("#lista-resumen");
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

function normalizarReporte(reporte) {
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
  if (!estaDentroDelPerimetro(reporte.lat, reporte.lng)) {
    throw new Error(`El reporte ${reporte.id} está fuera del perímetro urbano aproximado.`);
  }

  const criticidad = calcularCriticidad(reporte, vias, criterios);
  return {
    id: reporte.id,
    origen: reporte.origen,
    fecha_hora: reporte.fecha_hora,
    lat: reporte.lat,
    lng: reporte.lng,
    cuadra: reporte.cuadra,
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

function publicarReportesActualizados() {
  window.dispatchEvent(
    new CustomEvent("reportes:actualizados", {
      detail: {
        reportes: obtenerReportesActuales(),
        vias,
        criterios,
      },
    }),
  );
  actualizarTablero();
}

function cargarOpcionesCuadra() {
  for (const via of vias) {
    const opcionCaptura = document.createElement("option");
    opcionCaptura.value = via.id;
    opcionCaptura.textContent = via.id;
    selectorCuadra.append(opcionCaptura);

    const opcionFiltro = document.createElement("option");
    opcionFiltro.value = via.id;
    opcionFiltro.textContent = via.id;
    document.querySelector("#filtro-cuadra").append(opcionFiltro);
  }
}

function cambiarVista(nombreVista) {
  const mostrarCaptura = nombreVista === "captura";
  vistaCaptura.hidden = !mostrarCaptura;
  vistaTablero.hidden = mostrarCaptura;
  botonVistaCaptura.setAttribute("aria-pressed", String(mostrarCaptura));
  botonVistaTablero.setAttribute("aria-pressed", String(!mostrarCaptura));

  if (!mostrarCaptura) {
    window.dispatchEvent(new Event("tablero:activar"));
  }
}

function obtenerFiltrosActivos() {
  return Object.fromEntries(
    Object.entries(controlesFiltros).map(([nombre, control]) => [nombre, control.value]),
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

  for (const prioridad of resumen) {
    const elemento = document.createElement("li");
    const titulo = document.createElement("strong");
    titulo.textContent = prioridad.cuadra;
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
    listaResumen.append(elemento);
  }
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

function leerArchivoComoDataURL(archivo) {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.addEventListener("load", () => resolver(lector.result));
    lector.addEventListener("error", () => rechazar(new Error("No se pudo leer la foto seleccionada.")));
    lector.readAsDataURL(archivo);
  });
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

async function reducirFoto(archivo) {
  if (!archivo) {
    return "";
  }
  if (!archivo.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const imagen = await cargarImagenDesdeArchivo(archivo);
  const ancho = Math.min(imagen.naturalWidth, 800);
  const alto = Math.max(1, Math.round((imagen.naturalHeight * ancho) / imagen.naturalWidth));
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;

  const contexto = lienzo.getContext("2d");
  if (!contexto) {
    throw new Error("El navegador no pudo preparar la reducción de la foto.");
  }
  contexto.fillStyle = "#ffffff";
  contexto.fillRect(0, 0, ancho, alto);
  contexto.drawImage(imagen, 0, 0, ancho, alto);

  const fotoReducida = await new Promise((resolver, rechazar) => {
    lienzo.toBlob(
      (blob) => {
        if (!blob) {
          rechazar(new Error("No se pudo comprimir la foto."));
          return;
        }
        resolver(blob);
      },
      "image/jpeg",
      0.78,
    );
  });
  return leerArchivoComoDataURL(fotoReducida);
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
  mostrarEstado(estadoUbicacion, `Ubicación seleccionada: ${lat.toFixed(5)}, ${lng.toFixed(5)}.`);
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

async function guardarReporte(evento) {
  evento.preventDefault();
  mostrarEstado(estadoCaptura, "");

  if (!formulario.reportValidity()) {
    return;
  }
  if (!ubicacionSeleccionada) {
    mostrarEstado(estadoCaptura, "Marca una ubicación válida en el mapa antes de guardar.");
    return;
  }

  const datos = new FormData(formulario);
  try {
    const reportesActuales = obtenerReportesActuales();
    const foto = await reducirFoto(entradaFoto.files[0]);
    const reporte = normalizarReporte({
      id: generarIdUnico(reportesActuales),
      origen: "ciudadano",
      fecha_hora: formatearFechaHoraLocal(new Date()),
      lat: ubicacionSeleccionada.lat,
      lng: ubicacionSeleccionada.lng,
      cuadra: datos.get("cuadra"),
      categoria: datos.get("categoria"),
      actor: datos.get("actor"),
      foto,
    });

    const nuevosReportesLocales = [...reportesLocales, reporte];
    guardarReportesLocales(nuevosReportesLocales);
    reportesLocales = nuevosReportesLocales;
    publicarReportesActualizados();
    formulario.reset();
    ubicacionSeleccionada = null;
    window.dispatchEvent(new Event("mapa:limpiar-seleccion"));
    mostrarEstado(estadoUbicacion, "Toca el mapa o usa tu ubicación.");
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
  reportesIniciales = reportes.map(normalizarReporte);
  const idsIniciales = new Set(reportesIniciales.map((reporte) => reporte.id));
  reportesLocales = leerReportesLocales().map((reporte) => {
    const reporteNormalizado = normalizarReporte(reporte);
    if (idsIniciales.has(reporteNormalizado.id)) {
      throw new Error(`El ID ${reporteNormalizado.id} ya existe en los datos de ejemplo.`);
    }
    idsIniciales.add(reporteNormalizado.id);
    return reporteNormalizado;
  });

  cargarOpcionesCuadra();
  datosListos = true;
  publicarReportesActualizados();
  mostrarEstado(estadoUbicacion, "Toca el mapa o usa tu ubicación dentro del perímetro aproximado (no oficial).");
  mostrarEstado(estadoCaptura, "Listo para registrar un reporte.");
}

formulario.addEventListener("submit", guardarReporte);
botonGeolocalizacion.addEventListener("click", pedirGeolocalizacion);
botonLimpiarUbicacion.addEventListener("click", () => {
  ubicacionSeleccionada = null;
  window.dispatchEvent(new Event("mapa:limpiar-seleccion"));
  mostrarEstado(estadoUbicacion, "Toca el mapa o usa tu ubicación.");
});
botonVistaCaptura.addEventListener("click", () => cambiarVista("captura"));
botonVistaTablero.addEventListener("click", () => cambiarVista("tablero"));
for (const control of Object.values(controlesFiltros)) {
  control.addEventListener("change", actualizarTablero);
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
  mostrarEstado(estadoUbicacion, detail?.mensaje ?? "La ubicación está fuera del área permitida.");
});

inicializar().catch((error) => {
  mostrarEstado(estadoCaptura, `No se pudo iniciar la captura: ${error.message}`);
  console.error(error);
});
