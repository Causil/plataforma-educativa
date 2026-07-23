# US-05 · Panel de progreso y visualización de la ruta ⭐ (el "wow" de la demo)

**Prioridad:** Alta · **Depende de:** US-03 · **Épica:** Experiencia / Demo

## Historia
Como **estudiante**, quiero **ver mi dominio por subtema y cómo se adapta mi ruta**, para **sentir que avanzo** (y para el "wow" ante el jurado).

## Criterios de aceptación (EARS)
1. EL SISTEMA DEBERÁ mostrar el dominio actual por subtema de forma visual (barras/mapa de calor).
2. CUANDO el dominio cambia tras una respuesta, EL SISTEMA DEBERÁ actualizar la visualización en tiempo real.
3. EL SISTEMA DEBERÁ mostrar la **secuencia de la ruta adaptativa** (qué se decidió y por qué) de forma comprensible.

## Servicios AWS
- Frontend (**Amplify Hosting** o **S3 + CloudFront**) consumiendo la API.

## Notas de implementación
- Componente **"Mapa de dominio"**: barra/heatmap por subtema (0–1), color según nivel.
- Componente **"Línea de ruta"**: timeline de decisiones leyendo `RouteLog` (`motivoDecision`) → esto es lo que hace *visible* el diferenciador.
- Animar la transición de dominio tras responder (refuerza el "en vivo").
- Diseño limpio y móvil (suma en UX y en el video).

## Enganche con la demo/video
- Guion: responder 2–3 ejercicios y señalar cómo cambia el mapa y la ruta en tiempo real.

## Definición de Hecho (DoD)
- [ ] Mapa de dominio por subtema visible y correcto.
- [ ] Actualización en tiempo real tras cada respuesta.
- [ ] Timeline de decisiones de la ruta legible.
- [ ] Responsive en móvil.
