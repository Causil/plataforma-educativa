import { defineFunction } from '@aws-amplify/backend';

export const gradeQuiz = defineFunction({
  name: 'grade-quiz',
  entry: './handler.ts',
  timeoutSeconds: 10,
});
