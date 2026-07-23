# GuIA — Requisitos (Fase 1 · DEFINE)
### Spec-driven · formato Kiro (`requirements.md`)

> **Cómo usar este archivo:** pégalo en Kiro como tu `requirements.md` inicial y deja que Kiro lo refine. Las historias usan criterios de aceptación en notación **EARS** (`CUANDO … EL SISTEMA DEBERÁ …`), lista para ejecutar spec-driven.
>
> **Alcance:** MVP. Materia = Matemáticas secundaria · Tema = fracciones/álgebra básica.

---

## Introducción

GuIA es un tutor con IA que genera una ruta de aprendizaje adaptativa en tiempo real. Este documento define los requisitos del **MVP entregable para el hackathon**: el loop diagnóstico → ejercicio adaptativo → tutoría IA → panel de progreso.

## Glosario

- **Dominio (mastery):** probabilidad estimada (0–1) de que el estudiante domine un subtema.
- **Motor adaptativo:** componente que actualiza el dominio tras cada respuesta y selecciona el siguiente ejercicio.
- **Subtema:** unidad mínima evaluable (p. ej. "suma de fracciones con distinto denominador").

---

## Requisito 1 — Registro y acceso

**Historia:** Como estudiante, quiero crear una cuenta e iniciar sesión, para que mi progreso se guarde entre sesiones.

**Criterios de aceptación (EARS):**
1. CUANDO un visitante envía email y contraseña válidos, EL SISTEMA DEBERÁ crear una cuenta y una sesión autenticada.
2. CUANDO un estudiante registrado inicia sesión con credenciales válidas, EL SISTEMA DEBERÁ restaurar su estado de dominio previo.
3. SI las credenciales son inválidas, ENTONCES EL SISTEMA DEBERÁ rechazar el acceso y mostrar un mensaje de error claro.
4. MIENTRAS el estudiante no esté autenticado, EL SISTEMA DEBERÁ impedir el acceso a la ruta de aprendizaje.

## Requisito 2 — Diagnóstico inicial

**Historia:** Como estudiante nuevo, quiero una prueba diagnóstica corta, para que el tutor conozca mi nivel de partida.

**Criterios de aceptación (EARS):**
1. CUANDO un estudiante inicia por primera vez, EL SISTEMA DEBERÁ presentar un diagnóstico de entre 5 y 8 ejercicios que cubran los subtemas del tema.
2. CUANDO el estudiante responde cada ejercicio del diagnóstico, EL SISTEMA DEBERÁ registrar acierto/error y tiempo de respuesta.
3. CUANDO finaliza el diagnóstico, EL SISTEMA DEBERÁ calcular un dominio inicial (0–1) por subtema.
4. SI el estudiante ya completó el diagnóstico antes, ENTONCES EL SISTEMA DEBERÁ omitirlo e ir directo a la ruta adaptativa.

## Requisito 3 — Motor de ruta adaptativa (núcleo diferenciador)

**Historia:** Como estudiante, quiero que el siguiente ejercicio se ajuste a mi desempeño en tiempo real, para practicar justo lo que necesito, ni muy fácil ni muy difícil.

**Criterios de aceptación (EARS):**
1. CUANDO el estudiante responde un ejercicio, EL SISTEMA DEBERÁ actualizar el dominio del subtema asociado en menos de 1 segundo.
2. CUANDO se requiere el siguiente ejercicio, EL SISTEMA DEBERÁ seleccionar el subtema y dificultad que maximicen el aprendizaje (zona de desarrollo próximo: ni dominado ni demasiado difícil).
3. MIENTRAS un subtema tenga dominio ≥ umbral (p. ej. 0.85), EL SISTEMA DEBERÁ dejar de priorizar ese subtema y avanzar al siguiente.
4. SI el estudiante falla el mismo subtema 3 veces seguidas, ENTONCES EL SISTEMA DEBERÁ bajar la dificultad e insertar un ejercicio de refuerzo.
5. EL SISTEMA DEBERÁ registrar la secuencia de decisiones para poder visualizarla y auditarla.

## Requisito 4 — Tutoría con IA (Bedrock)

**Historia:** Como estudiante, quiero pistas y explicaciones cuando me equivoco, para entender el porqué en lugar de solo ver la respuesta.

**Criterios de aceptación (EARS):**
1. CUANDO el estudiante falla un ejercicio, EL SISTEMA DEBERÁ generar una **pista socrática** (no la respuesta directa) adaptada a su nivel de dominio.
2. CUANDO el estudiante solicita una explicación, EL SISTEMA DEBERÁ generar una explicación paso a paso del subtema.
3. EL SISTEMA DEBERÁ invocar el modelo generativo (Amazon Bedrock) **solo bajo demanda** (fallo o solicitud), no en cada interacción, para controlar costo y latencia.
4. SI la generación de IA falla o excede el tiempo límite, ENTONCES EL SISTEMA DEBERÁ mostrar una pista predefinida de respaldo (degradación elegante).

## Requisito 5 — Panel de progreso y visualización de la ruta

**Historia:** Como estudiante, quiero ver mi dominio por subtema y cómo se adapta mi ruta, para sentir que avanzo (y para el "wow" de la demo).

**Criterios de aceptación (EARS):**
1. EL SISTEMA DEBERÁ mostrar el dominio actual por subtema de forma visual (barras/mapa de calor).
2. CUANDO el dominio cambia tras una respuesta, EL SISTEMA DEBERÁ actualizar la visualización en tiempo real.
3. EL SISTEMA DEBERÁ mostrar la **secuencia de la ruta adaptativa** (qué se decidió y por qué) de forma comprensible para el jurado.

## Requisito 6 — Banco de ejercicios

**Historia:** Como sistema, necesito un banco de ejercicios etiquetados por subtema y dificultad, para que el motor pueda seleccionarlos.

**Criterios de aceptación (EARS):**
1. EL SISTEMA DEBERÁ almacenar ejercicios con: enunciado, respuesta correcta, subtema, dificultad (1–5) y tipo.
2. CUANDO el motor pide un ejercicio de (subtema, dificultad), EL SISTEMA DEBERÁ devolver uno no repetido en la sesión si existe.
3. EL SISTEMA PODRÁ generar ejercicios nuevos con Bedrock si se agota el banco para una combinación (extensión opcional).

## Requisitos no funcionales

1. **Rendimiento:** la actualización de dominio y selección del siguiente ejercicio DEBERÁ responder en < 1 s (p95).
2. **Costo/eficiencia:** llamadas a Bedrock solo bajo demanda; el resto del loop sin IA generativa.
3. **Disponibilidad de demo:** la app DEBERÁ estar desplegada y accesible por URL pública (entregable obligatorio).
4. **Escalabilidad:** arquitectura serverless (escala a cero, sin servidores que mantener).
5. **Seguridad:** datos de estudiantes protegidos; autenticación en todos los endpoints de la ruta.
6. **Accesibilidad:** UI usable en móvil de gama media (navegador), contraste y teclado.

## Fuera de alcance (MVP)

Panel del docente · múltiples materias · gamificación/insignias · multi-idioma · modo offline-first · app nativa.
