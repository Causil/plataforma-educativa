import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { nextExercise } from '../functions/next-exercise/resource';
import { submitAnswer } from '../functions/submit-answer/resource';
import { gradeQuiz } from '../functions/grade-quiz/resource';
import { tutor } from '../functions/tutor/resource';

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

    askTutor: a
      .query()
      .arguments({
        kind: a.string().required(), // 'chat' | 'hint' | 'explanation'
        payload: a.string().required(), // JSON con ctx + campos según kind
      })
      .returns(a.json())
      .handler(a.handler.function(tutor))
      .authorization((allow) => [allow.authenticated()]),

    gradeQuiz: a
      .mutation()
      .arguments({
        activityId: a.string().required(),
        answers: a.json().required(),
      })
      .returns(a.json())
      .handler(a.handler.function(gradeQuiz))
      .authorization((allow) => [allow.authenticated()]),
  })
  .authorization((allow) => [
    allow.resource(nextExercise),
    allow.resource(submitAnswer),
    allow.resource(gradeQuiz),
  ]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
