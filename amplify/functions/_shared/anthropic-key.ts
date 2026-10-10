/**
 * Carga la API key de Anthropic desde SSM en process.env (una vez por
 * arranque en frío). El SDK de Anthropic la toma de ANTHROPIC_API_KEY.
 */
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export async function loadAnthropicKey(): Promise<void> {
  const name = process.env.ANTHROPIC_KEY_PARAM;
  if (process.env.ANTHROPIC_API_KEY || !name) return;
  const res = await new SSMClient().send(
    new GetParameterCommand({ Name: name, WithDecryption: true }),
  );
  if (!res.Parameter?.Value) throw new Error(`Parámetro ${name} vacío`);
  process.env.ANTHROPIC_API_KEY = res.Parameter.Value;
}
