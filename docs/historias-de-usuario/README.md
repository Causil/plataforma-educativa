# Historias de Usuario — GuIA (MVP)

Cada archivo es una historia autocontenida, lista para que **Kiro** la tome y genere esa parte del aplicativo (spec-driven). Orden sugerido de construcción por dependencias:

| # | Historia | Prioridad | Depende de |
|---|---|---|---|
| [US-01](./US-01-registro-y-acceso.md) | Registro y acceso | Alta | — |
| [US-06](./US-06-banco-ejercicios.md) | Banco de ejercicios | Alta | — |
| [US-02](./US-02-diagnostico-inicial.md) | Diagnóstico inicial | Alta | US-01, US-06 |
| [US-03](./US-03-motor-ruta-adaptativa.md) | Motor de ruta adaptativa ⭐ | **Crítica** | US-02, US-06 |
| [US-04](./US-04-tutoria-ia.md) | Tutoría con IA (Bedrock) | Alta | US-03 |
| [US-05](./US-05-panel-progreso.md) | Panel de progreso y ruta ⭐ | Alta | US-03 |

⭐ = núcleo del diferenciador y del "wow" de la demo.

**Convención de cada historia:** Historia · Criterios de aceptación (EARS) · Servicios AWS · Modelo de datos · Notas de implementación · Definición de Hecho (DoD).
