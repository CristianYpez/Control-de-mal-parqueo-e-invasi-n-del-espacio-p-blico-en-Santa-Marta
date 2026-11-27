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

Tecnología

## Una app web estática, sin servidor

HTMLCSSJavaScriptLeafletLeaflet.heatOpenStreetMapPhotonlocalStorage

Se ejecuta con cualquier servidor estático. Los mapas necesitan conexión a internet.

| Archivo | Propósito |
| --- | --- |
| captura.js | Registro, validación, almacenamiento y estadísticas |
| mapa.js | Mapas, ubicación y capas de reportes |
| criticidad.js | Puntaje y nivel de criticidad |
| filtros.js | Filtros y franjas horarias |
| resumen.js | Agrupación por cuadra y recomendaciones |
| datos/\*.json | Reportes, vías y criterios |

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