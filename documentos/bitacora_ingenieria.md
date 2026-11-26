<p align="center">
  <img src="../logo/unimagdalena-logo.png" alt="Universidad del Magdalena" width="200" />
</p>

<h1 align="center">Bitácora de Ingeniería · Reto No. 2</h1>
<h3 align="center">Control de Mal Parqueo e Invasión del Espacio Público en Santa Marta</h3>

<p align="center">
  <strong>Universidad del Magdalena · Facultad de Ingeniería · Introducción a la Ingeniería de Sistemas (2026-2)</strong><br>
  <strong>Equipo:</strong> Trancón Samario · <strong>Docente:</strong> Aquiles Cohen
</p>

<p align="center">
  ▶️ <a href="https://controldelmalparqueo.vercel.app/"><strong>Demo en línea</strong></a> · 
  <a href="../README.md">README principal</a> · 
  <a href="anexo_evidencia_campo.md">Anexo de campo</a> · 
  <a href="diagrama_arquitectura.md">Diagrama de arquitectura</a>
</p>

---

### Integrantes del Equipo

| Integrante | Rol Oficial | Aporte en el Proyecto |
| :--- | :--- | :--- |
| **Sergio Orejarena** | Integrador del mapa e instrucciones IA | Organización del proyecto; desarrollo con la IA (mapa de calor dinámico, canvas de censura, calibración, comparador, pruebas y documentos); conteo del Conector Troncal e integración web. |
| **Jose Lopez** | Analista de campo y privacidad | Conteo de la Av. del Ferrocarril (entradas y salidas); levantamiento de evidencia fotográfica y estructuración de `datos/vias.json`. |
| **Juan Ariza** | Ingeniero de lógica y clasificación | Conteo de la Calle 31 (oriente) (entradas y salidas); calibración del índice de criticidad en `criterios.json` y algoritmos de filtrado. |
| **Oswel Moreno** | Diseñador de interfaz y documentador | Conteo de la Calle 31 (sur) en hora pico; protocolo de anonimización y censura de placas/rostros (Ley 1581); redacción de anexos y estilos UI. |

---

## 1. Definición y Justificación del Índice de Criticidad

El cálculo de criticidad del sistema asigna un puntaje entero entre **2 y 9 puntos** a cada incidente reportado, categorizándolo en tres niveles de severidad operativa: **Bajo (0 a 4 pts)**, **Medio (5 a 6 pts)** y **Alto (7 a 9 pts)**.

$$\text{Puntaje Total} = \text{Peso}_{\text{categoría}} + \text{Peso}_{\text{tipo\_vía}} + \text{Peso}_{\text{franja\_horaria}}$$

### Justificación de los Pesos (`datos/criterios.json`):

1. **Categoría de la Obstrucción:**
   - **Doble fila / vía prohibida (3 pts):** Reduce drásticamente la capacidad vial de la calzada vehicular. En vías arteriales de Santa Marta como la Av. Campo Serrano (Carrera 5ta) o la Av. del Ferrocarril, un vehículo estacionado en doble fila reduce la calzada a un solo carril, generando embotellamientos que afectan a cientos de usuarios y transporte público colectivo (TPC).
   - **Bloqueo de rampa, cebra o paradero (3 pts):** Atenta directamente contra la accesibilidad universal y la vida de personas con movilidad reducida (sillas de ruedas, adultos mayores, coches de bebés) obligándolos a transitar sobre la calzada vehicular de alto tráfico.
   - **Invasión de andén por comercio o mercancía (2 pts):** Aunque vulnera el espacio peatonal, generalmente ofrece un margen de maniobra de paso superior a un bloqueo total de rampa o doble fila vehicular continua.

2. **Tipo de Vía (`datos/vias.json`):**
   - **Vía Arterial (3 pts):** Conectores de alto flujo metropolitano que canalizan el transporte interurbano y de carga liviana. Cualquier interrupción causa colapso en cadena en las vías secundarias circundantes.
   - **Vía Secundaria (1 pt):** Calles residenciales o comerciales de baja velocidad donde el impacto del estacionamiento indebido es localizado y el desvío es factible sin congestionar el eje de la ciudad.

3. **Franja Horaria:**
   - **Hora Pico (3 pts):** Franjas de alta demanda laboral y escolar (`06:30–08:30`, `11:30–14:00`, `17:00–19:30`). En estos intervalos, la capacidad de la malla vial opera cerca del límite de saturación.
   - **Hora Valle (1 pt):** Horarios diurnos de demanda moderada donde la interferencia vial genera retrasos menores pero no colapsos prolongados.

### Ejemplo de cálculo a mano:
* **Reporte MP-015:** Vehículo en doble fila (3 pts) en la Av. del Ferrocarril [Arterial] (3 pts) a las 17:00 [Hora Pico] (3 pts).  
  $$\text{Total} = 3 + 3 + 3 = 9 \text{ pts} \longrightarrow \mathbf{Nivel\ Alto}$$
* **Reporte MP-012:** Rampa bloqueada (3 pts) en calle de barrio Comuna 1 [Secundaria] (1 pt) a las 16:59 [Hora Valle] (1 pt).  
  $$\text{Total} = 3 + 1 + 1 = 5 \text{ pts} \longrightarrow \mathbf{Nivel\ Medio}$$

---

## 2. Patrones Encontrados en el Trabajo de Campo (Santa Marta)

Durante los recorridos de observación realizados en dos jornadas (hora pico de la tarde y hora valle de la mañana):
1. **Comportamiento recurrente por actor:** Los *vehículos particulares* son los mayores generadores de doble fila frente a zonas bancarias y de comidas rápidas con paradas "rápidas" que superan los 15 minutos. En cambio, los *vehículos de carga* predominan en las mañanas cerca a distribuidores y tiendas de abarrotes sin respetar bahías de cargue.
2. **Invasión de andenes por motocicletas:** En sectores comerciales como la Carrera 5ta y alrededores del Mercado Público, las motocicletas utilizan los andenes peatonales como parqueadero alterno para evitar el pago de parqueaderos formales.
3. **Puntos ciegos de fiscalización:** Los sectores por fuera de las avenidas principales (clasificados como «Fuera de la zona») presentan una acumulación alta de reportes ciudadanos pero escasa presencia de agentes de movilidad en horas valle.

---

## 3. Bitácora de Iteración con Agentes de Inteligencia Artificial

Siguiendo la exigencia del Reto No. 2, se documentan fallos reales presentados por el asistente de IA durante el desarrollo, cómo fueron identificados y cómo se subsanaron:

### Fallo 1: Desbordamiento horizontal (`overflow-x`) y colapso de altura en tarjetas del reporte

* **Lo que se pidió:**  
  *"Rediseña las tarjetas de reporte con un layout horizontal compacto y elimina el scroll horizontal en la sección de historial de reportes."*
* **Lo que entregó la IA:**  
  La IA aplicó `display: flex; flex-direction: row;` a las tarjetas y fijó contenedores con `overflow-x: hidden;` pero mantuvo `overflow-y: auto; max-height: calc(100% - 3.8rem);` en el contenedor padre. Al renderizar en navegadores Chromium sobre Windows, la barra de desplazamiento vertical (~17px) redujo el ancho disponible del contenedor flex forzando a que las tarjetas colapsaran verticalmente a líneas de apenas 20px de altura con texto cortado.
* **Cómo se notó:**  
  En la prueba de visualización en vivo (captura adjunta por el usuario), las tarjetas de incidentes aparecían como franjas diminutas aplastadas unas sobre otras, siendo completamente ilegibles.
* **Cómo se corrigió:**  
  Se reestructuraron las reglas CSS aplicando `min-height: 84px; flex-shrink: 0;` a las tarjetas `.report-card`, permitiendo que el listado fluyera con `overflow: visible;` en el contenedor principal y reemplazando la limitación fija de altura por un observador de desplazamiento progresivo (`IntersectionObserver`).
* **Instrucción final que funcionó:**  
  *"Asegura que cada tarjeta tenga un min-height explícito, flex-shrink: 0 y box-sizing: border-box. Elimina el max-height restrictivo del contenedor padre para que las tarjetas se rendericen con altura completa y el scroll sea el de la página."*

---

### Fallo 2: Fallo de renderizado y tamaño en la capa de mapa de calor (`Leaflet.heat`)

* **Lo que se pidió:**  
  *"Haz que el mapa ocupe todo el ancho disponible a la izquierda y se mantenga estático/sticky mientras se exploran los reportes."*
* **Lo que entregó la IA:**  
  La IA cambió la cuadrícula de `.columnas-tablero` a `minmax(0, 1fr) minmax(380px, 440px)` y aplicó `position: sticky` en el mapa. Sin embargo, al cambiar el ancho del contenedor en tiempo de ejecución, el lienzo canvas interno de `Leaflet` y `Leaflet.heat` retuvo las dimensiones originales en píxeles, dejando una franja gris vacía en el costado izquierdo del mapa.
* **Cómo se notó:**  
  Al redimensionar la ventana o cargar la vista de tablero en pantallas anchas, las teselas de OpenStreetMap y el gradiente de calor no cubrían el área completa del elemento `#mapa-tablero`.
* **Cómo se corrigió:**  
  Se enlazó la llamada defensiva `mapa.invalidateSize()` dentro de los eventos de redimensionamiento de ventana y cambio de pestaña de vistas, además de forzar `width: 100%; height: 100%` en la regla `.mapa--tablero`.
* **Instrucción final que funcionó:**  
  *"Cada vez que se altere la visibilidad o el tamaño de la columna del mapa, ejecuta un debounce de `mapa.invalidateSize()` para que Leaflet recalcule inmediatamente los tiles y las coordenadas de la capa de calor."*

---

### Fallo 3: Pérdida de interactividad del botón de edición y censura de fotos

* **Lo que se pidió:**  
  *"Agrega un botón en el modal de detalle para editar o censurar fotos de reportes existentes."*
* **Lo que entregó la IA:**  
  Al hacer clic en «Editar / Censurar foto», la IA abría el canvas de censura (`iniciarEdicionFotoReporte`), pero no cerraba el modal dialog HTML5 nativo (`#modal-visor-foto`), lo que provocaba que el canvas quedara cubierto por el backdrop modal oscuro bloqueando la interacción táctil y del mouse para dibujar rectángulos.
* **Cómo se notó:**  
  El cursor quedaba inactivo y no se podían seleccionar las placas de los vehículos en la vista de censura.
* **Cómo se corrigió:**  
  Se agregó `modal.close()` previo a la inicialización del lienzo de pixelado y se implementó un flujo de retorno que restaura el reporte censurado en `localStorage` actualizando reactivamente la miniatura en la lista.
* **Instrucción final que funcionó:**  
  *"Cierra el diálogo modal activo antes de cambiar a la vista de censura y asegura que el canvas reciba el foco y capture los eventos touch/mouse."*
