/**
 * Smoke de permisos E15/F1 — Exam, ExamGrade y storage de exámenes.
 * Verifica el EFECTO (lección H5): lo que el docente escribe queda en BD/S3 y
 * lo que el estudiante no debe ver/escribir, falla.
 *
 * Uso:
 *   GUIA_TEACHER_EMAIL=... GUIA_TEACHER_PASSWORD='...' \
 *   GUIA_STUDENT_EMAIL=... GUIA_STUDENT_PASSWORD='...' \
 *     npx tsx scripts/exam-permissions-smoke.ts
 * (mismas variables que escribe scripts/create-demo-users.ts)
 */
import { Amplify } from 'aws-amplify';
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import { downloadData, remove, uploadData } from 'aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import outputs from '../amplify_outputs.json';

Amplify.configure(outputs);
const client = generateClient<Schema>();

const TEACHER = process.env.GUIA_TEACHER_EMAIL;
const STUDENT = process.env.GUIA_STUDENT_EMAIL;
const PASSWORDS: Record<string, string | undefined> = {
  [TEACHER ?? '']: process.env.GUIA_TEACHER_PASSWORD,
  [STUDENT ?? '']: process.env.GUIA_STUDENT_PASSWORD,
};
if (!TEACHER || !STUDENT || !PASSWORDS[TEACHER] || !PASSWORDS[STUDENT]) {
  console.error('❌ Define GUIA_{TEACHER,STUDENT}_{EMAIL,PASSWORD}.');
  process.exit(1);
}

let failures = 0;
const check = (ok: boolean, label: string) => {
  console.log(`   ${ok ? '✔' : '❌'} ${label}`);
  if (!ok) failures++;
};
const fails = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return false;
  } catch {
    return true;
  }
};

async function login(email: string) {
  await signOut();
  await signIn({ username: email, password: PASSWORDS[email]! });
  console.log(`\n🔐 ${email}`);
}

async function main() {
  // ── Docente: crea examen, calificación y archivos ──────────────────────
  await login(TEACHER!);
  const exam = await client.models.Exam.create({
    courseId: 'smoke-course',
    title: 'Smoke E15',
    scaleMax: 5,
    passMark: 3,
    solutionKey: 'exams/smoke/solution.txt',
    rubric: JSON.stringify({ questions: [{ q: 1, max: 5 }] }),
    rubricStatus: 'draft',
    status: 'draft',
  });
  check(!exam.errors?.length && !!exam.data?.id, `docente crea Exam ${exam.errors?.[0]?.message ?? ''}`);
  const examId = exam.data!.id;

  const grade = await client.models.ExamGrade.create({
    examId,
    studentId: 'smoke-student',
    status: 'uploaded',
    uploadedBy: 'teacher',
  });
  check(!grade.errors?.length && !!grade.data?.id, `docente crea ExamGrade ${grade.errors?.[0]?.message ?? ''}`);

  const byExam = await client.models.ExamGrade.listExamGradeByExamId({ examId });
  check(byExam.data.length === 1, 'ExamGrade queda en BD y se lista por índice examId');

  const solKey = `exams/${examId}/solution.txt`;
  const subKey = `exam-submissions/${examId}/smoke.txt`;
  await uploadData({ path: solKey, data: 'solucionario' }).result;
  await uploadData({ path: subKey, data: 'hoja' }).result;
  const back = await (await downloadData({ path: subKey }).result).body.text();
  check(back === 'hoja', 'docente sube y lee hoja en exam-submissions/');

  // ── Estudiante: no ve solucionario, rúbrica, notas ni archivos ajenos ──
  await login(STUDENT!);
  const seen = await client.models.Exam.get({ id: examId });
  check(!!seen.data && seen.data.solutionKey == null && seen.data.rubric == null,
    'estudiante lee Exam SIN solutionKey ni rubric');
  const grades = await client.models.ExamGrade.list();
  check(!!grades.errors?.length || grades.data.length === 0, 'estudiante no lista ExamGrade');
  check(await fails(() => downloadData({ path: solKey }).result), 'estudiante no descarga el solucionario');
  check(await fails(() => uploadData({ path: `exam-submissions/${examId}/x.txt`, data: 'x' }).result),
    'estudiante no escribe en exam-submissions/');

  const { identityId } = await fetchAuthSession();
  const ownKey = `exam-uploads/${identityId}/${examId}.txt`;
  const ownErr = await uploadData({ path: ownKey, data: 'mía' }).result.then(
    () => '',
    (e: Error) => `${e.name}: ${e.message}`,
  );
  check(!ownErr, `estudiante sube a su carpeta exam-uploads/ ${ownErr}`);
  check(await fails(() => uploadData({ path: `exam-uploads/us-east-1:otro/${examId}.txt`, data: 'x' }).result),
    'estudiante no escribe en carpeta ajena');

  // ── Limpieza (docente) ─────────────────────────────────────────────────
  await login(TEACHER!);
  await Promise.all([remove({ path: solKey }), remove({ path: subKey }), remove({ path: ownKey })]);
  await client.models.ExamGrade.delete({ id: grade.data!.id });
  await client.models.Exam.delete({ id: examId });
  console.log('\n🧹 limpieza hecha');
  await signOut();

  console.log(failures === 0 ? '\n✅ F1 permisos OK' : `\n❌ ${failures} verificaciones fallaron`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});
