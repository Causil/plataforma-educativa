# 10 · Calificación de exámenes con IA

> Épica E15 · planeada 10-oct-2026 · ejecutor: **Claude Code** (construye) + **Javier** (prueba/aprueba). Sin Kiro.

## Objetivo

El docente sube el **enunciado** y el **solucionario** de un examen y las **soluciones de los estudiantes**; la IA propone una nota por pregunta con justificación; el docente **revisa y aprueba**; la plataforma **envía la nota por correo** a cada estudiante.

## Decisiones (Javier, 10-oct)

| Tema | Decisión |
|---|---|
| Quién sube | **Ambos**: etapa 1 el docente en lote; etapa 2 el estudiante desde su cuenta con fecha límite |
| Asociación archivo ↔ estudiante | **Documento en el nombre del archivo** (`1000000001.pdf`); la IA verifica el nombre escrito en la hoja y alerta si no coincide |
| Escala | **0.0 – 5.0, aprueba con 3.0** (configurable por examen, una cifra decimal) |
| Envío | **Siempre con aprobación docente**. Ninguna nota sale sin revisión |

## Flujo

```
Docente: enunciado.pdf + solucionario.pdf
  → [IA] propone rúbrica (preguntas, puntos, criterios) → docente edita y aprueba
Docente (lote) / estudiante (etapa 2): una hoja por estudiante
  → cola SQS → Lambda grade-exam (Sonnet, salida estructurada, prompt caching)
  → ExamGrade: puntaje por pregunta + justificación + transcripción + confianza
  → docente revisa (PDF lado a lado), ajusta y aprueba
  → Lambda send-grades (SES) → correo con nota y retroalimentación → sentAt
```

## Modelo de datos (nuevo)

**Exam** — auth: teachers/admins CRUD; estudiantes matriculados leen solo campos públicos.
`courseId, title, date, scaleMax (5.0), passMark (3.0), statementKey, solutionKey (solo docentes), rubric (json, solo docentes), rubricStatus ('draft'|'approved'), studentUploadOpen (bool), dueAt, status`

**ExamGrade** — auth: **solo teachers/admins**. El estudiante NO lee el modelo directo (la regla "solo si `status = sent`" no se puede expresar con auth estática): en F7 lo consulta vía query Lambda `myExamGrades`, que filtra por su `sub` y `status = sent`.
`examId, studentId, email, fullName, document, fileKey, uploadedBy ('teacher'|'student'), status ('uploaded'|'queued'|'grading'|'graded'|'reviewed'|'sent'|'error'), triage ('green'|'yellow'|'red'), transcription (json), numericChecks (json), aiScore, aiScore2, finalScore, perQuestion (json: [{q, points, max, justification, confidence}]), feedback, flags (string[]), model, inputTokens, outputTokens, gradedAt, reviewedBy, reviewedAt, reviewNote, sentAt, error`

Índices secundarios: `Exam.courseId`, `ExamGrade.examId` (listar el grupo sin `scan`).

**Storage (S3, `defineStorage`)** — prefijos de primer nivel separados para poder aplicar ciclo de vida solo a las hojas:
- `exams/{examId}/statement.pdf`, `exams/{examId}/solution.pdf` → solo docentes/admins
- `exam-submissions/{examId}/{documento}.{pdf|jpg|png}` → solo docentes/admins (carga en lote)
- `exam-uploads/{entity_id}/{examId}.{ext}` → etapa 2: cada estudiante escribe solo en su carpeta (`entity_id` = Identity ID de Cognito, no el `sub`)
- Ciclo de vida: borrar `exam-submissions/` y `exam-uploads/` a los 180 días (cierre de semestre).

## Motor de calificación

La IA no califica "a su criterio": un pipeline auditable por etapas.

1. **Rúbrica = contrato.** Por pregunta: puntaje máximo, pasos con crédito parcial, errores comunes con su descuento, respuestas equivalentes aceptadas (métodos alternativos, tolerancia de redondeo) y la **respuesta numérica esperada** con tolerancia cuando aplique. La IA genera el borrador desde el solucionario; el docente la aprueba.
2. **Calibración.** Antes del lote: la IA califica 5 hojas → el docente corrige → las correcciones entran a la rúbrica como *casos resueltos* ("si el estudiante hace X → Y puntos") → se aprueba la rúbrica calibrada.
3. **Leer (pasada 1, visión).** Sonnet transcribe la hoja pregunta por pregunta (procedimiento, fórmulas, resultado final). Lo ilegible se marca como `[ilegible]`, nunca se completa. La transcripción se guarda: el docente ve qué leyó la IA y recalificar no exige releer imágenes.
4. **Verificar (código, sin IA).** Los resultados numéricos finales de la transcripción se comparan contra la respuesta esperada de la rúbrica con su tolerancia → `numericChecks`. Determinista.
5. **Calificar (pasada 2, texto).** Sonnet califica la transcripción contra la rúbrica calibrada: puntos por pregunta, justificación dirigida al estudiante, confianza. **El código** suma, acota al máximo y convierte a la escala; la IA nunca suma.
6. **Clasificar (triage).**
   - 🟢 confianza alta, sin flags, `numericChecks` y calificación coinciden → aprobable en lote
   - 🟡 nota en la franja de aprobación (2.8–3.2) o alguna pregunta con confianza < 0.7 → se califica **una segunda vez de forma independiente** (`aiScore2`); si difiere > 0.3 pasa a 🔴
   - 🔴 `illegible`, `name_mismatch`, `missing_pages`, discrepancia código↔IA o entre las dos calificaciones → revisión completa
7. **Aprender.** Cada ajuste docente queda guardado (`aiScore` vs `finalScore` + `reviewNote`) → métricas de precisión por examen y tipo de pregunta, insumo para la rúbrica del siguiente parcial.
8. **(Opcional) Cerrar el ciclo adaptativo.** Cada pregunta se mapea a un subtema; los resultados actualizan `MasteryState` y el correo recomienda práctica y la sección del libro correspondiente.

**Automático:** leer, verificar, calificar, clasificar, redactar retroalimentación, enviar tras aprobación. **Humano:** aprobar rúbrica, calibrar con 5, revisar 🟡/🔴, aprobar envío.

## Lambdas

| Lambda | Disparo | Qué hace |
|---|---|---|
| `build-rubric` | mutation `buildRubric(examId)` (async: deja `rubricStatus='generating'`) | Lee enunciado + solucionario, devuelve rúbrica estructurada. El docente la edita. |
| `enqueue-grading` | mutation `startGrading(examId, ids?)` | Valida rúbrica aprobada; marca `queued`; manda un mensaje SQS por ExamGrade. |
| `grade-exam` | SQS (batch 1, concurrencia máx. 5, timeout 5 min, DLQ) | Descarga la hoja de S3 → pasada 1 (transcripción, visión) → `numericChecks` → pasada 2 (calificación, enunciado/solucionario/rúbrica **cacheados**) → JSON validado → código suma y escala → triage (doble calificación en 🟡) → `graded`. Idempotente: si ya está `graded`/`sent`, no recalifica salvo `force`. |
| `send-grades` | mutation `sendGrades(examId, ids)` | Solo `reviewed` y sin `sentAt`; SES `SendEmail` con plantilla ES; escribe `sentAt` por estudiante. |

Todas con el helper `must()` y fallo explícito ante `errors` del data client (lección H5).

## Prompt de calificación (principios)

- Rol: corrector según **la rúbrica aprobada**, no según su propio criterio.
- Puntos parciales solo según criterios de la rúbrica; procedimiento correcto con error aritmético recibe lo que diga la rúbrica.
- Por pregunta: `transcription` (qué leyó), `points`, `justification` (1–3 frases, dirigida al estudiante), `confidence` 0–1.
- Si no puede leer: `illegible` y `confidence` baja; **nunca inventar**.
- Verificar nombre/documento escrito vs. esperado → `name_mismatch`.
- Salida con esquema JSON estricto; el código recalcula totales (la IA no suma).

## Pantallas

- **`/docente/examenes`** (página nueva; `Docente.tsx` ya tiene 643 líneas): lista de exámenes del curso → crear examen.
- **Examen › Rúbrica**: subir PDFs, generar rúbrica, editar tabla pregunta/puntos/criterios, aprobar.
- **Examen › Entregas**: carga múltiple (arrastrar archivos `documento.pdf`), reporte de asociación (sin coincidencia / duplicados), botón *Calificar*, progreso en vivo (`observeQuery`).
- **Examen › Revisión**: tabla con nota IA, flags, estado; detalle con PDF a la izquierda y desglose editable a la derecha; *Aprobar* / *Aprobar todos sin alertas*; *Enviar notas*.
- **Etapa 2 · estudiante**: en *Mi curso*, tarjeta del examen con carga de archivo hasta `dueAt` y, tras el envío, su nota y retroalimentación.

## Fases y tareas

- [ ] **F0 · Prerrequisitos (Javier)**
  - [ ] Verificar identidad en SES us-east-1 (dominio o correo remitente) y **solicitar salida del sandbox**
  - [ ] Conseguir un examen ya calificado a mano (enunciado, solucionario, ~10 hojas anonimizadas) para la calibración F6
  - [ ] Decidir: backend de producción por pipeline de rama `main` (recomendado antes de notas reales) vs. seguir con `ampx sandbox`
- [~] **F1 · Datos y storage** — código listo y validado con `cdk synth` (10-oct); pendiente deploy + `scripts/exam-permissions-smoke.ts` · modelos `Exam`/`ExamGrade`, `defineStorage` con rutas y permisos, pruebas de permisos (estudiante no lee solucionario ni rúbrica ni notas no enviadas)
- [ ] **F2 · Rúbrica IA** — `build-rubric` + editor + aprobación; prueba con el examen de F0
- [ ] **F3 · Calificación** — SQS + DLQ + `grade-exam` (transcripción → verificación numérica → calificación → triage) + validación de esquema + caching; funciones puras (suma/escala/tolerancias/triage) con tests; smoke que verifica `ExamGrade` en BD
- [ ] **F4 · Revisión docente** — páginas de entregas y revisión con semáforo, transcripción visible, ajuste de nota con motivo, aprobación individual / lote de 🟢; flujo de calibración (5 primeras → casos resueltos en la rúbrica)
- [ ] **F5 · Correo** — `send-grades` con SES y plantilla; idempotencia por `sentAt`; prueba con alias `+algo@gmail.com`
- [ ] **F6 · Calibración** — IA vs. calificación manual: error absoluto medio por pregunta y total, costo real por examen; ajustar prompt/rúbrica hasta un umbral acordado (propuesta: MAE total ≤ 0.3 en escala 0–5)
- [ ] **F7 · Etapa 2: carga del estudiante** — ruta `exam-uploads/{entity_id}/`, ventana `dueAt`, query `myExamGrades` (solo `sent`), vista de nota publicada
- [ ] **F8 · (opcional)** mover las invitaciones de Cognito a SES (límite diario del correo por defecto de Cognito)

## Riesgos

1. **Cupo de correo**: SES en sandbox solo envía a direcciones verificadas → F0 bloquea F5.
2. **Datos personales (Ley 1581)**: los exámenes se procesan con el proveedor de IA → aviso a estudiantes; no loguear contenido; ciclo de vida en S3.
3. **Legibilidad**: fotos borrosas → flags + revisión docente obligatoria.
4. **Costo**: medir en F6 con tokens reales (`inputTokens`/`outputTokens` quedan registrados por examen).
5. **Timeouts**: calificación siempre asíncrona vía SQS; AppSync nunca espera a la IA.
