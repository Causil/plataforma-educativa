# QA End-to-End — Reporte Final

> **Fecha:** 2026-07-26 15:02 COT  
> **Evaluador:** Kiro (agente QA)  
> **URL de producción:** https://main.dnshoh9una50.amplifyapp.com  
> **Commit evaluado:** `7bff8fa` (rama `main`)

---

## A. Verificación automatizada

| # | Prueba | Resultado | Detalle |
|---|--------|-----------|---------|
| A1 | `npm test` | ✅ PASS | 4 archivos, **42 tests** en verde (305 ms) |
| A1 | `npm run build` | ✅ PASS | tsc-b OK + vite build 918 módulos (2.68 s) |
| A2 | `scripts/api-smoke.ts` | ✅ PASS | `nextExercise` devuelve ejercicio **sin answerIndex** + motivo del motor. `submitAnswer` evalúa ok=true, mastery 0→0.15, xp=10, racha=1, hint+explanation presentes tras responder. |
| A3 | `scripts/tutor-cloud-smoke.ts` | ✅ PASS | Claude respondió vía Lambda (source: `ai`, 5789 ms). Explicación con KaTeX sobre correlación negativa y ejemplo cotidiano. |
| A4 | Rutas públicas (curl) | ⚠️ PARCIAL | `/` → 200 OK. `/login`, `/curso`, `/practica`, `/docente` → **301 → 404** (falta rewrite SPA). |

---

## B. Auditoría spec ↔ realidad

| Req | Sub | Descripción | Veredicto | Evidencia |
|-----|-----|-------------|-----------|-----------|
| 1 | 1.1 | Login Cognito + grupo | **CUMPLE** | `amplify/auth/resource.ts` (groups), `src/lib/auth.ts` (currentSession extrae cognito:groups) |
| 1 | 1.2 | Recuperación de contraseña | **CUMPLE** | `src/lib/auth.ts` (requestReset/confirmReset), `Login.tsx` fases forgot-* |
| 1 | 1.3 | Primer ingreso NEW_PASSWORD_REQUIRED | **CUMPLE** | `src/lib/auth.ts` (completeNewPassword → confirmSignIn), `Login.tsx` fase new-password |
| 1 | 1.4 | Guards por grupo en el router | **CUMPLE** | `src/App.tsx` <RequireRole>, `src/components/RequireRole.tsx` redirige sin permiso |
| 2 | 2.1 | 10 modelos definidos | **CUMPLE** | `amplify/data/resource.ts`: Course, Unit, Subtopic, Exercise, Activity, Enrollment, MasteryState, RouteLog, GameState, Submission |
| 2 | 2.2 | Autorización (owner, grupos, field-level) | **CUMPLE** | MasteryState/RouteLog/GameState/Submission: `allow.owner()`. Exercise.answerIndex/hint/explanation: field-level auth solo teachers/admins. Resource auth para Lambdas |
| 2 | 2.3 | Seed idempotente | **CUMPLE** | `scripts/seed.ts`: busca por clave natural antes de crear; corrida 2 = 0 creados |
| 3 | 3.1 | nextExercise sin answerIndex + motivo | **CUMPLE** | `amplify/functions/next-exercise/handler.ts` usa selectNext(), devuelve {exercise, reason} sin campos sensibles. Confirmado por api-smoke |
| 3 | 3.2 | submitAnswer valida + escribe progreso | **CUMPLE** | `amplify/functions/submit-answer/handler.ts`: doble upsert GameState (global + courseId), MasteryState, RouteLog. Confirmado por api-smoke |
| 3 | 3.3 | Respuesta < 1 s (motor sin IA generativa) | **CUMPLE** | Engine es TS puro sin I/O. api-smoke responde en <1 s (lógica math + DynamoDB reads) |
| 4 | 4.1 | Tutor con LLM_PROVIDER=bedrock | **PARCIAL** | Lambda configurada con `LLM_PROVIDER=anthropic` (API key como secreto Amplify). El código soporta ambos (`src/lib/tutor/client.ts` tiene path bedrock), pero en producción usa Anthropic directo. Funcionalidad equivalente; IAM policy bedrock:InvokeModel no adjuntada. |
| 4 | 4.2 | Fallback si IA falla | **CUMPLE** | `src/lib/tutor/tutor.ts`: cada función tiene catch → null → fallback local (hint precargada, referencia bibliográfica) |
| 4 | 4.3 | Tutor expuesto al frontend | **CUMPLE** | Vía AppSync custom query `askTutor` (mejor que REST separado). `src/lib/tutor/service.ts` → `client.queries.askTutor()` |
| 4 | 4.4 | Explicación cacheada por exerciseId | **CUMPLE** | `src/lib/tutor/tutor.ts`: `explanationCache = new Map<string, string>()`, check antes de invocar LLM |
| 5 | 5.1 | Hosting con CI + URL pública estable | **PARCIAL** | App desplegada, CI funcional (tests bloquean deploy), URL estable. **FALTA**: regla SPA rewrite (`/<*>` → `/index.html` 200) — subroutes dan 404 al acceso directo/F5. |

**Resumen:** 12/14 CUMPLE · 2/14 PARCIAL · 0/14 FALTA

---

## B6. Escaneo de secretos y PII

| Verificación | Resultado |
|---|---|
| Claves API (sk-ant, AKIA, aws_secret) | ✅ LIMPIO — ninguna en el repo |
| Contraseñas hardcodeadas | ✅ LIMPIO — solo demo creds en docs (esperado) |
| PII real de estudiantes | ✅ LIMPIO — solo datos anonimizados (`*00000@elpoli.edu.co`) |
| .gitignore cubre XLSX real + .env + credenciales AWS | ✅ Bien configurado |
| amplify_outputs.json | ✅ Solo config pública (endpoints, pool IDs — diseñados para ser públicos) |
| Archivos .env en el repo | ✅ Ninguno (correctamente excluidos) |

---

## C. Hallazgos ordenados por severidad

### 🔴 Bloqueante (impide demo funcional)

| # | Hallazgo | Impacto | Fix sugerido |
|---|----------|---------|--------------|
| H1 | **Falta regla SPA rewrite en Amplify Hosting** | Acceso directo a `/login`, `/curso`, `/practica`, `/docente` devuelve 404. El jurado que pegue un enlace directo o recargue (F5) verá error. Solo funciona si el usuario navega desde `/`. | Agregar en consola Amplify → Hosting → Rewrites: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp)$)([^.]+$)/>` → `/index.html` (200). O crear `customHttp.yml` en la raíz. |

### 🟡 Mayor (funcionalidad desviada del spec, no bloquea demo)

| # | Hallazgo | Impacto | Fix sugerido |
|---|----------|---------|--------------|
| H2 | **Tutor usa Anthropic directo en vez de Bedrock** (LLM_PROVIDER=anthropic) | Funciona perfectamente, pero el spec dice "bedrock" y el criterio del jurado valora "uso de AWS". Sin IAM policy bedrock:InvokeModel en el IaC. | Cambiar env var a `bedrock` en `amplify/functions/tutor/resource.ts` y quitar el secreto ANTHROPIC_API_KEY; IAM role ya hereda permisos si se adjunta la policy (o se agrega inline en backend.ts). |

### 🟢 Menor (cosmético / mejora)

| # | Hallazgo | Impacto | Fix sugerido |
|---|----------|---------|--------------|
| H3 | Chunk JS >500 kB (812 kB) | Advertencia de Vite. Carga inicial más lenta en 3G. No bloquea. | Code-split con `React.lazy()` por ruta + `manualChunks` para KaTeX. P2. |
| H4 | Cache de explicaciones es in-memory en Lambda | Se pierde en cold start. Funcional, pero no persiste entre invocaciones. | Mover a DynamoDB (campo en Exercise o tabla auxiliar). P2. |

---

## Veredicto final

| Criterio | Estado |
|----------|--------|
| Tests en verde | ✅ 42/42 |
| Build limpio | ✅ |
| Motor adaptativo (nube) | ✅ Funcional — e2e verificado |
| Tutor IA (nube) | ✅ Funcional — Claude responde con KaTeX y citas |
| Secretos / PII | ✅ Limpio |
| Hosting público | ⚠️ Funciona desde `/`, pero subroutes 404 |

### ¿Listo para entregar?

**Casi.** Hay **1 fix bloqueante** (H1: rewrite SPA) que requiere ~2 minutos en la consola de Amplify Hosting. Sin ese fix, el jurado que navegue a `/login` directamente (o comparta un enlace a cualquier ruta) verá un 404.

El hallazgo H2 (Anthropic vs Bedrock) no bloquea la demo pero pierde puntos en "uso de AWS" — es un cambio de 1 variable de entorno + adjuntar IAM policy.

**Recomendación:** aplicar H1 (inmediato, consola), evaluar H2 (2 archivos, re-deploy), y entregar.

---

## 🔍 Review del QA (Claude) — disposición de hallazgos · 26-jul 15:40 COT

| # | Hallazgo | Disposición | Evidencia |
|---|---|---|---|
| H1 | Regla SPA | ✅ **RESUELTO** (el QA corrió antes del fix) — regla regex-200 oficial aplicada vía CLI (`aws amplify update-app --custom-rules`); las 8 rutas directas responden **HTTP 200** verificado post-reporte | curls 15:35: /login /curso /practica /docente → 200 |
| H2 | Anthropic vs Bedrock | ⚖️ **ACEPTADO como decisión documentada** — Bedrock quedó bloqueado por `INVALID_PAYMENT_INSTRUMENT` (AWS Marketplace exige tarjeta válida); cliente dual: volver a Bedrock = 1 env var + IAM. Spec (tarea 11) corregido para reflejarlo. El uso de AWS permanece integral: Cognito, AppSync, DynamoDB, 3 Lambdas, Hosting, Secrets | Issue del tablero + spec tarea 11 |
| H3 | Chunk 812 KB | ✅ **CORREGIDO** — `manualChunks` (katex/vendor/amplify): 4 chunks paralelos, mayor = 258 KB (77 KB gzip); warning de Vite eliminado | vite.config.ts + build limpio |
| H4 | Caché in-memory en Lambda | 📌 **ACEPTADO (P2)** — funcional para la demo; migrar a DynamoDB post-hackathon | backlog |

**Veredicto final tras el review: ✅ LISTO PARA ENTREGAR.**
*Excelente trabajo de auditoría de Kiro: preciso en los 2 hallazgos reales, cero falsos positivos en seguridad/PII.*
