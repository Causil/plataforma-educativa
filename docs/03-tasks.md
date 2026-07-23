# GuIA — Tareas y Cronograma (Fase 2 · PLAN)
### Spec-driven · formato Kiro (`tasks.md`)

> **Ventana real: ~5 días** (hoy 22 jul → cierre **27 jul 23:59 UTC-6**). Regla: cada día termina con algo **desplegado y funcionando**. Prioridad P0 = imprescindible para la demo; P1 = mejora; P2 = si sobra tiempo.

---

## Cronograma de 5 días

| Día | Fecha | Meta del día (entregable desplegable) |
|---|---|---|
| **D0** | Mar 22 (hoy) | Repo + Amplify Gen2 inicializado + motor puro con tests + seed de ejercicios. |
| **D1** | Mié 23 | Loop de práctica end-to-end: pedir ejercicio → responder → dominio se actualiza. |
| **D2** | Jue 24 | Diagnóstico + Tutoría IA (Bedrock pistas/explicación con fallback). |
| **D3** | Vie 25 | Panel de progreso + visualización de ruta en vivo (el "wow") + UX. |
| **D4** | Sáb 26 | Deploy final + QA + seed rico + accesibilidad + README + diagrama. |
| **D5** | Dom 27 | Buffer + **grabar video** + entrega antes de 23:59 UTC-6. |

---

## D0 · Fundaciones  (P0)
- [ ] Inicializar proyecto: React + Vite + TS.
- [ ] `npm create amplify` (Amplify Gen2): Auth + Data + Functions scaffolding.
- [ ] Definir modelos de datos (Exercise, Mastery, RouteStep, Session).
- [ ] **Motor adaptativo** `engine/`: `updateMastery`, `selectNext`, `motivoDecision` (funciones puras).
- [ ] **Tests unitarios** del motor (acierto/fallo, umbral 0.85, degradación 3 fallos).
- [ ] **Seed** de 30–50 ejercicios (fracciones/álgebra) por subtema × dificultad (US-06).
- [ ] Primer deploy (aunque sea página vacía) para validar pipeline.

## D1 · Loop de práctica  (P0) — US-06, US-03
- [ ] Función `getNextExercise` (usa `selectNext`).
- [ ] Función `submitAnswer` (usa `updateMastery`, escribe `Mastery` + `RouteStep`).
- [ ] Vista **Práctica**: muestra ejercicio, recibe respuesta, feedback correcto/incorrecto.
- [ ] Auth mínima (Cognito email/contraseña) o modo invitado.
- [ ] Verificar latencia < 1 s. **Deploy.**

## D2 · Diagnóstico + IA  (P0) — US-02, US-04
- [ ] Flujo de **diagnóstico** (5–8 ítems) → inicializa `Mastery`. Omitir si ya hecho.
- [ ] Función `getHint` → **Bedrock** (pista socrática, no da respuesta) + **fallback**.
- [ ] Función `getExplanation` → Bedrock (paso a paso) + caché por `exerciseId`.
- [ ] Botón "Dame una pista" / "Explícame" en la vista Práctica. **Deploy.**

## D3 · Panel + "wow"  (P0/P1) — US-05
- [ ] `getProgress` (mapa de dominio + `RouteStep`).
- [ ] Componente **Mapa de dominio** (barras/heatmap por subtema, animado al cambiar).
- [ ] Componente **Línea de ruta** (timeline de decisiones con `motivoDecision`).
- [ ] Pulido de UX responsive (móvil). **Deploy.**

## D4 · Cierre técnico  (P0) — entregables
- [ ] QA del loop completo + arreglo de bugs.
- [ ] Seed rico para que la demo se vea llena.
- [ ] Accesibilidad básica (contraste, teclado, labels).
- [ ] Revisión de calidad/seguridad (Claude Code): endpoints protegidos, sin secretos en repo.
- [ ] **README** (qué es, cómo corre, arquitectura, stack AWS/Kiro) + **diagrama** (suma nota).
- [ ] **Deploy final estable** + URL pública verificada.

## D5 · Entrega  (P0)
- [ ] Guion + **grabar video**: problema → solución → demo del loop y del panel en vivo → stack AWS/Kiro.
- [ ] Subir video (YouTube/Drive) y enlazar.
- [ ] Verificar checklist de entregables (repo público + README + URL demo + video).
- [ ] **Enviar propuesta por el canal oficial antes de 27 jul 23:59 UTC-6.**

---

## Backlog P2 (solo si sobra tiempo)
- Generación de ejercicios nuevos con Bedrock al agotar banco.
- Gamificación (racha, insignias).
- Panel del docente.
- Más materias/temas.

## Reparto sugerido (si hay equipo 1–5)
- **Backend/IA:** motor + Lambdas + Bedrock.
- **Frontend/UX:** vistas + panel "wow" + responsive.
- **DevOps/Datos:** Amplify deploy + seed + README/diagrama.
- **Estrategia/Video:** guion, pitch, edición, entrega. (Yo, Claude Code, apoyo en specs, review y guion.)
