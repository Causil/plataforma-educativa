# Requisitos del Prototipo — GuIA
### La visión de Javier, estructurada y priorizada

> **Estado:** 🟢 Requisitos capturados (22-23 jul) · Priorización propuesta, pendiente de validar.
> **Prototipo actual:** https://claude.ai/code/artifact/dc94021d-5866-4f1b-a715-a580b1f63550
>
> **Leyenda de prioridades:**
> - **P0** = funcional en la demo del 27 jul
> - **P0-proto** = visible en el prototipo/demo aunque sea simulado (impresiona al jurado sin costo de backend)
> - **P1** = se construye si el tiempo alcanza
> - **P2** = post-hackathon; se presenta como *roadmap/visión* en el video

---

## 🎯 Visión ampliada (cambia el concepto)

GuIA pasa de "tutor de fracciones" a **plataforma de cursos adaptativos con IA**:

1. **Cursos públicos** — abiertos a cualquier persona (foco MVP: **Estadística**).
2. **Cursos universitarios contratados** — el docente da clases en universidades (ej. Politécnico Jaime Isaza Cadavid) que exigen su propio temario y formatos: la plataforma le permite crear el curso a la medida, matricular estudiantes por listado y cumplir los informes institucionales.

**Materia del MVP: ESTADÍSTICA** (reemplaza a fracciones en el banco de ejercicios, diagnóstico y demo).

---

## Requisitos por área

### A. Cuentas, acceso y matrícula

| ID | Requisito | Prioridad |
|---|---|---|
| R01 | Recuperación de cuenta/contraseña | **P0** (flujo UI) / P1 (email real vía Cognito) |
| R02 | **Matrícula por XLSX** (cursos universitarios): el docente sube xlsx con nombres+correos → no hay auto-inscripción → se notifica a cada estudiante que tiene acceso → crea su contraseña en el primer ingreso → con recuperación. **El curso universitario es PRIVADO: solo acceden quienes están en el listado que entrega la universidad** | **P1** (backend real) / **P0-proto** (flujo simulado en prototipo) |
| R03 | **Analítica de uso por estudiante**: frecuencia de ingreso, duración de sesión y ruta de navegación que sigue | P1 (registro básico de eventos) / P2 (analítica completa) |

### B. Cursos y estructura académica

| ID | Requisito | Prioridad |
|---|---|---|
| R04 | Catálogo de **cursos públicos** (ej. Estadística, Álgebra básica) | **P0** (1 curso: Estadística) |
| R05 | **Cursos universitarios a la medida**: el docente crea el curso con el temario que exige la universidad. **No es público** — acceso restringido al listado XLSX (ver R02) | **P0-proto** (pantalla de creación) / P1 (funcional) |
| R06 | **Recorrido del curso**: Tema 1 → Subtema 1, 2, 3 → Actividad evaluativa. Cada subtema/ítem registra avance | **P0** ⭐ (es la columna vertebral) |
| R07 | Material por tema/subtema en dos formatos: **PDF extendido** (bien desglosado) + **presentación tipo Beamer** (resumida) | P1 (material precargado de Estadística) / P2 (generación automática) |

### C. Diagnóstico

| ID | Requisito | Prioridad |
|---|---|---|
| R08 | Diagnóstico inicial de **Estadística** con preguntas de nivel **básico, intermedio y avanzado** (conceptos) | **P0** ⭐ |

### D. Tutor IA (el corazón)

| ID | Requisito | Prioridad |
|---|---|---|
| R09 | **Chat interactivo**: el estudiante pregunta sobre el tema; el acompañante IA da opciones, ejemplos y explicación del concepto | **P0** ⭐ |
| R10 | El tutor cita **libros de referencia: título, capítulo y página** para profundizar | **P0** (corpus curado con referencias mapeadas) |
| R11 | **"Universo de libros"**: corpus definido de libros donde el tutor busca explicaciones y desde donde formula preguntas, talleres y quices — con consumo mínimo (RAG económico) | P1 (Bedrock Knowledge Base o embeddings sobre 1-2 libros abiertos) — **gran punto AWS** |
| R12 | **Avatar en tablero**: tutor con avatar que explica de forma natural; el estudiante puede interrumpir con preguntas o dejarlas en un **buzón**; al terminar, el tutor pregunta cuáles responder | P2 (roadmap en video) / P0-proto opcional (mock visual del buzón) |

### E. Evaluación

| ID | Requisito | Prioridad |
|---|---|---|
| R13 | Tipos de actividad: **taller, quiz, examen** — todos con **rúbrica** | P1 (quiz auto-calificado con rúbrica) / P2 (taller y examen completos) |
| R14 | **Proctoring anti-fraude** en exámenes virtuales: cámara con reconocimiento de personas/objetos, verificación de distancia y entorno/escritorio, monitoreo de ventanas y mouse, bloqueo en móvil, bloqueo de sesión si cae internet, anti-pantallazos | **P2** (roadmap — técnicamente pesado y sensible en privacidad; se presenta como visión) |
| R15 | **Calificación automática** + **OCR** de trabajos subidos en papel (interpretar lo que el estudiante escribió en la foto) | P2 (nota: Claude en Bedrock ya lee imágenes → demo futura factible) |
| R16 | **Evaluación del curso por los estudiantes** (encuesta de satisfacción, visible para admin) | P1 |

### F. Panel docente

| ID | Requisito | Prioridad |
|---|---|---|
| R17 | **Informes institucionales auto-llenados**: leer formatos xlsx/word que exige la universidad (ej. Politécnico JIC; UdeA no pide) y llenarlos con datos del curso recaudados automáticamente. Javier puede aportar ejemplares reales | P2 (roadmap potente para docentes) / P1 si hay tiempo: export simple de datos |
| R18 | **Modo clase**: presentar diapositivas (Beamer) en vivo, con tutor IA disponible, opción de **rayar/anotar** y lanzar tests por subtema | P1 parcial (visor de presentación + test) / P2 (anotaciones) |

### G. Transversal

| ID | Requisito | Prioridad |
|---|---|---|
| R19 | **Logo**: un infinito que se transforma en un toro / botella de Klein (proceso topológico) — identidad matemática única | P1 (versión estática SVG) / P1-P2 (animación) |
| R20 | **Responsive**: móvil y desktop por igual | **P0** |
| R21 | **Bilingüe**: español e inglés | P1 (selector + textos EN) / **P0** solo español |
| R22 | **Gamificación completa**: rachas, puntos, insignias, niveles — todos | **P0** (rachas + puntos, ya hay base) / P1 (insignias + niveles) |
| R23 | **Fórmulas matemáticas con KaTeX**: todo el texto matemático se renderiza con KaTeX para que se vea profesional y acorde | **P0** (app real — KaTeX es ligero y corre en el navegador; en el prototipo se simula con estilos serif) |
| R24 | **Gráficos calidad LaTeX/TikZ**: figuras estáticas bonitas (pipeline TikZ→SVG) y/o **gráficos dinámicos/interactivos** (curvas, distribuciones, funciones) | P1 (motor de gráficos dinámicos) / **P0-proto** (demo: curva normal SVG en el chat del tutor) |

---

## 📋 Resumen de la priorización propuesta

### P0 — Demo funcional del 27 jul (lo que el jurado usa en vivo)
1. Landing + login por rol (con flujo de recuperación) — R01, R20
2. **Curso de Estadística** con recorrido Tema → Subtemas → Actividad y registro de avance — R04, R06 ⭐
3. **Diagnóstico** básico/intermedio/avanzado — R08 ⭐
4. **Práctica adaptativa** (motor que ya diseñamos) + **chat con el tutor IA** (ejemplos, explicaciones, referencias a libros con capítulo y página) — R09, R10 ⭐
5. Gamificación: rachas + puntos — R22
6. Panel docente básico (heatmap actual) + pantalla de creación de curso universitario (simulada) — R05

### P1 — Si el tiempo alcanza (en orden)
1. RAG "universo de libros" con Bedrock (aunque sea 1 libro abierto) — R11 💎 *el mayor diferenciador técnico*
2. Matrícula por XLSX + notificación — R02
3. Quiz con rúbrica auto-calificado — R13
4. Material PDF/Beamer precargado + modo clase básico — R07, R18
5. Logo topológico + bilingüe + insignias/niveles — R19, R21, R22
6. Analítica de uso + encuesta de curso — R03, R16

### P2 — Roadmap (se muestra en el video como visión)
- Avatar en tablero con buzón de preguntas — R12
- Proctoring anti-fraude completo — R14
- OCR + calificación automática de trabajos en papel — R15
- Informes institucionales auto-llenados — R17
- Generación automática de material Beamer/PDF — R07

> **Estrategia de demo:** el prototipo/video muestra TODO (P0 funcional + P1/P2 como pantallas simuladas o mockups), para que el jurado vea la visión completa. Lo construido de verdad es P0 (+P1 según avance).

---

## 📝 Notas técnicas y de riesgo

- **Libros del corpus (R10/R11):** usar libros de licencia abierta para evitar líos de derechos en un repo público — p. ej. *OpenIntro Statistics* (CC BY-SA, tiene versión en español "Estadística Abierta"), *Introduction to Modern Statistics* (CC). Javier puede sumar sus propias notas de clase.
- **RAG económico (R11):** encaja perfecto con AWS → Bedrock Knowledge Bases o embeddings (Titan) + S3. Refuerza el 10% de AWS y el 30% de innovación ("tutor anclado en bibliografía real, no alucina").
- **Proctoring (R14):** además del reto técnico, implica biometría/privacidad (consentimiento, normativa). Correcto presentarlo como roadmap con diseño responsable.
- **Pivote de materia:** el banco de ejercicios, subtemas y diagnóstico pasan de fracciones a **Estadística** (p. ej.: tipos de variables, tendencia central, dispersión, probabilidad básica, distribuciones, muestreo). El motor adaptativo no cambia — es agnóstico a la materia. ✅
- **Matemáticas y gráficos (R23/R24):** **KaTeX** para fórmulas (ligero, renderiza en el navegador, sin servidor). Gráficos en dos vías: (a) **TikZ→SVG precompilado** en build para figuras estáticas con calidad LaTeX; (b) librería tipo **JSXGraph / function-plot** para gráficos interactivos (curvas, distribuciones). El prototipo ya incluye una curva normal SVG con el 68% sombreado como demo en el chat del tutor.
- **Privacidad de cursos universitarios (R02/R05):** control de acceso por curso — `public` vs `private` con lista de matriculados; en AWS se implementa con grupos de Cognito + autorización por curso en las consultas.
