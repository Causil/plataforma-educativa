/**
 * Estado de práctica — VERSIÓN NUBE (tarea 10 · T-405-cloud).
 *
 * Habla con las Lambdas next-exercise/submit-answer vía AppSync:
 * - La SELECCIÓN y el SCORING son del servidor (answerIndex nunca decide en cliente).
 * - El progreso (MasteryState/RouteLog/GameState) PERSISTE entre sesiones.
 * - El contenido local (src/content) se usa como espejo de presentación
 *   (hint pre-respuesta, resaltado de opciones) casado por prompt.
 *
 * Mantiene la interfaz PracticeApi para que las páginas no cambien de forma.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { EXERCISES, SUBTOPICS } from '../content/estadistica';
import type { Exercise } from '../content/types';
import { useAuth } from './AuthContext';

const client = generateClient<Schema>();
const parse = (raw: unknown) => (typeof raw === 'string' ? JSON.parse(raw) : raw);

export interface RouteStep {
  key: number;
  ok: boolean;
  subtopicName: string;
  reason: string;
  before: number;
  after: number;
}

interface Current {
  /** id del ejercicio en la BD (para submitAnswer). */
  dbId: string;
  /** espejo local para presentación (opciones/hint/explicación/answerIndex UI). */
  content: Exercise;
  reason: string;
}

interface PracticeApi {
  ready: boolean;
  mastery: Record<string, number>; // por id de contenido ('vars', 'tc', …)
  stats: { done: number; correct: number; streak: number; xp: number; level: number };
  route: RouteStep[];
  current: { exercise: Exercise; selection: { reason: string } } | null;
  next: () => Promise<void>;
  answer: (optionIndex: number) => Promise<boolean>;
  diagnosticDone: boolean;
  applyDiagnostic: (results: Record<string, { correct: number; total: number }>) => Promise<void>;
}

const Ctx = createContext<PracticeApi | null>(null);

/** dbSubtopicId ↔ contentId, casados por título (seed mapeó name→title). */
interface CourseMap {
  contentIdByDb: Map<string, string>;
  dbIdByContent: Map<string, string>;
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const [ready, setReady] = useState(false);
  const [mastery, setMastery] = useState<Record<string, number>>(() =>
    Object.fromEntries(SUBTOPICS.map((s) => [s.id, 0])),
  );
  const [stats, setStats] = useState({ done: 0, correct: 0, streak: 0, xp: 0, level: 1 });
  const [route, setRoute] = useState<RouteStep[]>([]);
  const [current, setCurrent] = useState<Current | null>(null);
  const [diagnosticDone, setDiagnosticDone] = useState(false);
  const mapRef = useRef<CourseMap | null>(null);
  const userIdRef = useRef<string>('');

  // ── Carga inicial: mapa de subtemas + progreso persistido ──────────────
  useEffect(() => {
    if (status !== 'authed') {
      setReady(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { userId } = await getCurrentUser();
        userIdRef.current = userId;

        const subs = (await client.models.Subtopic.list({ limit: 100 })).data;
        const contentIdByDb = new Map<string, string>();
        const dbIdByContent = new Map<string, string>();
        for (const s of subs) {
          const c = SUBTOPICS.find((x) => x.name === s.title);
          if (c) {
            contentIdByDb.set(s.id, c.id);
            dbIdByContent.set(c.id, s.id);
          }
        }
        mapRef.current = { contentIdByDb, dbIdByContent };

        // MasteryState persistido (owner-scoped)
        const ms = (await client.models.MasteryState.list({ limit: 100 })).data;
        const m: Record<string, number> = Object.fromEntries(
          SUBTOPICS.map((s) => [s.id, 0]),
        );
        let any = false;
        for (const row of ms) {
          const cid = contentIdByDb.get(row.subtopicId);
          if (cid) {
            m[cid] = row.mastery;
            any = true;
          }
        }

        // GameState global persistido
        const gs = (await client.models.GameState.list({
          filter: { studentId: { eq: userId }, scope: { eq: 'global' } },
        })).data[0];

        // Historial de ruta (últimos pasos)
        const logs = (await client.models.RouteLog.list({ limit: 200 })).data
          .sort((a, b) => (b.step ?? 0) - (a.step ?? 0));
        const done = logs.length;
        const correct = logs.filter((l) => l.ok).length;

        if (cancelled) return;
        setMastery(m);
        setDiagnosticDone(any);
        setStats({
          done,
          correct,
          streak: gs?.streak ?? 0,
          xp: gs?.xp ?? 0,
          level: gs?.level ?? 1,
        });
        setRoute(
          logs.slice(0, 10).map((l, i) => ({
            key: i,
            ok: !!l.ok,
            subtopicName:
              SUBTOPICS.find((s) => s.id === contentIdByDb.get(l.subtopicId))?.name ??
              'Subtema',
            reason: l.reason ?? '',
            before: l.masteryBefore ?? 0,
            after: l.masteryAfter ?? 0,
          })),
        );
        setReady(true);
      } catch (e) {
        console.error('PracticeProvider init:', e);
        if (!cancelled) setReady(true); // no bloquear la UI; next() reintentará
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  // ── nextExercise (servidor decide) ─────────────────────────────────────
  const next = useCallback(async () => {
    const q = await client.queries.nextExercise({});
    const r = parse(q.data) as {
      error?: string;
      reason?: string;
      exercise?: { id: string; prompt: string };
    };
    if (r.error || !r.exercise) {
      console.error('nextExercise:', r.error);
      return;
    }
    const content =
      EXERCISES.find((e) => e.prompt === r.exercise!.prompt) ?? EXERCISES[0];
    setCurrent({ dbId: r.exercise.id, content, reason: r.reason ?? '' });
  }, []);

  // ── submitAnswer (servidor califica y persiste) ────────────────────────
  const answer = useCallback(
    async (optionIndex: number): Promise<boolean> => {
      if (!current) return false;
      const m = await client.mutations.submitAnswer({
        exerciseId: current.dbId,
        optionIndex,
      });
      const r = parse(m.data) as {
        error?: string;
        ok?: boolean;
        before?: number;
        after?: number;
        xp?: number;
        streak?: number;
        level?: number;
      };
      if (r.error) {
        console.error('submitAnswer:', r.error);
        return false;
      }
      const ok = !!r.ok;
      const cid = current.content.subtopicId;
      setMastery((prev) => ({ ...prev, [cid]: r.after ?? prev[cid] }));
      setStats((s) => ({
        done: s.done + 1,
        correct: s.correct + (ok ? 1 : 0),
        streak: r.streak ?? (ok ? s.streak + 1 : 0),
        xp: r.xp ?? s.xp,
        level: r.level ?? s.level,
      }));
      setRoute((rt) => [
        {
          key: Date.now(),
          ok,
          subtopicName:
            SUBTOPICS.find((s) => s.id === cid)?.name ?? 'Subtema',
          reason: current.reason,
          before: r.before ?? 0,
          after: r.after ?? 0,
        },
        ...rt,
      ]);
      return ok;
    },
    [current],
  );

  // ── Diagnóstico → MasteryState en la nube ──────────────────────────────
  const applyDiagnostic = useCallback(
    async (results: Record<string, { correct: number; total: number }>) => {
      const map = mapRef.current;
      const userId = userIdRef.current;
      if (!map || !userId) return;
      const updated: Record<string, number> = {};
      for (const [contentId, r] of Object.entries(results)) {
        if (r.total === 0) continue;
        const value = Math.min(0.9, Math.max(0.12, 0.22 + 0.6 * (r.correct / r.total)));
        updated[contentId] = value;
        const dbId = map.dbIdByContent.get(contentId);
        if (!dbId) continue;
        const existing = (await client.models.MasteryState.list({
          filter: { subtopicId: { eq: dbId } },
        })).data[0];
        if (existing) {
          await client.models.MasteryState.update({ id: existing.id, mastery: value });
        } else {
          await client.models.MasteryState.create({
            studentId: userId,
            subtopicId: dbId,
            mastery: value,
            attempts: 0,
            streak: 0,
            consecutiveFails: 0,
            owner: userId, // convención alineada con las Lambdas
          });
        }
      }
      setMastery((prev) => ({ ...prev, ...updated }));
      setCurrent(null);
      setDiagnosticDone(true);
    },
    [],
  );

  const api = useMemo<PracticeApi>(
    () => ({
      ready,
      mastery,
      stats,
      route,
      current: current
        ? { exercise: current.content, selection: { reason: current.reason } }
        : null,
      next,
      answer,
      diagnosticDone,
      applyDiagnostic,
    }),
    [ready, mastery, stats, route, current, next, answer, diagnosticDone, applyDiagnostic],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePractice(): PracticeApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('usePractice debe usarse dentro de <PracticeProvider>');
  return api;
}
