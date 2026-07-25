import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../state/AuthContext';
import type { Role } from '../lib/auth';

/** Guard de rutas por rol (T-206). Sin sesión → /login; sin permiso → su home. */
export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const { status, session } = useAuth();

  if (status === 'loading') {
    return (
      <div className="wrap" style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <div className="card" style={{ padding: 24, color: 'var(--ink-2)' }}>Cargando sesión…</div>
      </div>
    );
  }
  if (status === 'anon' || !session) return <Navigate to="/login" replace />;
  if (!allow.includes(session.role)) {
    const home = session.role === 'adm' ? '/admin' : session.role === 'prof' ? '/docente' : '/curso';
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}
