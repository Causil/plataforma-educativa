import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

/**
 * Backend de GuIA — Amplify Gen2.
 * Fase actual: Auth (E2). Data y Functions llegan con el spec aws-backend
 * (.kiro/specs/aws-backend/) en las siguientes tareas.
 */
defineBackend({
  auth,
});
