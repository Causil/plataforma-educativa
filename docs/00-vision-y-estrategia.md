# GuIA — Tutor IA Adaptativo
### Visión y estrategia para ganar el Hackathon códigofacilito + Kiro

> **Nombre provisional:** *GuIA* (juego de palabras: **guía** + **IA**). A confirmar.
> **Estado:** Fase 0 · Kickoff — borrador para revisión.

---

## 1. El problema (necesidad real → pilar *Impacto tecnológico*, 30%)

Millones de estudiantes de secundaria en LatAm arrastran vacíos en matemáticas y lectura, y **no tienen acceso a tutoría personalizada**: 1 profesor para 40 alumnos, ritmo único para todos, y el que se atrasa se queda atrás. La tutoría privada es cara y escasa.

El contenido educativo actual (videos, PDFs, apps) es **estático**: le da lo mismo a todos, sin importar qué domina o qué le cuesta a cada estudiante.

## 2. La solución

**GuIA** es un tutor con IA que construye una **ruta de aprendizaje que se adapta en tiempo real** a cada estudiante. Responde un ejercicio → el sistema recalcula qué domina y qué no → elige el siguiente ejercicio y genera pistas/explicaciones con IA ajustadas a su nivel. Como un tutor humano 1:1, pero para todos y a costo marginal casi cero.

## 3. Nuestro diferenciador (→ pilar *Innovación*, 30%)

Ventaja técnica **frente a lo existente**:

| Alternativa | Su límite | Ventaja de GuIA |
|---|---|---|
| Khan Academy / Coursera | Contenido y secuencia **estáticos** | Ruta que se **recalcula en cada respuesta** |
| Duolingo | Adaptativo pero **cerrado a un dominio/gamificación** | Motor de dominio + IA generativa por materia |
| ChatGPT "hazme la tarea" | Da la respuesta → **no mide ni construye dominio** | **Modela el dominio** del alumno y decide pedagógicamente qué sigue |

**El "wow" demostrable en 30 s:** en la demo se *ve* la ruta reordenándose en vivo según las respuestas — no es contenido pregrabado.

**Ventaja técnica extra (mantenibilidad/eficiencia, que el criterio premia):**
- Motor adaptativo **ligero** (knowledge tracing / mastery model) que corre en una Lambda barata — no requiere entrenar modelos pesados.
- IA generativa **bajo demanda** (Bedrock) solo cuando se necesita una pista/explicación → menor consumo de tokens = menor costo y mejor escalabilidad.

## 4. Alcance del MVP (→ pilar *Software funcional*, 30% — ¡el más fácil de perder!)

**Regla de oro: demo EN LÍNEA desplegada y funcional > muchas features rotas.**

MVP acotado a **una materia y un tema** para que sea entregable y demoable:
- **Materia:** Matemáticas de secundaria · **Tema:** fracciones / álgebra básica.
- **Loop principal:**
  1. Diagnóstico corto (estima nivel inicial).
  2. Motor adaptativo elige el siguiente ejercicio según el dominio estimado.
  3. Si falla → Bedrock genera pista socrática y explicación a su nivel.
  4. Panel que muestra el dominio por subtema y **la ruta adaptándose en vivo**.

Fuera del MVP (post-hackathon): panel del docente, más materias, gamificación, multi-idioma, offline-first.

## 5. Cómo mapeamos cada criterio de evaluación

| Criterio | Peso | Nuestra jugada |
|---|---|---|
| a) Impacto tecnológico | 30% | Necesidad real LatAm (códigofacilito), narrativa + a quién ayuda. |
| b) Innovación | 30% | Ruta adaptativa en vivo + motor ligero eficiente vs. contenido estático. |
| d) Software funcional + entregables | 30% | **Demo desplegada** + repo/README + video con demo funcional. |
| c) Uso de AWS y Kiro | 10% | Arquitectura AWS (Bedrock, Lambda, DynamoDB…) construida con Kiro spec-driven. |

## 6. Entregables obligatorios (checklist)

- [ ] Repositorio público en GitHub + **README** claro.
- [ ] **Enlace a demo en línea** (desplegada en AWS).
- [ ] **Video** de presentación: objetivos + componentes + demo funcional.
- [ ] *(Suma, no obligatorio)* Diagramas de arquitectura, casos de uso, visuales.

## 7. Método de trabajo (ciclo agent-skills → artefactos Kiro)

`DEFINE (/spec) → PLAN (/plan) → BUILD (/build) → VERIFY (/test) → REVIEW (/review) → SHIP (/ship)`

| Fase | Entregable | Herramienta |
|---|---|---|
| DEFINE | `01-requirements.md` (historias + criterios EARS) | Claude Code → Kiro |
| PLAN | `02-design.md` + análisis de costos + `03-tasks.md` | Claude Code → Kiro |
| Setup | GitHub Project (épicas/tareas/subtareas) | GitHub |
| BUILD | Slices verticales, feature flags | **Kiro** (créditos gratis) |
| VERIFY | Tests + browser testing | Kiro |
| REVIEW | Quality gates, seguridad, simplificación | Claude Code |
| SHIP | Deploy AWS + observabilidad + video | AWS + Claude Code |

**Reparto:** yo (Claude Code) pienso, estructuro y reviso; **Kiro construye** (aprovecha créditos + evidencia el 10%).

## 8. Restricciones del reglamento (críticas)

- **Hackathon de 7 días:** 20 jul 2026 → **cierre 27 jul 2026, 23:59 (UTC-6)**. Hoy es 22 jul → **~5 días reales**.
- Equipo de **1 a 5 personas**. Trabajo **original**, desarrollado dentro del periodo.
- Kiro y AWS **recomendados, no obligatorios** (se permite otra nube). Los usamos igual: 10% de la nota + créditos gratis.
- Registro: cuenta en codigofacilito.com + Discord oficial + formulario.
- Entrega por el canal oficial antes del cierre. Ganadores: 25 ago 2026.

> **Consecuencia de diseño:** alcance ultra-lean. Prioridad absoluta = **demo desplegada y funcional + video**. Ver cronograma en `03-tasks.md`.

## 9. Decisiones pendientes

- [ ] ¿Equipo o individual? Si equipo, ¿quién toca qué? (1–5 personas)
- [ ] Confirmar nombre definitivo (¿*GuIA*?).
- [ ] Confirmar registro hecho (códigofacilito + Discord) y créditos AWS/Kiro activos.
