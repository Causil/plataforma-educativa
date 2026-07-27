import { defineAuth } from '@aws-amplify/backend';
import { APP_URL } from '../constants';

/**
 * Autenticación de GuIA (T-202):
 * - Login por email (Cognito User Pool)
 * - Grupos de rol: students / teachers / admins
 * - El "primer ingreso" de estudiantes matriculados por universidad usa el
 *   flujo nativo AdminCreateUser → invitación por email con contraseña
 *   temporal → NEW_PASSWORD_REQUIRED (el estudiante crea la suya).
 * - Recuperación de contraseña: flujo nativo resetPassword por email.
 */

const LOGIN_URL = `${APP_URL}/login`;

/**
 * HTML del correo de invitación (T-207).
 * Layout compatible con Gmail/Outlook: tables + estilos inline, 600 px max.
 * Marcadores de Cognito: {username} y {####} (contraseña temporal).
 */
function buildInvitationEmail(username: () => string, code: () => string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f7;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;">
        <!-- Encabezado -->
        <tr>
          <td style="background-color:#0FB5A6;padding:24px 32px;text-align:center;">
            <span style="font-size:28px;font-weight:bold;color:#ffffff;letter-spacing:1px;">GuIA</span>
          </td>
        </tr>
        <!-- Cuerpo -->
        <tr>
          <td style="padding:32px;color:#333333;font-size:15px;line-height:1.6;">
            <p style="margin:0 0 16px;">Hola,</p>
            <p style="margin:0 0 16px;"><strong>GuIA</strong> es un tutor de estudio con inteligencia artificial que se adapta a tu ritmo de aprendizaje.</p>
            <p style="margin:0 0 16px;">Tu instituci\u00f3n te ha matriculado en un curso privado de la plataforma. A continuaci\u00f3n encontrar\u00e1s tus credenciales de acceso:</p>
            <!-- Credenciales -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;">
              <tr>
                <td style="padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:14px;color:#555555;">Usuario:</p>
                  <p style="margin:0 0 12px;font-size:16px;font-weight:bold;color:#111111;">${username()}</p>
                  <p style="margin:0 0 8px;font-size:14px;color:#555555;">Contrase\u00f1a temporal:</p>
                  <code style="display:inline-block;padding:8px 12px;background-color:#ffffff;border:1px solid #d1d5db;border-radius:4px;font-size:16px;font-family:monospace;color:#111111;letter-spacing:1px;">${code()}</code>
                </td>
              </tr>
            </table>
            <!-- Bot\u00f3n -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
              <tr>
                <td align="center">
                  <a href="${LOGIN_URL}" target="_blank" style="display:inline-block;padding:14px 32px;background-color:#0FB5A6;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;border-radius:6px;">Entrar a GuIA</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:13px;color:#555555;text-align:center;">Si el bot\u00f3n no funciona, copia y pega esta direcci\u00f3n en tu navegador:<br><a href="${LOGIN_URL}" style="color:#0FB5A6;word-break:break-all;">${LOGIN_URL}</a></p>
            <!-- Instrucciones -->
            <p style="margin:0 0 16px;">Al iniciar sesi\u00f3n con la contrase\u00f1a temporal, la plataforma te pedir\u00e1 crear tu contrase\u00f1a definitiva.</p>
            <p style="margin:0 0 16px;"><strong>Importante:</strong> esta contrase\u00f1a temporal vence en <strong>7 d\u00edas</strong>. Si no accedes antes de ese plazo, deber\u00e1s solicitar una nueva a tu docente.</p>
            <!-- Pie -->
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
            <p style="margin:0;font-size:12px;color:#888888;line-height:1.5;">Si no esperabas este correo, ign\u00f3ralo. No se ha creado ning\u00fan perfil p\u00fablico a tu nombre.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export const auth = defineAuth({
  loginWith: {
    email: {
      userInvitation: {
        emailSubject: 'Activa tu cuenta en GuIA',
        emailBody: buildInvitationEmail,
      },
    },
  },
  groups: ['students', 'teachers', 'admins'],
  userAttributes: {
    email: {
      required: true,
      mutable: true,
    },
  },
});
