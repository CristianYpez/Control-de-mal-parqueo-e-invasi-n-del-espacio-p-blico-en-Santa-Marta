const CENTRO_SANTA_MARTA = [11.205, -74.17];
const NIVEL_ZOOM_INICIAL = 11;

// Perímetro aproximado de cobertura, con una extensión ilustrativa hacia El Cisne.
const PERIMETRO_APROXIMADO = [
  [11.218, -74.185],
  [11.211, -74.172],
  [11.202, -74.156],
  [11.193, -74.149],
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
  [11.207, -74.151],
  [11.207, -74.16],
  [11.21, -74.165],
  [11.216, -74.166],
  [11.219, -74.16],
  [11.214, -74.171],
];

const mapaCapturaElemento = document.querySelector("#mapa-captura");
const mapaTableroElemento = document.querySelector("#mapa-tablero");
const estadoTablero = document.querySelector("#estado-tablero");
const estadoUbicacion = document.querySelector("#estado-ubicacion");
const controlPuntos = document.querySelector("#mostrar-puntos");

let mapaCaptura;
let mapaTablero;
let marcadorUbicacion;
let capaCalor;
let capaPuntos;
let reportesValidos = [];
let reportesFueraDelArea = 0;
let tableroActivo = false;
let modoVisualizacion = "calor";

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

  const capaBase = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  });
  capaBase.on("tileerror", () => {
    const mensaje = "No se pudo cargar el mapa base. Comprueba tu conexión a internet.";
    mostrarEstadoMapa(elemento, mensaje);
  });
  capaBase.addTo(mapa);

  L.polygon(PERIMETRO_APROXIMADO, {
    color: "#126b5c",
    weight: 2,
    dashArray: "6 5",
    fillColor: "#3d9b84",
    fillOpacity: 0.06,
  }).addTo(mapa);

  return mapa;
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
    minOpacity: 0.65,
    max: 1,
    maxZoom: 11,
    gradient: {
      0.1: "#2c7bb6",
      0.3: "#abd9e9",
      0.5: "#ffffbf",
      0.72: "#fdae61",
      1: "#d7191c",
    },
  });
}

function obtenerFuenteFoto(foto) {
  if (typeof foto !== "string" || !foto) {
    return "";
  }
  if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(foto)) {
    return foto;
  }

  const enlace = document.createElement("a");
  enlace.href = foto;
  return ["http:", "https:"].includes(enlace.protocol) &&
    enlace.origin === window.location.origin
    ? enlace.href
    : "";
}

function agregarFotoCensuradaAlPopup(contenido, reporte) {
  if (!reporte.foto) {
    return;
  }

  const figura = document.createElement("figure");
  figura.style.margin = "8px 0 0";
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
  imagen.style.maxHeight = "180px";
  imagen.style.objectFit = "contain";
  imagen.addEventListener("error", () => {
    figura.replaceChildren();
    const aviso = document.createElement("figcaption");
    aviso.textContent = "No se pudo cargar la foto censurada.";
    figura.append(aviso);
  });
  imagen.src = fuente;

  const pie = document.createElement("figcaption");
  pie.textContent = `Foto censurada del reporte ${reporte.id}`;
  figura.append(imagen, pie);
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

function aplicarModoVisualizacion() {
  if (!tableroActivo) {
    return;
  }

  if (modoVisualizacion === "calor") {
    if (!mapaTablero.hasLayer(capaCalor)) {
      capaCalor.addTo(mapaTablero);
    }
    capaCalor.setLatLngs(
      reportesValidos.map((reporte) => [
        reporte.lat,
        reporte.lng,
        Math.max(0, Math.min(1, reporte.criticidad.puntaje / 9)),
      ]),
    );
    if (mapaTablero.hasLayer(capaPuntos)) {
      mapaTablero.removeLayer(capaPuntos);
    }
    return;
  }

  if (mapaTablero.hasLayer(capaCalor)) {
    mapaTablero.removeLayer(capaCalor);
  }
  if (!mapaTablero.hasLayer(capaPuntos)) {
    capaPuntos.addTo(mapaTablero);
  }
}

function dibujarReportes(reportes) {
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

  if (!tableroActivo) {
    return;
  }

  capaPuntos.clearLayers();
  for (const reporte of reportesValidos) {
    L.marker([reporte.lat, reporte.lng])
      .bindPopup(crearContenidoPopup(reporte))
      .addTo(capaPuntos);
  }

  aplicarModoVisualizacion();
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
    aplicarModoVisualizacion();
    dibujarReportes(reportesValidos);
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

  mapaCaptura = crearMapa(mapaCapturaElemento);
  mapaTablero = crearMapa(mapaTableroElemento);
  capaCalor = crearCapaCalor();
  capaPuntos = L.layerGroup();
  controlPuntos.checked = false;

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
    dibujarReportes(detail?.reportes ?? []);
  });
  window.addEventListener("reportes:filtrados", ({ detail }) => {
    dibujarReportes(detail?.reportes ?? []);
  });
  window.addEventListener("mapa:modo-visualizacion", ({ detail }) => {
    if (detail?.modo !== "calor" && detail?.modo !== "puntos") {
      estadoTablero.textContent = "No se reconoce el modo de visualización del mapa.";
      return;
    }

    modoVisualizacion = detail.modo;
    aplicarModoVisualizacion();
  });
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
