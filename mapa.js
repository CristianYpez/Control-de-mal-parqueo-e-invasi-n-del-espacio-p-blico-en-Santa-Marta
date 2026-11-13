const CENTRO_SANTA_MARTA = [11.24, -74.20];
const NIVEL_ZOOM_INICIAL = 13;

// Perímetro ilustrativo del área urbana; no reemplaza un límite oficial.
const PERIMETRO_APROXIMADO = [
  [11.218, -74.221],
  [11.218, -74.185],
  [11.232, -74.171],
  [11.252, -74.172],
  [11.267, -74.188],
  [11.266, -74.219],
  [11.249, -74.238],
  [11.229, -74.237],
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
        mensaje: "El punto está fuera del perímetro urbano aproximado de Santa Marta.",
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

function crearContenidoPopup(reporte) {
  const contenido = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = reporte.id;
  contenido.append(titulo);

  const detalles = [
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
  return contenido;
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

  capaCalor.setLatLngs(
    reportesValidos.map((reporte) => [
      reporte.lat,
      reporte.lng,
      Math.max(0, Math.min(1, reporte.criticidad.puntaje / 9)),
    ]),
  );

  capaPuntos.clearLayers();
  for (const reporte of reportesValidos) {
    L.marker([reporte.lat, reporte.lng])
      .bindPopup(crearContenidoPopup(reporte))
      .addTo(capaPuntos);
  }

  if (controlPuntos.checked && !mapaTablero.hasLayer(capaPuntos)) {
    capaPuntos.addTo(mapaTablero);
  } else if (!controlPuntos.checked && mapaTablero.hasLayer(capaPuntos)) {
    mapaTablero.removeLayer(capaPuntos);
  }

  if (reportesFueraDelArea > 0) {
    estadoTablero.textContent =
      `${reportesFueraDelArea} reporte(s) no se muestran: están fuera del perímetro aproximado o no tienen criticidad válida.`;
  } else if (reportesValidos.length === 0) {
    estadoTablero.textContent = "No hay reportes para mostrar con estos filtros.";
  } else {
    estadoTablero.textContent = `${reportesValidos.length} reporte(s) dentro del perímetro aproximado.`;
  }
}

function activarCapas() {
  mapaTablero.invalidateSize();
  if (!mapaTablero.hasLayer(capaCalor)) {
    capaCalor.addTo(mapaTablero);
  }
  dibujarReportes(reportesValidos);
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
  capaCalor = L.heatLayer([], {
    radius: 30,
    blur: 20,
    minOpacity: 0.35,
    max: 1,
    maxZoom: 17,
    gradient: {
      0.2: "#2c7bb6",
      0.45: "#abd9e9",
      0.65: "#ffffbf",
      0.82: "#fdae61",
      1: "#d7191c",
    },
  }).addTo(mapaTablero);
  capaPuntos = L.layerGroup().addTo(mapaTablero);

  mapaCaptura.on("click", ({ latlng }) => seleccionarUbicacion(latlng.lat, latlng.lng));
  window.addEventListener("mapa:solicitar-ubicacion", ({ detail }) => {
    seleccionarUbicacion(detail?.lat, detail?.lng, true);
  });
  window.addEventListener("mapa:limpiar-seleccion", () => {
    marcadorUbicacion?.remove();
    marcadorUbicacion = null;
  });
  window.addEventListener("tablero:activar", activarCapas);
  window.addEventListener("reportes:actualizados", ({ detail }) => {
    dibujarReportes(detail?.reportes ?? []);
  });
  window.addEventListener("reportes:filtrados", ({ detail }) => {
    dibujarReportes(detail?.reportes ?? []);
  });
  controlPuntos.addEventListener("change", () => {
    if (controlPuntos.checked) {
      capaPuntos.addTo(mapaTablero);
    } else {
      mapaTablero.removeLayer(capaPuntos);
    }
  });

  window.addEventListener("tablero:activar", () => {
    requestAnimationFrame(() => mapaTablero.invalidateSize());
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
