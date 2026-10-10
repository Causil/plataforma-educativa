import { defineStorage } from '@aws-amplify/backend';

/**
 * Archivos de exámenes (E15 · docs/10-calificacion-examenes.md).
 *
 * Prefijos de primer nivel separados para que el ciclo de vida (backend.ts)
 * borre solo las hojas de los estudiantes y no enunciados/solucionarios:
 * - exams/{examId}/statement.pdf | solution.pdf → docentes/admins
 * - exam-submissions/{examId}/{documento}.{pdf|jpg|png} → carga en lote del docente
 * - exam-uploads/{entity_id}/{examId}.{ext} → etapa 2: cada estudiante en su
 *   carpeta (entity_id = Identity ID de Cognito, NO el sub del user pool)
 */
export const storage = defineStorage({
  name: 'guiaExamFiles',
  access: (allow) => ({
    'exams/*': [allow.groups(['teachers', 'admins']).to(['read', 'write', 'delete'])],
    'exam-submissions/*': [allow.groups(['teachers', 'admins']).to(['read', 'write', 'delete'])],
    'exam-uploads/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write']),
      allow.groups(['teachers', 'admins']).to(['read', 'delete']),
    ],
  }),
});
