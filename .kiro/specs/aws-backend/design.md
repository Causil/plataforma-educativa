# Spec: aws-backend — Diseño

> Fuente completa: `docs/06-arquitectura-v2.md`. Aquí, lo ejecutable.

## Estructura Amplify Gen2 a crear
```
amplify/
├── auth/resource.ts        # Cognito: email login + grupos students/teachers/admins
├── data/resource.ts        # modelos + reglas de autorización
├── functions/
│   ├── next-exercise/      # envuelve src/engine (selector)
│   ├── submit-answer/      # envuelve src/engine (mastery) + RouteLog + GameState
│   └── tutor/              # envuelve src/lib/tutor (getHint/chat/explanation)
└── backend.ts
```

## Auth
- `defineAuth({ loginWith: { email: true }, groups: ['students','teachers','admins'] })`.
- Usuarios de prueba post-deploy: uno por grupo (script o consola).
- Matrícula: la function de roster (fase 2) usará `AdminCreateUser`; por ahora los invitados se crean manualmente para probar el flujo `NEW_PASSWORD_REQUIRED`.

## Data (esquema resumido — campos completos en arquitectura §5)
- `Course{ code, name, institution, visibility: 'public'|'private', credits, teacherId }`
- `Unit{ courseId, order, title }` · `Subtopic{ unitId, order, name, short, bookRefs: json }`
- `Exercise{ subtopicId, level, difficulty, prompt, options: string[], answerIndex, hint, explanation }`
  ⚠️ `answerIndex/hint/explanation` NO deben ser legibles por estudiantes directamente
  (autorización a nivel de campo o lectura solo vía Lambda).
- `Enrollment{ courseId, studentId, document, source }`
- `MasteryState{ studentId, subtopicId, mastery, consecutiveFails }` (owner)
- `RouteLog{ studentId, step, subtopicId, difficulty, ok, masteryBefore, masteryAfter, reason }` (owner)
- `GameState{ studentId, xp, level, streak }` (owner)
- `Submission{ activityId, studentId, answers: json, score, rubricScores: json }` (owner)

## Functions
- **next-exercise** (handler TS): lee MasteryState del caller → `selectNext()` → busca Exercise por (subtopic, dificultad±) no repetido reciente → responde `{exercise: {id, prompt, options, level, difficulty}, reason}` (sin answerIndex).
- **submit-answer**: input `{exerciseId, optionIndex}` → carga Exercise (con answerIndex) → `updateMastery()` → escribe MasteryState/RouteLog/GameState → responde `{ok, before, after, xp, streak, level, hint?, explanation?}` (hint/explanation solo tras responder).
- **tutor**: input `{kind: 'hint'|'chat'|'explanation', ctx, ...}` → funciones de `src/lib/tutor/tutor.ts` con `LLM_PROVIDER=bedrock`. Env: `LLM_PROVIDER=bedrock`, `AWS_REGION=us-east-1`. IAM: `bedrock:InvokeModel` sobre los modelos Haiku/Sonnet.
- Exponer como REST (Function URL o API AppSync custom mutation — preferir mutation AppSync para heredar auth de Cognito).

## Frontend (cambios mínimos)
- `src/state/PracticeContext.tsx`: nueva implementación del provider que llama a las mutations — **conservar la interfaz `PracticeApi`** (las páginas no cambian).
- `.env`: `VITE_TUTOR_API` (si Function URL) o usar client de Amplify.
- Login.tsx → Authenticator de Amplify o `signIn()` manual conservando el diseño actual.

## Seed
- Script `scripts/seed.ts` (tsx): lee `src/content/estadistica.ts`, upsert por id natural (`code`, `unitId`, `exerciseId`) → idempotente. Ejecutar contra el sandbox y contra prod.

## Verificación por fase (gates)
1. `npx ampx sandbox` levanta sin errores.
2. Login real + guard por grupo funcionando en `npm run dev`.
3. Seed idempotente verificado (2 corridas = mismos conteos).
4. Práctica end-to-end contra la nube (mastery persiste al recargar).
5. Chat del tutor responde desde Bedrock (source: 'ai') y con Bedrock apagado degrada a fallback.
6. URL pública de Amplify Hosting sirviendo la app.
`npm test` y `npm run build` en verde en TODO momento.
