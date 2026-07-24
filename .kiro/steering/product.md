# GuIA — Contexto de producto

GuIA es una **plataforma de cursos adaptativos con IA** construida para el Hackathon de Código Facilito (Kiro + AWS). Cierre de entrega: **27 de julio, 23:59 UTC-6**.

## Qué hace
- **Cursos públicos** (ej. Estadística) y **cursos universitarios privados** (acceso solo por listado XLSX que entrega la universidad; ejemplo real: Estadística CBS00074 del Politécnico Colombiano Jaime Isaza Cadavid).
- **Ruta adaptativa**: un motor determinista (Elo, sin IA generativa) recalcula el dominio del estudiante tras cada respuesta y elige el siguiente reto; cada decisión es explicable.
- **Tutor IA** (Bedrock: Haiku para pistas/chat, Sonnet para explicaciones) anclado a la bibliografía oficial del curso — cita libro, capítulo y página; nunca revela respuestas en pistas.
- Roles: estudiante 🎓, profesor 🧑‍🏫 (crea cursos, matricula por XLSX, ve heatmap del grupo), admin ⚙️.

## Estado actual
- ✅ Frontend React funcional en local con datos seed (landing, login UI, Mi curso, Práctica+chat, Panel docente) — 42 tests en verde.
- ✅ Motor adaptativo (`src/engine/`) y capa del tutor (`src/lib/tutor/`) implementados y testeados.
- 🔜 **Este es el trabajo de Kiro:** conectar AWS (Amplify Gen2: Auth+Data+Functions+Hosting) siguiendo el spec `aws-backend`.

## Criterios del jurado (guían toda decisión)
Impacto 30% · Innovación/eficiencia 30% · **Software funcional desplegado + repo + video 30%** · Uso de AWS y Kiro 10%. Prioridad absoluta: que la demo pública funcione el 27.

## Documentación fuente
`docs/06-arquitectura-v2.md` (arquitectura autoritativa) · `docs/07-tareas-atomicas.md` (plan completo) · `docs/04-requisitos-prototipo.md` (requisitos R01–R24) · prototipo aprobado: `design/prototipo-guia.html`.
