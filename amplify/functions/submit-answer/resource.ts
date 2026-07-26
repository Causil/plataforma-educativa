import { defineFunction } from '@aws-amplify/backend';

export const submitAnswer = defineFunction({
  name: 'submit-answer',
  entry: './handler.ts',
  timeoutSeconds: 10,
});
