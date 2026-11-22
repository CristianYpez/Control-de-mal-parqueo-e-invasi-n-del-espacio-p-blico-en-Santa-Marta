// Calcula la criticidad sin modificar el reporte ni depender del navegador.
function calcularCriticidad(reporte, vias, criterios) {
  if (!reporte || !Array.isArray(vias) || !criterios) {
    throw new Error("Faltan datos válidos para calcular la criticidad.");
  }

  const puntosCategoria = criterios.categoria?.[reporte.categoria];
  if (typeof puntosCategoria !== "number") {
    throw new Error(`No hay puntaje configurado para la categoría "${reporte.categoria}".`);
  }

  const cuadra = vias.find((via) => via.id === reporte.cuadra);
  const puntosVia = cuadra ? criterios.via?.[cuadra.tipo] : 0;
  if (typeof puntosVia !== "number") {
    throw new Error(`No hay puntaje configurado para el tipo de vía "${cuadra.tipo}".`);
  }

  const coincidenciaFechaHora = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(
    reporte.fecha_hora ?? "",
  );
  if (!coincidenciaFechaHora) {
    throw new Error("La fecha_hora debe tener el formato AAAA-MM-DDTHH:mm.");
  }

  const [, fecha, hora, minuto] = coincidenciaFechaHora;
  const fechaValida = new Date(`${fecha}T00:00:00`);
  if (
    Number.isNaN(fechaValida.getTime()) ||
    fechaValida.toISOString().slice(0, 10) !== fecha ||
    Number(hora) > 23 ||
    Number(minuto) > 59
  ) {
    throw new Error(`La fecha_hora "${reporte.fecha_hora}" no es válida.`);
  }

  const minutosDelReporte = Number(hora) * 60 + Number(minuto);
  const estaEnHoraPico = (criterios.horas_pico ?? []).some((rango) => {
    const coincidenciaRango = /^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/.exec(rango);
    if (!coincidenciaRango) {
      throw new Error(`El rango de hora pico "${rango}" no tiene el formato HH:mm-HH:mm.`);
    }

    const [, horaInicio, minutoInicio, horaFin, minutoFin] = coincidenciaRango;
    const inicio = Number(horaInicio) * 60 + Number(minutoInicio);
    const fin = Number(horaFin) * 60 + Number(minutoFin);
    if (
      Number(horaInicio) > 23 ||
      Number(horaFin) > 23 ||
      Number(minutoInicio) > 59 ||
      Number(minutoFin) > 59 ||
      inicio >= fin
    ) {
      throw new Error(`El rango de hora pico "${rango}" no es válido.`);
    }

    return minutosDelReporte >= inicio && minutosDelReporte < fin;
  });

  const nombreFranja = estaEnHoraPico ? "pico" : "valle";
  const puntosFranja = criterios.franja?.[nombreFranja];
  if (typeof puntosFranja !== "number") {
    throw new Error(`No hay puntaje configurado para la franja "${nombreFranja}".`);
  }

  const puntaje = puntosCategoria + puntosVia + puntosFranja;

  // El nivel es el más alto cuyo mínimo alcanza el puntaje. Con los valores de criterios.json:
  // Bajo empieza en 0, Medio en 5 y Alto en 7. Un puntaje de 8 alcanza los tres mínimos y se queda con Alto.
  // Así, si se sube un peso y el puntaje pasa del tope (por ejemplo 10), sigue siendo Alto en vez de fallar.
  const niveles = Object.entries(criterios.niveles ?? {})
    .filter(([, rango]) => Array.isArray(rango) && typeof rango[0] === "number")
    .sort(([, rangoA], [, rangoB]) => rangoA[0] - rangoB[0]);
  if (niveles.length === 0) {
    throw new Error("criterios.json no tiene niveles configurados.");
  }

  let nivel = niveles[0][0];
  for (const [nombre, rango] of niveles) {
    if (puntaje >= rango[0]) {
      nivel = nombre;
    }
  }

  return { puntaje, nivel };
}

export { calcularCriticidad };
