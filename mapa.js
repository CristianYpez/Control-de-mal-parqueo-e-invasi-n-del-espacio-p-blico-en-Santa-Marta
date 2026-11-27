const CENTRO_SANTA_MARTA = [11.205, -74.17];
const NIVEL_ZOOM_INICIAL = 11;

// Objeto GeoJSON completo del perímetro urbano de Santa Marta (Polygon con 73 vértices detallados).
// Calibrado con la silueta urbana oficial: costa (Taganga, Bahía, Rodadero, Pozos Colorados), lóbulo Bonda y pie de monte.
let PERIMETRO_GEOJSON = {
  type: "FeatureCollection",
  name: "santa-marta-perimetro-urbano",
  features: [
    {
      type: "Feature",
      properties: {
        nombre: "Perímetro Urbano de Santa Marta",
        descripcion:
          "Límite urbano oficial que abarca el casco histórico, bahías, Rodadero, Pozos Colorados y corredor a Bonda",
        ciudad: "Santa Marta",
        departamento: "Magdalena",
        pais: "Colombia",
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            // 1. Taganga y Cerros del Norte
            [-74.1942, 11.2738],
            [-74.1915, 11.272],
            [-74.188, 11.2692],
            [-74.1845, 11.2665],
            [-74.1782, 11.2635],
            [-74.172, 11.2612],
            [-74.165, 11.2585],
            [-74.158, 11.2562],
            [-74.1515, 11.2545],
            [-74.1448, 11.253],
            [-74.1375, 11.2512],
            [-74.13, 11.2498],
            [-74.122, 11.2488],
            [-74.114, 11.2478],

            // 2. Corredor y lóbulo oriental de Bonda
            [-74.1065, 11.2468],
            [-74.1005, 11.2458],
            [-74.0955, 11.2435],
            [-74.092, 11.2405],
            [-74.0945, 11.2365],
            [-74.099, 11.2335],
            [-74.1055, 11.231],
            [-74.113, 11.2285],
            [-74.1215, 11.2255],
            [-74.129, 11.2228],
            [-74.1365, 11.2198],

            // 3. Suroriente - Falda de cerros de Santa Marta (Curinca, El Cisne, Ciudadela)
            [-74.1435, 11.2168],
            [-74.151, 11.214],
            [-74.1585, 11.2118],
            [-74.166, 11.2095],
            [-74.1735, 11.2075],
            [-74.1805, 11.2055],
            [-74.1865, 11.204],
            [-74.1925, 11.2025],
            [-74.1965, 11.201],

            // 4. Conector Troncal hacia Gaira
            [-74.2005, 11.197],
            [-74.2045, 11.1925],
            [-74.2085, 11.187],
            [-74.211, 11.1805],
            [-74.2125, 11.1735],
            [-74.2135, 11.1665],

            // 5. Franja oriental Pozos Colorados / Bello Horizonte (base de cerros / ferrocarril)
            [-74.214, 11.1585],
            [-74.2145, 11.151],
            [-74.2148, 11.1435],
            [-74.2152, 11.136],
            [-74.2155, 11.1285],
            [-74.2158, 11.121],
            [-74.216, 11.115],

            // 6. Límite sur (corte horizontal en Bello Horizonte / Pozos Colorados)
            [-74.2225, 11.115],
            [-74.229, 11.115],

            // 7. Línea costera real hacia el norte (ciñéndose a la costa sin invadir el mar)
            [-74.2298, 11.1215],
            [-74.2305, 11.1285],
            [-74.2312, 11.136],
            [-74.2318, 11.1435],
            [-74.2322, 11.151],
            [-74.2325, 11.1585],
            [-74.232, 11.166],
            [-74.2315, 11.1735],
            [-74.231, 11.181],
            [-74.2305, 11.1885],
            [-74.23, 11.196],
            [-74.2292, 11.2035],
            [-74.2285, 11.211],
            [-74.2265, 11.2185],
            [-74.2242, 11.2255],
            [-74.2225, 11.232],
            [-74.221, 11.2385],
            [-74.2198, 11.245],
            [-74.2185, 11.2515],
            [-74.216, 11.2575],
            [-74.2115, 11.263],
            [-74.206, 11.2675],
            [-74.2005, 11.271],
            [-74.1942, 11.2738],
          ],
        ],
      },
    },
  ],
};

// Conversión automática a formato Leaflet [lat, lng]
let PERIMETRO_APROXIMADO = PERIMETRO_GEOJSON.features[0].geometry.coordinates[0].map(
  ([lng, lat]) => [lat, lng],
);

// Máscara mundial con hueco interior en Santa Marta (efecto GIS "Cookie Cutter" estilo Reno/Sparks).
// Todo lo que quede fuera de Santa Marta se oscurece/atenúa, resaltando únicamente la ciudad.
let MASCARA_MUNDO = [
  [
    [85.0, -180.0],
    [85.0, 180.0],
    [-85.0, 180.0],
    [-85.0, -180.0],
    [85.0, -180.0],
  ],
  PERIMETRO_APROXIMADO,
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
  serena: ["#fde047", "#facc15", "#fb923c", "#ef4444", "#c026d3", "#701a75"],
  termica: ["#38bdf8", "#fef08a", "#fb923c", "#ef4444", "#991b1b"],
};

// Servidor de mapas OpenStreetMap (100% libre, sin requerir API Key ni presentar marcas de agua)
const URL_OSM = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUCION_OSM = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors';

let capaBaseCaptura;
let capaBaseTablero;
let capaCalorCaptura;
let capaBordeCaptura;
let capaBordeTablero;

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

  // 1. Validación preferente con Turf.js (booleanPointInPolygon)
  if (window.turf && typeof window.turf.booleanPointInPolygon === "function") {
    try {
      const puntoTurf = window.turf.point([longitud, latitud]);
      return window.turf.booleanPointInPolygon(puntoTurf, PERIMETRO_GEOJSON.features[0]);
    } catch {
      // Si falla Turf por cualquier razón, recurrir al algoritmo ray casting local
    }
  }

  // 2. Algoritmo de respaldo (Ray Casting)
  let dentro = false;
  for (
    let indice = 0, anterior = PERIMETRO_APROXIMADO.length - 1;
    indice < PERIMETRO_APROXIMADO.length;
    anterior = indice, indice += 1
  ) {
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
    const iconoPin = L.divIcon({
      className: "marcador-pin-captura-wrapper",
      html: `
        <div class="pin-pulso-radar" aria-hidden="true"></div>
        <div class="pin-cuerpo-marcador" aria-hidden="true">
          <svg width="28" height="36" viewBox="0 0 24 32" fill="none">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="#EF4444"/>
            <circle cx="12" cy="11" r="5" fill="#FFFFFF"/>
            <circle cx="12" cy="11" r="2.5" fill="#B91C1C"/>
          </svg>
        </div>
      `,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      popupAnchor: [0, -36],
    });

    marcadorUbicacion = L.marker(ubicacion, {
      icon: iconoPin,
      draggable: true,
      autoPan: true,
    }).addTo(mapaCaptura);

    marcadorUbicacion.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      seleccionarUbicacion(pos.lat, pos.lng, false);
    });

    marcadorUbicacion.bindTooltip("Arrastra para ajustar el punto exacto", {
      direction: "top",
      offset: [0, -38],
      className: "tooltip-pin-captura",
    });
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

const capasMascara = [];
const capasBordePerimetro = [];

function obtenerConfiguracionPerimetro() {
  const esOscuro =
    document.documentElement.dataset.tema !== "claro" &&
    document.documentElement.getAttribute("data-theme") !== "light";

  return {
    colorMascara: esOscuro ? "#0b1116" : "#ffffff",
    opacidadMascara: esOscuro ? 0.6 : 0.65,
    colorBorde: esOscuro ? "#ffffff" : "#0f172a",
    pesoBorde: 2,
    rellenoPerimetro: esOscuro ? "#ffffff" : "#0f172a",
    opacidadRelleno: 0.03,
  };
}

function aplicarPerimetroYMascara(mapa, opciones = {}) {
  if (!mapa.getPane("mascaraPerimetro")) {
    const pane = mapa.createPane("mascaraPerimetro");
    pane.style.zIndex = "450";
    pane.style.pointerEvents = "none";
  }

  const {
    colorMascara,
    opacidadMascara,
    colorBorde,
    pesoBorde,
    rellenoPerimetro,
    opacidadRelleno,
  } = obtenerConfiguracionPerimetro();

  // 1. Máscara exterior que atenúa todo el territorio fuera del perímetro urbano (estilo Reno/Sparks / Cookie Cutter)
  const capaMascara = L.polygon(MASCARA_MUNDO, {
    pane: "mascaraPerimetro",
    fillColor: colorMascara,
    fillOpacity: opacidadMascara,
    stroke: false,
    interactive: false,
  }).addTo(mapa);

  // 2. Capa GeoJSON oficial del perímetro urbano (L.geoJSON con borde blanco punteado y relleno suave)
  const capaBorde = L.geoJSON(PERIMETRO_GEOJSON, {
    pane: "mascaraPerimetro",
    className: "perimetro-borde-urbano",
    style: {
      color: colorBorde,
      weight: pesoBorde,
      dashArray: "6, 6",
      lineCap: "round",
      lineJoin: "round",
      fillColor: rellenoPerimetro,
      fillOpacity: opacidadRelleno,
    },
    interactive: false,
  }).addTo(mapa);

  if (opciones.ajustarBounds) {
    try {
      const size = mapa.getSize();
      if (size && size.x > 50 && size.y > 50) {
        const bounds = capaBorde.getBounds();
        if (bounds.isValid()) {
          mapa.fitBounds(bounds, {
            padding: [20, 20],
            maxZoom: 14,
          });
        }
      }
    } catch (e) {
      console.warn("No se pudo ajustar bounds al perímetro:", e);
    }
  }

  capasMascara.push(capaMascara);
  capasBordePerimetro.push(capaBorde);

  return { capaMascara, capaBorde };
}

function actualizarEstilosPerimetro() {
  const {
    colorMascara,
    opacidadMascara,
    colorBorde,
    pesoBorde,
    rellenoPerimetro,
    opacidadRelleno,
  } = obtenerConfiguracionPerimetro();

  for (const mascara of capasMascara) {
    mascara.setStyle({
      fillColor: colorMascara,
      fillOpacity: opacidadMascara,
    });
  }
  for (const borde of capasBordePerimetro) {
    borde.setStyle({
      color: colorBorde,
      weight: pesoBorde,
      fillColor: rellenoPerimetro,
      fillOpacity: opacidadRelleno,
    });
  }
}

// Carga asíncrona del archivo santa-marta-perimetro.geojson desde disco
async function cargarArchivoPerimetroGeoJSON() {
  if (typeof fetch !== "function" || location.protocol === "file:") return;
  const rutas = ["./datos/santa-marta-perimetro.geojson", "./santa-marta-perimetro.geojson"];
  for (const ruta of rutas) {
    try {
      const res = await fetch(ruta, { cache: "no-store" });
      if (res.ok) {
        const geojson = await res.json();
        const coords = geojson?.features?.[0]?.geometry?.coordinates?.[0];
        if (Array.isArray(coords) && coords.length > 3) {
          PERIMETRO_GEOJSON = geojson;
          PERIMETRO_APROXIMADO = coords.map(([lng, lat]) => [lat, lng]);
          MASCARA_MUNDO = [
            [
              [85.0, -180.0],
              [85.0, 180.0],
              [-85.0, 180.0],
              [-85.0, -180.0],
              [85.0, -180.0],
            ],
            PERIMETRO_APROXIMADO,
          ];
          for (const borde of capasBordePerimetro) {
            borde.clearLayers?.();
            borde.addData?.(geojson);
          }
          for (const mascara of capasMascara) {
            mascara.setLatLngs?.(MASCARA_MUNDO);
          }
          break;
        }
      }
    } catch {
      // Mantener geometría integrada de respaldo
    }
  }
}

function crearMapa(elemento, opciones = {}) {
  const centro = opciones.center || CENTRO_SANTA_MARTA;
  const zoom = opciones.zoom || NIVEL_ZOOM_INICIAL;
  const { center: _c, zoom: _z, ajustarBounds = false, ...restoOpciones } = opciones;
  const mapa = L.map(elemento, {
    zoomControl: true,
    ...restoOpciones,
  }).setView(centro, zoom);

  // Servidor OpenStreetMap 100% libre (sin API key ni marcas de agua)
  const capaBase = L.tileLayer(URL_OSM, {
    maxZoom: 19,
    attribution: ATRIBUCION_OSM,
  });
  capaBase.addTo(mapa);

  const { capaMascara, capaBorde } = aplicarPerimetroYMascara(mapa, { ajustarBounds });

  return { mapa, capaBase, capaMascara, capaBorde };
}

function actualizarCalorCaptura(reportes) {
  if (!mapaCaptura || typeof window.L?.heatLayer !== "function") return;
  const puntos = reportes
    .filter((r) => estaDentroDelPerimetro(r.lat, r.lng))
    .map((r) => [r.lat, r.lng, obtenerPesoCriticidad(r)]);
  if (!capaCalorCaptura) {
    capaCalorCaptura = L.heatLayer(puntos, {
      radius: 22,
      blur: 11,
      minOpacity: 0.18,
      max: 6,
      gradient: {
        0.0: "rgba(0, 0, 0, 0)",
        0.08: "rgba(254, 240, 138, 0.45)",
        0.22: "#fde047",
        0.45: "#fb923c",
        0.68: "#ef4444",
        1.0: "#c026d3",
      },
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

function clamp(valor, minimo, maximo) {
  return Math.max(minimo, Math.min(maximo, valor));
}

// 1. Radio dinámico según el nivel de zoom
function calcularRadioPorZoom(zoom) {
  // Calibrado según mapas de densidad urbana (hotspots concéntricos por sectores):
  if (zoom <= 10) return 6;
  if (zoom === 11) return 8;
  if (zoom === 12) return 11;
  if (zoom === 13) return 15;
  if (zoom === 14) return 21;
  if (zoom === 15) return 27;
  if (zoom === 16) return 33;
  return clamp(33 + (zoom - 16) * 4, 33, 42);
}

// 4. Desvanecimiento y blur dinámico
function calcularBlurPorZoom(radio, zoom) {
  // Proporción del 45-50% para lograr anillos concéntricos nítidos (estilo GIS)
  // con centro definido y halo perimetral suave que no invade cuadras adyacentes
  if (zoom <= 10) return 3;
  if (zoom === 11) return 4;
  if (zoom === 12) return 5;
  if (zoom === 13) return 7;
  if (zoom === 14) return 10;
  return clamp(Math.round(radio * 0.48), 8, 20);
}

// 3. Agrupación espacial por cuadrícula según el zoom (Spatial Clustering)
function agruparReportesPorZoom(reportes, zoom) {
  if (!reportes || reportes.length === 0) {
    return { puntos: [], maxPeso: 1 };
  }

  // Cuadrícula compacta calibrada para mantener focos independientes por manzana / cruce vial
  // (evita que focos a 100m se unan en una sola mancha, manteniendo focos múltiples definidos):
  const pasoGrados = zoom <= 11
    ? 0.00075 // ~80m
    : zoom <= 13
      ? 0.0005  // ~55m
      : Math.max(0.00008, 0.0025 / Math.pow(1.55, zoom - 10));

  const celdas = new Map();

  for (const r of reportes) {
    if (typeof r.lat !== "number" || typeof r.lng !== "number") continue;
    const peso = obtenerPesoCriticidad(r);

    const celdaX = Math.floor(r.lat / pasoGrados);
    const celdaY = Math.floor(r.lng / pasoGrados);
    const clave = `${celdaX}_${celdaY}`;

    if (!celdas.has(clave)) {
      celdas.set(clave, {
        latPonderada: r.lat * peso,
        lngPonderada: r.lng * peso,
        pesoTotal: peso,
        conteo: 1,
      });
    } else {
      const c = celdas.get(clave);
      c.latPonderada += r.lat * peso;
      c.lngPonderada += r.lng * peso;
      c.pesoTotal += peso;
      c.conteo += 1;
    }
  }

  let maxPeso = 1;
  const puntos = [];

  for (const c of celdas.values()) {
    // Al hacer zoom out (<= 12), suavizamos el peso acumulado para que un grupo denso
    // no desborde con una mancha masiva
    let pesoAjustado = c.pesoTotal;
    if (zoom <= 12) {
      pesoAjustado = Math.min(c.pesoTotal, 3 + Math.log2(c.conteo + 1) * 3);
    }

    if (pesoAjustado > maxPeso) {
      maxPeso = pesoAjustado;
    }
    puntos.push([
      c.latPonderada / c.pesoTotal,
      c.lngPonderada / c.pesoTotal,
      pesoAjustado,
    ]);
  }

  return { puntos, maxPeso };
}

// 2. Intensidad normalizada y cálculo dinámico de max según el nivel de zoom
function calcularMaxCalor(maxPeso, zoom = 14) {
  const factorSensibilidad = Number(controlesCalor.sensibilidad?.value || 6);

  // A zoom cercano (>= 15), los puntos se dispersan en la pantalla a escala de cuadra.
  // Reducimos el umbral 'max' para que 1 solo reporte aislado (peso 1.5) tenga un halo
  // visible y reconocible, y un grupo pequeño (2-3) pase a naranja/rojo.
  let base;
  if (zoom >= 16) {
    base = Math.min(3.8, Math.max(2.4, maxPeso * 0.35));
  } else if (zoom >= 14) {
    base = Math.min(5.5, Math.max(3.5, maxPeso * 0.6));
  } else {
    base = Math.max(8, Math.round(maxPeso * 1.08));
  }

  return Math.max(2.0, base + (6 - factorSensibilidad) * 0.4);
}

function crearCapaCalor() {
  return L.heatLayer([], {
    radius: 12,
    blur: 6,
    minOpacity: 0.12,
    max: 6,
    maxZoom: 18,
    gradient: {
      0.0: "rgba(0, 0, 0, 0)",
      0.08: "rgba(254, 240, 138, 0.45)",
      0.22: "#fde047",
      0.45: "#fb923c",
      0.68: "#ef4444",
      0.85: "#c026d3",
      1.00: "#701a75",
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
  const nivel = reporte.criticidad?.nivel?.toLowerCase() || "";
  // Ponderación base de 1.5 para que reportes de criticidad 'Bajo' tengan presencia
  // visible al hacer zoom in, evitando que se vuelvan transparentes.
  return nivel === "alto" ? 3.2 : nivel === "medio" ? 2.2 : 1.5;
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

let frameActualizacionCalor = null;
let temporizadorDebounceCalor = null;

// Actualiza el radio, blur, max y puntos agrupados en la capa de calor
function actualizarCapaCalorDinamica() {
  if (!mapaTablero || !capaCalor) return;

  const zoom = mapaTablero.getZoom();
  const radio = calcularRadioPorZoom(zoom);
  const blur = calcularBlurPorZoom(radio, zoom);

  const { puntos, maxPeso } = agruparReportesPorZoom(reportesEnMapa, zoom);
  const maxNormalizado = calcularMaxCalor(maxPeso, zoom);
  // A zoom bajo (<= 12) minOpacity muy bajo para no crear niebla gigante.
  // A zoom cercano (>= 15) minOpacity de 0.22 para que todo reporte individual
  // tenga un halo cálido luminoso y visible.
  const minOpacity = zoom <= 12 ? 0.05 : zoom <= 14 ? 0.12 : 0.22;

  capaCalor.setOptions({
    radius: radio,
    blur: blur,
    max: maxNormalizado,
    minOpacity: minOpacity,
    gradient: obtenerGradienteCalor(),
  });

  if (capasSeleccionadas.has("calor")) {
    capaCalor.setLatLngs(puntos);
  } else {
    capaCalor.setLatLngs([]);
  }

  if (valoresCalor.radio) valoresCalor.radio.value = String(radio);
  if (valoresCalor.desenfoque) valoresCalor.desenfoque.value = String(blur);
}

// Controla el rendimiento con debounce y requestAnimationFrame en zoom y paneo
function programarActualizacionCalor(inmediato = false) {
  if (temporizadorDebounceCalor) {
    clearTimeout(temporizadorDebounceCalor);
    temporizadorDebounceCalor = null;
  }
  if (frameActualizacionCalor) {
    cancelAnimationFrame(frameActualizacionCalor);
    frameActualizacionCalor = null;
  }

  if (inmediato) {
    frameActualizacionCalor = requestAnimationFrame(actualizarCapaCalorDinamica);
    return;
  }

  temporizadorDebounceCalor = setTimeout(() => {
    frameActualizacionCalor = requestAnimationFrame(actualizarCapaCalorDinamica);
  }, 100);
}

// Muestra solo las capas seleccionadas y refresca los datos de cada una.
function aplicarCapas() {
  actualizarCapaCalorDinamica();

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
        actualizarCapaCalorDinamica();
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
  document.querySelectorAll(".leyenda-criticidad__degradado").forEach((barra) => {
    barra.style.setProperty(
      "--degradado-calor",
      `linear-gradient(to right, ${pasos.join(", ")})`,
    );
  });
  aplicarCapas();
}

// Aplica los controles de intensidad y mantiene sus valores visibles.
function actualizarAjustesCalor() {
  const sensibilidad = Number(controlesCalor.sensibilidad.value);
  valoresCalor.sensibilidad.value = String(sensibilidad);
  programarActualizacionCalor(true);
}

function obtenerGradienteCalor() {
  if (paletaSeleccionada === "serena") {
    // Inspirada en mapas urbanos de densidad GIS:
    // Comienza en 0.08 para que puntos aislados muestren halo dorado/amarillo visible
    return {
      0.0: "rgba(0, 0, 0, 0)",
      0.08: "rgba(254, 240, 138, 0.45)",
      0.22: "#fde047",
      0.45: "#fb923c",
      0.68: "#ef4444",
      0.85: "#c026d3",
      1.00: "#701a75",
    };
  }
  if (paletaSeleccionada === "termica") {
    // Inspirada en el mapa térmico urbano Reno / Sparks:
    return {
      0.0: "rgba(0, 0, 0, 0)",
      0.08: "rgba(56, 189, 248, 0.5)",
      0.25: "#fef08a",
      0.50: "#fb923c",
      0.78: "#ef4444",
      1.00: "#991b1b",
    };
  }
  const colores = PALETAS_CALOR[paletaSeleccionada] || PALETAS_CALOR.serena;
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
  requestAnimationFrame(() => {
    mapaCaptura?.invalidateSize();
  });
}

function activarCapas() {
  tableroActivo = true;
  requestAnimationFrame(() => {
    if (!tableroActivo) {
      return;
    }

    mapaTablero.invalidateSize();
    try {
      if (capaBordeTablero) {
        const bounds = capaBordeTablero.getBounds();
        if (bounds.isValid()) {
          mapaTablero.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
        }
      }
    } catch {
      // Ignorar si ya está ajustado
    }
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

  const resCaptura = crearMapa(mapaCapturaElemento, {
    center: [11.232, -74.195],
    zoom: 15,
    ajustarBounds: false,
  });
  mapaCaptura = resCaptura.mapa;
  capaBaseCaptura = resCaptura.capaBase;
  capaBordeCaptura = resCaptura.capaBorde;

  const resTablero = crearMapa(mapaTableroElemento, {
    ajustarBounds: false,
  });
  mapaTablero = resTablero.mapa;
  capaBaseTablero = resTablero.capaBase;
  capaBordeTablero = resTablero.capaBorde;

  capaCalor = crearCapaCalor();
  capaPuntos = L.layerGroup();
  capaCeldas = L.layerGroup();
  if (window.matchMedia("(max-width: 42rem)").matches) {
    document.querySelector("#panel-capas-mapa").open = false;
  }
  setModo("una");
  actualizarAjustesCalor();
  actualizarPaleta();

  window.addEventListener("tema:cambiado", () => {
    actualizarEstilosPerimetro();
  });

  // Carga asíncrona desde disco (santa-marta-perimetro.geojson) si se ejecuta en servidor web
  cargarArchivoPerimetroGeoJSON();

  // Escuchar eventos de zoom y paneo para recalcular proporcionalidad del mapa de calor
  mapaTablero.on("zoomend", () => programarActualizacionCalor(true));
  mapaTablero.on("moveend", () => programarActualizacionCalor(false));

  mapaCaptura.on("click", ({ latlng }) => seleccionarUbicacion(latlng.lat, latlng.lng));
  window.addEventListener("mapa:solicitar-ubicacion", ({ detail }) => {
    seleccionarUbicacion(detail?.lat, detail?.lng, true);
  });
  window.addEventListener("mapa:volar-a", ({ detail }) => {
    if (detail?.lat && detail?.lng && mapaCaptura) {
      mapaCaptura.invalidateSize();
      mapaCaptura.flyTo([detail.lat, detail.lng], detail.zoom || 16, {
        animate: true,
        duration: 0.8,
      });
    }
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

  setTimeout(() => {
    mapaCaptura?.invalidateSize();
    if (mapaTablero && mapaTableroElemento.offsetWidth > 50) {
      mapaTablero.invalidateSize();
      if (capaBordeTablero) {
        const bounds = capaBordeTablero.getBounds();
        if (bounds.isValid()) {
          mapaTablero.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 });
        }
      }
    }
  }, 100);
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
