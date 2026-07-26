import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Logo } from '../components/Logo';
import { useAuth } from '../state/AuthContext';

/**
 * Panel de administración (E10) — 100 % datos reales vía la query adminStats:
 * usuarios y estados desde Cognito, conteos y actividad desde DynamoDB.
 */

const client = generateClient<Schema>();
const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

interface AdminUser {
  email: string;
  group: string;
  status: string;
  enabled: boolean;
  created: string | null;
  lastModified: string | null;
}

interface AdminData {
  error?: string;
  users?: AdminUser[];
  counts?: {
    users: number;
    courses: number;
    exercises: number;
    enrollments: number;
    exercisesAnswered: number;
    accuracyPct: number | null;
    submissions: number;
  };
  courses?: {
    id: string;
    code: string;
    name: string;
    institution: string | null;
    visibility: string | null;
    status: string | null;
  }[];
}

const ROLE_STYLE: Record<string, { label: string; bg: string; color: string }> = {
  students: { label: 'Estudiante', bg: 'var(--brand-soft)', color: 'var(--brand-ink)' },
  teachers: { label: 'Profesor', bg: 'var(--warm-soft)', color: 'var(--warm)' },
  admins: { label: 'Admin', bg: 'var(--surface-2)', color: 'var(--ink-2)' },
};

const STATUS_LABEL: Record<string, { label: string; ok: boolean }> = {
  CONFIRMED: { label: 'Activo', ok: true },
  FORCE_CHANGE_PASSWORD: { label: 'Invitado ✉️ (sin activar)', ok: false },
  RESET_REQUIRED: { label: 'Debe restablecer', ok: false },
  UNCONFIRMED: { label: 'Sin confirmar', ok: false },
};

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

export default function Admin() {
  const nav = useNavigate();
  const { session, logout } = useAuth();
  const userName = session?.email.split('@')[0] ?? 'admin';

  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = await client.queries.adminStats({});
        const r = parse(q.data) as AdminData;
        if (cancelled) return;
        if (r?.error) setError(r.error);
        else setData(r);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No pude cargar las estadísticas');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const c = data?.counts;

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
        <span className="sub">datos en vivo · Cognito + DynamoDB</span>
      </div>

      {error && (
        <section className="card" style={{ marginBottom: 18 }}>
          <div className="panel-body">⚠️ {error}</div>
        </section>
      )}

      <div className="strip" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat"><div className="k">Usuarios</div><div className="v">{c?.users ?? '…'}</div></div>
        <div className="stat"><div className="k">Cursos</div><div className="v">{c?.courses ?? '…'}</div></div>
        <div className="stat"><div className="k">Ejercicios en banco</div><div className="v">{c?.exercises ?? '…'}</div></div>
        <div className="stat"><div className="k">Matrículas</div><div className="v">{c?.enrollments ?? '…'}</div></div>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-h"><h2>Usuarios</h2><span className="sub">Cognito · en vivo</span></div>
          <div className="tbl-wrap" style={{ padding: '6px 6px 14px' }}>
            {!data && !error ? (
              <p style={{ padding: '8px 12px', color: 'var(--ink-3)' }}>Cargando usuarios…</p>
            ) : (
              <table>
                <thead>
                  <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th></tr>
                </thead>
                <tbody>
                  {(data?.users ?? []).map((u) => {
                    const r = ROLE_STYLE[u.group] ?? ROLE_STYLE.students;
                    const st = STATUS_LABEL[u.status] ?? { label: u.status, ok: false };
                    const name = u.email.split('@')[0];
                    return (
                      <tr key={u.email}>
                        <td>
                          <span className="avatar" style={{ width: 26, height: 26, fontSize: 11, marginRight: 8, display: 'inline-grid' }}>
                            {name.slice(0, 2).toUpperCase()}
                          </span>
                          {u.email}
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: r.bg, color: r.color }}>
                            {r.label}
                          </span>
                        </td>
                        <td>
                          <span className={st.ok ? 'tag-ok' : 'tag-warn'}>●</span> {st.label}
                        </td>
                        <td style={{ color: 'var(--ink-3)' }}>{fmtDate(u.created)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div style={{ display: 'grid', gap: 18 }}>
          <section className="card">
            <div className="card-h">
              <h2>Actividad de la plataforma</h2>
              <span className="sub">motor adaptativo · en vivo</span>
            </div>
            <div className="panel-body">
              {[
                { k: 'Ejercicios respondidos', v: c?.exercisesAnswered },
                { k: 'Tasa de acierto global', v: c?.accuracyPct !== null && c?.accuracyPct !== undefined ? `${c.accuracyPct}%` : null },
                { k: 'Evaluaciones entregadas', v: c?.submissions },
              ].map((row) => (
                <div
                  key={row.k}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px dashed var(--line)' }}
                >
                  <span>{row.k}</span>
                  <b style={{ fontFamily: 'var(--font-mono)' }}>{row.v ?? (data ? '—' : '…')}</b>
                </div>
              ))}
              <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '10px 0 0' }}>
                Fuente: RouteLog y Submission en DynamoDB — cada respuesta calificada por la Lambda queda registrada.
              </p>
            </div>
          </section>

          <section className="card">
            <div className="card-h"><h2>Contenido</h2><span className="sub">cursos en la plataforma</span></div>
            <div className="panel-body">
              {(data?.courses ?? []).length === 0 && (
                <p style={{ color: 'var(--ink-3)', fontSize: 13.5 }}>{data ? 'Sin cursos aún.' : 'Cargando…'}</p>
              )}
              {(data?.courses ?? []).map((course, i, arr) => (
                <div
                  key={course.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', padding: '9px 0',
                    borderBottom: i < arr.length - 1 ? '1px dashed var(--line)' : 'none',
                  }}
                >
                  <span>{course.name} — {course.code}</span>
                  <span className="tag-ok">
                    {course.status ?? 'Activo'} · {course.visibility === 'private' ? '🔒 privado' : 'público'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
