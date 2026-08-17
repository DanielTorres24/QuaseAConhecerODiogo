import { allQuestions } from './quiz';

/**
 * Que perguntas entram no resumo do ecra final. Mantido curto de proposito:
 * o objectivo e a pessoa ver de relance como se compara, nao ler um relatorio.
 */
export const AVERAGE_KEYS = [
  { key: 'weightKg', label: 'Peso médio previsto', unit: 'kg', decimals: 2 },
  { key: 'lengthCm', label: 'Comprimento médio previsto', unit: 'cm', decimals: 0 },
] as const;

export const DATE_KEY = 'birthDate';

export const DISTRIBUTION_KEYS = [
  'birthPeriod',
  'beforeAfter',
  'looksLikeWho',
  'calmOrElectric',
  'whoChangesMost',
] as const;

export type Tally = { questionKey: string; answer: string; count: number };

export type AverageStat = {
  key: string;
  label: string;
  unit: string;
  value: number;
  count: number;
};

export type DateStat = {
  key: string;
  label: string;
  value: string;
  count: number;
};

export type DistributionStat = {
  key: string;
  label: string;
  total: number;
  options: Array<{ answer: string; count: number; percent: number }>;
};

export type StatsPayload = {
  totalParticipants: number;
  averages: AverageStat[];
  topDate: DateStat | null;
  distributions: DistributionStat[];
};

const labelFor = (key: string) => allQuestions.find((question) => question.key === key)?.label ?? key;

/**
 * Intervalo aceitavel para uma pergunta numerica, tal como declarado em
 * lib/quiz.ts. Serve para uma media nao ser destruida por um engano — um
 * comprimento de "3.3" ou um peso de "500" nao entram na conta.
 */
function rangeFor(key: string): { min?: number; max?: number } {
  const question = allQuestions.find((entry) => entry.key === key);
  if (!question || question.type !== 'number') return {};
  return { min: question.min, max: question.max };
}

/**
 * Agrega as contagens vindas da base de dados. Funcao pura, para poder ser
 * testada sem base de dados.
 */
export function buildStats(tallies: Tally[], totalParticipants: number): StatsPayload {
  const byQuestion = new Map<string, Tally[]>();

  for (const tally of tallies) {
    if (!tally.answer.trim()) continue;
    const existing = byQuestion.get(tally.questionKey) ?? [];
    existing.push(tally);
    byQuestion.set(tally.questionKey, existing);
  }

  const averages: AverageStat[] = [];

  for (const spec of AVERAGE_KEYS) {
    const rows = byQuestion.get(spec.key) ?? [];
    const { min, max } = rangeFor(spec.key);
    let sum = 0;
    let count = 0;

    for (const row of rows) {
      // Aceita "3,4" e "3.4"; ignora o que nao for numero.
      const parsed = Number(row.answer.replace(',', '.'));
      if (!Number.isFinite(parsed)) continue;
      if (min !== undefined && parsed < min) continue;
      if (max !== undefined && parsed > max) continue;
      sum += parsed * row.count;
      count += row.count;
    }

    if (count > 0) {
      averages.push({
        key: spec.key,
        label: spec.label,
        unit: spec.unit,
        value: Number((sum / count).toFixed(spec.decimals)),
        count,
      });
    }
  }

  const dateRows = byQuestion.get(DATE_KEY) ?? [];
  const bestDate = [...dateRows].sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer))[0];
  const topDate: DateStat | null = bestDate
    ? { key: DATE_KEY, label: 'Data mais votada', value: bestDate.answer, count: bestDate.count }
    : null;

  const distributions: DistributionStat[] = [];

  for (const key of DISTRIBUTION_KEYS) {
    const rows = byQuestion.get(key) ?? [];
    const total = rows.reduce((accumulator, row) => accumulator + row.count, 0);
    if (total === 0) continue;

    distributions.push({
      key,
      label: labelFor(key),
      total,
      options: [...rows]
        .sort((a, b) => b.count - a.count || a.answer.localeCompare(b.answer))
        .map((row) => ({
          answer: row.answer,
          count: row.count,
          percent: Math.round((row.count / total) * 100),
        })),
    });
  }

  return { totalParticipants, averages, topDate, distributions };
}
