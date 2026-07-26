import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Tutor IA (T-601..T-604 · spec tarea 11).
 * Proveedor actual: API de Anthropic directa (LLM_PROVIDER=anthropic) — la
 * key viaja como SECRETO de Amplify (nunca en código ni en el repo).
 * Cambiar a Bedrock cuando la cuenta tenga método de pago = 1 env var.
 */
export const tutor = defineFunction({
  name: 'tutor',
  entry: './handler.ts',
  timeoutSeconds: 30,
  environment: {
    LLM_PROVIDER: 'anthropic',
    ANTHROPIC_API_KEY: secret('ANTHROPIC_API_KEY'),
  },
});
