/**
 * Crea las cuentas demo en un user pool (idempotente: si existe, solo
 * reasigna contraseña y grupo). Sin correo de invitación (guia.app no es
 * nuestro dominio: un rebote daña la reputación de SES).
 *
 * Estudiante: contraseña pública del README. Profesor/admin: contraseñas
 * aleatorias — el backend tiene estudiantes reales — escritas en CREDS_FILE
 * (modo 600, fuera del repo) en formato .env para los smokes.
 *
 * Uso:
 *   AWS_PROFILE=guia npx tsx scripts/create-demo-users.ts <userPoolId> <credsFile>
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  CognitoIdentityProviderClient,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';

const [poolId, credsFile] = process.argv.slice(2);
if (!poolId || !credsFile) {
  console.error('Uso: npx tsx scripts/create-demo-users.ts <userPoolId> <credsFile>');
  process.exit(1);
}

const randomPassword = () => `GuIA-${randomBytes(12).toString('base64url')}!9a`;

const USERS = [
  { key: 'STUDENT', email: 'estudiante.demo@guia.app', group: 'students', password: 'GuIA-2026!' },
  { key: 'TEACHER', email: 'profe.demo@guia.app', group: 'teachers', password: randomPassword() },
  { key: 'ADMIN', email: 'admin.demo@guia.app', group: 'admins', password: randomPassword() },
];

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });

async function main() {
  const lines: string[] = [];
  for (const u of USERS) {
    try {
      await cognito.send(
        new AdminCreateUserCommand({
          UserPoolId: poolId,
          Username: u.email,
          UserAttributes: [
            { Name: 'email', Value: u.email },
            { Name: 'email_verified', Value: 'true' },
          ],
          MessageAction: 'SUPPRESS',
        }),
      );
    } catch (err) {
      if (!(err instanceof UsernameExistsException)) throw err;
    }
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: poolId,
        Username: u.email,
        Password: u.password,
        Permanent: true,
      }),
    );
    await cognito.send(
      new AdminAddUserToGroupCommand({ UserPoolId: poolId, Username: u.email, GroupName: u.group }),
    );
    lines.push(`GUIA_${u.key}_EMAIL=${u.email}`, `GUIA_${u.key}_PASSWORD='${u.password}'`);
    console.log(`✔ ${u.email} → ${u.group}`);
  }
  writeFileSync(credsFile, lines.join('\n') + '\n', { mode: 0o600 });
  console.log(`🔐 credenciales en ${credsFile}`);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
