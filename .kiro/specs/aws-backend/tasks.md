# Spec: aws-backend — Tareas

> Prerequisito: perfil AWS PERSONAL `guia` configurado (`aws configure --profile guia`)
> y Bedrock model access aprobado para Claude Haiku/Sonnet en us-east-1 (T-002).
> ⚠️ NUNCA usar el perfil default (credenciales del trabajo — ver steering/tech.md).
> Todo comando ampx lleva `--profile guia`.
> Tras CADA tarea: `npm test` y `npm run build` deben quedar en verde.

- [x] 1. Inicializar Amplify Gen2 en el repo (`npm create amplify@latest`), estructura `amplify/` con backend.ts vacío funcional; `npx ampx sandbox` levanta. *(Req 5; T-201)*

- [x] 2. Auth: `amplify/auth/resource.ts` con login por email y grupos `students`/`teachers`/`admins`; crear 3 usuarios de prueba (uno por grupo). *(Req 1.1; T-202)*

- [x] 3. Conectar Login.tsx a Cognito (signIn de aws-amplify) conservando el diseño actual; redirección por grupo; guards reales en el router (estudiante no entra a /docente). *(Req 1.1, 1.4; T-203, T-206)*

- [x] 4. Flujo recuperar contraseña (resetPassword + confirmResetPassword) con la UI de 2 pasos del prototipo. *(Req 1.2; T-204)*

- [x] 5. Flujo primer ingreso: usuario creado con AdminCreateUser entra con contraseña temporal → pantalla de crear contraseña (confirmSignIn NEW_PASSWORD_REQUIRED). Probar creando un usuario invitado manualmente. *(Req 1.3; T-205)*

- [x] 6. Data: `amplify/data/resource.ts` con los 10 modelos y reglas de autorización del diseño (owner para progreso, grupos para gestión, Enrollment para cursos privados; answerIndex/hint/explanation NO legibles por estudiantes). *(Req 2.1, 2.2; T-301..T-303)* — ✅ Kiro (9 modelos) + fix de review (Activity); schema desplegado.

- [x] 7. **Seed idempotente del curso a DynamoDB** *(Req 2.3; T-304, T-305)* — instrucciones completas:

  **Contexto:** el schema (10 modelos, incluido `Activity` agregado en review) YA está desplegado — `amplify_outputs.json` tiene la sección `data`. **NO correr `ampx sandbox`** (no hay cambios de schema).

  Crear `scripts/seed.ts` (ejecutable con `npx tsx`) que:

  1. Configure Amplify con `amplify_outputs.json` y **autentique** con `signIn` de `aws-amplify/auth` usando las variables de entorno `GUIA_SEED_EMAIL` y `GUIA_SEED_PASSWORD` (el modo de autorización del schema es userPool; los admins tienen permisos de creación). **PROHIBIDO hardcodear credenciales.**
  2. Use `generateClient<Schema>()` y cargue desde `src/content/estadistica.ts`:
     - 1 `Course`: code `CBS00074`, name, institution, visibility `private`, credits 4, `teacherId` = userId del usuario autenticado (`getCurrentUser`)
     - 6 `Unit` (order + title)
     - 8 `Subtopic` — ⚠️ el contenido usa `name`/`short`, el schema usa `title`/`short`: **mapear name→title**; `bookRefs` como JSON
     - 16 `Exercise` (level, difficulty, prompt, options, answerIndex, hint, explanation)
     - 6 `Activity` (una por Unit: Quiz 1 / Taller 1 / Quiz 2 / Taller 2 / Examen parcial / Trabajo final; type quiz|taller|examen; `rubric` JSON `[{criterion, weight}]` p.ej. concepto 60/interpretación 40; `unlockThreshold` 0.6)
  3. Sea **IDEMPOTENTE** por clave natural: Course por `code`; Unit por (courseId, order); Subtopic por (unitId, order); Exercise por (subtopicId, prompt); Activity por (unitId, title). Si existe → skip (no update, no duplicado).
  4. Imprima resumen: creados/omitidos por modelo.

  **Verificación obligatoria antes de reportar** — ejecutar DOS veces:
  ```bash
  GUIA_SEED_EMAIL=admin.demo@guia.app GUIA_SEED_PASSWORD='GuIA-2026!' \
    AWS_PROFILE=guia npx tsx scripts/seed.ts
  ```
  La **segunda corrida debe dar 0 creados**. Además `npm test` y `npm run build` en verde.

  **Al terminar: DETENTE y reporta los conteos de ambas corridas** — Claude hace review antes de pasar a la tarea 8.

- [x] 8. Function `next-exercise` usando `src/engine/selector.ts`; responde ejercicio SIN answerIndex + motivo. *(Req 3.1; T-404a)*

- [x] 9. Function `submit-answer` usando `src/engine/mastery.ts`; valida contra answerIndex en BD, escribe MasteryState/RouteLog/GameState (¡2 upserts de GameState: scope 'global' Y scope=courseId!); devuelve `{ok, before, after, xp, streak, level, hint, explanation}`. *(Req 3.2; T-404b)*

  **Guía técnica Gen2 (tareas 8-9, hacerlas juntas):**
  - `amplify/functions/next-exercise/resource.ts`: `defineFunction({ name, entry: './handler.ts' })`; ídem submit-answer. Registrarlas en `backend.ts`.
  - Exponerlas como **custom operations** en el schema (`amplify/data/resource.ts`):
    `nextExercise: a.query().returns(a.json()).handler(a.handler.function(nextExercise)).authorization((allow) => [allow.authenticated()])` y
    `submitAnswer: a.mutation().arguments({ exerciseId: a.string().required(), optionIndex: a.integer().required() }).returns(a.json()).handler(a.handler.function(submitAnswer)).authorization((allow) => [allow.authenticated()])`.
  - Acceso a datos desde las functions: al final del schema añadir `.authorization((allow) => [allow.resource(nextExercise), allow.resource(submitAnswer)])` y en el handler usar `generateClient<Schema>()` con env de la function (patrón "function calling data" de Amplify Gen2).
  - El userId del caller llega en `event.identity` (AppSync) — usarlo para MasteryState/GameState del usuario.
  - Importar el engine con rutas relativas (`../../../src/engine/...`) — es TS puro sin dependencias.
  - Verificación: `npx ampx sandbox --once --profile guia` + invocar la query/mutation (puede ser con un mini script tsx autenticado como estudiante.demo) y mostrar respuesta del motor con `reason` y sin `answerIndex`.

- [x] 10. Migrar `PracticeContext` a la nube: nueva implementación del provider llamando a las functions (MISMA interfaz PracticeApi); verificar que la práctica persiste al recargar la página. *(Req 3; T-405-cloud)*

- [x] 11. Function `tutor` (hint/chat/explanation); smoke: chat responde `source:'ai'`; si el LLM falla → fallback. Frontend conectado vía custom query `askTutor`. *(Req 4; T-601..T-604)* — ✅ **Proveedor: `LLM_PROVIDER=anthropic`** (API key como secreto de Amplify) por decisión documentada: Bedrock quedó bloqueado por tarjeta de Marketplace (`INVALID_PAYMENT_INSTRUMENT`); el cliente es dual y volver a Bedrock = 1 env var + IAM InvokeModel (post-hackathon).

- [x] 12. Amplify Hosting: conectar repo GitHub rama main, build de Vite, URL pública; verificar la app completa en la URL. *(Req 5; T-1301)* — ✅ https://main.dnshoh9una50.amplifyapp.com (CI con tests + regla SPA regex-200 activa — todas las rutas directas en 200).

- [x] 13. **QA end-to-end** *(T-1302)* — instrucciones completas:

  **Regla de oro: SOLO LECTURA.** No modificar código ni desplegar nada. El
  entregable es el reporte `docs/08-qa-report.md`; los fixes los decide el
  review de Claude.

  **A. Verificación automatizada (correr y pegar resultados):**
  1. `npm test` y `npm run build` (deben estar verdes)
  2. `GUIA_SMOKE_EMAIL=estudiante.demo@guia.app GUIA_SMOKE_PASSWORD='GuIA-2026!' AWS_PROFILE=guia npx tsx scripts/api-smoke.ts` — motor en la nube
  3. Mismas vars + `npx tsx scripts/tutor-cloud-smoke.ts` — tutor IA (esperar `source: ai`)
  4. Rutas públicas con curl (código HTTP de `/`, `/login`, `/curso`, `/practica`, `/docente` en https://main.dnshoh9una50.amplifyapp.com) — anotar si alguna ≠200

  **B. Auditoría spec↔realidad (leer, no ejecutar):**
  5. Recorrer `requirements.md` de este spec y marcar por requisito: CUMPLE / PARCIAL / FALTA, con evidencia (archivo o script que lo prueba)
  6. Revisar que ningún archivo del repo contenga secretos (grep de `sk-ant`, `AKIA`, contraseñas) ni PII real

  **C. Reporte (`docs/08-qa-report.md`):** tabla de resultados A+B, lista de
  hallazgos ordenada por severidad (bloqueante/mayor/menor), y veredicto final
  "¿listo para entregar?". Al terminar DETENTE — Claude revisa el reporte.

- [x] 14. **Post-QA · datos 100 % reales y fix H5** *(26-jul noche)* — paneles docente/admin sin valores quemados: heatmap/KPIs/seguimiento desde MasteryState+RouteLog+GameState; matrícula real (Lambda `enroll-students`: AdminCreateUser + invitación email + Enrollment idempotente); `adminStats` (Cognito + conteos DynamoDB). **H5**: los creates de `submit-answer` pasaban `owner` sin que existiera en los inputs generados → AppSync rechazaba TODAS las escrituras de progreso y el handler ignoraba `res.errors`. Fix: `owner: a.string()` explícito en los 4 modelos de progreso + `must()` (fallar fuerte). Ver adenda en docs/08-qa-report.md.

- [ ] 15. **Correo de invitación: enlace de inicio de sesión + copy profesional en español** *(R02; T-207)*

  Hoy `amplify/auth/resource.ts` no define ninguna plantilla, así que Cognito
  envía su mensaje por defecto: en inglés, sin enlace y sin marca
  (*"Your username is … and temporary password is …"*). Es el **primer contacto
  del estudiante con GuIA** y aparece en el video (guion 0:35).

  **Qué construir**

  1. En `amplify/auth/resource.ts`, dentro de `loginWith.email`, añadir
     `userInvitation: { emailSubject, emailBody }`. `emailBody` recibe
     `(user, code)` — funciones que devuelven los marcadores de Cognito.
  2. La URL de la app va en **una sola constante exportada** (p. ej.
     `amplify/constants.ts` → `export const APP_URL = 'https://main.dnshoh9una50.amplifyapp.com'`),
     no repetida en el HTML. El enlace apunta a `${APP_URL}/login`.

  **Restricciones que NO son negociables**

  - La plantilla es **global del User Pool**: los únicos datos disponibles son
    `{username}` y `{####}`. **No intentes** nombrar el curso, el docente ni la
    institución como si fueran datos reales — no los tienes. Redacta en
    genérico ("tu institución te matriculó en un curso").
  - Cognito **rechaza el despliegue** si el cuerpo no contiene *ambos*
    marcadores. Asunto ≤ 140 caracteres, cuerpo ≤ 20 000.
  - HTML de correo, no de web: layout con `<table>`, **estilos inline**,
    ancho máx. 600 px, sin `<style>`, sin JS, sin imágenes ni fuentes externas
    (Gmail las bloquea). El logo va como texto/carácter, no como `<img>`.
  - Botón de acción **y además** la URL en texto plano debajo, porque muchos
    clientes no renderizan el botón.
  - La contraseña temporal debe verse **seleccionable como texto**
    (`<code>` con fondo claro), nunca dentro de una imagen.
  - **No toques nada más de `defineAuth`.** Cambiar `groups`,
    `userAttributes.required` o el modo de `loginWith` puede forzar el
    reemplazo del User Pool y **borrar las cuentas demo**
    (estudiante/profe/admin.demo) a un día del cierre. Solo se agrega
    `userInvitation`.
  - **No inventes el plazo de vencimiento.** Lee el valor real del pool
    (`AdminCreateUserConfig.UnusedAccountValidityDays` / la política de
    contraseñas temporales) y usa ese número en el texto.

  **Contenido del correo** (redacción base; puedes pulir el tono, no la estructura)

  - Asunto: `Activa tu cuenta en GuIA`
  - Encabezado con la marca **GuIA** (teal `#0FB5A6`).
  - Una línea de qué es: *tutor de estudio con IA que se adapta a tu ritmo*.
  - Por qué recibe esto: *tu institución te matriculó en un curso privado de la plataforma*.
  - Bloque de credenciales: **usuario** = `{username}`, **contraseña temporal** = `{####}`.
  - Botón **"Entrar a GuIA"** → `${APP_URL}/login` + la URL en texto plano.
  - Qué va a pasar: *al entrar con la contraseña temporal, la plataforma te
    pedirá crear la tuya definitiva*.
  - Aviso de vencimiento con el número real de días.
  - Pie: *si no esperabas este correo, ignóralo — no se creó ningún perfil público a tu nombre.*
  - Sin emojis decorativos, sin signos de exclamación en cadena. Tono de
    universidad: cálido pero serio.

  **Verificación — obligatoria antes de marcar la tarea** (lección de H5/H6:
  se verifica el **efecto**, no la respuesta)

  1. `npx ampx sandbox --once --profile guia` despliega sin error.
  2. Confirmar que la plantilla **quedó aplicada en AWS**, no solo en el código:
     `aws cognito-idp describe-user-pool --user-pool-id <id> --profile guia
     --query 'UserPool.AdminCreateUserConfig.InviteMessageTemplate'`
  3. Crear un usuario de prueba con un **alias de Gmail**
     (`tucorreo+kiro15@gmail.com`) desde `/docente` o con `AdminCreateUser`,
     **recibir el correo de verdad** y adjuntar captura de cómo se ve en Gmail.
  4. Hacer clic en el enlace → cae en `/login` → entrar con la contraseña
     temporal → sale la pantalla de crear contraseña definitiva → entra.
  5. **Borrar el usuario de prueba** al terminar (`AdminDeleteUser`).
  6. `npm test` y `npm run build` en verde.

  ⚠️ Cada corrida de la prueba **envía correo real**. Usa solo alias tuyos.

  **Fuera de alcance (P2, documentar en el PR, no construir):** remitente
  institucional propio. Hoy sale de `no-reply@verificationemail.com` con el
  envío por defecto de Cognito, limitado a **50 correos/día** — insuficiente
  para varios grupos reales. La ruta es SES con dominio verificado, y con SES
  también se podría personalizar por curso enviando el correo desde
  `enroll-students` con `MessageAction: 'SUPPRESS'`.
