Reto No. 2 · Introducción a la Ingeniería de Sistemas

# Santa Marta en orden

Control de mal parqueo e invasión del espacio público

Angel Florez · Universidad del Magdalena · 2026-2

Desplázate para recorrer el proyecto ↓

El problema

## Cuando el andén se vuelve parqueadero

Carros y motos sobre andenes, esquinas y cruces obligan a los peatones a caminar por la calzada.

Casos reales en Santa Marta

### Así se ve en la calle

![Camioneta con las ruedas traseras sobre el andén, junto a un charco de agua sucia](img/reporte-1.jpg)

**Ruedas sobre el andén.** El peatón debe rodear el vehículo por la calzada.

![Camioneta negra estacionada ocupando todo el ancho de un andén](img/reporte-2.jpg)

**Andén bloqueado.** El vehículo ocupa el paso en toda su anchura.

![Camión de carga blanco estacionado pegado al andén en una calle adoquinada](img/reporte-3.jpg)

**Vehículo de carga pegado al andén.** Reduce la visibilidad de quien cruza.

Fotos de reportes ciudadanos con las placas censuradas, como exige la propia aplicación.

Por qué importa

## Un andén ocupado afecta a todos

1

### Peatones

Sin andén libre, niños y adultos mayores caminan junto al tráfico.

2

### Accesibilidad

Una silla de ruedas o un coche de bebé no pasan por un andén bloqueado.

3

### Movilidad

Un vehículo en una esquina o cruce reduce la visibilidad y entorpece la vía.

La idea

## Sin datos no hay prioridades

Saber dónde, cuándo y quién estaciona mal es el primer paso. Cada reporte ciudadano se convierte en un dato.

La solución

## Del reporte a la decisión en cinco pasos

1

### Reportar

Marca el punto en el mapa o usa tu ubicación, describe la situación y el tipo de actor.

2

### Censurar

Pixela rostros y placas antes de guardar la foto.

3

### Calcular

Cada reporte recibe un puntaje de criticidad.

4

### Mapear

Los reportes forman un mapa de calor de la ciudad.

5

### Priorizar

Un resumen lista las cinco ubicaciones más críticas, con una recomendación.

Privacidad

## Reportar sin exponer a nadie

- La dirección se completa sola con datos de OpenStreetMap.
- Marcas rostros y placas y se pixelan en bloques.
- No se puede enviar hasta confirmar que no queda ningún dato personal.
- Solo se guarda la foto censurada.

Criticidad

## Cada reporte suma puntos

### Categoría

Qué tan grave es la situación.

+

### Tipo de vía

Si se identifica, aporta puntos.

+

### Franja horaria

Las horas pico pesan más.

\=

### Puntaje

Define el nivel de criticidad.

Barra ilustrativa, sin valores reales. Los puntajes, las horas pico y los niveles se configuran en datos/criterios.json. Si la vía no se puede clasificar desde el mapa, ese componente aporta cero.

Mapa de calor

## Dónde se concentra el problema

**Pocos reportes**Los primeros puntos aparecen dispersos por la ciudad.

**Se acumulan**Donde se repiten, el color pasa del amarillo hacia el naranja.

**Zona crítica**El rojo señala dónde actuar primero. Los puntos individuales se pueden mostrar u ocultar.

Menos reportesMás reportes

Panel de análisis

## Información lista para decidir

### Filtros

Por dirección o sector, franja horaria, situación y tipo de actor.

### Prioridades

Hasta cinco ubicaciones ordenadas por puntaje, con una recomendación.

### Gráficas

Barras comparativas por cuadra, categoría, actor, franja, criticidad y día.

### Datos

Importa y exporta reportes en JSON e imprime el resumen.

Tecnología y Arquitectura

## Una app web estática, modular y sin servidor

Stack tecnológico: HTML5 · CSS3 · JavaScript (ES6+ Modules) · Leaflet · Leaflet.heat · Turf.js · Chart.js · OpenStreetMap · Photon · localStorage

Se ejecuta con cualquier servidor estático (como Live Server o GitHub Pages). Los mapas base y la geocodificación requieren conexión a internet; la lógica analítica, el mapa de calor y el almacenamiento operan localmente en el navegador.

---

## Qué hace cada archivo y módulo del proyecto

### 1. Capa de Presentación e Interfaz de Usuario

* **`index.html` (Estructura semántica y vistas de la aplicación):**
  - Define la interfaz estructurada en tres vistas principales accesibles por pestañas: **Reportar** (formulario de captura rápida en < 30 s), **Tablero** (mapa interactivo de calor, filtros y lista de incidentes) y **Gráficas** (análisis estadístico comparativo).
  - Aloja el modal interactivo de censura fotográfica (canvas interactivo para pixelado), la leyenda flotante de criticidad en tiempo real, atajos rápidos a sectores representativos de Santa Marta y diálogos accesibles compatibles con estándares WAI-ARIA.

* **`styles.css` (Diseño responsivo, variables y estilos visuales):**
  - Implementa un sistema de diseño con variables CSS (`--bg-canvas`, `--accent-primary`, etc.) con soporte completo para **modo oscuro nativo** y **modo claro**.
  - Incluye efectos visuales de desenfoque de fondo (*glassmorphism*), animaciones de radar en el pin de captura y adaptación fluida a pantallas móviles, tabletas y computadores de escritorio.
  - Aplica un filtro monocromático optimizado a las teselas de OpenStreetMap en modo oscuro para lograr una estética limpia tipo GIS sin depender de servicios externos con marcas de agua.

---

### 2. Módulos de Lógica del Sistema (JavaScript ES6+)

* **`captura.js` (Controlador central y orquestador del flujo de usuario):**
  - **Formulario de captura:** Valida datos de entrada (categoría, tipo de actor, fotos, coordenadas y dirección) y emite notificaciones de estado.
  - **Censura interactiva obligatoria:** Controla el canvas de pixelado de rostros y placas en bloques de 12 px (Ley 1581 de protección de datos personales), bloqueando el envío del reporte hasta que el usuario confirme que no existen datos sensibles visibles.
  - **Geocodificación inversa automática:** Consulta los servicios de Photon y OpenStreetMap para autocompletar la dirección de la vía a partir de las coordenadas del mapa.
  - **Scroll infinito progresivo:** Administra la lista de reportes en el tablero mediante un observador de intersección (*IntersectionObserver*), renderizando elementos en lotes de 6 para mantener una navegación fluida y sin bloqueos de memoria.
  - **Persistencia e importación/exportación:** Lee y guarda en el `localStorage` del navegador, y permite descargar o cargar copias de seguridad en formato JSON evitando registros duplicados.

* **`mapa.js` (Motor cartográfico, mapa de calor y validación espacial):**
  - **Gestión de mapas duales:** Inicializa y sincroniza los dos mapas Leaflet (el mapa de marcado en la vista de captura y el mapa analítico de calor en el tablero).
  - **Mapa de calor adaptativo:** Implementa `Leaflet.heat` con calibración dinámica según el zoom (radio de 8 px a 42 px, desenfoque proporcional y agrupación en cuadrícula) para evitar manchas desproporcionadas al alejarse y halos invisibles al acercarse.
  - **Perímetro urbano y máscara exterior:** Dibuja el polígono oficial de Santa Marta (`L.geoJSON`) con borde blanco discontinuo (`dashArray: "6, 6"`) y proyecta una máscara exterior invertida (*Cookie Cutter*) que atenúa el mar y la sierra para resaltar únicamente la ciudad.
  - **Validación espacial con Turf.js:** Emplea `turf.booleanPointInPolygon` para verificar que cualquier clic, reporte o punto del mapa de calor se ubique estrictamente dentro de la zona urbana autorizada de Santa Marta.

* **`criticidad.js` (Algoritmo de cálculo de severidad e índice de riesgo):**
  - Calcula de manera transparente un puntaje entero entre **2 y 9 puntos** para cada incidente.
  - Aplica la fórmula ponderada de tres dimensiones configuradas en `criterios.json`:
    1. **Gravedad de la infracción:** Doble fila (3 pts), invasión de andén (3 pts), rampa/cebra (2 pts).
    2. **Tipo de vía:** Vía arterial/principal (3 pts), vía secundaria/colectora (1 pt).
    3. **Franja horaria:** Hora pico (3 pts), hora valle (1 pt).
  - Clasifica el resultado en tres niveles de alerta: **Bajo (2–4 pts)**, **Medio (5–7 pts)** y **Alto (8–9 pts)**.

* **`cuadras.js` (Geometría espacial y asignación de tramos viales):**
  - Implementa un algoritmo geométrico de distancia perpendicular punto-a-segmento para asociar automáticamente las coordenadas de un reporte con el tramo vial más cercano (< 30 m) registrado en `vias.json`.
  - Si el reporte se ubica fuera de los corredores mapeados, se le asigna la etiqueta "Fuera de la zona" aportando 0 puntos al componente de tipo de vía.

* **`filtros.js` (Motor de filtrado reactivo multidimensional):**
  - Permite filtrar instantáneamente el conjunto de reportes por dirección/sector, franja horaria (mañana, tarde, noche, horas pico), situación de mal parqueo y tipo de actor vial (particular, moto, carga, comercial).
  - Emite eventos desacoplados para actualizar simultáneamente las tarjetas del tablero, el mapa de calor y las gráficas analíticas.

* **`resumen.js` (Agregación territorial y recomendaciones operativas):**
  - Agrupa los reportes filtrados por cuadra o intersección y totaliza los puntajes de criticidad acumulados.
  - Genera automáticamente el **Top 5 de ubicaciones críticas prioritarias** con recomendaciones operativas derivadas de reglas explícitas (por ejemplo, operativos de grúa para doble fila, horarios de descargue comercial o despeje de andenes).

---

### 3. Capa de Datos y Geometría Espacial

* **`santa-marta-perimetro.geojson` (Límite Urbano Oficial):**
  - Archivo en formato estándar GeoJSON (`FeatureCollection`) que contiene el polígono de **73 vértices detallados** de la zona urbana de Santa Marta.
  - Traza la silueta real de la línea de costa (Taganga, Bahía de Santa Marta, El Rodadero, Pozos Colorados), el corredor oriental hacia Bonda y el límite suroriental en el pie de monte, excluyendo el mar y las áreas rurales de la Sierra Nevada.

* **`datos/vias.json` (Malla de corredores y tramos viales):**
  - Catálogo geoespacial con los tramos viales caracterizados en campo, incluyendo sus coordenadas de inicio y fin (`lat`, `lng`), nombre de la vía, sentido y jerarquía (arterial o secundaria).

* **`datos/criterios.json` (Reglas normativas y parámetros de evaluación):**
  - Almacena las ponderaciones de cada categoría de mal parqueo, la definición horaria exacta de las horas pico de Santa Marta y los rangos de puntaje para los niveles de criticidad.

* **`datos/reportes.json` (Base de datos de campo inicial):**
  - Contiene los 30 registros reales recopilados durante el levantamiento en terreno, con sus coordenadas, estampas de tiempo, tipo de actor vial, fotografías con censura aplicada y evaluaciones calculadas.

Alcance

## Un prototipo con límites claros

### Hoy

- Prototipo educativo, no un sistema oficial de denuncias.
- Los reportes viven en el navegador de cada dispositivo.
- El perímetro de cobertura es aproximado.
- Los datos de ejemplo y las reglas deben verificarse.

### Siguientes pasos posibles

- Base de datos central para compartir reportes.
- Validar las reglas de criticidad con expertos en movilidad.
- Usar un perímetro oficial de la ciudad.
- Conectar los reportes con la entidad responsable.

Para cerrar

## Una ciudad en orden empieza con un reporte

Gracias. ¿Preguntas?

Angel Florez · Universidad del Magdalena · Repositorio en GitHub: lilangel-stack