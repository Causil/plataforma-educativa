/**
 * Smoke test del motor en la nube (review tareas 8-9):
 * autentica como estudiante → nextExercise → submitAnswer → nextExercise.
 *
 * Uso:
 *   GUIA_SMOKE_EMAIL=estudiante.demo@guia.app GUIA_SMOKE_PASSWORD='...' \
 *     AWS_PROFILE=guia npx tsx scripts/api-smoke.ts
 */
import { Amplify } from 'aws-amplify';
import { signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

const EMAIL = process.env.GUIA_SMOKE_EMAIL;
const PASSWORD = process.env.GUIA_SMOKE_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('❌ Define GUIA_SMOKE_EMAIL y GUIA_SMOKE_PASSWORD.');
  process.exit(1);
}

const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

async function main() {
  await signIn({ username: EMAIL!, password: PASSWORD! }).catch((e) => {
    if (e?.name !== 'UserAlreadyAuthenticatedException') throw e;
  });
  console.log(`🔐 Estudiante autenticado: ${EMAIL}\n`);

  // 1) nextExercise
  const q1 = await client.queries.nextExercise({});
  const r1 = parse(q1.data) as {
    error?: string;
    reason?: string;
    exercise?: Record<string, unknown>;
  };
  if (r1.error) throw new Error(`nextExercise: ${r1.error}`);
  console.log('🎯 nextExercise:');
  console.log(`   subtema/dificultad: ${r1.exercise?.subtopicId} · d${r1.exercise?.difficulty}`);
  console.log(`   prompt: ${String(r1.exercise?.prompt).slice(0, 60)}…`);
  console.log(`   motivo del motor: "${r1.reason}"`);
  const leaked = ['answerIndex', 'hint', 'explanation'].filter((k) => k in (r1.exercise ?? {}));
  console.log(
    leaked.length === 0
      ? '   🔐 sin answerIndex/hint/explanation en la respuesta ✔'
      : `   ❌ FUGA de campos sensibles: ${leaked.join(', ')}`,
  );

  // 2) submitAnswer (opción 0 — puede acertar o fallar, ambas rutas sirven)
  const m = await client.mutations.submitAnswer({
    exerciseId: String(r1.exercise!.id),
    optionIndex: 0,
  });
  const r2 = parse(m.data) as Record<string, unknown> & { error?: string };
  if (r2.error) throw new Error(`submitAnswer: ${r2.error}`);
  console.log('\n📝 submitAnswer(opción 0):');
  console.log(`   ok=${r2.ok} · mastery ${Number(r2.before).toFixed(2)}→${Number(r2.after).toFixed(2)}`);
  console.log(`   xp=${r2.xp} · racha=${r2.streak} · nivel=${r2.level}`);
  console.log(`   hint tras responder: ${r2.hint ? '✔' : '✖'} · explanation: ${r2.explanation ? '✔' : '✖'}`);

  // 3) nextExercise otra vez — el motor debe reaccionar al nuevo estado
  const q2 = await client.queries.nextExercise({});
  const r3 = parse(q2.data) as { reason?: string; exercise?: Record<string, unknown> };
  console.log('\n🔁 nextExercise #2 (post-respuesta):');
  console.log(`   subtema/dificultad: ${r3.exercise?.subtopicId} · d${r3.exercise?.difficulty}`);
  console.log(`   motivo: "${r3.reason}"`);

  console.log('\n✅ MOTOR ADAPTATIVO EN LA NUBE: funcionando end-to-end');
  await signOut();
}

main().catch((e) => {
  console.error('❌', e?.message ?? e);
  process.exit(1);
});
