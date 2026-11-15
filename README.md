# Santa Marta en orden

Prototipo web ciudadano para registrar y consultar situaciones de mal parqueo e invasión del espacio público en Santa Marta, Colombia.

## Funcionalidades

- **Registro ciudadano:** permite seleccionar una cuadra, describir la situación y el tipo de actor, marcar un punto en el mapa o usar la geolocalización del dispositivo y adjuntar una foto opcional.
- **Catálogo de cuadras ampliable:** el campo permite buscar entre las vías de `datos/vias.json`; al agregar vías a ese catálogo, aparecen también como sugerencias para el registro y los filtros. La dirección o referencia del reporte se puede especificar aparte.
- **Tarjetas de infracciones:** una vista dedicada lista los reportes con dirección o cuadra, actor, situación, fecha y coordenadas. El botón de cada tarjeta centra el mapa en el punto y abre sus detalles.
- **Validación de ubicación:** solo acepta puntos dentro de un perímetro aproximado definido en `mapa.js`, ampliado hacia el sur por la Vía de Minca y la costa hasta incluir Gaira y Pozos Colorados. El contorno es ilustrativo y no representa un límite oficial.
- **Almacenamiento local:** los reportes nuevos se guardan en `localStorage` del navegador. No hay servidor ni base de datos central; los datos permanecen en el dispositivo y navegador usados.
- **Mapa y tablero:** presenta los reportes sobre un mapa de calor y permite mostrar u ocultar sus puntos individuales. El mapa base utiliza OpenStreetMap.
- **Filtros y prioridades:** permite filtrar por cuadra, franja horaria, situación y tipo de actor. El resumen presenta hasta cinco cuadras, ordenadas por puntaje total, con recomendaciones según las reglas definidas.
- **Criticidad:** calcula un puntaje sumando los valores de la categoría, el tipo de vía y la franja horaria. Las horas pico, valores y niveles se configuran en `datos/criterios.json`.
- **Importación y exportación:** importa reportes desde un archivo JSON, omite identificadores duplicados y valida los registros nuevos; también permite descargar los reportes actuales.
- **Impresión:** el botón de impresión genera una versión del resumen operativo adecuada para imprimir.
- **Privacidad:** el formulario recomienda no capturar placas, rostros ni otros datos personales. Las fotos y reportes ciudadanos se conservan localmente.
- **Interfaz accesible:** diseño adaptable a móvil y escritorio, controles etiquetados, mensajes de estado y animaciones de aparición al desplazarse, desactivadas cuando el dispositivo solicita reducir el movimiento.
- **Tema claro y oscuro:** el selector del encabezado alterna la apariencia, guarda la preferencia en el navegador y respeta el tema del sistema en la primera visita. Los mapas mantienen sus colores originales.

## Estructura

| Archivo | Propósito |
| --- | --- |
| `index.html` | Interfaz, estilos y animaciones de desplazamiento. |
| `captura.js` | Carga de datos, registro, validación, almacenamiento, importación/exportación, filtros y resumen. |
| `mapa.js` | Mapas Leaflet, selección de ubicación, perímetro aproximado y capas de reportes. |
| `criticidad.js` | Cálculo del puntaje y nivel de criticidad. |
| `filtros.js` | Filtrado de reportes y clasificación horaria. |
| `resumen.js` | Agrupación por cuadra y reglas de recomendación operativa. |
| `datos/reportes.json` | Reportes de ejemplo que se cargan al iniciar. |
| `datos/vias.json` | Cuadras y tipos de vía usados en el puntaje. |
| `datos/criterios.json` | Puntajes, rangos de hora pico y niveles de criticidad. |

## Cómo ejecutarlo

La aplicación es estática y no requiere instalación de dependencias del proyecto. Debe servirse por HTTP para que el navegador pueda cargar los módulos JavaScript y archivos JSON. Desde la carpeta del proyecto, ejecuta:

```powershell
python -m http.server 8000
```

Luego abre <http://localhost:8000>. También se puede utilizar cualquier servidor estático local equivalente.

Leaflet, Leaflet.heat y las teselas de OpenStreetMap se obtienen de servicios externos, por lo que las funciones de mapa requieren conexión a internet. La geolocalización depende del permiso del usuario y de que el navegador la permita en el contexto de ejecución.

## Alcance y limitaciones

Este proyecto es un prototipo educativo, no un sistema oficial de recepción o atención de denuncias. La ubicación se limita mediante un polígono aproximado; los datos de ejemplo y las reglas de criticidad deben verificarse antes de cualquier uso operativo. La información guardada en el navegador no se sincroniza entre dispositivos ni se envía a una entidad.
