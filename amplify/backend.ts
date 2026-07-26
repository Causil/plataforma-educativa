import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { nextExercise } from './functions/next-exercise/resource';
import { submitAnswer } from './functions/submit-answer/resource';

/**
 * Backend de GuIA — Amplify Gen2.
 * Auth (T-202) + Data (T-301..T-303) + Functions (T-404a/b).
 */
defineBackend({
  auth,
  data,
  nextExercise,
  submitAnswer,
});
