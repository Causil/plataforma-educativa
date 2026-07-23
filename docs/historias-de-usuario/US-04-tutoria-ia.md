# US-04 · Tutoría con IA (Bedrock)

**Prioridad:** Alta · **Depende de:** US-03 · **Épica:** Tutoría IA

## Historia
Como **estudiante**, quiero **pistas y explicaciones cuando me equivoco**, para **entender el porqué en lugar de solo ver la respuesta**.

## Criterios de aceptación (EARS)
1. CUANDO el estudiante falla un ejercicio, EL SISTEMA DEBERÁ generar una **pista socrática** (no la respuesta directa) adaptada a su nivel de dominio.
2. CUANDO el estudiante solicita una explicación, EL SISTEMA DEBERÁ generar una explicación paso a paso del subtema.
3. EL SISTEMA DEBERÁ invocar Bedrock **solo bajo demanda** (fallo o solicitud), no en cada interacción.
4. SI la IA falla o excede el tiempo límite, ENTONCES EL SISTEMA DEBERÁ mostrar una pista de respaldo predefinida (degradación elegante).

## Servicios AWS
- **Amazon Bedrock** (modelo Claude) vía Lambda `getHint` / `getExplanation`.

## Diseño del prompt (clave pedagógica = innovación)
- **Rol:** tutor socrático de matemáticas para secundaria.
- **Entradas:** enunciado, respuesta del alumno, subtema, dominio actual (0–1).
- **Regla dura:** *nunca* dar la respuesta final en una pista; guiar con una pregunta o el siguiente paso. En "explicación" sí se resuelve paso a paso.
- **Nivel:** lenguaje más simple si `mastery` bajo; más conciso si alto.
- **Salida:** breve (1–3 frases para pista).

## Notas de implementación
- Timeout ~4 s + fallback a `explicacionBase` del ejercicio (US-06).
- Cachear explicaciones por `(exerciseId)` para no re-generar → menor costo/latencia.
- Registrar tokens usados para el análisis de costos.

## Definición de Hecho (DoD)
- [ ] Pista socrática que no revela la respuesta (validado con casos).
- [ ] Explicación paso a paso bajo demanda.
- [ ] Fallback funcionando si Bedrock falla.
- [ ] Invocación solo bajo demanda (verificado).
