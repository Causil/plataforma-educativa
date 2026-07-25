import { defineAuth } from '@aws-amplify/backend';

/**
 * Autenticación de GuIA (T-202):
 * - Login por email (Cognito User Pool)
 * - Grupos de rol: students / teachers / admins
 * - El "primer ingreso" de estudiantes matriculados por universidad usa el
 *   flujo nativo AdminCreateUser → invitación por email con contraseña
 *   temporal → NEW_PASSWORD_REQUIRED (el estudiante crea la suya).
 * - Recuperación de contraseña: flujo nativo resetPassword por email.
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  groups: ['students', 'teachers', 'admins'],
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
