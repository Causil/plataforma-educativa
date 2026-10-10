import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { nextExercise } from '../functions/next-exercise/resource';
import { submitAnswer } from '../functions/submit-answer/resource';
import { tutor } from '../functions/tutor/resource';
import { enrollStudents } from '../functions/enroll-students/resource';
import { adminStats } from '../functions/admin-stats/resource';

/**
 * GuIA — Esquema de datos (T-301..T-303, T-404a/b)
 *
 * 10 modelos con reglas de autorización + 2 custom operations:
 * - Contenido académico (Course, Unit, Subtopic, Exercise): lectura pública,
 *   gestión por profesores y admins.
 * - Exercise: answerIndex/hint/explanation NO legibles por estudiantes
 *   (campo-level auth; solo accesibles vía Lambda submit-answer/tutor).
 * - Enrollment: base de acceso a cursos privados.
 * - Progreso del estudiante (MasteryState, RouteLog, GameState, Submission):
 *   owner-based auth.
 * - Custom queries/mutations: nextExercise, submitAnswer.
 */

const schema = a
  .schema({
    // ─────────────────────────────────────────────────────────────────────────
    // Contenido académico
    // ─────────────────────────────────────────────────────────────────────────

    Course: a
      .model({
        code: a.string().required(),
        name: a.string().required(),
        institution: a.string(),
        visibility: a.enum(['public', 'private']),
        credits: a.integer(),
        teacherId: a.string().required(),
        status: a.string(),
      })
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete']),
        allow.authenticated().to(['read']),
      ]),

    Unit: a
      .model({
        courseId: a.id().required(),
        order: a.integer().required(),
        title: a.string().required(),
      })
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete']),
        allow.authenticated().to(['read']),
      ]),

    Subtopic: a
      .model({
        unitId: a.id().required(),
        order: a.integer().required(),
        title: a.string().required(),
        short: a.string(),
        bookRefs: a.json(),
      })
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete']),
        allow.authenticated().to(['read']),
      ]),

    Exercise: a
      .model({
        subtopicId: a.id().required(),
        level: a.enum(['basico', 'intermedio', 'avanzado']),
        difficulty: a.integer().required(),
        type: a.string(),
        prompt: a.string().required(),
        options: a.string().array(),
        // ⚠️ Campos sensibles: NO legibles por estudiantes directamente.
        // Solo accesibles vía Lambdas (submit-answer, tutor).
        answerIndex: a.integer().authorization((allow) => [
          allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        ]),
        hint: a.string().authorization((allow) => [
          allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        ]),
        explanation: a.string().authorization((allow) => [
          allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        ]),
      })
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete']),
        allow.authenticated().to(['read']),
      ]),

    /** Fix de review (Claude): modelo faltante en la entrega de la tarea 6. */
    Activity: a
      .model({
        unitId: a.id().required(),
        type: a.enum(['quiz', 'taller', 'examen']),
        title: a.string().required(),
        rubric: a.json(),
        unlockThreshold: a.float(),
      })
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete']),
        allow.authenticated().to(['read']),
      ]),

    // ─────────────────────────────────────────────────────────────────────────
    // Matrícula (acceso a cursos privados)
    // ─────────────────────────────────────────────────────────────────────────

    Enrollment: a
      .model({
        courseId: a.id().required(),
        studentId: a.string().required(),
        email: a.string(),
        fullName: a.string(),
        document: a.string(),
        source: a.enum(['xlsx', 'self']),
        status: a.string(),
      })
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        allow.owner().to(['read']),
      ]),

    // ─────────────────────────────────────────────────────────────────────────
    // Progreso del estudiante (owner-based)
    // ─────────────────────────────────────────────────────────────────────────

    MasteryState: a
      .model({
        owner: a.string(),
        studentId: a.string().required(),
        subtopicId: a.id().required(),
        mastery: a.float().required(),
        attempts: a.integer(),
        streak: a.integer(),
        consecutiveFails: a.integer(),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'update', 'delete', 'read']),
        allow.groups(['teachers', 'admins']).to(['read']),
      ]),

    RouteLog: a
      .model({
        owner: a.string(),
        studentId: a.string().required(),
        step: a.integer().required(),
        subtopicId: a.id().required(),
        difficulty: a.integer(),
        ok: a.boolean(),
        masteryBefore: a.float(),
        masteryAfter: a.float(),
        reason: a.string(),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'update', 'delete', 'read']),
        allow.groups(['teachers', 'admins']).to(['read']),
      ]),

    GameState: a
      .model({
        owner: a.string(),
        studentId: a.string().required(),
        scope: a.string().required(),
        xp: a.integer().required(),
        level: a.integer().required(),
        streak: a.integer(),
        badges: a.string().array(),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'update', 'delete', 'read']),
        allow.groups(['teachers', 'admins']).to(['read']),
        allow.authenticated().to(['read']),
      ]),

    Submission: a
      .model({
        owner: a.string(),
        activityId: a.id().required(),
        studentId: a.string().required(),
        answers: a.json(),
        score: a.float(),
        rubricScores: a.json(),
      })
      .authorization((allow) => [
        allow.owner().to(['create', 'update', 'delete', 'read']),
        allow.groups(['teachers', 'admins']).to(['read']),
      ]),

    // ─────────────────────────────────────────────────────────────────────────
    // Exámenes calificados con IA (E15 · docs/10-calificacion-examenes.md)
    // ─────────────────────────────────────────────────────────────────────────

    /** Examen de un curso. Solucionario y rúbrica: solo docentes (campo-level). */
    Exam: a
      .model({
        courseId: a.id().required(),
        title: a.string().required(),
        date: a.date(),
        scaleMax: a.float().required(), // 5.0
        passMark: a.float().required(), // 3.0
        statementKey: a.string(),
        solutionKey: a.string().authorization((allow) => [
          allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        ]),
        rubric: a.json().authorization((allow) => [
          allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        ]),
        rubricStatus: a.enum(['none', 'generating', 'draft', 'approved']),
        studentUploadOpen: a.boolean(),
        dueAt: a.datetime(),
        status: a.enum(['draft', 'grading', 'reviewing', 'closed']),
      })
      .secondaryIndexes((index) => [index('courseId')])
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
        allow.authenticated().to(['read']),
      ]),

    /**
     * Calificación de un estudiante en un examen. Solo docentes/admins: el
     * estudiante la verá en F7 vía query Lambda que filtra status = 'sent'
     * (la auth estática no puede expresar "solo si ya se envió").
     */
    ExamGrade: a
      .model({
        examId: a.id().required(),
        studentId: a.string().required(), // sub de Cognito (de Enrollment)
        email: a.string(),
        fullName: a.string(),
        document: a.string(),
        fileKey: a.string(),
        uploadedBy: a.enum(['teacher', 'student']),
        status: a.enum(['uploaded', 'queued', 'grading', 'graded', 'reviewed', 'sent', 'error']),
        triage: a.enum(['green', 'yellow', 'red']),
        transcription: a.json(),
        numericChecks: a.json(),
        aiScore: a.float(),
        aiScore2: a.float(),
        finalScore: a.float(),
        perQuestion: a.json(),
        feedback: a.string(),
        flags: a.string().array(),
        model: a.string(),
        inputTokens: a.integer(),
        outputTokens: a.integer(),
        gradedAt: a.datetime(),
        reviewedBy: a.string(),
        reviewedAt: a.datetime(),
        reviewNote: a.string(),
        sentAt: a.datetime(),
        error: a.string(),
      })
      .secondaryIndexes((index) => [index('examId')])
      .authorization((allow) => [
        allow.groups(['teachers', 'admins']).to(['create', 'update', 'delete', 'read']),
      ]),

    // ─────────────────────────────────────────────────────────────────────────
    // Custom operations (AppSync → Lambda)
    // ─────────────────────────────────────────────────────────────────────────

    nextExercise: a
      .query()
      .returns(a.json())
      .handler(a.handler.function(nextExercise))
      .authorization((allow) => [allow.authenticated()]),

    submitAnswer: a
      .mutation()
      .arguments({
        exerciseId: a.string().required(),
        optionIndex: a.integer().required(),
      })
      .returns(a.json())
      .handler(a.handler.function(submitAnswer))
      .authorization((allow) => [allow.authenticated()]),

    /** Matrícula real (R02): crea cuentas Cognito, invita por correo y registra Enrollment. */
    enrollStudents: a
      .mutation()
      .arguments({
        courseId: a.string().required(),
        students: a.string().required(), // JSON: [{document, fullName, email}]
      })
      .returns(a.json())
      .handler(a.handler.function(enrollStudents))
      .authorization((allow) => [allow.groups(['teachers', 'admins'])]),

    /** Estadísticas reales de la plataforma para el panel admin. */
    adminStats: a
      .query()
      .returns(a.json())
      .handler(a.handler.function(adminStats))
      .authorization((allow) => [allow.groups(['admins'])]),

    askTutor: a
      .query()
      .arguments({
        kind: a.string().required(), // 'chat' | 'hint' | 'explanation'
        payload: a.string().required(), // JSON con ctx + campos según kind
      })
      .returns(a.json())
      .handler(a.handler.function(tutor))
      .authorization((allow) => [allow.authenticated()]),
  })
  .authorization((allow) => [
    allow.resource(nextExercise),
    allow.resource(submitAnswer),
    allow.resource(enrollStudents),
    allow.resource(adminStats),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
