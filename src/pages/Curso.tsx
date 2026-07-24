import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { SUBTOPICS, UNITS, ESTADISTICA } from '../content/estadistica';
import { usePractice } from '../state/PracticeContext';
import { MASTERY_THRESHOLD } from '../engine/selector';

const ACTIVITIES: Record<string, string> = {
  u1: 'Quiz 1 · con rúbrica', u2: 'Taller 1 · con rúbrica', u3: 'Quiz 2 · con rúbrica',
  u4: 'Taller 2 · con rúbrica', u5: 'Examen parcial · con rúbrica', u6: 'Trabajo final · con rúbrica',
};

const barColor = (m: number) =>
  m >= 0.75 ? 'var(--m-high)' : m >= 0.45 ? 'var(--m-mid)' : 'var(--m-low)';

export default function Curso() {
  const nav = useNavigate();
  const { mastery, stats } = usePractice();

  const avg =
    SUBTOPICS.reduce((acc, s) => acc + mastery[s.id], 0) / SUBTOPICS.length;

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo size="sm" />
          <h1 style={{ fontSize: 16 }}>GuIA</h1>
        </div>
        <div className="spacer" />
        <span className="rolepill">🎓 Estudiante</span>
        <div className="who">
          <span>Sofía</span>
          <div className="avatar">SO</div>
        </div>
        <button className="link" onClick={() => nav('/')}>Salir</button>
      </header>

      <div className="card course-head">
        <div className="info">
          <h2>
            {ESTADISTICA.name} — {ESTADISTICA.code}
          </h2>
          <div className="meta">
            <span className="chip warm">Politécnico JIC · 🔒 privado</span>
            <span className="chip">{ESTADISTICA.credits} créditos</span>
            <span>6 unidades (programa FD-GC70) · 8 subtemas · 6 actividades</span>
          </div>
        </div>
        <div style={{ minWidth: 180 }}>
          <div className="progress">
            <i style={{ width: `${Math.round(avg * 100)}%` }} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)', marginTop: 5 }}>
            {Math.round(avg * 100)}% completado · avance por ítem
          </div>
        </div>
        <button className="btn primary" onClick={() => nav('/practica')}>
          Continuar donde ibas →
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <span className="chip gold">🏅 Nivel {stats.level}</span>
        <span className="chip gold">⭐ {stats.xp} pts</span>
        <span className="chip">🔥 Racha: {stats.streak}</span>
      </div>

      {UNITS.map((u) => {
        const subs = SUBTOPICS.filter((s) => s.unitId === u.id);
        const uAvg = subs.reduce((a, s) => a + mastery[s.id], 0) / subs.length;
        const unlocked = uAvg >= 0.6;
        return (
          <section className="card tema" key={u.id}>
            <div className="t-head">
              <span className="tn">Unidad {u.order}</span>
              <h3>{u.title}</h3>
              <span className="chip" style={{ marginLeft: 'auto' }}>
                {Math.round(uAvg * 100)}% dominio
              </span>
            </div>
            <div className="t-body">
              {subs.map((s) => {
                const m = mastery[s.id];
                const state = m >= MASTERY_THRESHOLD ? 'done' : m >= 0.35 ? 'doing' : '';
                return (
                  <div className={`sub-row ${state}`} key={s.id}>
                    <div className="st-ic">{m >= MASTERY_THRESHOLD ? '✓' : m >= 0.35 ? '▶' : '○'}</div>
                    <div className="nm">
                      <b>{s.name}</b>
                      <small>
                        {m >= MASTERY_THRESHOLD ? 'Completado' : m >= 0.35 ? 'En curso' : 'Pendiente'} · avance
                        registrado
                      </small>
                    </div>
                    <div className="mini">
                      <div className="bar">
                        <i style={{ width: `${Math.round(m * 100)}%`, background: barColor(m) }} />
                      </div>
                      <div className="pct">{Math.round(m * 100)}%</div>
                    </div>
                    <button className="btn sm" onClick={() => nav('/practica')}>
                      Practicar
                    </button>
                  </div>
                );
              })}
              <div className="sub-row activity">
                <div className="st-ic">{unlocked ? '📝' : '🔒'}</div>
                <div className="nm">
                  <b>Actividad evaluativa</b>
                  <small>{ACTIVITIES[u.id]}</small>
                </div>
                <button className={`btn sm ${unlocked ? 'primary' : ''}`} disabled={!unlocked}>
                  {unlocked ? 'Comenzar' : 'Se desbloquea al 60%'}
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
