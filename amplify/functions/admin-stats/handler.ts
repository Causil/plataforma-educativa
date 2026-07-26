/**
 * admin-stats — datos REALES para el panel de administración.
 *
 * - Usuarios: Cognito ListUsers + membresía por grupo (ListUsersInGroup ×3).
 * - Conteos: cursos, ejercicios, matrículas, ejercicios respondidos y
 *   evaluaciones entregadas, leídos de DynamoDB vía el data client.
 */
import type { Schema } from '../../data/resource';
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  ListUsersInGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/admin-stats';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>();
const cognito = new CognitoIdentityProviderClient();

const USER_POOL_ID = process.env.USER_POOL_ID ?? '';
const GROUPS = ['students', 'teachers', 'admins'] as const;

interface AppSyncEvent {
  identity?: { sub?: string };
}

export const handler = async (event: AppSyncEvent) => {
  if (!event.identity?.sub) return { error: 'No autenticado.' };
  if (!USER_POOL_ID) return { error: 'USER_POOL_ID no configurado.' };

  try {
    // ── Usuarios y grupos (Cognito) ──
    const groupOf = new Map<string, string>();
    for (const g of GROUPS) {
      const res = await cognito.send(
        new ListUsersInGroupCommand({ UserPoolId: USER_POOL_ID, GroupName: g, Limit: 60 }),
      );
      for (const u of res.Users ?? []) {
        if (u.Username) groupOf.set(u.Username, g);
      }
    }

    const list = await cognito.send(
      new ListUsersCommand({ UserPoolId: USER_POOL_ID, Limit: 60 }),
    );
    const users = (list.Users ?? []).map((u) => {
      const email = u.Attributes?.find((a) => a.Name === 'email')?.Value ?? u.Username ?? '';
      return {
        email,
        group: groupOf.get(u.Username ?? '') ?? 'students',
        status: u.UserStatus ?? 'UNKNOWN', // CONFIRMED | FORCE_CHANGE_PASSWORD (invitado sin activar)…
        enabled: u.Enabled ?? true,
        created: u.UserCreateDate?.toISOString() ?? null,
        lastModified: u.UserLastModifiedDate?.toISOString() ?? null,
      };
    });

    // ── Conteos de la plataforma (DynamoDB) ──
    const [courses, exercises, enrollments, routeLogs, submissions] = await Promise.all([
      client.models.Course.list({ limit: 100 }),
      client.models.Exercise.list({ limit: 500 }),
      client.models.Enrollment.list({ limit: 500 }),
      client.models.RouteLog.list({ limit: 1000 }),
      client.models.Submission.list({ limit: 500 }),
    ]);

    const logs = routeLogs.data ?? [];
    const answered = logs.length;
    const correct = logs.filter((l) => l.ok).length;

    return {
      users,
      counts: {
        users: users.length,
        courses: (courses.data ?? []).length,
        exercises: (exercises.data ?? []).length,
        enrollments: (enrollments.data ?? []).length,
        exercisesAnswered: answered,
        accuracyPct: answered > 0 ? Math.round((correct / answered) * 100) : null,
        submissions: (submissions.data ?? []).length,
      },
      courses: (courses.data ?? []).map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        institution: c.institution,
        visibility: c.visibility,
        status: c.status,
      })),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return { error: message };
  }
};
