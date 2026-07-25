import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { currentSession, doSignOut, type Role, type SessionInfo } from '../lib/auth';

interface AuthApi {
  status: 'loading' | 'authed' | 'anon';
  session: SessionInfo | null;
  refresh: () => Promise<SessionInfo | null>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthApi | null>(null);

export const HOME_BY_ROLE: Record<Role, string> = {
  est: '/curso',
  prof: '/docente',
  adm: '/admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthApi['status']>('loading');
  const [session, setSession] = useState<SessionInfo | null>(null);

  const refresh = useCallback(async () => {
    const s = await currentSession();
    setSession(s);
    setStatus(s ? 'authed' : 'anon');
    return s;
  }, []);

  const logout = useCallback(async () => {
    await doSignOut();
    setSession(null);
    setStatus('anon');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ status, session, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return api;
}
