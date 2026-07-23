# US-03 · Motor de ruta adaptativa ⭐ (núcleo diferenciador)

**Prioridad:** CRÍTICA · **Depende de:** US-02, US-06 · **Épica:** Ruta de aprendizaje

## Historia
Como **estudiante**, quiero que **el siguiente ejercicio se ajuste a mi desempeño en tiempo real**, para **practicar justo lo que necesito, ni muy fácil ni muy difícil**.

## Criterios de aceptación (EARS)
1. CUANDO el estudiante responde un ejercicio, EL SISTEMA DEBERÁ actualizar el dominio del subtema en < 1 s.
2. CUANDO se requiere el siguiente ejercicio, EL SISTEMA DEBERÁ seleccionar subtema y dificultad que maximicen el aprendizaje (zona de desarrollo próximo).
3. MIENTRAS un subtema tenga dominio ≥ 0.85, EL SISTEMA DEBERÁ despriorizarlo y avanzar al siguiente.
4. SI el estudiante falla el mismo subtema 3 veces seguidas, ENTONCES EL SISTEMA DEBERÁ bajar la dificultad e insertar un ejercicio de refuerzo.
5. EL SISTEMA DEBERÁ registrar la secuencia de decisiones (para visualizar/auditar — ver US-05).

## Servicios AWS
- **Lambda** `getNextExercise` + `updateMastery` (lógica del motor, sin IA pesada → barato y rápido).
- **DynamoDB** `MasteryState`, `RouteLog`.

## Algoritmo (ligero, eficiente — ventaja de innovación)
- **Actualización de dominio:** Bayesian Knowledge Tracing (BKT) simplificado *o* Elo por subtema.
  - Ej. Elo: `mastery' = mastery + K · (resultado − dificultadEsperada)`.
- **Selección del siguiente ítem:** priorizar el subtema con mayor "ganancia esperada" (dominio lejos de 0 y de 1); elegir dificultad ≈ nivel actual + 1 (reto alcanzable).
- Reglas duras: umbral de maestría 0.85; degradación tras 3 fallos.

## Modelo de datos
- `RouteLog`: `studentId (PK)`, `step (SK)`, `subtema`, `dificultad`, `resultado`, `masteryAntes`, `masteryDespues`, `motivoDecision`, `timestamp`.

## Notas de implementación
- Mantener el motor **determinista y testeable** (funciones puras para update y selección) → facilita tests y la explicación al jurado.
- `motivoDecision` en texto legible ("subtema con menor dominio", "bajé dificultad por 3 fallos") → alimenta la visualización de US-05.

## Definición de Hecho (DoD)
- [ ] `updateMastery` y `getNextExercise` como funciones puras + Lambda.
- [ ] Cumple los 5 criterios EARS.
- [ ] Tests unitarios de: actualización, selección, umbral, degradación.
- [ ] Latencia < 1 s (p95) verificada.
