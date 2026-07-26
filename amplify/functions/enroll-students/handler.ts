/**
 * enroll-students (R02 — matrícula por listado oficial)
 *
 * Recibe el listado parseado del XLSX/CSV institucional y, por cada estudiante:
 * 1. Crea la cuenta en Cognito (AdminCreateUser) → Cognito envía la invitación
 *    por correo con contraseña temporal (flujo primer ingreso ya implementado).
 *    Si la cuenta ya existe, la reutiliza (idempotente, permite re-subir listado).
 * 2. Lo agrega al grupo `students`.
 * 3. Registra el Enrollment (courseId + sub) si no existe — la llave de acceso
 *    al curso privado, con nombre y correo para los paneles del docente.
 */
import type { Schema } from '../../data/resource';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/enroll-students';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const cognito = new CognitoIdentityProviderClient();

interface RosterStudent {
  document?: string;
  fullName?: string;
  email: string;
}

interface AppSyncEvent {
  identity?: { sub?: string; username?: string };
  arguments: { courseId: string; students: string };
}

const USER_POOL_ID = process.env.USER_POOL_ID ?? '';

const findSub = (attrs: { Name?: string; Value?: string }[] | undefined) =>
  attrs?.find((a) => a.Name === 'sub')?.Value;

export const handler = async (event: AppSyncEvent) => {
  if (!event.identity?.sub) return { error: 'No autenticado.' };
  if (!USER_POOL_ID) return { error: 'USER_POOL_ID no configurado.' };

  let roster: RosterStudent[];
  try {
    roster = JSON.parse(event.arguments.students);
    if (!Array.isArray(roster)) throw new Error('students debe ser un arreglo');
  } catch {
    return { error: 'Formato inválido: students debe ser JSON de arreglo.' };
  }

  const courseId = event.arguments.courseId;
  const results: { email: string; status: 'invited' | 'existing' | 'error'; enrolled: boolean; detail?: string }[] = [];

  // Enrollments existentes del curso (para idempotencia sin N consultas)
  const { data: existing } = await client.models.Enrollment.list({
    filter: { courseId: { eq: courseId } },
    limit: 500,
  });
  const enrolledEmails = new Set(
    (existing ?? []).map((e) => (e.email ?? '').toLowerCase()).filter(Boolean),
  );

  for (const s of roster) {
    const email = s.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      results.push({ email: s.email ?? '(vacío)', status: 'error', enrolled: false, detail: 'Correo inválido' });
      continue;
    }

    try {
      let sub: string | undefined;
      let status: 'invited' | 'existing' = 'invited';

      try {
        const created = await cognito.send(
          new AdminCreateUserCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            UserAttributes: [
              { Name: 'email', Value: email },
              { Name: 'email_verified', Value: 'true' },
            ],
            DesiredDeliveryMediums: ['EMAIL'], // Cognito envía la invitación con contraseña temporal
          }),
        );
        sub = findSub(created.User?.Attributes);
      } catch (err) {
        if (err instanceof UsernameExistsException) {
          status = 'existing';
          const user = await cognito.send(
            new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }),
          );
          sub = findSub(user.UserAttributes);
        } else {
          throw err;
        }
      }

      if (!sub) throw new Error('Cognito no devolvió el sub del usuario');

      await cognito.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: USER_POOL_ID,
          Username: email,
          GroupName: 'students',
        }),
      );

      let enrolled = false;
      if (!enrolledEmails.has(email)) {
        await client.models.Enrollment.create({
          courseId,
          studentId: sub,
          email,
          fullName: s.fullName ?? null,
          document: s.document ?? null,
          source: 'xlsx',
          status: status === 'invited' ? 'invited' : 'active',
        });
        enrolledEmails.add(email);
        enrolled = true;
      }

      results.push({ email, status, enrolled });
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Error desconocido';
      results.push({ email, status: 'error', enrolled: false, detail });
    }
  }

  return {
    courseId,
    total: roster.length,
    invited: results.filter((r) => r.status === 'invited').length,
    existing: results.filter((r) => r.status === 'existing').length,
    enrolled: results.filter((r) => r.enrolled).length,
    errors: results.filter((r) => r.status === 'error').length,
    results,
  };
};
