import { defineFunction } from '@aws-amplify/backend';

export const enrollStudents = defineFunction({
  name: 'enroll-students',
  entry: './handler.ts',
  timeoutSeconds: 60, // AdminCreateUser por estudiante; listados de ~40 caben holgados
});
