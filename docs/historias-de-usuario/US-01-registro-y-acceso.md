# US-01 · Registro y acceso

**Prioridad:** Alta · **Depende de:** — · **Épica:** Cuentas

## Historia
Como **estudiante**, quiero **crear una cuenta e iniciar sesión**, para que **mi progreso se guarde entre sesiones**.

## Criterios de aceptación (EARS)
1. CUANDO un visitante envía email y contraseña válidos, EL SISTEMA DEBERÁ crear una cuenta y una sesión autenticada.
2. CUANDO un estudiante registrado inicia sesión con credenciales válidas, EL SISTEMA DEBERÁ restaurar su estado de dominio previo.
3. SI las credenciales son inválidas, ENTONCES EL SISTEMA DEBERÁ rechazar el acceso y mostrar un mensaje claro.
4. MIENTRAS el estudiante no esté autenticado, EL SISTEMA DEBERÁ impedir el acceso a la ruta de aprendizaje.

## Servicios AWS
- **Amazon Cognito** (User Pool) para registro, login y gestión de sesión/JWT.
- API Gateway + Lambda protegidas con el authorizer de Cognito.

## Modelo de datos
- Tabla `Students` (DynamoDB): `studentId (PK)`, `email`, `createdAt`, `lastLoginAt`.
- El `studentId` se deriva del `sub` de Cognito.

## Notas de implementación
- Usar Amplify Auth o SDK de Cognito en el frontend.
- No almacenar contraseñas propias: delegar en Cognito.
- Endpoints de la ruta rechazan peticiones sin JWT válido (401).

## Definición de Hecho (DoD)
- [ ] Registro + login funcionando end-to-end.
- [ ] Endpoints protegidos devuelven 401 sin token.
- [ ] Estado del estudiante persiste entre sesiones.
- [ ] Prueba manual + prueba automatizada del flujo de auth.
