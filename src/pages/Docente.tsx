import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import { Logo } from '../components/Logo';
import { SUBTOPICS } from '../content/estadistica';
import { parseRosterCsv, type RosterResult } from '../lib/roster';
import { useAuth } from '../state/AuthContext';

/**
 * Panel docente — 100 % datos reales de la nube (E9).
 * Heatmap y seguimiento desde MasteryState/RouteLog/GameState (lectura de grupo
 * teachers/admins), cursos desde Course, matrícula real vía enrollStudents (R02).
 */

const client = generateClient<Schema>();
const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

type Course = Schema['Course']['type'];

interface StudentRow {
  key: string; // sub de Cognito
  name: string;
  email: string | null;
  mastery: (number | null)[]; // 0..100 por subtema en el orden de SUBTOPICS; null = sin datos
  avg: number | null;
  exercises: number;
  correct: number;
  lastAt: string | null;
  streak: number;
}

interface EnrollOutcome {
  email: string;
  status: 'invited' | 'existing' | 'error';
  enrolled: boolean;
  detail?: string;
}

const cellStyle = (v: number): React.CSSProperties => {
  const col = v >= 75 ? 'var(--m-high)' : v >= 45 ? 'var(--m-mid)' : 'var(--m-low)';
  return {
    background: `color-mix(in srgb, ${col} 20%, var(--surface))`,
    color: v >= 45 ? 'var(--ink)' : 'var(--m-low)',
  };
};

const initials = (n: string) =>
  n.split(' ').slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase() || '?';

const ago = (iso: string | null): string => {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d > 1 ? 's' : ''}`;
};

export default function Docente() {
  const nav = useNavigate();
  const { session, logout } = useAuth();
  const userName = session?.email.split('@')[0] ?? 'profesor';

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollCount, setEnrollCount] = useState<Map<string, number>>(new Map());
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [exercisesToday, setExercisesToday] = useState(0);

  const [toast, setToast] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [roster, setRoster] = useState<RosterResult | null>(null);
  const [rosterName, setRosterName] = useState('');
  const [targetCourse, setTargetCourse] = useState<string>(''); // courseId o 'new'
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newInst, setNewInst] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [outcome, setOutcome] = useState<EnrollOutcome[] | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const notify = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 5000);
  };

  // ── Carga de datos reales ────────────────────────────────────────────────
  const load = async () => {
    setLoadError(null);
    try {
      const [subsQ, coursesQ, enrQ, msQ, logQ, gsQ] = await Promise.all([
        client.models.Subtopic.list({ limit: 100 }),
        client.models.Course.list({ limit: 50 }),
        client.models.Enrollment.list({ limit: 500 }),
        client.models.MasteryState.list({ limit: 1000 }),
        client.models.RouteLog.list({ limit: 1000 }),
        client.models.GameState.list({ limit: 500 }),
      ]);

      // dbSubtopicId → columna (mismo mapeo por título que usa PracticeContext)
      const colByDbId = new Map<string, number>();
      for (const s of subsQ.data ?? []) {
        const idx = SUBTOPICS.findIndex((c) => c.name === s.title);
        if (idx >= 0) colByDbId.set(s.id, idx);
      }

      const byStudent = new Map<string, StudentRow>();
      const ensure = (key: string): StudentRow => {
        let r = byStudent.get(key);
        if (!r) {
          r = {
            key,
            name: `Estudiante ${key.slice(0, 6)}`,
            email: null,
            mastery: SUBTOPICS.map(() => null),
            avg: null,
            exercises: 0,
            correct: 0,
            lastAt: null,
            streak: 0,
          };
          byStudent.set(key, r);
        }
        return r;
      };

      for (const e of enrQ.data ?? []) {
        const r = ensure(e.studentId);
        if (e.fullName) r.name = e.fullName;
        else if (e.email) r.name = e.email.split('@')[0];
        r.email = e.email ?? r.email;
      }

      for (const ms of msQ.data ?? []) {
        const col = colByDbId.get(ms.subtopicId);
        if (col === undefined) continue;
        ensure(ms.studentId).mastery[col] = Math.round(ms.mastery * 100);
      }

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      let today = 0;
      for (const l of logQ.data ?? []) {
        const r = ensure(l.studentId);
        r.exercises += 1;
        if (l.ok) r.correct += 1;
        if (l.createdAt && (!r.lastAt || l.createdAt > r.lastAt)) r.lastAt = l.createdAt;
        if (l.createdAt && new Date(l.createdAt) >= todayStart) today += 1;
      }

      for (const g of gsQ.data ?? []) {
        if (g.scope === 'global') ensure(g.studentId).streak = g.streak ?? 0;
      }

      const list = [...byStudent.values()].map((r) => {
        const vals = r.mastery.filter((v): v is number => v !== null);
        return { ...r, avg: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null };
      });
      list.sort((a, b) => a.name.localeCompare(b.name));

      const counts = new Map<string, number>();
      for (const e of enrQ.data ?? []) {
        counts.set(e.courseId, (counts.get(e.courseId) ?? 0) + 1);
      }

      setRows(list);
      setCourses(coursesQ.data ?? []);
      setEnrollCount(counts);
      setExercisesToday(today);
      const priv = (coursesQ.data ?? []).find((c) => c.visibility === 'private');
      setTargetCourse((prev) => prev || priv?.id || (coursesQ.data ?? [])[0]?.id || 'new');
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No pude cargar los datos del grupo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── KPIs reales ──────────────────────────────────────────────────────────
  const active = useMemo(() => rows.filter((r) => r.avg !== null), [rows]);
  const kpis = useMemo(() => {
    if (active.length === 0) return null;
    const groupAvg = Math.round(active.reduce((a, r) => a + (r.avg ?? 0), 0) / active.length);
    const atRisk = active.filter((r) => (r.avg ?? 0) < 40).length;
    const colAvgs = SUBTOPICS.map((_, i) => {
      const vals = active.map((r) => r.mastery[i]).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : Infinity;
    });
    const weakest = SUBTOPICS[colAvgs.indexOf(Math.min(...colAvgs))]?.name ?? '—';
    return { groupAvg, atRisk, weakest };
  }, [active]);

  const risky = useMemo(
    () =>
      active
        .filter((r) => (r.avg ?? 0) < 40)
        .map((r) => {
          const vals = r.mastery.map((v, i) => ({ v: v ?? Infinity, i }));
          const w = vals.reduce((min, c) => (c.v < min.v ? c : min), vals[0]);
          return { ...r, weakest: SUBTOPICS[w.i]?.name ?? '—' };
        })
        .sort((a, b) => (a.avg ?? 0) - (b.avg ?? 0)),
    [active],
  );

  // ── Matrícula real (R02) ─────────────────────────────────────────────────
  const onFile = async (file: File) => {
    if (/\.xlsx?$/i.test(file.name)) {
      notify(`⚠️ ${file.name} es un Excel — guárdalo como CSV y vuelve a subirlo`);
      return;
    }
    const text = await file.text();
    const result = parseRosterCsv(text);
    setRoster(result);
    setRosterName(file.name);
    setOutcome(null);
    if (result.students.length > 0) {
      notify(
        `📄 ${file.name}: ${result.students.length} estudiante(s) leídos` +
          (result.errors.length ? ` · ${result.errors.length} fila(s) con error` : ''),
      );
    } else {
      // El motivo real importa: sin él, "revisa el formato" no dice qué revisar.
      notify(
        `⚠️ No pude leer estudiantes de ${file.name} — ${result.errors[0] ?? 'el archivo no tiene filas de estudiantes'}`,
      );
    }
  };

  const doEnroll = async () => {
    if (!roster || roster.students.length === 0 || enrolling) return;
    setEnrolling(true);
    setOutcome(null);
    try {
      let courseId = targetCourse;

      if (courseId === 'new') {
        if (!newName.trim() || !newCode.trim()) {
          notify('⚠️ El curso nuevo necesita nombre y código');
          setEnrolling(false);
          return;
        }
        const { userId } = await getCurrentUser();
        const created = await client.models.Course.create({
          code: newCode.trim(),
          name: newName.trim(),
          institution: newInst.trim() || null,
          visibility: 'private',
          teacherId: userId,
          status: 'activo',
        });
        if (!created.data) throw new Error(created.errors?.[0]?.message ?? 'No se pudo crear el curso');
        courseId = created.data.id;
      }

      const res = await client.mutations.enrollStudents({
        courseId,
        students: JSON.stringify(roster.students),
      });
      const r = parse(res.data) as {
        error?: string;
        invited?: number;
        existing?: number;
        errors?: number;
        results?: EnrollOutcome[];
      };
      if (r?.error) throw new Error(r.error);

      setOutcome(r.results ?? []);
      notify(
        `✅ Matrícula: ${r.invited ?? 0} invitación(es) enviadas · ${r.existing ?? 0} ya tenían cuenta` +
          ((r.errors ?? 0) > 0 ? ` · ⚠️ ${r.errors} error(es)` : ''),
      );
      await load(); // refresca cursos, matrículas y heatmap
    } catch (err) {
      notify(`⚠️ ${err instanceof Error ? err.message : 'Error al matricular'}`);
    } finally {
      setEnrolling(false);
    }
  };

  const mainCourse = courses.find((c) => c.id === targetCourse && targetCourse !== 'new') ??
    courses.find((c) => c.visibility === 'private') ?? courses[0];

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo size="sm" />
          <h1 style={{ fontSize: 16 }}>GuIA</h1>
        </div>
        <div className="spacer" />
        <span className="rolepill">🧑‍🏫 Profesor</span>
        <div className="who">
          <span>{userName}</span>
          <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
        </div>
        <button className="link" onClick={() => void logout().then(() => nav('/'))}>Salir</button>
      </header>

      {/* Mis cursos (reales, desde la BD) */}
      <div className="section-h">
        <h2>Mis cursos</h2>
        <span className="sub">desde la base de datos del curso</span>
      </div>
      <div className="course-cards" style={{ marginBottom: 18 }}>
        {loading && courses.length === 0 && (
          <div className="card ccard"><h3>Cargando cursos…</h3></div>
        )}
        {courses.map((c) => (
          <div className="card ccard" key={c.id}>
            <h3>{c.name} · {c.code}</h3>
            <div className="meta">
              {c.visibility === 'private' ? (
                <span className="chip warm">🔒 Privado · solo listado oficial</span>
              ) : (
                <span className="chip brand">Público</span>
              )}
              <span>
                {enrollCount.get(c.id) ?? 0} matriculado(s)
                {c.institution ? ` · ${c.institution}` : ''}
              </span>
            </div>
          </div>
        ))}
        <div className="card ccard">
          <h3>Matricular estudiantes</h3>
          <div className="meta">
            <span>Sube el listado oficial → cuentas + invitación por correo</span>
          </div>
          <button className="btn sm" onClick={() => setShowCreate((v) => !v)}>
            {showCreate ? 'Ocultar' : '⬆️ Cargar listado / crear curso'}
          </button>
        </div>
      </div>

      {/* Matrícula real + creación de curso */}
      {showCreate && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="card-h">
            <h2>Matrícula por listado oficial</h2>
            <span className="sub">crea las cuentas y envía la invitación real por correo (Cognito)</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Curso destino</label>
              <select value={targetCourse} onChange={(e) => setTargetCourse(e.target.value)}>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.code}</option>
                ))}
                <option value="new">➕ Crear curso universitario nuevo…</option>
              </select>
            </div>

            {targetCourse === 'new' && (
              <>
                <div className="field">
                  <label>Nombre del curso</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Estadística I" />
                </div>
                <div className="field">
                  <label>Código institucional</label>
                  <input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="CBS00074" />
                </div>
                <div className="field">
                  <label>Universidad / institución</label>
                  <input value={newInst} onChange={(e) => setNewInst(e.target.value)} placeholder="Politécnico Jaime Isaza Cadavid" />
                </div>
              </>
            )}

            <div className="field">
              <label>Listado de estudiantes — curso privado, sin auto-inscripción</label>
              <div className="xlsx-drop" onClick={() => fileRef.current?.click()}>
                ⬆️ Sube el listado <b>.csv</b> (columnas del formato del Poli)
                <br />
                <small>
                  🔒 Solo ellos tendrán acceso · Cognito les envía contraseña temporal y crean la
                  suya en el primer ingreso{rosterName ? ` · cargado: ${rosterName}` : ''}
                </small>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
              />
            </div>

            {roster && roster.students.length > 0 && (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Estudiante</th>
                      <th>Correo</th>
                      <th>Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.students.map((s) => {
                      const done = outcome?.find((o) => o.email === s.email.toLowerCase());
                      return (
                        <tr key={s.document}>
                          <td>{s.document}</td>
                          <td>{s.fullName}</td>
                          <td>{s.email}</td>
                          <td>
                            {!done && <span style={{ color: 'var(--ink-3)' }}>Pendiente</span>}
                            {done?.status === 'invited' && <span className="tag-ok">Invitado ✉️</span>}
                            {done?.status === 'existing' && (
                              <span className="tag-ok">{done.enrolled ? 'Matriculado (ya tenía cuenta)' : 'Ya matriculado'}</span>
                            )}
                            {done?.status === 'error' && (
                              <span className="tag-warn" title={done.detail}>⚠️ {done.detail ?? 'Error'}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {roster.errors.length > 0 && (
                  <p style={{ fontSize: 12, color: 'var(--warm)', margin: '8px 0 0' }}>
                    ⚠️ {roster.errors.join(' · ')}
                  </p>
                )}
              </div>
            )}

            <button
              className="btn primary"
              disabled={!roster || roster.students.length === 0 || enrolling}
              onClick={() => void doEnroll()}
            >
              {enrolling
                ? 'Matriculando…'
                : targetCourse === 'new'
                  ? 'Crear curso y matricular'
                  : 'Matricular y enviar invitaciones'}
            </button>
          </div>
        </section>
      )}

      {/* Grupo real */}
      <div className="section-h">
        <h2>
          {mainCourse ? `${mainCourse.name} · ${mainCourse.code}` : 'Mi grupo'}
        </h2>
        <span className="sub">
          {mainCourse?.institution ?? ''} · {rows.length} estudiante(s) con cuenta · {active.length} con actividad
        </span>
      </div>

      {loadError && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="panel-body">⚠️ {loadError}</div>
        </section>
      )}

      <div className="strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat">
          <div className="k">Dominio del grupo</div>
          <div className="v">{kpis ? `${kpis.groupAvg}%` : '—'}</div>
        </div>
        <div className="stat">
          <div className="k">En riesgo</div>
          <div className="v" style={{ color: 'var(--warm)' }}>{kpis ? kpis.atRisk : '—'}</div>
        </div>
        <div className="stat">
          <div className="k">Ejercicios hoy</div>
          <div className="v">{exercisesToday}</div>
        </div>
        <div className="stat">
          <div className="k">Más flojo</div>
          <div className="v" style={{ fontSize: 14, lineHeight: 1.3 }}>{kpis ? kpis.weakest : '—'}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 18 }}>
        <section className="card">
          <div className="card-h">
            <h2>Mapa de dominio de la clase</h2>
            <span className="sub">verde = dominado · rojo = por reforzar · · = sin datos aún</span>
          </div>
          <div className="tbl-wrap" style={{ padding: '8px 6px 14px' }}>
            {loading ? (
              <p style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>Cargando progreso del grupo…</p>
            ) : rows.length === 0 ? (
              <p style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>
                Aún no hay estudiantes. Sube el listado oficial para matricular al primero. ⬆️
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    {SUBTOPICS.map((s) => (
                      <th key={s.id}>{s.short}</th>
                    ))}
                    <th>Prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((st) => (
                    <tr key={st.key}>
                      <td>
                        <span
                          className="avatar"
                          style={{ width: 26, height: 26, fontSize: 11, marginRight: 8, display: 'inline-grid' }}
                        >
                          {initials(st.name)}
                        </span>
                        {st.name}
                      </td>
                      {st.mastery.map((v, i) => (
                        <td key={i}>
                          {v === null ? (
                            <span className="cell" style={{ color: 'var(--ink-3)' }}>·</span>
                          ) : (
                            <span className="cell" style={cellStyle(v)}>{v}</span>
                          )}
                        </td>
                      ))}
                      <td>{st.avg === null ? <span style={{ color: 'var(--ink-3)' }}>—</span> : <b>{st.avg}%</b>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Necesitan apoyo</h2></div>
          <div className="panel-body">
            {risky.length === 0 && (
              <p style={{ color: 'var(--ink-3)', fontSize: 13.5 }}>
                {active.length === 0
                  ? 'Sin actividad todavía — cuando el grupo practique, aquí verás a quién apoyar.'
                  : 'Nadie en riesgo por ahora. 🎉'}
              </p>
            )}
            {risky.map((s) => (
              <div className="risk-item" key={s.key}>
                <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                  {initials(s.name)}
                </span>
                <div className="txt">
                  <b>{s.name}</b>
                  <small>Más flojo: {s.weakest} · dominio {s.avg}%</small>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Seguimiento real (R03 básico) + informes (visión) */}
      <div className="two-col">
        <section className="card">
          <div className="card-h">
            <h2>Seguimiento de uso</h2>
            <span className="sub">actividad real registrada por el motor (RouteLog)</span>
          </div>
          <div className="tbl-wrap" style={{ padding: '6px 6px 14px' }}>
            {rows.filter((r) => r.exercises > 0).length === 0 ? (
              <p style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>Sin actividad registrada todavía.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Estudiante</th><th>Última actividad</th><th>Ejercicios</th><th>Aciertos</th><th>Racha</th>
                  </tr>
                </thead>
                <tbody>
                  {rows
                    .filter((r) => r.exercises > 0)
                    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))
                    .map((u) => (
                      <tr key={u.key}>
                        <td>{u.name}</td>
                        <td>{ago(u.lastAt)}</td>
                        <td>{u.exercises}</td>
                        <td>{Math.round((u.correct / u.exercises) * 100)}%</td>
                        <td>{u.streak > 0 ? `🔥 ${u.streak}` : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="card">
          <div className="card-h">
            <h2>Informes institucionales</h2>
            <span className="chip warm" style={{ fontSize: 10, textTransform: 'uppercase' }}>Visión · P2</span>
          </div>
          <div className="panel-body">
            {[
              '📄 FD-GC71 · Guía didáctica y concertación de evaluación (docx)',
              '📊 Listado de asistencia por sesión (xlsx)',
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  gap: 8, padding: '9px 0', borderBottom: '1px dashed var(--line)', fontSize: 13.5,
                }}
              >
                <span>{label}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>en el roadmap</span>
              </div>
            ))}
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '10px 0 0' }}>
              GuIA leerá el formato que exige la universidad y lo llenará con los datos recaudados
              automáticamente del curso.
            </p>
          </div>
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
