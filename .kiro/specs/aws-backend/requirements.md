# Spec: aws-backend — Requisitos

## Introducción
Conectar el frontend funcional de GuIA (ya construido y testeado en local) a AWS con Amplify Gen2: autenticación real, datos en DynamoDB, motor y tutor como Lambdas, y hosting público. El frontend ya define las interfaces; este spec las materializa en la nube.

## Requisito 1 — Autenticación con roles (R01/R02 parcial)
**Historia:** Como usuario, quiero iniciar sesión con mi rol real, para acceder solo a lo que me corresponde.

1. CUANDO un usuario inicia sesión con credenciales válidas, EL SISTEMA DEBERÁ autenticarlo con Cognito y resolver su grupo (`students` | `teachers` | `admins`).
2. CUANDO un usuario olvida su contraseña, EL SISTEMA DEBERÁ permitir recuperarla con código por email (flujo nativo `forgotPassword`).
3. CUANDO un docente matricula estudiantes, EL SISTEMA DEBERÁ crearlos con `AdminCreateUser` (invitación por email con contraseña temporal) y CUANDO el estudiante entre por primera vez DEBERÁ crear su contraseña definitiva (`NEW_PASSWORD_REQUIRED`).
4. MIENTRAS un usuario no pertenezca al grupo requerido, EL SISTEMA DEBERÁ impedirle el acceso a las rutas de otro rol (guards en frontend + reglas de autorización en datos).

## Requisito 2 — Datos del curso en DynamoDB
**Historia:** Como plataforma, necesito el curso CBS00074 y el progreso de los estudiantes persistidos en la nube.

1. EL SISTEMA DEBERÁ definir los modelos: Course, Unit, Subtopic, Exercise, Activity, Enrollment, MasteryState, RouteLog, GameState, Submission (campos según `docs/06-arquitectura-v2.md` §5).
2. EL SISTEMA DEBERÁ aplicar autorización: el estudiante solo lee/escribe SU progreso; contenido de curso `private` solo visible con fila de Enrollment; profesores gestionan sus cursos; admins todo.
3. CUANDO se ejecute el seed, EL SISTEMA DEBERÁ cargar el contenido de `src/content/estadistica.ts` (6 unidades, 8 subtemas, 16 ejercicios con bookRefs) a DynamoDB sin duplicar en corridas repetidas (idempotente).

## Requisito 3 — Motor adaptativo como API
**Historia:** Como estudiante, quiero que mi progreso viva en la nube para continuar desde cualquier dispositivo.

1. CUANDO el frontend pida el siguiente reto, la Lambda `getNextExercise` DEBERÁ usar `src/engine/selector.ts` con el MasteryState del usuario y devolver ejercicio (SIN `answerIndex`) + motivo.
2. CUANDO el estudiante responda, la Lambda `submitAnswer` DEBERÁ validar contra el ejercicio en BD, actualizar MasteryState con `src/engine/mastery.ts`, registrar RouteLog y GameState (XP/racha/nivel), y devolver el resultado.
3. EL SISTEMA DEBERÁ responder en < 1 s (p95) — el motor no usa IA generativa.

## Requisito 4 — Tutor IA con Bedrock
**Historia:** Como estudiante, quiero pistas, chat y explicaciones del modelo real.

1. Las Lambdas `getHint`/`chatTutor`/`getExplanation` DEBERÁN usar `src/lib/tutor/tutor.ts` con `LLM_PROVIDER=bedrock` (Haiku para hint/chat, Sonnet para explicación) e IAM role con permiso `bedrock:InvokeModel`.
2. SI Bedrock falla o excede el timeout, EL SISTEMA DEBERÁ devolver el fallback local (ya implementado) — nunca un error al estudiante.
3. EL SISTEMA DEBERÁ exponer la URL del tutor al frontend vía `VITE_TUTOR_API`.
4. Las respuestas de `getExplanation` DEBERÁN cachearse por exerciseId.

## Requisito 5 — Hosting público
1. EL SISTEMA DEBERÁ desplegar el frontend en Amplify Hosting con CI desde la rama `main` de GitHub y URL pública estable (entregable obligatorio del hackathon).
