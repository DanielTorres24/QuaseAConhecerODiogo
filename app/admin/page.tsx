"use client";

import { useEffect, useMemo, useState } from 'react';

const ADMIN_ROUTE = '/admin';

type ParticipantRow = {
  id: number;
  name: string;
  relationship: string | null;
  createdAt: string;
  responses: Array<{ questionKey: string; questionText: string; answer: string }>;
};

export default function AdminPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('diogo2026');
  const [token, setToken] = useState<string | null>(null);
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
    setError('');
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
  };

  useEffect(() => {
    if (!token) return;

    const loadParticipants = async () => {
      setIsLoading(true);
      const response = await fetch('/api/admin/participants', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Erro ao carregar participantes.');
        setIsLoading(false);
        return;
      }

      setParticipants(data.participants || []);
      setIsLoading(false);
    };

    loadParticipants();
  }, [token]);

  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants;

    return participants.filter((participant) =>
      participant.name.toLowerCase().includes(search.toLowerCase()) ||
      (participant.relationship || '').toLowerCase().includes(search.toLowerCase()),
    );
  }, [participants, search]);

  const exportCsv = () => {
    if (!participants.length) return;

    const rows = participants.flatMap((participant) => {
      const answers = participant.responses.map((response) => [
        participant.name,
        participant.relationship || '',
        response.questionKey,
        response.questionText,
        response.answer,
      ]);

      return answers.length ? answers : [[participant.name, participant.relationship || '', '', '', '']];
    });

    const headers = ['participant_name', 'relationship', 'question_key', 'question', 'answer'];
    const csv = [headers, ...rows].map((record) => record.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diogo-baby-shower-respostas.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!token) {
    return (
      <main style={{ maxWidth: 420, margin: '80px auto', padding: 24, borderRadius: 24, background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
        <h1 style={{ marginBottom: 18 }}>Administração</h1>
        <label style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <span>Utilizador</span>
          <input value={username} onChange={(event) => setUsername(event.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid #e3d9f4' }} />
        </label>
        <label style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
          <span>Senha</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} style={{ padding: 12, borderRadius: 12, border: '1px solid #e3d9f4' }} />
        </label>
        <button onClick={login} style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #c88de7 0%, #8d82ef 100%)', color: '#fff', fontWeight: 700 }}>
          Entrar
        </button>
        {error && <p style={{ color: '#b73333', marginTop: 16 }}>{error}</p>}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: '40px auto', padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1>Respostas do baby shower</h1>
          <p style={{ color: '#625c76' }}>{participants.length} participantes registados</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar participante"
            style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #e3d9f4', minWidth: 220 }}
          />
          <button onClick={exportCsv} style={{ padding: '12px 18px', borderRadius: 12, border: 'none', background: '#2a1a35', color: '#fff', fontWeight: 700 }}>
            Exportar CSV
          </button>
        </div>
      </div>

      {isLoading ? <p>A carregar...</p> : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filteredParticipants.map((participant) => (
            <article key={participant.id} style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 10px 24px rgba(45, 29, 66, 0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0 }}>{participant.name}</h2>
                  <p style={{ margin: '6px 0 0', color: '#66617c' }}>{participant.relationship || 'Sem relação definida'}</p>
                </div>
                <span style={{ background: '#f3ebff', color: '#5c3d7d', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 700 }}>
                  {new Date(participant.createdAt).toLocaleString('pt-PT')}
                </span>
              </div>

              <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
                {participant.responses.map((response) => (
                  <div key={`${participant.id}-${response.questionKey}`} style={{ borderTop: '1px solid #f1eaf7', paddingTop: 10 }}>
                    <strong style={{ display: 'block', marginBottom: 4 }}>{response.questionText}</strong>
                    <span style={{ color: '#534a64' }}>{response.answer || 'Sem resposta'}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
