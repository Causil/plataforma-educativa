import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../state/AuthContext';

/** Panel de administración (E10/T-1001) — KPIs, usuarios y evaluación de cursos. */

const USERS = [
  { name: 'jcausilmartinez', role: 'est', estado: 'Activo', last: 'Hace 2 min' },
  { name: 'profe.demo', role: 'prof', estado: 'Activo', last: 'Hace 10 min' },
  { name: 'admin.demo', role: 'adm', estado: 'Activo', last: 'Ahora' },
  { name: 'estudiante.demo', role: 'est', estado: 'Activo', last: 'Hace 1 h' },
];

const ROLE_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  est: { label: 'Estudiante', bg: 'var(--brand-soft)', color: 'var(--brand-ink)' },
  prof: { label: 'Profesor', bg: 'var(--warm-soft)', color: 'var(--warm)' },
  adm: { label: 'Admin', bg: 'var(--surface-2)', color: 'var(--ink-2)' },
};

const EVAL = [
  { nm: 'Contenido', pct: 92, score: '4.6/5', col: 'var(--m-high)' },
  { nm: 'Tutor IA', pct: 96, score: '4.8/5', col: 'var(--m-high)' },
  { nm: 'Plataforma', pct: 88, score: '4.4/5', col: 'var(--m-mid)' },
  { nm: 'Evaluaciones', pct: 84, score: '4.2/5', col: 'var(--m-mid)' },
];

export default function Admin() {
  const nav = useNavigate();
  const { session, logout } = useAuth();
  const userName = session?.email.split('@')[0] ?? 'admin';

  return (
    <div className="wrap">
      <header className="topbar">
        <div className="brand">
          <Logo size="sm" />
          <h1 style={{ fontSize: 16 }}>GuIA</h1>
        </div>
        <div className="spacer" />
        <span className="rolepill">⚙️ Administrador</span>
        <div className="who">
          <span>{userName}</span>
          <div className="avatar">{userName.slice(0, 2).toUpperCase()}</div>
        </div>
        <button className="link" onClick={() => void logout().then(() => nav('/'))}>Salir</button>
      </header>

      <div className="section-h">
        <h2>Panel de administración</h2>
        <span className="sub">plataforma GuIA</span>
      </div>

      <div className="strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat"><div className="k">Usuarios</div><div className="v">{USERS.length}</div></div>
        <div className="stat"><div className="k">Cursos activos</div><div className="v">2</div></div>
        <div className="stat"><div className="k">Ejercicios en banco</div><div className="v">16</div></div>
        <div className="stat"><div className="k">Costo IA (mes)</div><div className="v">$0<small style={{ color: 'var(--ink-3)' }}>.00</small></div></div>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-h"><h2>Usuarios</h2><span className="sub">Cognito · pool us-east-1_YUlvwbLCQ</span></div>
          <div className="tbl-wrap" style={{ padding: '6px 6px 14px' }}>
            <table>
              <thead>
                <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Último acceso</th></tr>
              </thead>
              <tbody>
                {USERS.map((u) => {
                  const r = ROLE_STYLE[u.role];
                  return (
                    <tr key={u.name}>
                      <td>
                        <span className="avatar" style={{ width: 26, height: 26, fontSize: 11, marginRight: 8, display: 'inline-grid' }}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </span>
                        {u.name}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: r.bg, color: r.color }}>
                          {r.label}
                        </span>
                      </td>
                      <td><span className="tag-ok">●</span> {u.estado}</td>
                      <td style={{ color: 'var(--ink-3)' }}>{u.last}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 18 }}>
          <section className="card">
            <div className="card-h">
              <h2>Evaluación de los cursos</h2>
              <span className="sub">por estudiantes · demo (R16 = P1)</span>
            </div>
            <div className="panel-body">
              {EVAL.map((e) => (
                <div key={e.nm} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <span style={{ width: 110, fontSize: 13, fontWeight: 600 }}>{e.nm}</span>
                  <div className="bar" style={{ flex: 1 }}>
                    <i style={{ width: `${e.pct}%`, background: e.col }} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12.5, width: 52, textAlign: 'right' }}>{e.score}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-h"><h2>Contenido</h2><span className="sub">cursos y banco</span></div>
            <div className="panel-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed var(--line)' }}>
                <span>Estadística — CBS00074</span>
                <span className="tag-ok">Activo · 🔒 privado</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed var(--line)' }}>
                <span>Estadística Fundamental</span>
                <span className="tag-ok">Activo · público</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0' }}>
                <span>Álgebra básica</span>
                <span style={{ color: 'var(--ink-3)' }}>Borrador</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
