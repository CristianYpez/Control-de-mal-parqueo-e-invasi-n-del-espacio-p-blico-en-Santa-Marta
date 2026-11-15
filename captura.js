import { calcularCriticidad } from "./criticidad.js?v=5";
import { filtrarReportes } from "./filtros.js?v=5";
import { resumirPorCuadra } from "./resumen.js?v=5";
import { estaDentroDelPerimetro } from "./mapa.js?v=5";

const CLAVE_ALMACENAMIENTO = "santaMartaReportesV1";
const formulario = document.querySelector("#formulario-reporte");
const selectorCuadra = document.querySelector("#reporte-cuadra");
const opcionesCuadras = document.querySelector("#opciones-cuadras");
const opcionesCuadrasFiltro = document.querySelector("#opciones-cuadras-filtro");
const entradaFoto = document.querySelector("#reporte-foto");
const editorCensura = document.querySelector("#editor-censura");
const lienzoCensura = document.querySelector("#canvas-censura");
const marcoSeleccionCensura = document.querySelector("#marco-seleccion-censura");
const botonDeshacerCensura = document.querySelector("#boton-deshacer-censura");
const botonConfirmarFoto = document.querySelector("#boton-confirmar-foto");
const botonGuardarReporte = document.querySelector("#boton-guardar-reporte");
const estadoCensura = document.querySelector("#estado-censura");
const estadoCaptura = document.querySelector("#estado-captura");
const estadoUbicacion = document.querySelector("#estado-ubicacion");
const botonGeolocalizacion = document.querySelector("#boton-geolocalizacion");
const botonLimpiarUbicacion = document.querySelector("#boton-limpiar-ubicacion");
const botonVistaCaptura = document.querySelector("#boton-vista-captura");
const botonVistaTablero = document.querySelector("#boton-vista-tablero");
const botonVistaInfracciones = document.querySelector("#boton-vista-infracciones");
const vistaCaptura = document.querySelector("#vista-captura");
const vistaTablero = document.querySelector("#vista-tablero");
const vistaInfracciones = document.querySelector("#vista-infracciones");
const estadoTablero = document.querySelector("#estado-tablero");
const listaResumen = document.querySelector("#lista-resumen");
const listaInfracciones = document.querySelector("#lista-infracciones");
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
  doble_fila: "Vehículo en doble fila",
  bloqueo_rampa_cebra_paradero: "Bloqueo de rampa, cebra o paradero",
  invasion_anden: "Invasión del andén",
};
const nombresActores = {
  vehiculo_particular: "Vehículo particular",
  motocicleta: "Motocicleta",
  vehiculo_carga: "Vehículo de carga",
  mobiliario_comercial: "Mobiliario comercial",
};
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
  if (reporte.direccion !== undefined && typeof reporte.direccion !== "string") {
    throw new Error(`La dirección del reporte ${reporte.id} debe ser texto.`);
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
  renderizarInfracciones(obtenerReportesActuales());
}

function cargarOpcionesCuadra() {
  for (const via of vias) {
    const opcionCaptura = document.createElement("option");
    opcionCaptura.value = via.id;
    opcionesCuadras.append(opcionCaptura);

    const opcionFiltro = document.createElement("option");
    opcionFiltro.value = via.id;
    opcionesCuadrasFiltro.append(opcionFiltro);
  }
}

function cambiarVista(nombreVista) {
  const mostrarCaptura = nombreVista === "captura";
  const mostrarTablero = nombreVista === "tablero";
  const mostrarInfracciones = nombreVista === "infracciones";
  vistaCaptura.hidden = !mostrarCaptura;
  vistaTablero.hidden = !mostrarTablero;
  vistaInfracciones.hidden = !mostrarInfracciones;
  botonVistaCaptura.setAttribute("aria-pressed", String(mostrarCaptura));
  botonVistaTablero.setAttribute("aria-pressed", String(mostrarTablero));
  botonVistaInfracciones.setAttribute("aria-pressed", String(mostrarInfracciones));

  if (mostrarCaptura) {
    window.dispatchEvent(new Event("tablero:desactivar"));
    window.dispatchEvent(new Event("captura:activar"));
  } else if (mostrarTablero) {
    window.dispatchEvent(new Event("tablero:activar"));
  } else if (mostrarInfracciones) {
    window.dispatchEvent(new Event("tablero:desactivar"));
    window.dispatchEvent(new Event("infracciones:activar"));
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

function agregarDetalleInfraccion(contenedor, etiqueta, valor) {
  const nombre = document.createElement("dt");
  nombre.textContent = etiqueta;
  const detalle = document.createElement("dd");
  detalle.textContent = valor;
  contenedor.append(nombre, detalle);
}

function agregarFotoInfraccion(tarjeta, reporte) {
  const figura = document.createElement("figure");
  figura.className = "foto-infraccion";
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

function renderizarInfracciones(reportes) {
  listaInfracciones.replaceChildren();

  if (reportes.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.className = "ayuda";
    mensaje.textContent = "Todavía no hay infracciones para mostrar.";
    listaInfracciones.append(mensaje);
    return;
  }

  const reportesRecientes = [...reportes].sort((primero, segundo) =>
    segundo.fecha_hora.localeCompare(primero.fecha_hora),
  );
  for (const reporte of reportesRecientes) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta-infraccion";

    const titulo = document.createElement("h3");
    titulo.textContent = `${reporte.id} · ${reporte.criticidad.nivel}`;
    tarjeta.append(titulo);

    const detalles = document.createElement("dl");
    detalles.className = "detalle-infraccion";
    agregarDetalleInfraccion(
      detalles,
      "Dirección",
      reporte.direccion || "Sin dirección específica",
    );
    agregarDetalleInfraccion(detalles, "Cuadra", reporte.cuadra);
    agregarDetalleInfraccion(detalles, "Actor", nombresActores[reporte.actor] ?? reporte.actor);
    agregarDetalleInfraccion(
      detalles,
      "Situación",
      nombresCategorias[reporte.categoria] ?? reporte.categoria,
    );
    agregarDetalleInfraccion(
      detalles,
      "Criticidad",
      `${reporte.criticidad.nivel} (${reporte.criticidad.puntaje} puntos)`,
    );
    agregarDetalleInfraccion(
      detalles,
      "Origen",
      reporte.origen === "ciudadano" ? "Ciudadano" : "Campo",
    );
    agregarDetalleInfraccion(
      detalles,
      "Coordenadas",
      `${reporte.lat.toFixed(5)}, ${reporte.lng.toFixed(5)}`,
    );
    agregarDetalleInfraccion(
      detalles,
      "Fecha",
      reporte.fecha_hora.replace("T", " · "),
    );
    tarjeta.append(detalles);
    agregarFotoInfraccion(tarjeta, reporte);

    const botonUbicacion = document.createElement("button");
    botonUbicacion.type = "button";
    botonUbicacion.textContent = "Ver en el mapa";
    botonUbicacion.addEventListener("click", () => {
      window.dispatchEvent(
        new CustomEvent("infraccion:ver-en-mapa", {
          detail: { id: reporte.id },
        }),
      );
    });
    tarjeta.append(botonUbicacion);
    listaInfracciones.append(tarjeta);
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
  marcoSeleccionCensura.style.display = "none";
  botonDeshacerCensura.disabled = true;
  botonConfirmarFoto.disabled = true;
  lienzoCensura.width = 0;
  lienzoCensura.height = 0;

  if (!archivo) {
    editorCensura.hidden = true;
    botonGuardarReporte.disabled = false;
    estadoCensura.textContent = "";
    return;
  }

  editorCensura.hidden = false;
  botonGuardarReporte.disabled = true;
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

    botonConfirmarFoto.disabled = false;
    estadoCensura.textContent =
      "Arrastra sobre cada rostro, placa o dato personal. Confirma la foto cuando hayas terminado.";
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
  botonConfirmarFoto.disabled = false;

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
    botonDeshacerCensura.disabled = false;
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
  botonConfirmarFoto.disabled = false;
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
    botonConfirmarFoto.disabled = false;
    botonDeshacerCensura.disabled = historialCensura.length === 0;
    estadoCensura.textContent = "Se deshizo la última censura. Confirma la foto antes de guardar.";
  } catch (error) {
    historialCensura.push(ultimaCensura);
    console.error("No se pudo deshacer la censura.", error);
    estadoCensura.textContent = `No se pudo deshacer la censura: ${error.message}`;
  }
}

function confirmarFotoCensurada() {
  if (!entradaFoto.files[0] || !lienzoCensura.width || seleccionCensura) {
    estadoCensura.textContent = "Carga una foto y termina cualquier selección antes de confirmar.";
    return;
  }

  try {
    fotoConfirmada = lienzoCensura.toDataURL("image/jpeg", 0.7);
    if (!fotoConfirmada.startsWith("data:image/jpeg;base64,")) {
      throw new Error("El navegador no pudo exportar la foto censurada.");
    }
    botonGuardarReporte.disabled = false;
    estadoCensura.textContent = "Foto confirmada. Se guardará únicamente esta versión censurada.";
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
  lienzoCensura.width = 0;
  lienzoCensura.height = 0;
  editorCensura.hidden = true;
  botonDeshacerCensura.disabled = true;
  botonConfirmarFoto.disabled = true;
  botonGuardarReporte.disabled = false;
  estadoCensura.textContent = "";
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

function guardarReporte(evento) {
  evento.preventDefault();
  mostrarEstado(estadoCaptura, "");

  if (!formulario.reportValidity()) {
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

  const datos = new FormData(formulario);
  if (!vias.some((via) => via.id === datos.get("cuadra"))) {
    mostrarEstado(estadoCaptura, "Selecciona una cuadra disponible en las sugerencias.");
    selectorCuadra.focus();
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
      cuadra: datos.get("cuadra"),
      direccion: datos.get("direccion"),
      categoria: datos.get("categoria"),
      actor: datos.get("actor"),
      foto: archivoFoto ? fotoConfirmada : "",
    });

    const nuevosReportesLocales = [...reportesLocales, reporte];
    guardarReportesLocales(nuevosReportesLocales);
    reportesLocales = nuevosReportesLocales;
    publicarReportesActualizados();
    formulario.reset();
    reiniciarEditorCensura();
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
entradaFoto.addEventListener("change", () => prepararFotoParaCensura(entradaFoto.files[0]));
lienzoCensura.addEventListener("pointerdown", manejarInicioSeleccion);
lienzoCensura.addEventListener("pointermove", manejarMovimientoSeleccion);
lienzoCensura.addEventListener("pointerup", manejarFinSeleccion);
lienzoCensura.addEventListener("pointercancel", manejarCancelacionSeleccion);
botonDeshacerCensura.addEventListener("click", deshacerCensura);
botonConfirmarFoto.addEventListener("click", confirmarFotoCensurada);
botonGeolocalizacion.addEventListener("click", pedirGeolocalizacion);
botonLimpiarUbicacion.addEventListener("click", () => {
  ubicacionSeleccionada = null;
  window.dispatchEvent(new Event("mapa:limpiar-seleccion"));
  mostrarEstado(estadoUbicacion, "Toca el mapa o usa tu ubicación.");
});
botonVistaCaptura.addEventListener("click", () => cambiarVista("captura"));
botonVistaTablero.addEventListener("click", () => cambiarVista("tablero"));
botonVistaInfracciones.addEventListener("click", () => cambiarVista("infracciones"));
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
