/**
 * Smoke de matrícula real (R02) + adminStats.
 *
 * Autenticado como admin, matricula por la mutation enrollStudents a los
 * estudiantes existentes (idempotente: crea el Enrollment si falta, no
 * duplica ni re-invita) y consulta las estadísticas del panel admin.
 *
 * Uso:
 *   GUIA_SMOKE_EMAIL=admin.demo@guia.app GUIA_SMOKE_PASSWORD='...' \
 *     AWS_PROFILE=guia npx tsx scripts/enroll-smoke.ts
 */
import { Amplify } from 'aws-amplify';
import { signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

const email = process.env.GUIA_SMOKE_EMAIL;
const password = process.env.GUIA_SMOKE_PASSWORD;
if (!email || !password) {
  console.error('Faltan GUIA_SMOKE_EMAIL / GUIA_SMOKE_PASSWORD');
  process.exit(1);
}

const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

async function main() {
  Amplify.configure(outputs);
  await signOut().catch(() => undefined);
  await signIn({ username: email!, password: password! });
  const client = generateClient<Schema>();

  const { data: courses } = await client.models.Course.list({ limit: 10 });
  const course = courses.find((c) => c.code === 'CBS00074');
  if (!course) throw new Error('Curso CBS00074 no encontrado');
  console.log(`Curso: ${course.name} (${course.id})`);

  const students = [
    { document: 'DEMO-001', fullName: 'Estudiante Demo', email: 'estudiante.demo@guia.app' },
    { document: 'DEMO-002', fullName: 'Javier Causil (invitado)', email: 'jcausilmartinez@gmail.com' },
  ];

  const res = await client.mutations.enrollStudents({
    courseId: course.id,
    students: JSON.stringify(students),
  });
  console.log('enrollStudents →', JSON.stringify(parse(res.data), null, 2));

  const stats = await client.queries.adminStats({});
  const s = parse(stats.data) as Record<string, unknown>;
  if ((s as { error?: string }).error) throw new Error(`adminStats: ${(s as { error: string }).error}`);
  console.log('adminStats.counts →', JSON.stringify((s as { counts: unknown }).counts, null, 2));
  console.log(
    'adminStats.users →',
    ((s as { users: { email: string; group: string; status: string }[] }).users ?? [])
      .map((u) => `${u.email} [${u.group}] ${u.status}`)
      .join('\n  '),
  );

  await signOut();
  console.log('\n✅ SMOKE OK');
}

main().catch((err) => {
  console.error('❌', err instanceof Error ? err.message : err);
  process.exit(1);
});
