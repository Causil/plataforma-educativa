/**
 * Cliente LLM agnóstico al proveedor.
 *
 * - LLM_PROVIDER=anthropic (default): API de Anthropic directa — desarrollo local.
 * - LLM_PROVIDER=bedrock: Amazon Bedrock (cliente Mantle) — producción/Lambda.
 *
 * Ambos exponen la misma superficie `messages.create`, así que el resto del
 * código no cambia al alternar (T-002 solo cambia una variable de entorno).
 */
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';

export type Provider = 'anthropic' | 'bedrock';
/** Nivel del modelo según la tarea (arquitectura §1.3). */
export type Tier = 'fast' | 'smart';

const MODELS: Record<Provider, Record<Tier, string>> = {
  anthropic: { fast: 'claude-haiku-4-5', smart: 'claude-sonnet-5' },
  bedrock: { fast: 'anthropic.claude-haiku-4-5', smart: 'anthropic.claude-sonnet-5' },
};

export function provider(): Provider {
  return process.env.LLM_PROVIDER === 'bedrock' ? 'bedrock' : 'anthropic';
}

export function modelFor(tier: Tier): string {
  return MODELS[provider()][tier];
}

type LlmClient = Anthropic | AnthropicBedrockMantle;
let cached: LlmClient | null = null;

export function llm(): LlmClient {
  if (!cached) {
    cached =
      provider() === 'bedrock'
        ? new AnthropicBedrockMantle({
            awsRegion: process.env.AWS_REGION ?? 'us-east-1',
          })
        : new Anthropic();
  }
  return cached;
}

/** Solo para tests: resetea el cliente cacheado. */
export function _resetClient(): void {
  cached = null;
}
