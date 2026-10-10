import { defineFunction } from '@aws-amplify/backend';
import { ANTHROPIC_KEY_PARAM } from '../../constants';

/**
 * Tutor IA (T-601..T-604 · spec tarea 11).
 * Proveedor actual: API de Anthropic directa (LLM_PROVIDER=anthropic). La key
 * vive en SSM (SecureString) y se lee en el arranque en frío — nunca en
 * código ni en el repo. Permiso de lectura en backend.ts.
 * Cambiar a Bedrock cuando la cuenta tenga método de pago = 1 env var.
 */
export const tutor = defineFunction({
  name: 'tutor',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    LLM_PROVIDER: 'anthropic',
    ANTHROPIC_KEY_PARAM,
  },
});
