import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { Rich } from '../components/Math';
import { EXERCISES } from '../content/estadistica';
import { useAuth } from '../state/AuthContext';

/**
 * Quiz 1 · Unidad 1-3 (R13): 5 preguntas del banco + rúbrica visible +
 * calificación automática local. La persistencia (Submission) llega con la
 * Lambda gradeQuiz del spec aws-backend (tarea 9/11 de Kiro).
 */
const QUIZ_IDS = ['vars-2', 'tablas-1', 'tc-1', 'disp-1', 'prob-2'];

/** Rúbrica del quiz: concepto 60% (responder bien) + consistencia 40% (sin adivinar: racha). */
const RUBRIC = [
  { criterion: 'Dominio del concepto', weight: 60 },
  { criterion: 'Consistencia (aciertos seguidos)', weight: 40 },
];

export default function Evaluacion() {
  const nav = useNavigate();
  const { session } = useAuth();
  const items = useMemo(() => QUIZ_IDS.map((id) => EXERCISES.find((e) => e.id === id)!), []);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = items.every((e) => answers[e.id] !== undefined);

  const grade = useMemo(() => {
    if (!submitted) return null;
    const oks = items.map((e) => answers[e.id] === e.answerIndex);
    const concepto = (oks.filter(Boolean).length / items.length) * RUBRIC[0].weight;
    // consistencia: racha máxima de aciertos / total
    let best = 0;
    let cur = 0;
    for (const ok of oks) {
      cur = ok ? cur + 1 : 0;
      best = Math.max(best, cur);
    }
    const consistencia = (best / items.length) * RUBRIC[1].weight;
    return {
      oks,
      rubricScores: [
        { ...RUBRIC[0], score: Math.round(concepto) },
        { ...RUBRIC[1], score: Math.round(consistencia) },
      ],
      total: Math.round(concepto + consistencia),
    };
  }, [submitted, items, answers]);

  const userName = session?.email.split('@')[0] ?? 'estudiante';

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo size="sm" />
          <h1 style={{ fontSize: 16 }}>GuIA</h1>
        </div>
        <div className="spacer" />
        <span className="chip gold">📋 Quiz 1 · con rúbrica</span>
        <div className="who">
          <span>{userName}</span>
          <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
        </div>
        <button className="link" onClick={() => nav('/curso')}>← Mi curso</button>
      </header>

      <div className="grid2">
        <div style={{ display: 'grid', gap: 16 }}>
          {items.map((e, qi) => {
            const picked = answers[e.id];
            const ok = grade?.oks[qi];
            return (
              <section className="card" key={e.id}>
                <div className="ex-body" style={{ paddingTop: 16 }}>
                  <div className="chips" style={{ marginBottom: 10 }}>
                    <span className="chip">Pregunta {qi + 1}</span>
                    {submitted && (
                      <span className={`chip ${ok ? 'brand' : 'warm'}`}>
                        {ok ? '✓ correcta' : '✗ incorrecta'}
                      </span>
                    )}
                  </div>
                  <div className="prompt" style={{ fontSize: 18, marginBottom: 14 }}>
                    <Rich text={e.prompt} />
                  </div>
                  <div className="opts">
                    {e.options.map((op, i) => {
                      let cls = 'opt';
                      if (submitted) {
                        if (i === e.answerIndex) cls += ' correct';
                        else if (i === picked) cls += ' wrong';
                        else cls += ' dim';
                      } else if (picked === i) {
                        cls += ' correct';
                      }
                      return (
                        <button
                          key={i}
                          className={cls}
                          disabled={submitted}
                          onClick={() => setAnswers((a) => ({ ...a, [e.id]: i }))}
                        >
                          <span className="badge">{String.fromCharCode(65 + i)}</span>
                          <span><Rich text={op} /></span>
                        </button>
                      );
                    })}
                  </div>
                  {submitted && !ok && (
                    <div className="hintbox" style={{ marginTop: 12 }}>
                      <span className="ai">Explicación</span>
                      <div><Rich text={e.explanation} /></div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}

          {!submitted && (
            <button
              className="btn primary block"
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
            >
              {allAnswered ? 'Enviar quiz para calificación' : `Responde las ${items.length} preguntas`}
            </button>
          )}
        </div>

        <aside style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <section className="card">
            <div className="card-h"><h2>Rúbrica</h2><span className="sub">calificación automática</span></div>
            <div className="tbl-wrap" style={{ padding: '6px 6px 14px' }}>
              <table>
                <thead>
                  <tr><th>Criterio</th><th>Peso</th>{submitted && <th>Puntos</th>}</tr>
                </thead>
                <tbody>
                  {(grade?.rubricScores ?? RUBRIC).map((r) => (
                    <tr key={r.criterion}>
                      <td style={{ whiteSpace: 'normal' }}>{r.criterion}</td>
                      <td>{r.weight}%</td>
                      {submitted && 'score' in r && <td><b>{(r as { score: number }).score}</b></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {grade && (
            <section className="card" style={{ padding: 22, textAlign: 'center' }}>
              <div style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--ink-3)' }}>
                Calificación final
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-display)', fontSize: 46, fontWeight: 700,
                  color: grade.total >= 60 ? 'var(--m-high)' : 'var(--m-low)',
                }}
              >
                {grade.total}<span style={{ fontSize: 20, color: 'var(--ink-3)' }}>/100</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: '6px 0 14px' }}>
                {grade.total >= 60
                  ? '¡Actividad aprobada! El avance queda registrado.'
                  : 'Aún no — repasa con el tutor y vuelve a intentarlo.'}
              </p>
              <button className="btn primary" onClick={() => nav(grade.total >= 60 ? '/curso' : '/practica')}>
                {grade.total >= 60 ? 'Volver a mi curso' : 'Ir a practicar'}
              </button>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
