import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

/**
 * Backend de GuIA — Amplify Gen2.
 * Auth (T-202) + Data (T-301..T-303).
 * Functions llegan con las siguientes tareas del spec aws-backend.
 */
defineBackend({
  auth,
  data,
});
