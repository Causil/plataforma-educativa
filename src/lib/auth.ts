/**
 * Capa de autenticación de GuIA sobre Cognito (T-203..T-206).
 * Flujos: login · recuperación de contraseña · primer ingreso de matriculados
 * (NEW_PASSWORD_REQUIRED tras AdminCreateUser).
 */
import {
  confirmResetPassword,
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  resetPassword,
  signIn,
  signOut,
} from 'aws-amplify/auth';

export type Role = 'est' | 'prof' | 'adm';

export interface SessionInfo {
  email: string;
  role: Role;
  groups: string[];
}

export type SignInOutcome =
  | { kind: 'ok' }
  | { kind: 'new-password-required' } // primer ingreso de matriculado
  | { kind: 'error'; message: string };

function roleFromGroups(groups: string[]): Role {
  if (groups.includes('admins')) return 'adm';
  if (groups.includes('teachers')) return 'prof';
  return 'est';
}

const ERRORS: Record<string, string> = {
  NotAuthorizedException: 'Correo o contraseña incorrectos.',
  UserNotFoundException: 'No existe una cuenta con ese correo.',
  LimitExceededException: 'Demasiados intentos. Espera unos minutos.',
  CodeMismatchException: 'El código no coincide. Revisa tu correo.',
  ExpiredCodeException: 'El código expiró. Solicita uno nuevo.',
  InvalidPasswordException:
    'La contraseña debe tener mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.',
};

function friendly(err: unknown): string {
  const e = err as { name?: string; message?: string };
  return ERRORS[e.name ?? ''] ?? e.message ?? 'Algo salió mal. Intenta de nuevo.';
}

export async function currentSession(): Promise<SessionInfo | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const groups =
      (session.tokens?.idToken?.payload['cognito:groups'] as string[] | undefined) ?? [];
    const email =
      (session.tokens?.idToken?.payload.email as string | undefined) ??
      user.signInDetails?.loginId ??
      user.username;
    return { email, groups, role: roleFromGroups(groups) };
  } catch {
    return null;
  }
}

export async function doSignIn(email: string, password: string): Promise<SignInOutcome> {
  try {
    const r = await signIn({ username: email.trim(), password });
    if (r.isSignedIn) return { kind: 'ok' };
    if (r.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      return { kind: 'new-password-required' };
    }
    return { kind: 'error', message: `Paso no soportado: ${r.nextStep.signInStep}` };
  } catch (err) {
    return { kind: 'error', message: friendly(err) };
  }
}

/** Primer ingreso: el matriculado define su contraseña definitiva. */
export async function completeNewPassword(newPassword: string): Promise<SignInOutcome> {
  try {
    const r = await confirmSignIn({ challengeResponse: newPassword });
    return r.isSignedIn
      ? { kind: 'ok' }
      : { kind: 'error', message: `Paso no soportado: ${r.nextStep.signInStep}` };
  } catch (err) {
    return { kind: 'error', message: friendly(err) };
  }
}

export async function requestReset(email: string): Promise<{ ok: boolean; message?: string }> {
  try {
    await resetPassword({ username: email.trim() });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: friendly(err) };
  }
}

export async function confirmReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await confirmResetPassword({
      username: email.trim(),
      confirmationCode: code.trim(),
      newPassword,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, message: friendly(err) };
  }
}

export async function doSignOut(): Promise<void> {
  try {
    await signOut();
  } catch {
    /* sesión ya cerrada */
  }
}
