# GuIA — Diseño y Arquitectura (Fase 2 · PLAN)
### Spec-driven · formato Kiro (`design.md`)

> ⚠️ **SUPERSEDIDO:** este documento corresponde al alcance v1 ("tutor de fracciones"). La arquitectura vigente es **[`06-arquitectura-v2.md`](./06-arquitectura-v2.md)** (plataforma de cursos, alcance R01–R24). Se conserva como historial de decisiones.

> Alcance = MVP de 5 días. Prioridad: **desplegable y demoable**. Elegimos el camino AWS más rápido de montar.

---

## 1. Decisión de arquitectura: AWS Amplify Gen2

**Elegimos AWS Amplify Gen2** como base porque en un solo proyecto TypeScript nos da, con IaC y deploy casi automático:
- **Auth** (Amazon Cognito) — login email/contraseña sin montar nada a mano.
- **Data** (AppSync + DynamoDB) — modelos tipados con autorización por usuario.
- **Functions** (Lambda) — para el motor adaptativo y las llamadas a Bedrock.
- **Hosting** — despliegue del frontend con CI desde GitHub.

Rationale (ventaja de *mantenibilidad/eficiencia* = puntos de innovación): menos glue-code, todo serverless (escala a cero → costo ~0 fuera de demo), y encaja con Kiro spec-driven (TS end-to-end). Alternativa descartada por tiempo: CDK/SAM a mano (más control, demasiado setup para 5 días).

## 2. Diagrama de arquitectura (lógico)

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  React + Vite + TS   (Amplify Hosting)             │
│  Vistas: Diagnóstico · Práctica · Panel de progreso/ruta     │
└───────────────┬─────────────────────────────────────────────┘
                │  (Amplify client, JWT Cognito)
        ┌───────▼────────┐
        │  AppSync (API) │  Amazon Cognito (Auth)
        └───┬────────┬───┘
            │        │
   ┌────────▼──┐  ┌──▼────────────────────┐
   │ DynamoDB  │  │ Lambda Functions       │
   │ (Data)    │  │  • nextExercise (motor)│
   │  Exercise │  │  • submitAnswer        │
   │  Mastery  │  │  • getHint ───────────┐│
   │  RouteStep│  │  • getExplanation ────┼┼──► Amazon Bedrock
   │  Session  │  └───────────────────────┘│    (Claude Haiku/Sonnet)
   └───────────┘                           │
                                    fallback local si falla
```

## 3. Modelo de datos (DynamoDB vía Amplify Data)

| Modelo | Campos clave | Autorización |
|---|---|---|
| **Exercise** | `id`, `subtema`, `dificultad(1–5)`, `tipo`, `enunciado`, `opciones[]`, `respuestaCorrecta`, `explicacionBase` | lectura pública/autenticada; escritura admin (seed) |
| **Mastery** | `owner`, `subtema`, `mastery(0–1)`, `intentos`, `aciertos`, `updatedAt` | dueño |
| **RouteStep** | `owner`, `step`, `subtema`, `dificultad`, `resultado`, `masteryAntes`, `masteryDespues`, `motivoDecision`, `ts` | dueño |
| **Session** | `owner`, `sessionId`, `tipo(diagnostico/practica)`, `estado`, `diagnosticoCompletado` | dueño |

> `owner` lo inyecta Amplify desde el `sub` de Cognito → aislamiento de datos por estudiante gratis.

## 4. Motor adaptativo (núcleo — funciones puras testeables)

Módulo TS puro `engine/` reutilizado por las Lambdas:

- **`updateMastery(mastery, dificultad, correcto) → mastery'`**
  Elo simplificado: `m' = clamp(m + K·(correcto − expected(m, dificultad)), 0, 1)`, `K≈0.15`.
- **`selectNext(masteryPorSubtema, historial) → {subtema, dificultad}`**
  Elige el subtema de mayor *ganancia esperada* (dominio ni ~0 ni ~1); dificultad ≈ nivel actual +1 (reto alcanzable). Reglas duras: umbral maestría 0.85; tras 3 fallos seguidos baja dificultad + refuerzo.
- **`motivoDecision(...) → string`** legible para el panel/jurado.

Determinista → tests unitarios sólidos y explicable en el pitch.

## 5. Diseño de API (AppSync)

| Operación | Entrada | Salida |
|---|---|---|
| `startSession` | — | `sessionId`, ¿diagnóstico? |
| `getNextExercise` | `sessionId` | `Exercise` (sin `respuestaCorrecta`) + `motivoDecision` |
| `submitAnswer` | `exerciseId`, `respuesta` | `{correcto, masteryAntes, masteryDespues, subtema}` |
| `getHint` | `exerciseId`, `respuestaAlumno` | `hint` (socrática, Bedrock, con fallback) |
| `getExplanation` | `exerciseId` | `explicacion` paso a paso (Bedrock, cacheable) |
| `getProgress` | — | mapa `Mastery[]` + `RouteStep[]` |

## 6. Integración con Bedrock (US-04)

- Invocación **solo bajo demanda** (fallo o clic en "explícame").
- Timeout ~4 s → fallback a `explicacionBase` del ejercicio.
- Cache de explicaciones por `exerciseId` (menor costo/latencia).
- Prompt: rol tutor socrático; regla dura de no revelar la respuesta en pistas; nivel según `mastery`.

### 6.1 Estrategia de modelos (consciente del costo = innovación + eficiencia)

| Tarea | Modelo | Por qué |
|---|---|---|
| Pistas socráticas (loop frecuente) | **Claude Haiku 4.5** ($1/$5 por 1M) | Barato, rápido, alto volumen |
| Explicaciones paso a paso (bajo demanda) | **Claude Sonnet 5** ($3/$15) | Equilibrio calidad/costo |
| *(Opción futura)* Plan de estudio / temas difíciles | **Claude Fable 5** ($10/$50) | Máxima capacidad; solo tareas puntuales de alto valor, no por interacción |

- **Fable 5 en runtime:** documentado como **mejora futura**, NO en el MVP (10× más caro que Haiku; en el loop dañaría el criterio de eficiencia). En Bedrock sería `anthropic.claude-fable-5` (verificar región; requiere retención de datos de 30 días).
- **Fable 5 en construcción:** SÍ se usa como modelo de desarrollo para las piezas más complejas (motor adaptativo, cableado AWS). Se puede delegar esos tramos a un agente con Fable durante el build.

## 7. Análisis de costos AWS (estimación)

**Durante el hackathon y demo, prácticamente todo cae en Free Tier + créditos:**

| Servicio | Uso esperado (demo/dev) | Costo estimado |
|---|---|---|
| Cognito | < 100 usuarios | Free (50k MAU) |
| AppSync | Miles de queries | Free tier / centavos |
| DynamoDB (on-demand) | Datos mínimos | Free (25 GB) / ~$0 |
| Lambda | Miles de invocaciones | Free (1M req) |
| Amplify Hosting | 1 app | Free tier / centavos |
| **Bedrock** (pago por token) | Pistas ~300–500 tokens; solo bajo demanda | **el único costo real** |

**Estimación Bedrock:** con Claude Haiku, ~cientos de generaciones para dev+demo ⇒ **orden de pocos USD (< $5)**. Con caché de explicaciones baja aún más.

> ⚠️ Confirmar precios exactos de Bedrock por región en la consola (varían por modelo/región). Los créditos AWS del evento deberían cubrirlo. Regla de eficiencia (US-04): nunca llamar a Bedrock en el loop normal, solo ante fallo/solicitud.

## 8. Decisiones abiertas / riesgos

- **Auth:** Cognito por Amplify es casi gratis de montar; si aprieta el tiempo, modo invitado como fallback.
- **Región Bedrock:** elegir una con Claude disponible (p. ej. `us-east-1`).
- **Riesgo de tiempo:** el panel de ruta (US-05) es el "wow" pero también estético; reservar día dedicado. Ver `03-tasks.md`.
