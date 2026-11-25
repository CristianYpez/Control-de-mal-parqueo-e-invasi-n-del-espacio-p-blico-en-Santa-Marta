const CENTRO_SANTA_MARTA = [11.205, -74.17];
const NIVEL_ZOOM_INICIAL = 11;

// Perímetro aproximado de cobertura urbana unificado (incluye corredor hacia Bonda y extensión a El Cisne).
const PERIMETRO_APROXIMADO = [
  [11.184, -74.145],
  [11.174, -74.139],
  [11.163, -74.132],
  [11.15, -74.13],
  [11.14, -74.138],
  [11.148, -74.153],
  [11.16, -74.17],
  [11.178, -74.19],
  [11.2, -74.21],
  [11.195, -74.207],
  [11.18, -74.205],
  [11.16, -74.203],
  [11.14, -74.203],
  [11.12, -74.209],
  [11.118, -74.231],
  [11.13, -74.248],
  [11.15, -74.252],
  [11.174, -74.251],
  [11.198, -74.246],
  [11.218, -74.238],
  [11.229, -74.237],
  [11.249, -74.238],
  [11.266, -74.219],
  [11.267, -74.188],
  [11.252, -74.172],
  [11.251, -74.158],
  [11.246, -74.146],
  [11.239, -74.137],
  [11.238, -74.13],
  [11.238, -74.1248],
  [11.241, -74.115],
  [11.241, -74.107],
  [11.232, -74.101],
  [11.222, -74.102],
  [11.214, -74.112],
  [11.208, -74.126],
  [11.207, -74.142],
  [11.2, -74.143],
  [11.192, -74.144],
];

const mapaCapturaElemento = document.querySelector("#mapa-captura");
const mapaTableroElemento = document.querySelector("#mapa-tablero");
const estadoTablero = document.querySelector("#estado-tablero");
const estadoUbicacion = document.querySelector("#estado-ubicacion");
const resumenPeriodoMapa = document.querySelector("#resumen-periodo-mapa");
const controlesCapas = [...document.querySelectorAll('input[name="capa-mapa"]')];
const botonesModoCapas = {
  una: document.querySelector("#modo-capas-una"),
  combinar: document.querySelector("#modo-capas-combinar"),
};
const controlesTiempo = [...document.querySelectorAll("[data-periodo-mapa]")];
const controlesCalor = {
  sensibilidad: document.querySelector("#sensibilidad-calor"),
  radio: document.querySelector("#radio-calor"),
  desenfoque: document.querySelector("#desenfoque-calor"),
  paleta: document.querySelector("#paleta-calor"),
};
const valoresCalor = {
  sensibilidad: document.querySelector("#valor-sensibilidad"),
  radio: document.querySelector("#valor-radio"),
  desenfoque: document.querySelector("#valor-desenfoque"),
};

let mapaCaptura;
let mapaTablero;
let marcadorUbicacion;
let capaCalor;
let capaPuntos;
let capaCeldas;
let reportesValidos = [];
let reportesDelTablero = [];
let reportesDelPeriodo = [];
let reportesEnMapa = [];
let reportesFueraDelArea = 0;
let tableroActivo = false;
let periodoSeleccionado = "todo";
let capasSeleccionadas = new Set(["calor"]);
let paletaSeleccionada = "serena";

const PALETAS_CALOR = {
  serena: ["#fff9c4", "#ffee58", "#ffb300", "#f4511e", "#7f0000"],
  termica: ["#2166ac", "#00bcd4", "#4caf50", "#ffeb3b", "#ff9800", "#e53935"],
};

// Servidor de mapas OpenStreetMap (100% libre, sin requerir API Key ni presentar marcas de agua)
const URL_OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

let capaBaseCaptura;
let capaBaseTablero;
let capaCalorCaptura;

function puntoEnSegmento(latitud, longitud, inicio, fin) {
  const productoCruzado =
    (longitud - inicio[1]) * (fin[0] - inicio[0]) -
    (latitud - inicio[0]) * (fin[1] - inicio[1]);
  if (Math.abs(productoCruzado) > 1e-10) {
    return false;
  }

  return (
    longitud >= Math.min(inicio[1], fin[1]) - 1e-10 &&
    longitud <= Math.max(inicio[1], fin[1]) + 1e-10 &&
    latitud >= Math.min(inicio[0], fin[0]) - 1e-10 &&
    latitud <= Math.max(inicio[0], fin[0]) + 1e-10
  );
}

function estaDentroDelPerimetro(latitud, longitud) {
  if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
    return false;
  }

  let dentro = false;
  for (let indice = 0, anterior = PERIMETRO_APROXIMADO.length - 1;
    indice < PERIMETRO_APROXIMADO.length;
    anterior = indice, indice += 1) {
    const inicio = PERIMETRO_APROXIMADO[anterior];
    const fin = PERIMETRO_APROXIMADO[indice];

    if (puntoEnSegmento(latitud, longitud, inicio, fin)) {
      return true;
    }

    const cruzaLatitud = (fin[0] > latitud) !== (inicio[0] > latitud);
    const longitudCruce =
      ((inicio[1] - fin[1]) * (latitud - fin[0])) / (inicio[0] - fin[0]) + fin[1];
    if (cruzaLatitud && longitud < longitudCruce) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function notificarUbicacionRechazada() {
  window.dispatchEvent(
    new CustomEvent("mapa:ubicacion-rechazada", {
      detail: {
        mensaje: "El punto está fuera del perímetro aproximado del área de cobertura.",
      },
    }),
  );
}

function seleccionarUbicacion(latitud, longitud, centrarMapa = false) {
  if (!estaDentroDelPerimetro(latitud, longitud)) {
    marcadorUbicacion?.remove();
    marcadorUbicacion = null;
    notificarUbicacionRechazada();
    return;
  }

  const ubicacion = [latitud, longitud];
  if (marcadorUbicacion) {
    marcadorUbicacion.setLatLng(ubicacion);
  } else {
    marcadorUbicacion = L.marker(ubicacion).addTo(mapaCaptura);
  }

  if (centrarMapa) {
    mapaCaptura.setView(ubicacion, 16);
  }
  window.dispatchEvent(
    new CustomEvent("mapa:ubicacion-seleccionada", {
      detail: { lat: latitud, lng: longitud },
    }),
  );
}

function crearMapa(elemento, opciones = {}) {
  const mapa = L.map(elemento, {
    zoomControl: true,
    ...opciones,
  }).setView(CENTRO_SANTA_MARTA, NIVEL_ZOOM_INICIAL);

  const capaBase = L.tileLayer(URL_OSM, {
    maxZoom: 19,
    attribution: ATRIBUCION_OSM,
  });
  capaBase.addTo(mapa);

  L.polygon(PERIMETRO_APROXIMADO, {
    color: "#2DD4BF",
    weight: 2,
    dashArray: "6 5",
    fillColor: "#2DD4BF",
    fillOpacity: 0.05,
  }).addTo(mapa);

  return { mapa, capaBase };
}

function actualizarCalorCaptura(reportes) {
  if (!mapaCaptura || typeof window.L?.heatLayer !== "function") return;
  const puntos = reportes
    .filter((r) => estaDentroDelPerimetro(r.lat, r.lng))
    .map((r) => [r.lat, r.lng, 0.65]);
  if (!capaCalorCaptura) {
    capaCalorCaptura = L.heatLayer(puntos, {
      radius: 34,
      blur: 24,
      minOpacity: 0.35,
      max: 5,
    }).addTo(mapaCaptura);
  } else {
    capaCalorCaptura.setLatLngs(puntos);
  }
}

function mostrarEstadoMapa(elemento, mensaje) {
  if (elemento === mapaCapturaElemento) {
    estadoUbicacion.textContent = mensaje;
  } else {
    estadoTablero.textContent = mensaje;
  }
}

function crearCapaCalor() {
  return L.heatLayer([], {
    radius: 38,
    blur: 26,
    minOpacity: 0.35,
    max: 6,
    maxZoom: 11,
    gradient: {
      0.05: "#fff9c4",
      0.28: "#efdb23",
      0.52: "#f3aa00",
      0.76: "#ec4a19",
      1: "#780000",
    },
  });
}

function obtenerFuenteFoto(foto) {
  if (typeof foto !== "string" || !foto) {
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
    // Si no es URL parseable, retornar limpia
  }
  return limpia;
}

function agregarFotoCensuradaAlPopup(contenido, reporte) {
  if (!reporte.foto) {
    return;
  }

  const figura = document.createElement("figure");
  figura.className = "popup-foto-contenedor";
  figura.style.margin = "8px 0 0";
  figura.style.position = "relative";
  figura.style.cursor = "pointer";
  figura.style.borderRadius = "8px";
  figura.style.overflow = "hidden";
  figura.style.border = "1px solid var(--border-subtle, rgba(255,255,255,0.15))";
  figura.tabIndex = 0;
  figura.setAttribute("role", "button");
  figura.setAttribute("aria-label", `Ampliar foto del reporte ${reporte.id}`);
  figura.title = "Haz clic para ver la foto ampliada con todos los detalles";

  const fuente = obtenerFuenteFoto(reporte.foto);
  if (!fuente) {
    const aviso = document.createElement("figcaption");
    aviso.textContent = "La foto no se puede mostrar porque su formato o ruta no es válido.";
    figura.append(aviso);
    contenido.append(figura);
    return;
  }

  const imagen = document.createElement("img");
  imagen.alt = `Foto censurada del reporte ${reporte.id}`;
  imagen.loading = "lazy";
  imagen.referrerPolicy = "no-referrer";
  imagen.style.display = "block";
  imagen.style.width = "100%";
  imagen.style.maxWidth = "240px";
  imagen.style.maxHeight = "160px";
  imagen.style.objectFit = "cover";
  imagen.addEventListener("error", () => {
    figura.replaceChildren();
    const aviso = document.createElement("figcaption");
    aviso.textContent = "No se pudo cargar la foto censurada.";
    figura.append(aviso);
  });
  imagen.src = fuente;

  const overlay = document.createElement("div");
  overlay.className = "popup-foto-overlay";
  overlay.innerHTML = `
    <span style="display:inline-flex;align-items:center;gap:4px;background:rgba(15,23,42,0.85);color:#F1F5F9;padding:3px 8px;border-radius:999px;font-size:0.7rem;font-weight:600;backdrop-filter:blur(4px);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
      Ampliar foto
    </span>
  `;
  overlay.style.position = "absolute";
  overlay.style.bottom = "6px";
  overlay.style.right = "6px";
  overlay.style.pointerEvents = "none";

  figura.append(imagen, overlay);

  const accionar = (e) => {
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("foto:abrir-visor", {
        detail: { reporte },
      }),
    );
  };

  figura.addEventListener("click", accionar);
  figura.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      accionar(e);
    }
  });

  contenido.append(figura);
}

function crearContenidoPopup(reporte) {
  const contenido = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = reporte.id;
  contenido.append(titulo);

  const detalles = [
    `Dirección: ${reporte.direccion?.trim() || `Cuadra ${reporte.cuadra}`}`,
    `Cuadra: ${reporte.cuadra}`,
    `Situación: ${reporte.categoria}`,
    `Tipo de actor: ${reporte.actor}`,
    `Criticidad: ${reporte.criticidad.nivel} (${reporte.criticidad.puntaje})`,
    `Fecha y hora: ${reporte.fecha_hora}`,
  ];
  for (const detalle of detalles) {
    const linea = document.createElement("div");
    linea.textContent = detalle;
    contenido.append(linea);
  }
  agregarFotoCensuradaAlPopup(contenido, reporte);
  return contenido;
}

function obtenerPesoCriticidad(reporte) {
  const nivel = reporte.criticidad.nivel.toLowerCase();
  return nivel === "alto" ? 3 : nivel === "medio" ? 2 : 1;
}

// Interpola entre los colores de la paleta para una intensidad relativa.
function colorEn(intensidad) {
  const colores = PALETAS_CALOR[paletaSeleccionada];
  const posicion = Math.max(0, Math.min(1, intensidad)) * (colores.length - 1);
  const indice = Math.min(Math.floor(posicion), colores.length - 2);
  const fraccion = posicion - indice;
  const inicio = colores[indice].match(/[a-f\d]{2}/gi).map((parte) => Number.parseInt(parte, 16));
  const fin = colores[indice + 1].match(/[a-f\d]{2}/gi).map((parte) => Number.parseInt(parte, 16));
  const canales = inicio.map((canal, posicionCanal) =>
    Math.round(canal + (fin[posicionCanal] - canal) * fraccion),
  );
  return `#${canales.map((canal) => canal.toString(16).padStart(2, "0")).join("")}`;
}

// Reconstruye las celdas según el peso de criticidad y el conteo sin ponderar.
function dibujarCeldas() {
  capaCeldas.clearLayers();
  if (reportesEnMapa.length === 0) {
    return;
  }

  const tamanoCelda = 0.003;
  const celdas = new Map();
  for (const reporte of reportesEnMapa) {
    const fila = Math.floor(reporte.lat / tamanoCelda);
    const columna = Math.floor(reporte.lng / tamanoCelda);
    const clave = `${fila}:${columna}`;
    const celda = celdas.get(clave) ?? {
      fila,
      columna,
      cantidad: 0,
      peso: 0,
    };
    celda.cantidad += 1;
    celda.peso += obtenerPesoCriticidad(reporte);
    celdas.set(clave, celda);
  }

  const pesoMaximo = [...celdas.values()].reduce(
    (maximo, celda) => Math.max(maximo, celda.peso),
    0,
  );
  for (const celda of celdas.values()) {
    const limiteSur = celda.fila * tamanoCelda;
    const limiteOeste = celda.columna * tamanoCelda;
    L.rectangle(
      [
        [limiteSur, limiteOeste],
        [limiteSur + tamanoCelda, limiteOeste + tamanoCelda],
      ],
      {
        color: colorEn(celda.peso / pesoMaximo),
        weight: 1,
        opacity: 0.65,
        fillColor: colorEn(celda.peso / pesoMaximo),
        fillOpacity: 0.55,
      },
    )
      .bindTooltip(`${celda.cantidad} reportes`)
      .addTo(capaCeldas);
  }
}

// Muestra solo las capas seleccionadas y refresca los datos de cada una.
function aplicarCapas() {
  capaCalor.setLatLngs(
    capasSeleccionadas.has("calor")
      ? reportesEnMapa.map((reporte) => [
        reporte.lat,
        reporte.lng,
        obtenerPesoCriticidad(reporte),
      ])
      : [],
  );
  capaPuntos.clearLayers();
  for (const reporte of reportesEnMapa) {
    L.marker([reporte.lat, reporte.lng])
      .bindPopup(crearContenidoPopup(reporte))
      .addTo(capaPuntos);
  }
  dibujarCeldas();

  if (!tableroActivo) {
    return;
  }

  for (const [nombre, capa] of [
    ["calor", capaCalor],
    ["puntos", capaPuntos],
    ["celdas", capaCeldas],
  ]) {
    const visible = capasSeleccionadas.has(nombre);
    if (visible && !mapaTablero.hasLayer(capa)) {
      capa.addTo(mapaTablero);
      if (nombre === "calor") {
        capaCalor.setOptions({
          ...obtenerAjustesCalor(),
          gradient: obtenerGradienteCalor(),
        });
      }
    } else if (!visible && nombre !== "calor" && mapaTablero.hasLayer(capa)) {
      mapaTablero.removeLayer(capa);
    }
  }
}

// Ajusta selección única o múltiple según el modo del panel.
function setModo(modo) {
  if (modo === "una") {
    const seleccionada = controlesCapas.find((control) => control.checked)?.value;
    capasSeleccionadas = new Set([seleccionada ?? "calor"]);
  }
  botonesModoCapas.una.setAttribute("aria-pressed", String(modo === "una"));
  botonesModoCapas.combinar.setAttribute("aria-pressed", String(modo === "combinar"));

  for (const control of controlesCapas) {
    control.type = modo === "una" ? "radio" : "checkbox";
    control.checked = capasSeleccionadas.has(control.value);
  }
  aplicarCapas();
}

// Aplica el rango temporal a los reportes que ya respetan los filtros del tablero.
function filtrarPorFecha() {
  const dias = periodoSeleccionado === "todo" ? null : Number(periodoSeleccionado);
  const fechaLimite = dias === null ? null : Date.now() - dias * 24 * 60 * 60 * 1000;
  const estaEnPeriodo = (reporte) => {
    if (fechaLimite === null) {
      return true;
    }
    const fecha = new Date(reporte.fecha_hora).getTime();
    return Number.isFinite(fecha) && fecha >= fechaLimite;
  };
  reportesDelPeriodo = reportesDelTablero.filter(estaEnPeriodo);
  reportesEnMapa = reportesValidos.filter(estaEnPeriodo);

  resumenPeriodoMapa.textContent =
    `${reportesDelPeriodo.length} ${reportesDelPeriodo.length === 1 ? "reporte" : "reportes"} en el período seleccionado`;
  document.querySelector("#conteo-reportes").textContent = String(reportesDelPeriodo.length);
  for (const nivel of ["alto", "medio", "bajo"]) {
    document.querySelector(`#conteo-${nivel}`).textContent = String(
      reportesDelPeriodo.filter((reporte) => reporte.criticidad.nivel.toLowerCase() === nivel).length,
    );
  }
  document.querySelector("#texto-conteo-reportes").textContent =
    `Mostrando ${reportesDelPeriodo.length} de ${reportesDelTablero.length} reportes`;

  if (reportesEnMapa.length === 0) {
    estadoTablero.textContent = "No hay reportes con ubicación válida para mostrar en este período.";
  } else if (reportesFueraDelArea > 0) {
    estadoTablero.textContent =
      `${reportesFueraDelArea} reporte(s) no se muestran por estar fuera del perímetro o no tener criticidad válida.`;
  } else {
    estadoTablero.textContent =
      `${reportesEnMapa.length} reporte(s) dentro del perímetro aproximado en este período.`;
  }

  aplicarCapas();
}

// Actualiza el degradado del heatmap y de la leyenda al cambiar paleta o tema.
function actualizarPaleta() {
  paletaSeleccionada = controlesCalor.paleta.value;
  const colores = PALETAS_CALOR[paletaSeleccionada];
  const pasos = colores.map((color, indice) =>
    `${color} ${(indice / (colores.length - 1)) * 100}%`,
  );
  if (mapaTablero.hasLayer(capaCalor)) {
    capaCalor.setOptions({ gradient: obtenerGradienteCalor() });
  }
  document.querySelector(".leyenda-criticidad__degradado").style.setProperty(
    "--degradado-calor",
    `linear-gradient(to right, ${pasos.join(", ")})`,
  );
  aplicarCapas();
}

// Aplica los controles de intensidad y mantiene sus valores visibles.
function actualizarAjustesCalor() {
  const sensibilidad = Number(controlesCalor.sensibilidad.value);
  const radio = Number(controlesCalor.radio.value);
  const desenfoque = Number(controlesCalor.desenfoque.value);
  valoresCalor.sensibilidad.value = String(sensibilidad);
  valoresCalor.radio.value = String(radio);
  valoresCalor.desenfoque.value = String(desenfoque);
  if (mapaTablero.hasLayer(capaCalor)) {
    capaCalor.setOptions(obtenerAjustesCalor());
  }
}

function obtenerAjustesCalor() {
  return {
    max: 12 - Number(controlesCalor.sensibilidad.value),
    radius: Number(controlesCalor.radio.value),
    blur: Number(controlesCalor.desenfoque.value),
  };
}

function obtenerGradienteCalor() {
  const colores = PALETAS_CALOR[paletaSeleccionada];
  return Object.fromEntries(
    colores.map((color, indice) => [indice / (colores.length - 1), color]),
  );
}

function dibujar(reportes) {
  reportesDelTablero = reportes;
  reportesValidos = [];
  reportesFueraDelArea = 0;

  for (const reporte of reportes) {
    if (
      !estaDentroDelPerimetro(reporte.lat, reporte.lng) ||
      typeof reporte.criticidad?.puntaje !== "number"
    ) {
      reportesFueraDelArea += 1;
      continue;
    }
    reportesValidos.push(reporte);
  }

  if (reportesFueraDelArea > 0) {
    estadoTablero.textContent =
      `${reportesFueraDelArea} reporte(s) no se muestran: están fuera del perímetro aproximado o no tienen criticidad válida.`;
  } else if (reportesValidos.length === 0) {
    estadoTablero.textContent = "No hay reportes para mostrar con estos filtros.";
  } else {
    estadoTablero.textContent = `${reportesValidos.length} reporte(s) dentro del perímetro aproximado.`;
  }

  filtrarPorFecha();
}

function activarMapaCaptura() {
  requestAnimationFrame(() => mapaCaptura.invalidateSize());
}

function activarCapas() {
  tableroActivo = true;
  requestAnimationFrame(() => {
    if (!tableroActivo) {
      return;
    }

    mapaTablero.invalidateSize();
    aplicarCapas();
    dibujar(reportesDelTablero);
  });
}

function desactivarCapas() {
  tableroActivo = false;
}

function inicializarMapas() {
  if (!window.L) {
    throw new Error("Leaflet no cargó. Comprueba la conexión a internet y los CDN.");
  }
  if (typeof window.L.heatLayer !== "function") {
    throw new Error("Leaflet.heat no cargó. Comprueba la conexión a internet y el CDN.");
  }

  const resCaptura = crearMapa(mapaCapturaElemento);
  mapaCaptura = resCaptura.mapa;
  capaBaseCaptura = resCaptura.capaBase;

  const resTablero = crearMapa(mapaTableroElemento);
  mapaTablero = resTablero.mapa;
  capaBaseTablero = resTablero.capaBase;

  capaCalor = crearCapaCalor();
  capaPuntos = L.layerGroup();
  capaCeldas = L.layerGroup();
  if (window.matchMedia("(max-width: 42rem)").matches) {
    document.querySelector("#panel-capas-mapa").open = false;
  }
  setModo("una");
  actualizarAjustesCalor();
  actualizarPaleta();

  mapaCaptura.on("click", ({ latlng }) => seleccionarUbicacion(latlng.lat, latlng.lng));
  window.addEventListener("mapa:solicitar-ubicacion", ({ detail }) => {
    seleccionarUbicacion(detail?.lat, detail?.lng, true);
  });
  window.addEventListener("mapa:limpiar-seleccion", () => {
    marcadorUbicacion?.remove();
    marcadorUbicacion = null;
  });
  window.addEventListener("captura:activar", activarMapaCaptura);
  window.addEventListener("tablero:activar", activarCapas);
  window.addEventListener("tablero:desactivar", desactivarCapas);
  window.addEventListener("reportes:actualizados", ({ detail }) => {
    const reportes = detail?.reportes ?? [];
    dibujar(reportes);
    actualizarCalorCaptura(reportes);
  });
  window.addEventListener("reportes:filtrados", ({ detail }) => {
    dibujar(detail?.reportes ?? []);
  });

  window.addEventListener("mapa:centrar-coordenadas", ({ detail }) => {
    if (detail?.lat && detail?.lng && mapaTablero) {
      const zoom = detail.zoom || 18;
      mapaTablero.invalidateSize();
      mapaTablero.flyTo([detail.lat, detail.lng], zoom, { animate: true, duration: 1 });
      if (!mapaTablero.hasLayer(capaPuntos)) {
        capaPuntos.addTo(mapaTablero);
      }
      setTimeout(() => {
        capaPuntos.eachLayer((layer) => {
          if (layer.getLatLng) {
            const pos = layer.getLatLng();
            if (Math.abs(pos.lat - detail.lat) < 0.00015 && Math.abs(pos.lng - detail.lng) < 0.00015) {
              layer.openPopup();
            }
          }
        });
      }, 500);
    }
  });
  botonesModoCapas.una.addEventListener("click", () => setModo("una"));
  botonesModoCapas.combinar.addEventListener("click", () => setModo("combinar"));
  for (const control of controlesCapas) {
    control.addEventListener("change", () => {
      capasSeleccionadas = new Set(
        controlesCapas.filter((capa) => capa.checked).map((capa) => capa.value),
      );
      aplicarCapas();
    });
  }
  for (const control of controlesTiempo) {
    control.addEventListener("click", () => {
      periodoSeleccionado = control.dataset.periodoMapa;
      for (const boton of controlesTiempo) {
        boton.setAttribute("aria-pressed", String(boton === control));
      }
      filtrarPorFecha();
    });
  }
  for (const control of Object.values(controlesCalor)) {
    control.addEventListener("input", control === controlesCalor.paleta ? actualizarPaleta : actualizarAjustesCalor);
    control.addEventListener("change", control === controlesCalor.paleta ? actualizarPaleta : actualizarAjustesCalor);
  }
}

try {
  inicializarMapas();
} catch (error) {
  mapaCapturaElemento.textContent = `No se pudo iniciar el mapa: ${error.message}`;
  estadoUbicacion.textContent = `No se pudo iniciar el mapa: ${error.message}`;
  estadoTablero.textContent = `No se pudo iniciar el mapa: ${error.message}`;
  console.error(error);
}

export { estaDentroDelPerimetro };
