/**
 * 🧪 Laboratorio del Tutor IA — prueba los prompts desde la terminal.
 *
 * Uso:
 *   npm run tutor:lab                        → API Anthropic (necesita ANTHROPIC_API_KEY)
 *   LLM_PROVIDER=bedrock npm run tutor:lab   → Bedrock (necesita `aws configure` + T-002)
 *
 * Comandos dentro del REPL:
 *   /pista      → simula un fallo y pide pista socrática
 *   /explica    → pide explicación paso a paso
 *   /nivel 0.2  → cambia el dominio simulado del estudiante
 *   /salir      → termina
 *   (cualquier otro texto → chat con el tutor)
 */
import * as readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { provider, modelFor } from '../src/lib/tutor/client';
import { chatTutor, getExplanation, getHint } from '../src/lib/tutor/tutor';
import type { TutorContext } from '../src/lib/tutor/prompts';

const ctx: TutorContext = {
  courseName: 'Estadística CBS00074 (Politécnico JIC)',
  subtopicName: 'Tendencia central',
  mastery: 0.5,
  bookRefs: [
    { title: 'Devore (2015) · Probability and Statistics', chapter: 'Cap. 1 · Medidas de localización', page: 'pág. 28' },
    { title: 'Walpole, Myers & Ye (2007)', chapter: 'Cap. 1 · Introducción y análisis de datos', page: 'pág. 1' },
  ],
};

const EXERCISE = 'Datos: 2, 3, 3, 8, 9. ¿Cuál es la mediana?';
const CORRECT = '3';
const FALLBACK_HINT = 'Ordena los datos y busca el valor que queda exactamente en el centro.';
const FALLBACK_EXPL = 'Ordenados: 2,3,3,8,9 → el del centro (3ª posición) es 3.';

async function main() {
  console.log(`\n🧭 GuIA · Laboratorio del Tutor IA`);
  console.log(`   Proveedor: ${provider()} · fast=${modelFor('fast')} · smart=${modelFor('smart')}`);
  console.log(`   Subtema: ${ctx.subtopicName} · dominio simulado: ${ctx.mastery}\n`);
  console.log(`   Escribe tu pregunta, o /pista · /explica · /nivel 0.8 · /salir\n`);

  const rl = readline.createInterface({ input: stdin, output: stdout });

  for (;;) {
    const line = (await rl.question('tú> ')).trim();
    if (!line) continue;
    if (line === '/salir') break;

    if (line.startsWith('/nivel')) {
      const v = Number(line.split(/\s+/)[1]);
      if (v >= 0 && v <= 1) {
        ctx.mastery = v;
        console.log(`   ✔ dominio simulado = ${v}\n`);
      } else console.log('   uso: /nivel 0.0..1.0\n');
      continue;
    }

    const t0 = Date.now();
    if (line === '/pista') {
      const r = await getHint(ctx, EXERCISE, 'La mediana es 5', FALLBACK_HINT);
      console.log(`\n💡 [${r.source} · ${Date.now() - t0}ms] ${r.text}\n`);
    } else if (line === '/explica') {
      const r = await getExplanation(ctx, 'ex-demo-1', EXERCISE, CORRECT, FALLBACK_EXPL);
      console.log(`\n📚 [${r.source} · ${Date.now() - t0}ms]\n${r.text}\n`);
    } else {
      const r = await chatTutor(ctx, line);
      console.log(`\n🤖 [${r.source} · ${Date.now() - t0}ms] ${r.text}\n`);
    }
  }

  rl.close();
  console.log('¡Hasta luego! 👋');
}

main();
