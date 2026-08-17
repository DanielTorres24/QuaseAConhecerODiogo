import { describe, expect, it } from 'vitest';
import { buildStats, type Tally } from './stats';

const tally = (questionKey: string, answer: string, count: number): Tally => ({ questionKey, answer, count });

describe('buildStats', () => {
  it('calcula percentagens e ordena da opção mais votada para a menos', () => {
    const stats = buildStats(
      [
        tally('birthPeriod', 'Madrugada', 1),
        tally('birthPeriod', 'Manhã', 3),
        tally('birthPeriod', 'Tarde', 4),
      ],
      8,
    );

    const birthPeriod = stats.distributions.find((entry) => entry.key === 'birthPeriod');

    expect(birthPeriod?.total).toBe(8);
    expect(birthPeriod?.options.map((option) => option.answer)).toEqual(['Tarde', 'Manhã', 'Madrugada']);
    expect(birthPeriod?.options[0]).toMatchObject({ count: 4, percent: 50 });
  });

  it('faz a média ponderada pelas contagens e aceita vírgula decimal', () => {
    const stats = buildStats([tally('weightKg', '3,00', 3), tally('weightKg', '4.00', 1)], 4);

    // (3*3 + 4*1) / 4 = 3.25
    expect(stats.averages.find((entry) => entry.key === 'weightKg')).toMatchObject({ value: 3.25, count: 4 });
  });

  it('ignora valores fora do intervalo declarado na pergunta', () => {
    // lengthCm aceita 30 a 60: um "3.3" é engano de quem escreveu e não
    // pode arrastar a média para baixo.
    const stats = buildStats([tally('lengthCm', '3.3', 1), tally('lengthCm', '50', 1)], 2);

    expect(stats.averages.find((entry) => entry.key === 'lengthCm')).toMatchObject({ value: 50, count: 1 });
  });

  it('ignora respostas não numéricas nas médias', () => {
    const stats = buildStats([tally('weightKg', 'não sei', 5), tally('weightKg', '3.5', 1)], 6);

    expect(stats.averages.find((entry) => entry.key === 'weightKg')).toMatchObject({ value: 3.5, count: 1 });
  });

  it('ignora respostas em branco', () => {
    const stats = buildStats([tally('birthPeriod', '', 9), tally('birthPeriod', 'Noite', 1)], 10);

    expect(stats.distributions.find((entry) => entry.key === 'birthPeriod')?.total).toBe(1);
  });

  it('escolhe a data mais votada', () => {
    const stats = buildStats(
      [tally('birthDate', '2026-09-19', 2), tally('birthDate', '2026-09-20', 5)],
      7,
    );

    expect(stats.topDate).toMatchObject({ value: '2026-09-20', count: 5 });
  });

  it('devolve listas vazias quando ainda não há respostas', () => {
    const stats = buildStats([], 0);

    expect(stats).toMatchObject({ totalParticipants: 0, averages: [], topDate: null, distributions: [] });
  });
});
