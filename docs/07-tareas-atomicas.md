# GuIA — Tareas Atómicas (Fase 5)
### Descomposición ejecutable de la Arquitectura v2

> **Fuentes:** `06-arquitectura-v2.md` (diseño) + prototipo v2.3 aprobado (referencia visual exacta).
> **Convención:** `T-###` · prioridad (P0 = demo del 27 / P1 = si alcanza) · estimación · `←` dependencias · ✔ = criterio de hecho.
> **Ejecutores:** 🤖 Claude (genera código/specs) · 🟣 Kiro (construye/conecta AWS — evidencia del 10%) · 👤 Javier (cuentas, decisiones, video).
> **Regla:** una tarea se cierra solo si su ✔ se cumple **desplegado o testeado**, no "en mi máquina".

---

## 📅 Calendario (cierre: dom 27 jul, 23:59 UTC-6)

| Día | Meta dura del día |
|---|---|
| **Jue 24** | E0–E3: repo + app desplegada con **login real (3 flujos)** + modelos de datos + seed del curso CBS00074 |
| **Vie 25** | E4–E7: **loop adaptativo + diagnóstico + tutor IA con referencias** funcionando en la URL pública |
| **Sáb 26** | E8–E11 + E13: quiz con rúbrica, panel docente + XLSX, gamificación, QA, README, **deploy final congelado** |
| **Dom 27** | E14: video + verificación de entregables + **envío** (buffer para imprevistos) |

---

## E0 · Preparación (👤 Javier — bloqueante, hacer YA)

| ID | Tarea | Est. | ✔ Hecho cuando |
|---|---|---|---|
| T-001 | Verificar registro en el hackathon: formulario códigofacilito + cuenta + Discord | P0 · 30m | estás inscrito y en el Discord |
| T-002 | Cuenta AWS activa con créditos + acceso a **Bedrock en us-east-1** (solicitar acceso a modelos Claude si no está) | P0 · 30m | consola Bedrock muestra Claude Haiku/Sonnet disponibles |
| T-003 | Instalar/abrir **Kiro** con sesión iniciada y créditos visibles | P0 · 15m | Kiro abre el repo |
| T-004 | Crear repo público en GitHub y primer push (docs + prototipo) | P0 · 15m ← T-001 | `git push origin main` OK |

## E1 · Scaffolding y base frontend (🤖→🟣)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-101 | P0 · Proyecto Vite+React+TS con estructura `/src/{pages,components,engine,lib,i18n,styles}` | 30m | `npm run dev` sirve página vacía |
| T-102 | P0 · Portar el **sistema visual del prototipo** (tokens CSS, tema claro/oscuro, card/btn/chip/strip) | 1h ← T-101 | componentes base renderizan igual al prototipo |
| T-103 | P0 · Router con rutas por rol + guards placeholder | 45m ← T-101 | navegación entre páginas vacías |
| T-104 | P0 · **i18next** configurado, textos ES en JSON (EN vacío P1) | 45m ← T-101 | `t('landing.title')` funciona |
| T-105 | P0 · **KaTeX** integrado: componente `<Math>` inline y bloque | 30m ← T-101 | fórmula de la normal renderiza |
| T-106 | P0 · Componente `NormalCurve` y gráficos SVG (portar del prototipo) | 30m ← T-102 | curva con 68% sombreado |
| T-107 | P0 · Landing + navegación pública (portar del prototipo) | 1h ← T-102,T-104 | landing desplegable |
| T-108 | P1 · Logo ∞ animado como componente + favicon | 30m ← T-102 | logo en topbar |

## E2 · Amplify Auth (🟣 Kiro con specs de 🤖)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-201 | P0 · `npm create amplify` — inicializar Gen2 en el repo | 30m ← T-101 | `npx ampx sandbox` levanta |
| T-202 | P0 · Cognito User Pool + **grupos** students/teachers/admins | 45m ← T-201 | usuarios de prueba en cada grupo |
| T-203 | P0 · UI Login por rol conectada (portar pantalla del prototipo) | 1h ← T-202,T-103 | login real redirige según grupo |
| T-204 | P0 · Flujo **recuperar contraseña** (forgotPassword + confirm) | 45m ← T-203 | email de código llega y resetea |
| T-205 | P0 · Flujo **primer ingreso** (invitación AdminCreateUser → NEW_PASSWORD_REQUIRED) | 1h ← T-203 | usuario invitado crea contraseña y entra |
| T-206 | P0 · Guards reales por grupo en el router | 30m ← T-203 | estudiante no puede entrar a /docente |

## E3 · Amplify Data + Seed (🟣 con specs de 🤖)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-301 | P0 · Definir modelos: Course, Unit, Subtopic, Exercise, Activity | 1h ← T-201 | schema deploya sin errores |
| T-302 | P0 · Modelos de progreso: Enrollment, MasteryState, RouteLog, GameState, Submission | 1h ← T-301 | ídem |
| T-303 | P0 · **Reglas de autorización**: owner (estudiante), grupo (teacher/admin), curso privado vía Enrollment | 1.5h ← T-302 | test: no matriculado NO lee curso privado |
| T-304 | P0 · **Seed curso CBS00074**: 6 unidades FD-GC70 + 8 subtemas + bookRefs (Walpole/Devore/Montgomery) | 1h ← T-301 | query devuelve el árbol completo |
| T-305 | P0 · **Seed banco de ejercicios**: ≥40 ejercicios de Estadística (niveles B/I/A, con hint y explicación; los 16 del prototipo + 24 nuevos generados por 🤖 y revisados por 👤) | 2h ← T-304 | banco consultable por (subtopic, level) |
| T-306 | P1 · Modelos UsageEvent, Attendance, CourseEvaluation | 45m ← T-302 | schema deploya |

## E4 · Motor adaptativo (🤖 — TS puro, sin AWS)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-401 | P0 · `engine/mastery.ts`: `updateMastery` (Elo, K=0.16, expected por dificultad) | 45m | funciones puras |
| T-402 | P0 · `engine/selector.ts`: `selectNext` (zona próxima, umbral 0.85, degradación 3 fallos) + `reason()` | 1h ← T-401 | determinista |
| T-403 | P0 · **Tests unitarios** del motor (acierto/fallo/umbral/degradación/bordes) | 1h ← T-402 | `vitest` verde, ≥90% cobertura del engine |
| T-404 | P0 · Lambdas `getNextExercise` + `submitAnswer` usando el engine + escribe RouteLog/GameState | 1.5h ← T-403,T-302 | mutación end-to-end en sandbox |
| T-405 | P0 · UI Práctica conectada (ejercicio, opciones, feedback, mapa dominio, ruta con motivos) | 2h ← T-404,T-102 | igual al prototipo, con datos reales |

## E5 · Diagnóstico

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-501 | P0 · Selección de 6 ítems (uno por unidad clave, niveles B/I/A) + cálculo mastery inicial | 45m ← T-404 | MasteryState poblado al terminar |
| T-502 | P0 · UI flujo diagnóstico (intro → preguntas → mapa resultado) | 1h ← T-501,T-405 | flujo completo desplegado |

## E6 · Tutor IA (🟣 Bedrock + 🤖 prompts)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-601 | P0 · Permisos IAM Bedrock para Lambdas + smoke test Haiku | 45m ← T-201,T-002 | invocación responde |
| T-602 | P0 · `getHint`: prompt socrático (regla dura: no dar respuesta) + timeout 4s + **fallback** al hint del seed | 1h ← T-601 | falla Bedrock ⇒ pista igual aparece |
| T-603 | P0 · `chatTutor`: contexto = subtema + mastery + bookRefs → explica/ejemplifica/**cita libro cap./pág.** | 1.5h ← T-601 | respuesta cita bibliografía real |
| T-604 | P0 · `getExplanation` (Sonnet) con caché por exerciseId | 45m ← T-601 | 2ª llamada sale de caché |
| T-605 | P0 · UI Chat del tutor (portar del prototipo: chips, input, tarjeta libro, fórmulas KaTeX) | 1.5h ← T-603,T-105 | chat funcional en la URL |
| T-606 | P1 · RAG: chunking notas/OpenIntro + embeddings Titan + búsqueda en `chatTutor` | 3h ← T-603 | respuesta usa fragmento del corpus |

## E7 · Mi curso (recorrido)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-701 | P0 · UI recorrido: unidades → subtemas con % avance → actividad (desbloqueo al 60%) | 1.5h ← T-304,T-405 | refleja mastery real |
| T-702 | P0 · Header curso + progreso global + botón "continuar donde ibas" | 30m ← T-701 | navega al subtema foco |

## E8 · Evaluación

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-801 | P0 · `gradeQuiz` contra rúbrica + Submission | 1h ← T-302 | score y rubricScores guardados |
| T-802 | P0 · UI Quiz (5 preguntas del banco + rúbrica visible + resultado) | 1.5h ← T-801,T-405 | quiz completo desplegado |
| T-803 | P1 · UI Taller con carga de archivo (guarda en S3; OCR queda P2 simulado) | 1h ← T-801 | archivo sube y Submission queda |

## E9 · Panel docente

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-901 | P0 · Heatmap dominio del grupo (query MasteryState del curso) + "necesitan apoyo" | 1.5h ← T-303 | datos reales de estudiantes seed |
| T-902 | P0 · **Pipeline XLSX**: upload S3 presigned + `parseRoster` (columnas reales del Poli, tolerante) + AdminCreateUser + Enrollment + resumen | 2.5h ← T-205,T-303 | subir CSV/XLSX anónimo crea usuarios invitados |
| T-903 | P0 · UI crear curso universitario (form + resultado del roster) | 1h ← T-902 | flujo del prototipo funcional |
| T-904 | P1 · Seguimiento de uso (tabla UsageEvent) + `trackUsage` en cliente | 1.5h ← T-306 | eventos reales listados |
| T-905 | P1 · Pantalla informes (FD-GC71 / asistencia) con export básico de datos (CSV) | 1h ← T-901 | descarga CSV con datos del curso |

## E10 · Admin (mínimo P0)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-1001 | P0 · Lista de usuarios por rol + KPIs básicos | 1h ← T-303 | página desplegada |
| T-1002 | P1 · CourseEvaluation: encuesta estudiante + resumen admin | 1.5h ← T-306 | flujo completo |

## E11 · Gamificación

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-1101 | P0 · XP/racha/nivel en `submitAnswer` (backend) + strip UI | 45m ← T-404 | puntos suben al acertar |
| T-1102 | P1 · Insignias (primer acierto, racha×3, 100pts) + toasts | 45m ← T-1101 | insignia se desbloquea |

## E13 · Cierre técnico (sáb 26 — congelar)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-1301 | P0 · Amplify Hosting: pipeline desde GitHub, dominio público | 45m ← T-201 | URL pública estable |
| T-1302 | P0 · QA guiado: recorrido completo estudiante + docente en móvil y desktop; arreglar bloqueantes | 2h ← todo P0 | checklist QA verde |
| T-1303 | P0 · Seed rico para demo (estudiantes ficticios con progreso variado para el heatmap) | 45m ← T-901 | demo se ve "viva" |
| T-1304 | P0 · **README** (qué es, arquitectura, cómo correr, stack AWS+Kiro, screenshots) + diagrama | 1.5h | README completo en el repo |
| T-1305 | P0 · Revisión seguridad: sin secretos en repo, authz verificada, PII fuera | 45m | checklist seguridad verde |
| T-1306 | P0 · 🔒 **CODE FREEZE** sáb 26 noche — solo hotfixes | — | tag `v1.0-hackathon` |

## E14 · Entrega (dom 27)

| ID | Tarea | Est. | ✔ |
|---|---|---|---|
| T-1401 | P0 · Guion del video (🤖): problema → demo en vivo P0 → visión P2 (proctoring/avatar/OCR/informes con el prototipo) → stack AWS+Kiro | 1h | guion aprobado por 👤 |
| T-1402 | P0 · 👤 Grabar video (pantalla + voz) + subir | 2h ← T-1401 | link del video funciona |
| T-1403 | P0 · Checklist de entrega: repo público ✓ README ✓ URL demo ✓ video ✓ | 30m | todo verificado |
| T-1404 | P0 · 👤 **ENVIAR por el canal oficial antes de 23:59 UTC-6** | 15m ← T-1403 | confirmación de envío 🎉 |

---

## 🔗 Ruta crítica

```
T-001/002/004 → T-101 → T-201 → T-202/301 → T-203 → T-404 → T-405 → T-603/605 → T-701 → T-802/902 → T-1301..1306 → T-1401..1404
```

**Total P0 ≈ 36 h-tarea** repartidas en 3 días de build — apretado pero viable con Claude generando + Kiro conectando en paralelo. **Los P1 solo se abren cuando TODOS los P0 del día están ✔.** Si el viernes se atrasa, se recorta: T-904/905, T-1002, T-606 (en ese orden) — nunca T-13xx/14xx.

## 🚦 Compuerta de arranque

El build inicia cuando 👤 Javier confirme **T-001 a T-004** (registro, AWS+Bedrock, Kiro, repo pusheado). Todo lo demás está listo para disparar.
