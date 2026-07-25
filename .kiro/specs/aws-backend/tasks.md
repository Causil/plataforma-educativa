# Spec: aws-backend — Tareas

> Prerequisito: perfil AWS PERSONAL `guia` configurado (`aws configure --profile guia`)
> y Bedrock model access aprobado para Claude Haiku/Sonnet en us-east-1 (T-002).
> ⚠️ NUNCA usar el perfil default (credenciales del trabajo — ver steering/tech.md).
> Todo comando ampx lleva `--profile guia`.
> Tras CADA tarea: `npm test` y `npm run build` deben quedar en verde.

- [x] 1. Inicializar Amplify Gen2 en el repo (`npm create amplify@latest`), estructura `amplify/` con backend.ts vacío funcional; `npx ampx sandbox` levanta. *(Req 5; T-201)*

- [x] 2. Auth: `amplify/auth/resource.ts` con login por email y grupos `students`/`teachers`/`admins`; crear 3 usuarios de prueba (uno por grupo). *(Req 1.1; T-202)*

- [x] 3. Conectar Login.tsx a Cognito (signIn de aws-amplify) conservando el diseño actual; redirección por grupo; guards reales en el router (estudiante no entra a /docente). *(Req 1.1, 1.4; T-203, T-206)*

- [x] 4. Flujo recuperar contraseña (resetPassword + confirmResetPassword) con la UI de 2 pasos del prototipo. *(Req 1.2; T-204)*

- [x] 5. Flujo primer ingreso: usuario creado con AdminCreateUser entra con contraseña temporal → pantalla de crear contraseña (confirmSignIn NEW_PASSWORD_REQUIRED). Probar creando un usuario invitado manualmente. *(Req 1.3; T-205)*

- [ ] 6. Data: `amplify/data/resource.ts` con los 10 modelos y reglas de autorización del diseño (owner para progreso, grupos para gestión, Enrollment para cursos privados; answerIndex/hint/explanation NO legibles por estudiantes). *(Req 2.1, 2.2; T-301..T-303)*

- [ ] 7. Seed idempotente: `scripts/seed.ts` carga `src/content/estadistica.ts` (curso, 6 unidades, 8 subtemas, 16 ejercicios) al sandbox; correrlo 2 veces y verificar que no duplica. *(Req 2.3; T-304, T-305)*

- [ ] 8. Function `next-exercise` usando `src/engine/selector.ts`; probar que responde ejercicio sin answerIndex + motivo. *(Req 3.1; T-404a)*

- [ ] 9. Function `submit-answer` usando `src/engine/mastery.ts`; escribe MasteryState/RouteLog/GameState; devuelve resultado con hint/explanation. *(Req 3.2; T-404b)*

- [ ] 10. Migrar `PracticeContext` a la nube: nueva implementación del provider llamando a las functions (MISMA interfaz PracticeApi); verificar que la práctica persiste al recargar la página. *(Req 3; T-405-cloud)*

- [ ] 11. Function `tutor` (hint/chat/explanation) con `LLM_PROVIDER=bedrock` + IAM `bedrock:InvokeModel`; smoke test: chat responde `source:'ai'`; sin permisos → fallback. Conectar frontend (VITE_TUTOR_API o mutation). *(Req 4; T-601..T-604)*

- [ ] 12. Amplify Hosting: conectar repo GitHub rama main, build de Vite, URL pública; verificar la app completa en la URL. *(Req 5; T-1301)*

- [ ] 13. QA end-to-end en la URL pública (recorrido estudiante completo + docente) y reporte de hallazgos en docs/07. *(T-1302 parcial)*
