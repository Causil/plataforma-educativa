import { defineFunction } from '@aws-amplify/backend';

export const nextExercise = defineFunction({
  name: 'next-exercise',
  entry: './handler.ts',
  timeoutSeconds: 10,
});
