"use client";

import { useEffect, useState } from 'react';
import styles from './page.module.css';
import type { StatsPayload } from '@/lib/stats';

const formatDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' });
};

const formatNumber = (value: number) => value.toString().replace('.', ',');

export default function StatsPanel({ myAnswers }: { myAnswers: Record<string, string> }) {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;

    fetch('/api/stats')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('stats'))))
      .then((data: StatsPayload) => {
        if (alive) setStats(data);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  // O ecra final continua a fazer sentido sem numeros; se falhar, nao mostramos nada.
  if (failed) return null;
  if (!stats) return <p className={styles.hint}>A contar os palpites…</p>;

  const isFirst = stats.totalParticipants <= 1;

  return (
    <section className={styles.stats}>
      <div className={styles.dotted} />

      <p className={styles.statsHero}>
        <strong>{stats.totalParticipants}</strong>
        {stats.totalParticipants === 1 ? ' palpite até agora' : ' palpites até agora'}
      </p>

      {isFirst ? (
        <p className={styles.statsLead}>
          És o primeiro a arriscar! Volta cá mais tarde para veres como os outros palpitaram.
        </p>
      ) : (
        <p className={styles.statsLead}>Isto é o que toda a gente anda a adivinhar.</p>
      )}

      {(stats.averages.length > 0 || stats.topDate) && (
        <div className={styles.tiles}>
          {stats.averages.map((average) => (
            <div className={styles.tile} key={average.key}>
              <span className={styles.tileValue}>
                {formatNumber(average.value)}
                <small> {average.unit}</small>
              </span>
              <span className={styles.tileLabel}>{average.label}</span>
            </div>
          ))}

          {stats.topDate && (
            <div className={styles.tile}>
              <span className={styles.tileValue}>{formatDate(stats.topDate.value)}</span>
              <span className={styles.tileLabel}>
                Data mais votada · {stats.topDate.count}
                {stats.topDate.count === 1 ? ' voto' : ' votos'}
              </span>
            </div>
          )}
        </div>
      )}

      {stats.distributions.map((distribution) => {
        const mine = myAnswers[distribution.key];

        return (
          <div className={styles.distribution} key={distribution.key}>
            <h3 className={styles.distributionTitle}>{distribution.label}</h3>

            {distribution.options.length === 1 ? (
              // Uma barra sozinha a 100% nao e um grafico; e uma frase.
              <p className={styles.unanimous}>
                Toda a gente respondeu <strong>{distribution.options[0].answer}</strong>
                {mine === distribution.options[0].answer ? ' — tu incluído.' : '.'}
              </p>
            ) : (
            <ul className={styles.bars}>
              {distribution.options.map((option) => {
                const isMine = Boolean(mine) && mine === option.answer;

                return (
                  <li key={option.answer} className={styles.barRow}>
                    <div className={styles.barHead}>
                      <span className={styles.barLabel}>{option.answer}</span>
                      {/* A identidade nunca depende so da cor: leva etiqueta. */}
                      {isMine && <span className={styles.barBadge}>o teu palpite</span>}
                      <span className={styles.barValue}>
                        {option.percent}% <span className={styles.barCount}>· {option.count}</span>
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={`${styles.barFill} ${isMine ? styles.barFillMine : ''}`}
                        style={{ width: `${option.percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}
