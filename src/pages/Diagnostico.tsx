import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Rich } from '../components/Math';
import { EXERCISES, SUBTOPICS } from '../content/estadistica';
import { LEVEL_LABEL } from '../content/types';
import { usePractice } from '../state/PracticeContext';

/** Un ítem por unidad clave, cubriendo niveles básico/intermedio/avanzado (US-02/R08). */
const DIAG_IDS = ['vars-1', 'tablas-1', 'tc-2', 'regresion-1', 'dist-1', 'muestreo-2'];

const barColor = (m: number) =>
  m >= 0.75 ? 'var(--m-high)' : m >= 0.45 ? 'var(--m-mid)' : 'var(--m-low)';

type Phase = 'intro' | 'quiz' | 'done';

export default function Diagnostico() {
  const nav = useNavigate();
  const { mastery, applyDiagnostic, diagnosticDone } = usePractice();
  const items = useMemo(
    () => DIAG_IDS.map((id) => EXERCISES.find((e) => e.id === id)!),
    [],
  );
  const [phase, setPhase] = useState<Phase>('intro');
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Record<string, { correct: number; total: number }>>({});

  const ex = items[idx];
  const sub = ex ? SUBTOPICS.find((s) => s.id === ex.subtopicId)! : null;

  const start = () => {
    setResults({});
    setIdx(0);
    setPhase('quiz');
  };

  const pick = (i: number) => {
    const ok = i === ex.answerIndex;
    const next = { ...results };
    const r = next[ex.subtopicId] ?? { correct: 0, total: 0 };
    next[ex.subtopicId] = { correct: r.correct + (ok ? 1 : 0), total: r.total + 1 };
    setResults(next);
    if (idx + 1 < items.length) {
      setIdx(idx + 1);
    } else {
      // guarda el dominio inicial en la NUBE (MasteryState) y muestra el mapa
      void applyDiagnostic(next).then(() => setPhase('done'));
    }
  };

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo size="sm" />
          <h1 style={{ fontSize: 16 }}>GuIA</h1>
        </div>
        <div className="spacer" />
        <span className="chip brand">Diagnóstico · Estadística</span>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {phase === 'intro' && (
          <div className="card" style={{ padding: 26, textAlign: 'center' }}>
            <h2 style={{ fontSize: 22, margin: '0 0 8px' }}>Veamos tu punto de partida</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 14.5, maxWidth: '46ch', margin: '0 auto 20px' }}>
              Antes de tu ruta, te haré <b>{items.length} preguntas de Estadística</b> — de nivel{' '}
              <span className="chip">Básico</span> <span className="chip">Intermedio</span>{' '}
              <span className="chip">Avanzado</span> — para saber exactamente por dónde empezar
              contigo. No te preocupes por fallar.
            </p>
            {diagnosticDone && (
              <p style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 14 }}>
                Ya hiciste el diagnóstico antes — repetirlo recalculará tu punto de partida.
              </p>
            )}
            <button className="btn primary" onClick={start}>
              Empezar diagnóstico
            </button>
          </div>
        )}

        {phase === 'quiz' && ex && sub && (
          <div className="card" style={{ padding: 22 }}>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                fontSize: 12.5, color: 'var(--ink-3)', flexWrap: 'wrap', gap: 6,
              }}
            >
              <span>
                Pregunta {idx + 1} de {items.length}
              </span>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="chip">{LEVEL_LABEL[ex.level]}</span>
                <span>{sub.name}</span>
              </span>
            </div>
            <div className="progress" style={{ margin: '14px 0 22px' }}>
              <i style={{ width: `${Math.round((idx / items.length) * 100)}%` }} />
            </div>
            <div className="prompt" style={{ fontSize: 'clamp(19px,3.4vw,25px)' }}>
              <Rich text={ex.prompt} />
            </div>
            <div className="opts">
              {ex.options.map((op, i) => (
                <button key={i} className="opt" onClick={() => pick(i)}>
                  <span className="badge">{String.fromCharCode(65 + i)}</span>
                  <span><Rich text={op} /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="card" style={{ padding: 26, textAlign: 'center' }}>
            <div style={{ fontSize: 34 }}>🎯</div>
            <h2 style={{ fontSize: 22, margin: '8px 0 6px' }}>¡Listo!</h2>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, maxWidth: '44ch', margin: '0 auto 18px' }}>
              Este es tu mapa de dominio inicial en Estadística. Desde aquí construyo tu ruta
              personalizada.
            </p>
            <div style={{ textAlign: 'left', maxWidth: 420, margin: '0 auto 20px' }}>
              {SUBTOPICS.map((s) => (
                <div className="mrow" key={s.id}>
                  <div className="top">
                    <span className="name">{s.name}</span>
                    <span className="pct">{Math.round(mastery[s.id] * 100)}%</span>
                  </div>
                  <div className="bar">
                    <i
                      style={{
                        width: `${Math.round(mastery[s.id] * 100)}%`,
                        background: barColor(mastery[s.id]),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="btn primary" onClick={() => nav('/curso')}>
              Ver mi curso →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
