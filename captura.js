import { calcularCriticidad } from "./criticidad.js";

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

let vias = [];
let criterios = null;
let reportesIniciales = [];
let reportesLocales = [];
let ubicacionSeleccionada = null;

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
    const reporte = {
      id: generarIdUnico(reportesActuales),
      origen: "ciudadano",
      fecha_hora: formatearFechaHoraLocal(new Date()),
      lat: ubicacionSeleccionada.lat,
      lng: ubicacionSeleccionada.lng,
      cuadra: datos.get("cuadra"),
      categoria: datos.get("categoria"),
      actor: datos.get("actor"),
      foto,
    };
    reporte.criticidad = calcularCriticidad(reporte, vias, criterios);

    const nuevosReportesLocales = [...reportesLocales, reporte];
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(nuevosReportesLocales));
    reportesLocales = nuevosReportesLocales;
    publicarReportesActualizados();
    formulario.reset();
    ubicacionSeleccionada = null;
    window.dispatchEvent(new Event("mapa:limpiar-seleccion"));
    mostrarEstado(estadoUbicacion, "Toca el mapa o usa tu ubicación.");
    mostrarEstado(estadoCaptura, `Reporte ${reporte.id} guardado en este dispositivo.`);
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      mostrarEstado(estadoCaptura, mensajeErrorAlmacenamiento(error));
      return;
    }
    if (error instanceof DOMException && error.name === "NS_ERROR_DOM_QUOTA_REACHED") {
      mostrarEstado(estadoCaptura, mensajeErrorAlmacenamiento(error));
      return;
    }
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
  reportesIniciales = reportes.map((reporte) => ({
    ...reporte,
    criticidad: calcularCriticidad(reporte, vias, criterios),
  }));
  reportesLocales = leerReportesLocales().map((reporte) => ({
    ...reporte,
    criticidad: calcularCriticidad(reporte, vias, criterios),
  }));

  cargarOpcionesCuadra();
  publicarReportesActualizados();
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
