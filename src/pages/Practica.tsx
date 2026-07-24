import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../components/Logo';
import { Rich } from '../components/Math';
import { SUBTOPICS, ESTADISTICA } from '../content/estadistica';
import { LEVEL_LABEL } from '../content/types';
import { usePractice } from '../state/PracticeContext';
import { chatTutor } from '../lib/tutor/service';
import type { TutorContext } from '../lib/tutor/prompts';

const barColor = (m: number) =>
  m >= 0.75 ? 'var(--m-high)' : m >= 0.45 ? 'var(--m-mid)' : 'var(--m-low)';

interface ChatMsg {
  who: 'me' | 'tutor';
  text: string;
}

export default function Practica() {
  const nav = useNavigate();
  const { t } = useTranslation();
  const { mastery, stats, route, current, next, answer } = usePractice();

  const [picked, setPicked] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      who: 'tutor',
      text: 'Hola 👋 Soy tu tutor de Estadística. Pregúntame sobre el tema en pantalla: doy explicaciones, ejemplos y te digo en qué libro, capítulo y página leer más.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!current) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [chat]);

  if (!current) return null;
  const { exercise, selection } = current;
  const sub = SUBTOPICS.find((s) => s.id === exercise.subtopicId)!;
  const answered = picked !== null;
  const ok = answered && picked === exercise.answerIndex;

  const onPick = (i: number) => {
    if (answered) return;
    const wasOk = answer(i);
    setPicked(i);
    if (!wasOk) setShowHint(true);
  };

  const onNext = () => {
    setPicked(null);
    setShowHint(false);
    next();
  };

  const sendChat = async (q: string) => {
    const question = q.trim();
    if (!question || chatBusy) return;
    setChat((c) => [...c, { who: 'me', text: question }]);
    setChatInput('');
    setChatBusy(true);
    const ctx: TutorContext = {
      courseName: `${ESTADISTICA.name} ${ESTADISTICA.code}`,
      subtopicName: sub.name,
      mastery: mastery[sub.id],
      bookRefs: sub.bookRefs,
    };
    const r = await chatTutor(ctx, question);
    setChat((c) => [...c, { who: 'tutor', text: r.text }]);
    setChatBusy(false);
  };

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo size="sm" />
          <h1 style={{ fontSize: 16 }}>GuIA</h1>
        </div>
        <div className="spacer" />
        <span className="rolepill">🎓 Estudiante</span>
        <button className="link" onClick={() => nav('/curso')}>← Mi curso</button>
      </header>

      <section className="strip">
        <div className="stat"><div className="k">Resueltos</div><div className="v">{stats.done}</div></div>
        <div className="stat"><div className="k">Aciertos</div><div className="v">{stats.done ? `${Math.round((stats.correct / stats.done) * 100)}%` : '—'}</div></div>
        <div className="stat"><div className="k">Racha</div><div className="v">{stats.streak}</div></div>
        <div className="stat"><div className="k">Puntos</div><div className="v gold">{stats.xp}</div></div>
        <div className="stat"><div className="k">Nivel</div><div className="v gold">{stats.level}</div></div>
      </section>

      <div className="grid2">
        <div>
          <main className="card">
            <div className="card-h">
              <h2>{t('practice.nextChallenge')}</h2>
              <span className="sub">{selection.reason}</span>
            </div>
            <div className="ex-body">
              <div className="chips">
                <span className="chip brand">{sub.name}</span>
                <span className="chip">{LEVEL_LABEL[exercise.level]}</span>
                <span className="chip">
                  <span className="diff">
                    {[1, 2, 3, 4, 5].map((d) => (
                      <i key={d} className={d <= exercise.difficulty ? 'on' : ''} />
                    ))}
                  </span>
                </span>
              </div>
              <div className="prompt"><Rich text={exercise.prompt} /></div>
              <div className="opts">
                {exercise.options.map((op, i) => {
                  let cls = 'opt';
                  if (answered) {
                    if (i === exercise.answerIndex) cls += ' correct';
                    else if (i === picked) cls += ' wrong';
                    else cls += ' dim';
                  }
                  return (
                    <button key={i} className={cls} disabled={answered} onClick={() => onPick(i)}>
                      <span className="badge">{String.fromCharCode(65 + i)}</span>
                      <span><Rich text={op} /></span>
                    </button>
                  );
                })}
              </div>

              {showHint && (
                <div className="hintbox">
                  <span className="ai">Tutor IA</span>
                  <div><b>Pista.</b> <Rich text={exercise.hint} /></div>
                </div>
              )}
              {answered && ok && (
                <div className="hintbox">
                  <span className="ai">Explicación</span>
                  <div><Rich text={exercise.explanation} /></div>
                </div>
              )}

              <div className="ex-foot">
                {!answered && (
                  <button className="btn" onClick={() => setShowHint(true)}>
                    {t('practice.askHint')}
                  </button>
                )}
                {answered && (
                  <button className="btn primary" onClick={onNext}>
                    {t('practice.next')}
                  </button>
                )}
                <span className={`feedback ${answered ? (ok ? 'ok' : 'no') : ''}`}>
                  {answered
                    ? ok
                      ? t('practice.correct', { points: 10 * exercise.difficulty })
                      : t('practice.wrong')
                    : ''}
                </span>
              </div>
            </div>
          </main>

          <section className="card" style={{ marginTop: 18 }}>
            <div className="card-h">
              <h2>💬 Pregúntale al tutor</h2>
              <span className="sub">explica, da ejemplos y cita libros</span>
            </div>
            <div className="chat-log" ref={logRef}>
              {chat.map((m, i) => (
                <div key={i} className={`msg ${m.who} anim-in`}>
                  {m.who === 'tutor' && <div className="whoq">Tutor IA</div>}
                  <Rich text={m.text} />
                </div>
              ))}
              {chatBusy && <div className="msg tutor">…</div>}
            </div>
            <div className="chat-chips">
              {['Explícame el concepto', 'Dame un ejemplo', '¿Dónde leo más?'].map((c) => (
                <button key={c} onClick={() => sendChat(c)}>{c}</button>
              ))}
            </div>
            <div className="chat-in">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat(chatInput)}
                placeholder="Escribe tu pregunta… ej. ¿qué es la mediana?"
              />
              <button className="btn primary" onClick={() => sendChat(chatInput)} disabled={chatBusy}>
                Enviar
              </button>
            </div>
          </section>
        </div>

        <aside style={{ display: 'grid', gap: 18 }}>
          <section className="card">
            <div className="card-h">
              <h2>{t('practice.masteryMap')}</h2>
              <span className="sub">en vivo</span>
            </div>
            <div className="panel-body">
              {SUBTOPICS.map((s) => (
                <div className="mrow" key={s.id}>
                  <div className="top">
                    <span className="name">
                      {s.name}
                      {s.id === sub.id ? ' 🎯' : ''}
                    </span>
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
              <div className="legend">
                <span><i style={{ background: 'var(--m-low)' }} />Por reforzar</span>
                <span><i style={{ background: 'var(--m-mid)' }} />En progreso</span>
                <span><i style={{ background: 'var(--m-high)' }} />Dominado</span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-h">
              <h2>{t('practice.route')}</h2>
              <span className="sub">por qué elijo cada paso</span>
            </div>
            <div className="route">
              {route.length === 0 && <div className="empty">{t('practice.routeEmpty')}</div>}
              {route.map((r) => (
                <div key={r.key} className={`step ${r.ok ? 'ok' : 'no'} anim-in`}>
                  <div className="h">
                    <span className="res">{r.ok ? '✓ ACIERTO' : '✗ FALLO'}</span>
                    <span className="st">{r.subtopicName}</span>
                  </div>
                  <div className="why">{r.reason}</div>
                  <div className="delta">
                    dominio {Math.round(r.before * 100)}% → {Math.round(r.after * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
