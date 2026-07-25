/**
 * Seed idempotente del curso CBS00074 a DynamoDB (tarea 7 · T-304/T-305).
 *
 * Uso:
 *   GUIA_SEED_EMAIL=admin.demo@guia.app GUIA_SEED_PASSWORD='...' \
 *     AWS_PROFILE=guia npx tsx scripts/seed.ts
 *
 * Idempotencia por clave natural (existe → skip):
 *   Course:code · Unit:(courseId,order) · Subtopic:(unitId,order)
 *   Exercise:(subtopicId,prompt) · Activity:(unitId,title)
 */
import { Amplify } from 'aws-amplify';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';
import { ESTADISTICA, EXERCISES, SUBTOPICS, UNITS } from '../src/content/estadistica';

Amplify.configure(outputs);
const client = generateClient<Schema>();

const EMAIL = process.env.GUIA_SEED_EMAIL;
const PASSWORD = process.env.GUIA_SEED_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('❌ Define GUIA_SEED_EMAIL y GUIA_SEED_PASSWORD (sin hardcodear).');
  process.exit(1);
}

/** Actividad evaluativa por unidad (docs/07 · R13). */
const ACTIVITIES: Record<number, { type: 'quiz' | 'taller' | 'examen'; title: string }> = {
  1: { type: 'quiz', title: 'Quiz 1' },
  2: { type: 'taller', title: 'Taller 1' },
  3: { type: 'quiz', title: 'Quiz 2' },
  4: { type: 'taller', title: 'Taller 2' },
  5: { type: 'examen', title: 'Examen parcial' },
  6: { type: 'taller', title: 'Trabajo final' },
};
const RUBRICS: Record<'quiz' | 'taller' | 'examen', { criterion: string; weight: number }[]> = {
  quiz: [
    { criterion: 'Dominio del concepto', weight: 60 },
    { criterion: 'Interpretación', weight: 40 },
  ],
  taller: [
    { criterion: 'Planteamiento', weight: 30 },
    { criterion: 'Procedimiento', weight: 30 },
    { criterion: 'Resultado', weight: 20 },
    { criterion: 'Presentación', weight: 20 },
  ],
  examen: [
    { criterion: 'Dominio del concepto', weight: 50 },
    { criterion: 'Procedimiento', weight: 30 },
    { criterion: 'Interpretación', weight: 20 },
  ],
};

const counts: Record<string, { created: number; skipped: number }> = {};
const tally = (model: string, created: boolean) => {
  counts[model] ??= { created: 0, skipped: 0 };
  counts[model][created ? 'created' : 'skipped']++;
};

function fail(model: string, errors: unknown): never {
  console.error(`❌ Error creando ${model}:`, JSON.stringify(errors));
  process.exit(1);
}

async function main() {
  await signIn({ username: EMAIL!, password: PASSWORD! }).catch(async (e) => {
    if (e?.name === 'UserAlreadyAuthenticatedException') return;
    throw e;
  });
  const { userId } = await getCurrentUser();
  console.log(`🔐 Autenticado como ${EMAIL} (${userId.slice(0, 8)}…)\n`);

  // ── Course ────────────────────────────────────────────────────────────
  const existingCourses = (await client.models.Course.list({
    filter: { code: { eq: ESTADISTICA.code } },
  })).data;
  let course = existingCourses[0];
  if (course) {
    tally('Course', false);
  } else {
    const r = await client.models.Course.create({
      code: ESTADISTICA.code,
      name: ESTADISTICA.name,
      institution: ESTADISTICA.institution,
      visibility: ESTADISTICA.visibility,
      credits: ESTADISTICA.credits,
      teacherId: userId,
      status: 'active',
    });
    if (!r.data) fail('Course', r.errors);
    course = r.data;
    tally('Course', true);
  }

  // ── Units ─────────────────────────────────────────────────────────────
  const existingUnits = (await client.models.Unit.list({
    filter: { courseId: { eq: course.id } },
  })).data;
  const unitIdByOrder = new Map<number, string>();
  for (const u of UNITS) {
    const found = existingUnits.find((x) => x.order === u.order);
    if (found) {
      unitIdByOrder.set(u.order, found.id);
      tally('Unit', false);
      continue;
    }
    const r = await client.models.Unit.create({
      courseId: course.id,
      order: u.order,
      title: u.title,
    });
    if (!r.data) fail('Unit', r.errors);
    unitIdByOrder.set(u.order, r.data.id);
    tally('Unit', true);
  }

  // ── Subtopics (name→title) ────────────────────────────────────────────
  const contentUnitOrder = (contentUnitId: string) =>
    UNITS.find((u) => u.id === contentUnitId)!.order;
  const subtopicRealId = new Map<string, string>(); // contentId → dbId

  for (const [i, s] of SUBTOPICS.entries()) {
    const unitDbId = unitIdByOrder.get(contentUnitOrder(s.unitId))!;
    const order = i + 1;
    const existing = (await client.models.Subtopic.list({
      filter: { unitId: { eq: unitDbId }, order: { eq: order } },
    })).data[0];
    if (existing) {
      subtopicRealId.set(s.id, existing.id);
      tally('Subtopic', false);
      continue;
    }
    const r = await client.models.Subtopic.create({
      unitId: unitDbId,
      order,
      title: s.name, // ← mapeo name→title
      short: s.short,
      bookRefs: JSON.stringify(s.bookRefs),
    });
    if (!r.data) fail('Subtopic', r.errors);
    subtopicRealId.set(s.id, r.data.id);
    tally('Subtopic', true);
  }

  // ── Exercises ─────────────────────────────────────────────────────────
  const allExercises = (await client.models.Exercise.list({ limit: 500 })).data;
  for (const e of EXERCISES) {
    const subDbId = subtopicRealId.get(e.subtopicId)!;
    const exists = allExercises.some((x) => x.subtopicId === subDbId && x.prompt === e.prompt);
    if (exists) {
      tally('Exercise', false);
      continue;
    }
    const r = await client.models.Exercise.create({
      subtopicId: subDbId,
      level: e.level,
      difficulty: e.difficulty,
      type: 'multiple-choice',
      prompt: e.prompt,
      options: e.options,
      answerIndex: e.answerIndex,
      hint: e.hint,
      explanation: e.explanation,
    });
    if (!r.data) fail('Exercise', r.errors);
    tally('Exercise', true);
  }

  // ── Activities ────────────────────────────────────────────────────────
  const allActivities = (await client.models.Activity.list({ limit: 100 })).data;
  for (const [order, meta] of Object.entries(ACTIVITIES)) {
    const unitDbId = unitIdByOrder.get(Number(order))!;
    const exists = allActivities.some((a) => a.unitId === unitDbId && a.title === meta.title);
    if (exists) {
      tally('Activity', false);
      continue;
    }
    const r = await client.models.Activity.create({
      unitId: unitDbId,
      type: meta.type,
      title: meta.title,
      rubric: JSON.stringify(RUBRICS[meta.type]),
      unlockThreshold: 0.6,
    });
    if (!r.data) fail('Activity', r.errors);
    tally('Activity', true);
  }

  // ── Resumen ───────────────────────────────────────────────────────────
  console.log('📊 Resumen del seed:');
  for (const [model, c] of Object.entries(counts)) {
    console.log(`   ${model.padEnd(9)} creados: ${c.created} · omitidos: ${c.skipped}`);
  }
  const totalCreated = Object.values(counts).reduce((a, c) => a + c.created, 0);
  console.log(`   TOTAL creados: ${totalCreated}`);
  await signOut();
}

main().catch((e) => {
  console.error('❌', e?.message ?? e);
  process.exit(1);
});
