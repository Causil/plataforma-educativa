import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { tutor } from './functions/tutor/resource';
import { nextExercise } from './functions/next-exercise/resource';
import { submitAnswer } from './functions/submit-answer/resource';
import { enrollStudents } from './functions/enroll-students/resource';
import { adminStats } from './functions/admin-stats/resource';

/**
 * Backend de GuIA — Amplify Gen2.
 * Auth (T-202) + Data (T-301..T-303) + Functions (T-404a/b, R02, admin).
 */
const backend = defineBackend({
  auth,
  data,
  nextExercise,
  submitAnswer,
  tutor,
  enrollStudents,
  adminStats,
});

// Las Lambdas de matrícula y estadísticas operan sobre el user pool
const userPool = backend.auth.resources.userPool;

backend.enrollStudents.addEnvironment('USER_POOL_ID', userPool.userPoolId);
backend.enrollStudents.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'cognito-idp:AdminCreateUser',
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminGetUser',
    ],
    resources: [userPool.userPoolArn],
  }),
);

backend.adminStats.addEnvironment('USER_POOL_ID', userPool.userPoolId);
backend.adminStats.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['cognito-idp:ListUsers', 'cognito-idp:ListUsersInGroup'],
    resources: [userPool.userPoolArn],
  }),
);
