/**
 * Smoke del Tutor IA EN LA NUBE (tarea 11): estudiante real → askTutor.
 * Uso: GUIA_SMOKE_EMAIL=... GUIA_SMOKE_PASSWORD='...' AWS_PROFILE=guia npx tsx scripts/tutor-cloud-smoke.ts
 */
import { Amplify } from 'aws-amplify';
import { signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();
const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

const ctx = {
  courseName: 'Estadística CBS00074 (Politécnico JIC)',
  subtopicName: 'Regresión y correlación',
  mastery: 0.2,
  bookRefs: [
    { title: 'Walpole, Myers & Ye (2007) · Probabilidad y estadística', chapter: 'Cap. 11 · Regresión lineal simple', page: 'pág. 389' },
  ],
};

async function main() {
  await signIn({
    username: process.env.GUIA_SMOKE_EMAIL!,
    password: process.env.GUIA_SMOKE_PASSWORD!,
  }).catch((e) => {
    if (e?.name !== 'UserAlreadyAuthenticatedException') throw e;
  });
  console.log('🔐 Estudiante autenticado\n');

  const t0 = Date.now();
  const q = await client.queries.askTutor({
    kind: 'chat',
    payload: JSON.stringify({ ctx, question: '¿Qué significa que r sea negativo? Dame un ejemplo corto.' }),
  });
  const r = parse(q.data) as { text?: string; source?: string; error?: string };
  if (r.error) throw new Error(r.error);
  console.log(`🤖 [${r.source} · ${Date.now() - t0}ms]`);
  console.log(r.text);
  console.log(
    r.source === 'ai'
      ? '\n✅ TUTOR IA EN LA NUBE: Claude respondiendo vía Lambda + secreto'
      : '\n⚠️ Respondió el fallback — revisar secreto/permiso de la Lambda',
  );
  await signOut();
}

main().catch((e) => {
  console.error('❌', e?.message ?? e);
  process.exit(1);
});
