# GuIA — Stack y convenciones técnicas

## Stack
- **Frontend:** React 18 + Vite + TypeScript estricto · KaTeX (fórmulas) · i18next (ES; EN futuro) · CSS propio con tokens (`src/styles/`) — SIN frameworks UI.
- **Backend objetivo:** AWS **Amplify Gen2** (Auth=Cognito, Data=AppSync+DynamoDB, Functions=Lambda, Hosting). Región: **us-east-1**.
- **IA:** Amazon Bedrock — Haiku (`anthropic.claude-haiku-4-5`) para pistas/chat, Sonnet (`anthropic.claude-sonnet-5`) para explicaciones. Solo bajo demanda, siempre con fallback local.

## Comandos
- `npm run dev` — dev server (usa polling por límite de inotify de esta máquina)
- `npm test` — vitest (DEBE quedar en verde antes de cada commit)
- `npm run build` — tsc + vite build (DEBE pasar antes de cada commit)
- `npm run tutor:lab` — REPL del tutor (LLM_PROVIDER=bedrock para probar Bedrock)

## Convenciones no negociables
1. **El motor adaptativo (`src/engine/`) es puro y determinista** — sin llamadas de red, sin `Date.now()`/aleatoriedad en la lógica de decisión. Cualquier cambio requiere actualizar sus tests.
2. **Los SDKs de IA solo viven en Node** (Lambdas, `scripts/`). El navegador consume la API vía `src/lib/tutor/service.ts` (`VITE_TUTOR_API`). Nunca importar `@anthropic-ai/*` desde componentes React.
3. **Prompts:** la pista NUNCA incluye la respuesta correcta en el prompt; el chat solo puede citar bibliografía de `bookRefs` (prohibido inventar fuentes). Ver `src/lib/tutor/prompts.ts`.
4. **Cero PII real:** datos de estudiantes reales jamás en el repo ni en seeds (ver `.gitignore`). Los seeds usan nombres inventados.
5. **Cero secretos en código:** credenciales solo por IAM roles de Amplify / variables de entorno.
6. **Contenido = datos:** cursos/unidades/ejercicios viven en `src/content/estadistica.ts` (fuente para el seed de DynamoDB) — no hardcodear contenido en componentes.
7. Textos de UI en `src/i18n/es.json` (i18next), español por defecto.
8. Commits: mensaje descriptivo en español + referencia a tareas `T-###` de `docs/07-tareas-atomicas.md`.
