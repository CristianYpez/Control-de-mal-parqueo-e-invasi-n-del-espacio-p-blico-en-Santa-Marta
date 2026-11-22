function convertirHoraEnMinutos(hora, descripcion) {
  const coincidencia = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!coincidencia) {
    throw new Error(`${descripcion} debe tener el formato HH:mm.`);
  }

  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) {
    throw new Error(`${descripcion} no es una hora válida.`);
  }
  return horas * 60 + minutos;
}

function esHoraPico(fechaHora, horasPico) {
  const coincidenciaFecha = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})$/.exec(fechaHora ?? "");
  if (!coincidenciaFecha) {
    throw new Error(`La fecha_hora "${fechaHora}" no tiene el formato AAAA-MM-DDTHH:mm.`);
  }
  const minutosDelReporte = convertirHoraEnMinutos(
    `${coincidenciaFecha[1]}:${coincidenciaFecha[2]}`,
    "La hora del reporte",
  );
  if (!Array.isArray(horasPico)) {
    throw new Error("criterios.horas_pico debe ser una lista de rangos horarios.");
  }

  const rangosEnMinutos = horasPico.map((rango) => {
    const coincidenciaRango = /^(.+)-(.+)$/.exec(rango);
    if (!coincidenciaRango) {
      throw new Error(`El rango de hora pico "${rango}" no tiene el formato HH:mm-HH:mm.`);
    }

    const inicio = convertirHoraEnMinutos(coincidenciaRango[1], `El inicio de "${rango}"`);
    const fin = convertirHoraEnMinutos(coincidenciaRango[2], `El final de "${rango}"`);
    if (inicio >= fin) {
      throw new Error(`El rango de hora pico "${rango}" no es válido.`);
    }
    return { inicio, fin };
  });
  return rangosEnMinutos.some(
    ({ inicio, fin }) => minutosDelReporte >= inicio && minutosDelReporte < fin,
  );
}

function contarValores(reportes, propiedad) {
  const conteos = new Map();
  for (const reporte of reportes) {
    const valor = reporte[propiedad];
    conteos.set(valor, (conteos.get(valor) ?? 0) + 1);
  }
  return conteos;
}

function obtenerPredominioUnico(conteos) {
  let valorPredominante = null;
  let mayorConteo = 0;
  let hayEmpate = false;

  for (const [valor, conteo] of conteos) {
    if (conteo > mayorConteo) {
      valorPredominante = valor;
      mayorConteo = conteo;
      hayEmpate = false;
    } else if (conteo === mayorConteo) {
      hayEmpate = true;
    }
  }

  // Un empate en el máximo no se considera predominio.
  return hayEmpate ? null : valorPredominante;
}

function obtenerRecomendacion(reportesDeCuadra, reportesAltosEnPico) {
  if (reportesAltosEnPico >= 3) {
    return {
      recomendacion: "patrullaje prioritario en hora pico",
      regla: `3 o más reportes de nivel Alto en hora pico (${reportesAltosEnPico}).`,
    };
  }

  const categoriaPredominante = obtenerPredominioUnico(contarValores(reportesDeCuadra, "categoria"));
  if (categoriaPredominante === "invasion_anden") {
    const cantidad = reportesDeCuadra.filter(
      (reporte) => reporte.categoria === categoriaPredominante,
    ).length;
    return {
      recomendacion: "operativo de espacio público",
      regla: `Predomina invasion_anden (${cantidad} reportes).`,
    };
  }

  const actorPredominante = obtenerPredominioUnico(contarValores(reportesDeCuadra, "actor"));
  if (actorPredominante === "vehiculo_carga") {
    const cantidad = reportesDeCuadra.filter(
      (reporte) => reporte.actor === actorPredominante,
    ).length;
    return {
      recomendacion: "revisar horario de cargue y descargue",
      regla: `Predomina vehiculo_carga (${cantidad} reportes).`,
    };
  }

  return { recomendacion: null, regla: null };
}

function resumirPorCuadra(reportes, criterios) {
  if (!Array.isArray(reportes)) {
    throw new Error("Los reportes deben ser una lista.");
  }

  const grupos = new Map();
  for (const reporte of reportes) {
    if (typeof reporte.criticidad?.puntaje !== "number" || !reporte.cuadra) {
      throw new Error(`El reporte "${reporte.id ?? "sin ID"}" no tiene cuadra o puntaje válido.`);
    }

    if (!grupos.has(reporte.cuadra)) {
      grupos.set(reporte.cuadra, []);
    }
    grupos.get(reporte.cuadra).push(reporte);
  }

  return [...grupos.entries()]
    .map(([cuadra, reportesDeCuadra]) => {
      const reportesAltosEnPico = reportesDeCuadra.filter(
        (reporte) =>
          (reporte.criticidad.nivel?.toLowerCase() === "alto" || reporte.criticidad.nivel === "Alto") &&
          esHoraPico(reporte.fecha_hora, criterios?.horas_pico),
      ).length;
      const puntajeTotal = reportesDeCuadra.reduce(
        (suma, reporte) => suma + reporte.criticidad.puntaje,
        0,
      );
      const { recomendacion, regla } = obtenerRecomendacion(
        reportesDeCuadra,
        reportesAltosEnPico,
      );

      return {
        cuadra,
        puntajeTotal,
        cantidadReportes: reportesDeCuadra.length,
        reportesAltosEnPico,
        recomendacion,
        regla,
      };
    })
    .sort(
      (primero, segundo) =>
        segundo.puntajeTotal - primero.puntajeTotal ||
        primero.cuadra.localeCompare(segundo.cuadra),
    )
    .slice(0, 5);
}

export { resumirPorCuadra };
