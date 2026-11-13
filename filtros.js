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

function obtenerFranja(fechaHora, horasPico) {
  const coincidenciaFecha = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})$/.exec(fechaHora ?? "");
  if (!coincidenciaFecha) {
    throw new Error(`La fecha_hora "${fechaHora}" no tiene el formato AAAA-MM-DDTHH:mm.`);
  }

  const minutosDelReporte =
    convertirHoraEnMinutos(`${coincidenciaFecha[1]}:${coincidenciaFecha[2]}`, "La hora del reporte");
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

  const estaEnHoraPico = rangosEnMinutos.some(
    ({ inicio, fin }) => minutosDelReporte >= inicio && minutosDelReporte < fin,
  );
  return estaEnHoraPico ? "pico" : "valle";
}

function filtrarReportes(reportes, filtrosActivos, criterios) {
  if (!Array.isArray(reportes) || !filtrosActivos) {
    throw new Error("Se necesita una lista de reportes y un objeto de filtros.");
  }

  const { cuadra, franja, categoria, actor } = filtrosActivos;
  if (franja && franja !== "pico" && franja !== "valle") {
    throw new Error(`La franja "${franja}" no es válida; usa "pico" o "valle".`);
  }

  return reportes.filter((reporte) => {
    if (cuadra && reporte.cuadra !== cuadra) {
      return false;
    }
    if (categoria && reporte.categoria !== categoria) {
      return false;
    }
    if (actor && reporte.actor !== actor) {
      return false;
    }
    if (franja && obtenerFranja(reporte.fecha_hora, criterios?.horas_pico) !== franja) {
      return false;
    }
    return true;
  });
}

export { filtrarReportes };
