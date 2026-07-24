/**
 * Smoke test de Bedrock (T-002a/T-601): una llamada mínima a Claude Haiku.
 * Uso: AWS_PROFILE=guia npx tsx scripts/bedrock-smoke.ts
 */
import { AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';

async function main() {
  const client = new AnthropicBedrockMantle({ awsRegion: 'us-east-1' });
  console.log('🔌 Invocando anthropic.claude-haiku-4-5 en us-east-1…');
  try {
    const r = await client.messages.create({
      model: 'anthropic.claude-haiku-4-5',
      max_tokens: 60,
      messages: [
        { role: 'user', content: 'Di "¡Hola Javier, tu tutor GuIA está vivo en Bedrock!" y nada más.' },
      ],
    });
    const text = r.content.find((b) => b.type === 'text');
    console.log('✅ RESPUESTA:', text && 'text' in text ? text.text : JSON.stringify(r.content));
    console.log('   tokens →', JSON.stringify(r.usage));
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.error('❌ ERROR', e.status ?? '', '—', e.message ?? err);
    process.exit(1);
  }
}

main();
