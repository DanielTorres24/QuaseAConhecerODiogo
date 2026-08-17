"use client";

import { useMemo, useState } from 'react';
import styles from './page.module.css';
import { allQuestions, getInitialAnswerState, quizSections } from '@/lib/quiz';

export default function HomePage() {
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(() => getInitialAnswerState());
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message?: string }>({ type: 'idle' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameCheckState, setNameCheckState] = useState<{ loading: boolean; available: boolean | null }>({ loading: false, available: null });

  const currentSection = quizSections[stepIndex - 1] ?? null;
  const progress = ((stepIndex + 1) / (quizSections.length + 1)) * 100;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value && String(value).trim() !== '').length,
    [answers],
  );

  const updateAnswer = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const validateName = async () => {
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Parece que ainda faltou o teu nome.' });
      return false;
    }

    setNameCheckState({ loading: true, available: null });
    const response = await fetch(`/api/check-name?name=${encodeURIComponent(name)}`);
    const data = await response.json();
    setNameCheckState({ loading: false, available: data.available });

    if (!data.available) {
      setStatus({ type: 'error', message: data.error || 'Este nome já foi usado. Escolha outro.' });
      return false;
    }

    return true;
  };

  const nextStep = async () => {
    if (stepIndex === 0) {
      const valid = await validateName();
      if (!valid) return;
    }

    if (stepIndex < quizSections.length) {
      setStepIndex((current) => current + 1);
      setStatus({ type: 'idle' });
    }
  };

  const prevStep = () => {
    if (stepIndex > 0) {
      setStepIndex((current) => current - 1);
      setStatus({ type: 'idle' });
    }
  };

  const submitQuiz = async () => {
    if (!name.trim()) {
      setStatus({ type: 'error', message: 'Parece que ainda faltou o teu nome.' });
      setStepIndex(0);
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle' });

    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, relationship, answers }),
    });

    const data = await response.json();
    setIsSubmitting(false);

    if (!response.ok) {
      setStatus({ type: 'error', message: data.error || 'O palpite não pôde ser guardado.' });
      return;
    }

    setStepIndex(quizSections.length + 1);
    setStatus({ type: 'success', message: 'Palpite registado! 🔮' });
  };

  if (stepIndex >= quizSections.length + 1) {
    return (
      <div className={styles.pageShell}>
        <div className={styles.successCard}>
          <p className={styles.kicker}>Palpite registado</p>
          <h1>“Palpite registado! 🔮”</h1>
          <p>
            Obrigado por ajudares a prever o Diogo! Agora só falta esperar para descobrir quem é realmente o Nostradamus da família e dos amigos. 👶🏻✨
          </p>
          <p>
            E, um dia, o Diogo poderá ler tudo aquilo que imaginávamos sobre ele antes de o conhecermos.
          </p>
        </div>
      </div>
    );
  }

  const isFinalReview = stepIndex === quizSections.length;

  return (
    <div className={styles.pageShell}>
      <div className={styles.appCard}>
        <header className={styles.header}>
          <div className={styles.badge}>Baby Shower</div>
          <h1>Antes de Conhecermos o Diogo…</h1>
          <p>
            Data, peso, altura, feitio, parecenças e muito mais. Deixa o teu palpite e vamos descobrir quem conhece melhor o Diogo antes de ele chegar.
          </p>
          <div className={styles.progressWrap}>
            <div className={styles.progressBar} style={{ width: `${progress}%` }} />
          </div>
        </header>

        <main className={styles.formSection}>
          {stepIndex === 0 && (
            <section className={styles.formPanel}>
              <div className={styles.sectionIntro}>
                <span className={styles.sectionNumber}>1</span>
                <div>
                  <h2>Bem-vindo!</h2>
                  <p>Antes de começares, diz-nos quem és.</p>
                </div>
              </div>

              <label className={styles.inputGroup}>
                <span>Nome</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Escreve o teu nome"
                  required
                />
              </label>

              {nameCheckState.available === false && (
                <div className={`${styles.alert} ${styles.error}`}>Este nome já foi usado. Escolha outro.</div>
              )}
            </section>
          )}

          {stepIndex > 0 && stepIndex < quizSections.length && currentSection && (
            <section className={styles.formPanel}>
              <div className={styles.sectionIntro}>
                <span className={styles.sectionNumber}>{stepIndex}</span>
                <div>
                  <h2>{currentSection.title}</h2>
                  <p>{currentSection.subtitle}</p>
                </div>
              </div>

              <div className={styles.questionList}>
                {currentSection.questions.map((question) => (
                  <div key={question.key} className={styles.questionBlock}>
                    <label className={styles.questionLabel}>{question.label}</label>

                    {question.type === 'text' && (
                      <input
                        type="text"
                        value={answers[question.key] || ''}
                        onChange={(event) => updateAnswer(question.key, event.target.value)}
                        placeholder={question.placeholder || ''}
                      />
                    )}

                    {question.type === 'textarea' && (
                      <textarea
                        value={answers[question.key] || ''}
                        onChange={(event) => updateAnswer(question.key, event.target.value)}
                        placeholder={question.placeholder || ''}
                        rows={5}
                      />
                    )}

                    {question.type === 'date' && (
                      <input
                        type="date"
                        value={answers[question.key] || ''}
                        onChange={(event) => updateAnswer(question.key, event.target.value)}
                      />
                    )}

                    {question.type === 'time' && (
                      <input
                        type="time"
                        value={answers[question.key] || ''}
                        onChange={(event) => updateAnswer(question.key, event.target.value)}
                      />
                    )}

                    {question.type === 'number' && (
                      <input
                        type="number"
                        min={question.min}
                        max={question.max}
                        step={question.step}
                        value={answers[question.key] || ''}
                        onChange={(event) => updateAnswer(question.key, event.target.value)}
                        placeholder={question.placeholder || ''}
                      />
                    )}

                    {question.type === 'select' && (
                      <select
                        value={answers[question.key] || ''}
                        onChange={(event) => updateAnswer(question.key, event.target.value)}
                      >
                        <option value="">Escolhe uma opção</option>
                        {question.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {isFinalReview && (
            <section className={styles.formPanel}>
              <div className={styles.sectionIntro}>
                <span className={styles.sectionNumber}>10</span>
                <div>
                  <h2>Quase a conhecer o Diogo…</h2>
                  <p>Revisa o teu palpite antes de guardar.</p>
                </div>
              </div>

              <div className={styles.summaryList}>
                <div className={styles.summaryRow}><strong>Nome:</strong> {name}</div>
                <div className={styles.summaryRow}><strong>Quem és:</strong> {relationship || 'Não indicado'}</div>
                {allQuestions.map((question) => (
                  <div key={question.key} className={styles.summaryRow}>
                    <strong>{question.label}:</strong> {answers[question.key] || 'Sem resposta'}
                  </div>
                ))}
              </div>
            </section>
          )}

          {status.type !== 'idle' && (
            <div className={`${styles.alert} ${status.type === 'error' ? styles.error : styles.success}`}>
              {status.message}
            </div>
          )}

          <div className={styles.actions}>
            {stepIndex > 0 && (
              <button type="button" className={styles.secondaryButton} onClick={prevStep}>
                Voltar
              </button>
            )}

            {stepIndex === 0 && (
              <button type="button" className={styles.primaryButton} onClick={nextStep} disabled={!name.trim() || nameCheckState.loading}>
                {nameCheckState.loading ? 'A verificar...' : 'Começar a dar palpites'}
              </button>
            )}

            {stepIndex > 0 && stepIndex < quizSections.length && (
              <button type="button" className={styles.primaryButton} onClick={nextStep}>
                Seguinte
              </button>
            )}

            {isFinalReview && (
              <button type="button" className={styles.primaryButton} onClick={submitQuiz} disabled={isSubmitting}>
                {isSubmitting ? 'A guardar...' : 'Enviar palpite'}
              </button>
            )}
          </div>
        </main>

        <footer className={styles.footer}>
          <span>{answeredCount} respostas preenchidas</span>
          <span>{Math.min(stepIndex + 1, quizSections.length + 1)}/{quizSections.length + 1}</span>
        </footer>
      </div>
    </div>
  );
}
