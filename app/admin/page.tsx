"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import shell from '../page.module.css';
import styles from './admin.module.css';

type ParticipantRow = {
  id: number;
  name: string;
  relationship: string | null;
  createdAt: string;
  responses: Array<{ questionKey: string; questionText: string; answer: string }>;
};

/** O que a janela de confirmacao esta prestes a apagar. */
type PendingDeletion =
  | { kind: 'all' }
  | { kind: 'one'; id: number; name: string };

export default function AdminPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pending, setPending] = useState<PendingDeletion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const login = async () => {
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao iniciar sessão.');
        return;
      }

      setToken(data.token);
    } catch {
      setError('Não foi possível ligar ao servidor.');
    }
  };

  const loadParticipants = useCallback(async (activeToken: string) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/participants', {
        headers: { Authorization: `Bearer ${activeToken}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Erro ao carregar participantes.');
        setParticipants([]);
      } else {
        setParticipants(data.participants || []);
      }
    } catch {
      setError('Não foi possível carregar os participantes.');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (token) void loadParticipants(token);
  }, [token, loadParticipants]);

  const confirmDeletion = async () => {
    if (!pending || !token) return;

    setIsDeleting(true);
    setError('');

    const url =
      pending.kind === 'all' ? '/api/admin/participants' : `/api/admin/participants/${pending.id}`;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Não foi possível apagar.');
        setIsDeleting(false);
        setPending(null);
        return;
      }

      setPending(null);
      setIsDeleting(false);
      await loadParticipants(token);
    } catch {
      setError('Não foi possível ligar ao servidor.');
      setIsDeleting(false);
      setPending(null);
    }
  };

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants;

    const needle = search.toLowerCase();
    return participants.filter((participant) => participant.name.toLowerCase().includes(needle));
  }, [participants, search]);

  const exportCsv = () => {
    if (!participants.length) return;

    const rows = participants.flatMap((participant) => {
      const answers = participant.responses.map((response) => [
        participant.name,
        response.questionKey,
        response.questionText,
        response.answer,
      ]);

      return answers.length ? answers : [[participant.name, '', '', '']];
    });

    const headers = ['participante', 'chave', 'pergunta', 'resposta'];
    const csv = [headers, ...rows]
      .map((record) => record.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // BOM para o Excel abrir os acentos correctamente.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diogo-baby-shower-respostas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  /* ------------------------------------------------------------------ */
  /* Autenticacao                                                        */
  /* ------------------------------------------------------------------ */

  if (!token) {
    return (
      <div className={shell.pageShell}>
        <div className={shell.card} style={{ maxWidth: 420, marginTop: '10vh' }}>
          <h1 className={styles.title}>Administração</h1>

          <div className={shell.questionBlock}>
            <label className={shell.fieldLabel} htmlFor="admin-user">
              Utilizador
            </label>
            <input
              id="admin-user"
              className={shell.field}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </div>

          <div className={shell.questionBlock}>
            <label className={shell.fieldLabel} htmlFor="admin-pass">
              Senha
            </label>
            <input
              id="admin-pass"
              className={shell.field}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void login();
              }}
              autoComplete="current-password"
            />
          </div>

          {error && <p className={shell.error}>{error}</p>}

          <button type="button" className={`${shell.btn} ${shell.btnPrimary} ${shell.btnWide}`} onClick={login}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Lista de respostas                                                  */
  /* ------------------------------------------------------------------ */

  return (
    <div className={shell.pageShell}>
      <div className={`${shell.card} ${styles.wide}`}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.title}>Respostas do baby shower</h1>
            <p className={styles.count}>
              {participants.length}
              {participants.length === 1 ? ' participante registado' : ' participantes registados'}
            </p>
          </div>
        </div>

        <div className={styles.toolbar}>
          <input
            className={`${shell.field} ${styles.search}`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar participante"
          />
          <button
            type="button"
            className={`${shell.btn} ${shell.btnGhost} ${styles.btnSmall}`}
            onClick={exportCsv}
            disabled={!participants.length}
          >
            Exportar CSV
          </button>
          <button
            type="button"
            className={`${shell.btn} ${shell.btnDanger} ${styles.btnSmall}`}
            onClick={() => setPending({ kind: 'all' })}
            disabled={!participants.length}
          >
            Limpar base de dados
          </button>
        </div>

        {error && <p className={shell.error}>{error}</p>}

        {isLoading ? (
          <p className={styles.empty}>A carregar…</p>
        ) : filteredParticipants.length === 0 ? (
          <p className={styles.empty}>
            {participants.length === 0
              ? 'Ainda não há palpites registados.'
              : 'Nenhum participante corresponde à pesquisa.'}
          </p>
        ) : (
          <div className={styles.list}>
            {filteredParticipants.map((participant) => {
              const answered = participant.responses.filter((response) => response.answer.trim() !== '');

              return (
                <article key={participant.id} className={styles.person}>
                  <div className={styles.personHead}>
                    <div>
                      <div className={styles.personName}>{participant.name}</div>
                      <span className={styles.personDate}>
                        {new Date(participant.createdAt).toLocaleString('pt-PT')} · {answered.length}{' '}
                        {answered.length === 1 ? 'resposta' : 'respostas'}
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`${shell.btn} ${shell.btnDanger} ${styles.btnSmall}`}
                      onClick={() => setPending({ kind: 'one', id: participant.id, name: participant.name })}
                    >
                      Remover
                    </button>
                  </div>

                  <div className={styles.answers}>
                    {answered.map((response) => (
                      <div key={`${participant.id}-${response.questionKey}`} className={styles.answer}>
                        <strong className={styles.answerQuestion}>{response.questionText}</strong>
                        <span className={styles.answerValue}>{response.answer}</span>
                      </div>
                    ))}
                    {answered.length === 0 && (
                      <p className={styles.answerValue}>Não respondeu a nenhuma pergunta.</p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmacao: o clique anterior so abriu isto, nada foi apagado ainda. */}
      {pending && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isDeleting) setPending(null);
          }}
        >
          <div className={styles.modal}>
            <h2 id="confirm-title" className={styles.modalTitle}>
              {pending.kind === 'all' ? 'Apagar tudo?' : 'Remover este palpite?'}
            </h2>

            {pending.kind === 'all' ? (
              <>
                <p className={styles.modalText}>
                  {participants.length === 1 ? (
                    <>
                      Isto apaga <strong>o único participante</strong> e todas as respostas dele.
                    </>
                  ) : (
                    <>
                      Isto apaga os <strong>{participants.length}</strong> participantes e todas as
                      respostas.
                    </>
                  )}
                </p>
                <p className={styles.modalWarning}>
                  Não há forma de recuperar. Se quiseres uma cópia, cancela e exporta o CSV primeiro.
                </p>
              </>
            ) : (
              <p className={styles.modalText}>
                Vais remover o questionário de <strong>{pending.name}</strong>. Depois disto, essa
                pessoa pode voltar a responder com o mesmo nome.
              </p>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={`${shell.btn} ${styles.btnDestructive} ${shell.btnWide}`}
                onClick={confirmDeletion}
                disabled={isDeleting}
              >
                {isDeleting
                  ? 'A apagar…'
                  : pending.kind === 'all'
                    ? 'Sim, apagar tudo'
                    : 'Sim, remover'}
              </button>
              <button
                type="button"
                className={`${shell.btn} ${shell.btnGhost} ${shell.btnWide}`}
                onClick={() => setPending(null)}
                disabled={isDeleting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
