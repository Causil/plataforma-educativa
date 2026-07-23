# US-02 · Diagnóstico inicial

**Prioridad:** Alta · **Depende de:** US-01, US-06 · **Épica:** Ruta de aprendizaje

## Historia
Como **estudiante nuevo**, quiero **una prueba diagnóstica corta**, para que **el tutor conozca mi nivel de partida**.

## Criterios de aceptación (EARS)
1. CUANDO un estudiante inicia por primera vez, EL SISTEMA DEBERÁ presentar un diagnóstico de 5–8 ejercicios que cubran los subtemas del tema.
2. CUANDO el estudiante responde cada ejercicio, EL SISTEMA DEBERÁ registrar acierto/error y tiempo de respuesta.
3. CUANDO finaliza el diagnóstico, EL SISTEMA DEBERÁ calcular un dominio inicial (0–1) por subtema.
4. SI el estudiante ya completó el diagnóstico, ENTONCES EL SISTEMA DEBERÁ omitirlo e ir directo a la ruta adaptativa.

## Servicios AWS
- API Gateway + **Lambda** (`startDiagnostic`, `submitAnswer`).
- **DynamoDB** para persistir respuestas y estado de dominio.

## Modelo de datos
- Tabla `MasteryState`: `studentId (PK)`, `subtema (SK)`, `mastery (0–1)`, `intentos`, `aciertos`, `updatedAt`.
- Tabla `Sessions`: `studentId (PK)`, `sessionId (SK)`, `tipo=diagnostico`, `respuestas[]`, `completed`.

## Notas de implementación
- El diagnóstico elige 1 ejercicio de dificultad media por subtema (cobertura amplia, no profundidad).
- Dominio inicial: heurística simple (acierto → 0.6, fallo → 0.25; ajustar por tiempo). El refinamiento fino ocurre en US-03.
- Flag `diagnosticoCompletado` para no repetirlo.

## Definición de Hecho (DoD)
- [ ] Diagnóstico de 5–8 ítems funcionando.
- [ ] `MasteryState` inicializado por subtema al terminar.
- [ ] Se omite si ya fue completado.
- [ ] Test del cálculo de dominio inicial.
