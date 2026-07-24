import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { SUBTOPICS, ESTADISTICA } from '../content/estadistica';
import { DEMO_GROUP, DEMO_USAGE } from '../content/demoGroup';
import { parseRosterCsv, type RosterResult } from '../lib/roster';

const cellStyle = (v: number): React.CSSProperties => {
  const col = v >= 75 ? 'var(--m-high)' : v >= 45 ? 'var(--m-mid)' : 'var(--m-low)';
  return {
    background: `color-mix(in srgb, ${col} 20%, var(--surface))`,
    color: v >= 45 ? 'var(--ink)' : 'var(--m-low)',
  };
};

const initials = (n: string) =>
  n.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();

export default function Docente() {
  const nav = useNavigate();
  const [toast, setToast] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [roster, setRoster] = useState<RosterResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  const notify = (msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  const kpis = useMemo(() => {
    const avgs = DEMO_GROUP.map(
      (s) => s.mastery.reduce((a, b) => a + b, 0) / s.mastery.length,
    );
    const groupAvg = Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length);
    const atRisk = avgs.filter((a) => a < 40).length;
    const bySub = SUBTOPICS.map((_, i) =>
      DEMO_GROUP.reduce((a, s) => a + s.mastery[i], 0) / DEMO_GROUP.length,
    );
    const weakest = SUBTOPICS[bySub.indexOf(Math.min(...bySub))].name;
    return { groupAvg, atRisk, weakest };
  }, []);

  const risky = useMemo(
    () =>
      DEMO_GROUP.map((s) => ({
        name: s.name,
        avg: s.mastery.reduce((a, b) => a + b, 0) / s.mastery.length,
        weakest: SUBTOPICS[s.mastery.indexOf(Math.min(...s.mastery))].name,
      }))
        .filter((s) => s.avg < 40)
        .sort((a, b) => a.avg - b.avg),
    [],
  );

  const onFile = async (file: File) => {
    const text = await file.text();
    const result = parseRosterCsv(text);
    setRoster(result);
    if (result.students.length > 0) {
      notify(
        `📄 ${file.name}: ${result.students.length} estudiante(s) listos para matricular` +
          (result.errors.length ? ` · ${result.errors.length} fila(s) con error` : ''),
      );
    } else {
      notify(`⚠️ No pude leer estudiantes de ${file.name} — revisa el formato`);
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
        <span className="rolepill">🧑‍🏫 Profesor</span>
        <div className="who">
          <span>Prof. Javier</span>
          <div className="avatar">JA</div>
        </div>
        <button className="link" onClick={() => nav('/')}>Salir</button>
      </header>

      {/* Mis cursos */}
      <div className="section-h">
        <h2>Mis cursos</h2>
        <span className="sub">públicos y universitarios</span>
      </div>
      <div className="course-cards" style={{ marginBottom: 18 }}>
        <div className="card ccard">
          <h3>Estadística Fundamental</h3>
          <div className="meta">
            <span className="chip brand">Público</span>
            <span>128 estudiantes · abierto todo el año</span>
          </div>
          <button className="btn sm" onClick={() => notify('Gestión del curso público — llega con E3 en AWS')}>
            Gestionar
          </button>
        </div>
        <div className="card ccard">
          <h3>
            {ESTADISTICA.name} — {ESTADISTICA.institution.split(' ').slice(-3).join(' ')}
          </h3>
          <div className="meta">
            <span className="chip warm">Universitario</span>
            <span className="chip">🔒 Privado · solo listado XLSX</span>
            <span>28 estudiantes</span>
          </div>
          <button className="btn sm" onClick={() => setShowCreate((v) => !v)}>
            + Crear curso universitario
          </button>
        </div>
      </div>

      {/* Crear curso + matrícula */}
      {showCreate && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="card-h">
            <h2>Crear curso universitario</h2>
            <span className="sub">con el temario que exige la institución</span>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Nombre del curso</label>
              <input defaultValue="Estadística I" />
            </div>
            <div className="field">
              <label>Universidad / institución</label>
              <input defaultValue="Politécnico Jaime Isaza Cadavid" />
            </div>
            <div className="field">
              <label>Matrícula de estudiantes — curso privado, sin auto-inscripción</label>
              <div className="xlsx-drop" onClick={() => fileRef.current?.click()}>
                ⬆️ Sube el listado <b>.csv</b> (columnas del formato del Poli)
                <br />
                <small>
                  🔒 Solo ellos tendrán acceso · se les notifica y crean su contraseña en el primer
                  ingreso (.xlsx nativo llega con la Lambda T-902)
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
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.students.map((s) => (
                      <tr key={s.document}>
                        <td>{s.document}</td>
                        <td>{s.fullName}</td>
                        <td>{s.email}</td>
                        <td className="tag-ok">Listo para invitar ✉️</td>
                      </tr>
                    ))}
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
              disabled={!roster || roster.students.length === 0}
              onClick={() =>
                notify(
                  `✅ ${roster!.students.length} invitación(es) se enviarán al conectar Cognito (T-902) — curso privado creado (demo)`,
                )
              }
            >
              Crear curso y notificar acceso
            </button>
          </div>
        </section>
      )}

      {/* Grupo */}
      <div className="section-h">
        <h2>Grupo 0310 · Tecnología en Costos y Auditoría — {ESTADISTICA.code}</h2>
        <span className="sub">Politécnico JIC · Barbosa · {DEMO_GROUP.length} estudiantes (demo)</span>
      </div>
      <div className="strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat">
          <div className="k">Dominio del grupo</div>
          <div className="v">{kpis.groupAvg}%</div>
        </div>
        <div className="stat">
          <div className="k">En riesgo</div>
          <div className="v" style={{ color: 'var(--warm)' }}>{kpis.atRisk}</div>
        </div>
        <div className="stat">
          <div className="k">Ejercicios hoy</div>
          <div className="v">412</div>
        </div>
        <div className="stat">
          <div className="k">Más flojo</div>
          <div className="v" style={{ fontSize: 14, lineHeight: 1.3 }}>{kpis.weakest}</div>
        </div>
      </div>

      <div className="two-col" style={{ marginBottom: 18 }}>
        <section className="card">
          <div className="card-h">
            <h2>Mapa de dominio de la clase</h2>
            <span className="sub">verde = dominado · rojo = por reforzar</span>
          </div>
          <div className="tbl-wrap" style={{ padding: '8px 6px 14px' }}>
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
                {DEMO_GROUP.map((st) => {
                  const avg = Math.round(
                    st.mastery.reduce((a, b) => a + b, 0) / st.mastery.length,
                  );
                  return (
                    <tr key={st.name}>
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
                          <span className="cell" style={cellStyle(v)}>{v}</span>
                        </td>
                      ))}
                      <td><b>{avg}%</b></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-h"><h2>Necesitan apoyo</h2></div>
          <div className="panel-body">
            {risky.map((s) => (
              <div className="risk-item" key={s.name}>
                <span className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                  {initials(s.name)}
                </span>
                <div className="txt">
                  <b>{s.name}</b>
                  <small>Más flojo: {s.weakest} · dominio {Math.round(s.avg)}%</small>
                </div>
                <button className="btn sm" onClick={() => notify(`📌 Refuerzo asignado a ${s.name} (demo)`)}>
                  Asignar refuerzo
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Seguimiento + informes */}
      <div className="two-col">
        <section className="card">
          <div className="card-h">
            <h2>Seguimiento de uso</h2>
            <span className="sub">frecuencia, duración y ruta por estudiante</span>
          </div>
          <div className="tbl-wrap" style={{ padding: '6px 6px 14px' }}>
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th><th>Último ingreso</th><th>Frecuencia</th><th>Duración media</th><th>Ruta seguida</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_USAGE.map((u) => (
                  <tr key={u.name}>
                    <td>{u.name}</td>
                    <td>{u.last}</td>
                    <td className={u.risk ? 'tag-warn' : ''}>{u.freq}</td>
                    <td>{u.dur}</td>
                    <td style={{ color: 'var(--ink-3)' }}>{u.route}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                <button
                  className="btn sm"
                  onClick={() => notify('🗺️ Roadmap (P2): GuIA llenará el formato institucional con los datos del curso')}
                >
                  Generar automático
                </button>
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
