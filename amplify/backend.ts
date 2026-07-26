import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { tutor } from './functions/tutor/resource';
import { nextExercise } from './functions/next-exercise/resource';
import { submitAnswer } from './functions/submit-answer/resource';
import { gradeQuiz } from './functions/grade-quiz/resource';

/**
 * Backend de GuIA — Amplify Gen2.
 * Auth (T-202) + Data (T-301..T-303) + Functions (T-404a/b, T-801).
 */
defineBackend({
  auth,
  data,
  nextExercise,
  submitAnswer,
  gradeQuiz,
  tutor,
});
