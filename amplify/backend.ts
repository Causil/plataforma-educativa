import { defineBackend } from '@aws-amplify/backend';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { tutor } from './functions/tutor/resource';
import { nextExercise } from './functions/next-exercise/resource';
import { submitAnswer } from './functions/submit-answer/resource';
import { enrollStudents } from './functions/enroll-students/resource';
import { adminStats } from './functions/admin-stats/resource';
import { storage } from './storage/resource';
import { ANTHROPIC_KEY_PARAM } from './constants';

/**
 * Backend de GuIA — Amplify Gen2.
 * Auth (T-202) + Data (T-301..T-303) + Functions (T-404a/b, R02, admin)
 * + Storage de exámenes (E15).
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  nextExercise,
  submitAnswer,
  tutor,
  enrollStudents,
  adminStats,
});

// Las Lambdas de matrícula y estadísticas operan sobre el user pool
const userPool = backend.auth.resources.userPool;

// Correos de Cognito por SES: en SES está verificado el DOMINIO, no la
// dirección no-responder@. Amplify apunta SourceArn a la dirección y Cognito
// rechaza crear el pool → se apunta a la identidad del dominio.
const userPoolEmail = backend.auth.resources.cfnResources.cfnUserPool
  .emailConfiguration as { sourceArn?: string };
userPoolEmail.sourceArn = `arn:aws:ses:${backend.auth.stack.region}:${backend.auth.stack.account}:identity/jcausil.com`;

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

// Hojas de estudiantes (datos personales, Ley 1581): se borran solas a los
// 180 días — cierre de semestre. Enunciados y solucionarios (exams/) se conservan.
backend.storage.resources.cfnResources.cfnBucket.lifecycleConfiguration = {
  rules: ['exam-submissions/', 'exam-uploads/'].map((prefix) => ({
    id: `expira-${prefix.replace('/', '')}`,
    status: 'Enabled',
    prefix,
    expirationInDays: 180,
  })),
};

// La API key de Anthropic se lee de SSM (ver constants.ts); clave SecureString
// con la llave administrada aws/ssm, así que basta ssm:GetParameter.
const { region, account } = backend.tutor.stack;
backend.tutor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter'],
    resources: [`arn:aws:ssm:${region}:${account}:parameter${ANTHROPIC_KEY_PARAM}`],
  }),
);

// Los usuarios de un grupo asumen el rol del GRUPO, no el rol autenticado al
// que Amplify aplica la regla exam-uploads/{entity_id}/*. Se replica en el rol
// de students, acotada a su propia carpeta (Identity ID de Cognito).
const examBucket = backend.storage.resources.bucket;
backend.auth.resources.groups['students'].role.attachInlinePolicy(
  new Policy(backend.storage.stack, 'StudentsOwnExamUploads', {
    statements: [
      new PolicyStatement({
        actions: ['s3:PutObject', 's3:GetObject'],
        resources: [
          `${examBucket.bucketArn}/exam-uploads/\${cognito-identity.amazonaws.com:sub}/*`,
        ],
      }),
    ],
  }),
);
