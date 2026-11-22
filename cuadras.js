// Dado un punto del mapa, encuentra la cuadra de vias.json donde cayó.
// Cada cuadra de vias.json trae su "tramo": la esquina donde empieza y la esquina donde termina,
// [[lat, lng], [lat, lng]]. El punto se asigna a la cuadra cuyo tramo queda más cerca,
// siempre que esté a menos de DISTANCIA_MAXIMA_METROS. Si no hay ninguna tan cerca,
// el punto está fuera de la zona del estudio y el tipo de vía no suma puntos.
const DISTANCIA_MAXIMA_METROS = 30;
const CUADRA_FUERA_DE_ZONA = "Fuera de la zona";
const METROS_POR_GRADO = 111320;

// Distancia en metros entre un punto y el tramo recto que va de la esquina a a la esquina b.
function distanciaAlTramo(lat, lng, [a, b]) {
  // Se pasa todo a metros sobre un plano, con el punto inicial del tramo como origen.
  const escalaLng = METROS_POR_GRADO * Math.cos((lat * Math.PI) / 180);
  const px = (lng - a[1]) * escalaLng;
  const py = (lat - a[0]) * METROS_POR_GRADO;
  const bx = (b[1] - a[1]) * escalaLng;
  const by = (b[0] - a[0]) * METROS_POR_GRADO;
  const largo2 = bx * bx + by * by;
  // t dice en qué parte del tramo cae la proyección del punto: 0 = esquina a, 1 = esquina b.
  const t = largo2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / largo2));
  return Math.hypot(px - t * bx, py - t * by);
}

// Devuelve { id, tipo, distancia } de la cuadra más cercana, o null si el punto está fuera de la zona.
function ubicarCuadra(lat, lng, vias, maximo = DISTANCIA_MAXIMA_METROS) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Array.isArray(vias)) {
    return null;
  }

  let mejor = null;
  for (const via of vias) {
    if (!Array.isArray(via.tramo) || via.tramo.length !== 2) {
      continue;
    }
    const distancia = distanciaAlTramo(lat, lng, via.tramo);
    if (distancia <= maximo && (!mejor || distancia < mejor.distancia)) {
      mejor = { id: via.id, tipo: via.tipo, distancia: Math.round(distancia) };
    }
  }
  return mejor;
}

export { ubicarCuadra, DISTANCIA_MAXIMA_METROS, CUADRA_FUERA_DE_ZONA };
