# GuIA — Estructura del repositorio

```
├── .kiro/                  ← steering + specs (este directorio)
├── docs/                   ← especificaciones del proyecto
│   ├── 04-requisitos-prototipo.md   (requisitos R01–R24 priorizados)
│   ├── 05-insumos-institucionales.md (formatos reales del Politécnico)
│   ├── 06-arquitectura-v2.md        (ARQUITECTURA AUTORITATIVA)
│   ├── 07-tareas-atomicas.md        (plan T-001..T-1404 — tablero vivo)
│   └── insumos/                     (FD-GC70, FD-GC71, listado anónimo; el
│                                     xlsx real con PII está en .gitignore)
├── design/prototipo-guia.html       (prototipo aprobado — referencia visual EXACTA)
├── src/
│   ├── engine/            ← motor adaptativo PURO (mastery, selector) + tests
│   ├── lib/
│   │   ├── tutor/         ← prompts (puros) · client/tutor (Node/SDK) ·
│   │   │                    service (navegador→API) · answer (tipos)
│   │   ├── roster.ts      ← parser del listado del Poli + tests
│   │   └── i18n.ts
│   ├── content/           ← seed del curso CBS00074 (fuente para DynamoDB)
│   ├── state/             ← PracticeContext (local; se sustituirá por Amplify
│   │                        manteniendo la MISMA interfaz)
│   ├── pages/             ← Landing, Login, Curso, Practica, Docente, Stub
│   ├── components/        ← Logo, Math/Rich (KaTeX)
│   └── styles/            ← tokens.css + components.css (sistema visual)
├── scripts/tutor-lab.ts   ← REPL para refinar prompts contra el modelo real
└── amplify/               ← (LO CREA KIRO — spec aws-backend)
```

## Reglas de modificación
- `src/engine/` y `src/lib/tutor/prompts.ts`: cambiar solo con sus tests actualizados.
- `src/state/PracticeContext.tsx`: al migrar a Amplify, conservar la interfaz `PracticeApi` para no tocar las páginas.
- `docs/07-tareas-atomicas.md`: marcar `✔` las tareas completadas en cada commit.
