/**
 * Estado de práctica (modo local — se sustituirá por Amplify Data en T-404/405,
 * manteniendo esta misma interfaz para que las pantallas no cambien).
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { updateMastery } from '../engine/mastery';
import { selectNext } from '../engine/selector';
import type { Selection, SubtopicState } from '../engine/types';
import { EXERCISES, SUBTOPICS } from '../content/estadistica';
import type { Exercise } from '../content/types';

export interface RouteStep {
  key: number;
  ok: boolean;
  subtopicName: string;
  reason: string;
  before: number;
  after: number;
}

interface Current {
  exercise: Exercise;
  selection: Selection;
}

interface PracticeApi {
  mastery: Record<string, number>;
  fails: Record<string, number>;
  stats: { done: number; correct: number; streak: number; xp: number; level: number };
  route: RouteStep[];
  current: Current | null;
  next: () => void;
  answer: (optionIndex: number) => boolean;
}

const Ctx = createContext<PracticeApi | null>(null);

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [mastery, setMastery] = useState<Record<string, number>>(() =>
    Object.fromEntries(SUBTOPICS.map((s) => [s.id, s.initialMastery])),
  );
  const [fails, setFails] = useState<Record<string, number>>(() =>
    Object.fromEntries(SUBTOPICS.map((s) => [s.id, 0])),
  );
  const [bankIdx, setBankIdx] = useState<Record<string, number>>({});
  const [stats, setStats] = useState({ done: 0, correct: 0, streak: 0, xp: 0, level: 1 });
  const [route, setRoute] = useState<RouteStep[]>([]);
  const [current, setCurrent] = useState<Current | null>(null);

  const api = useMemo<PracticeApi>(() => {
    const states = (): SubtopicState[] =>
      SUBTOPICS.map((s) => ({
        id: s.id,
        mastery: mastery[s.id],
        consecutiveFails: fails[s.id],
      }));

    const next = () => {
      const selection = selectNext(states());
      const pool = EXERCISES.filter((e) => e.subtopicId === selection.subtopicId).sort(
        (a, b) =>
          Math.abs(a.difficulty - selection.difficulty) -
          Math.abs(b.difficulty - selection.difficulty),
      );
      const idx = bankIdx[selection.subtopicId] ?? 0;
      const exercise = pool[idx % pool.length];
      setBankIdx((m) => ({ ...m, [selection.subtopicId]: idx + 1 }));
      setCurrent({ exercise, selection });
    };

    const answer = (optionIndex: number): boolean => {
      if (!current) return false;
      const { exercise } = current;
      const ok = optionIndex === exercise.answerIndex;
      const sub = SUBTOPICS.find((s) => s.id === exercise.subtopicId)!;
      const upd = updateMastery(mastery[sub.id], exercise.difficulty, ok);

      setMastery((m) => ({ ...m, [sub.id]: upd.after }));
      setFails((f) => ({ ...f, [sub.id]: ok ? 0 : f[sub.id] + 1 }));
      setStats((s) => {
        const xp = s.xp + (ok ? 10 * exercise.difficulty : 2);
        return {
          done: s.done + 1,
          correct: s.correct + (ok ? 1 : 0),
          streak: ok ? s.streak + 1 : 0,
          xp,
          level: 1 + Math.floor(xp / 100),
        };
      });
      setRoute((r) => [
        {
          key: Date.now(),
          ok,
          subtopicName: sub.name,
          reason: current.selection.reason,
          before: upd.before,
          after: upd.after,
        },
        ...r,
      ]);
      return ok;
    };

    return { mastery, fails, stats, route, current, next, answer };
  }, [mastery, fails, bankIdx, stats, route, current]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePractice(): PracticeApi {
  const api = useContext(Ctx);
  if (!api) throw new Error('usePractice debe usarse dentro de <PracticeProvider>');
  return api;
}
