"use client";

import { useMemo, useState } from 'react';
import styles from './page.module.css';
import StatsPanel from './StatsPanel';
import {
  allQuestions,
  bonusQuestions,
  coreQuestions,
  getInitialAnswerState,
  isOtherOption,
  quizSections,
  resolveAnswer,
  type QuestionDefinition,
  type QuizSection,
} from '@/lib/quiz';

type Phase = 'name' | 'quiz' | 'done';

/**
 * Larguras proporcionais ao recorte real de cada boneco, para que a altura
 * seja comum e nenhum apareca esticado ou cortado.
 */
const CLOTHESLINE = [
  { src: '/convite/sapatinhos.png', width: 70 },
  { src: '/convite/gorro.png', width: 52 },
  { src: '/convite/body.png', width: 68 },
  { src: '/convite/coelho.png', width: 45 },
];

function Clothesline() {
  return (
    <div className={styles.clothesline}>
      {CLOTHESLINE.map((item) => (
        <span
          key={item.src}
          className={styles.clotheslineItem}
          style={{ backgroundImage: `url(${item.src})`, width: item.width }}
        />
      ))}
    </div>
  );
}

/** Agrupa uma lista de perguntas pelas seccoes a que pertencem. */
function groupBySection(questions: QuestionDefinition[]) {
  return quizSections
    .map((section) => ({
      section,
      questions: questions.filter((question) => question.section === section.id),
    }))
    .filter((group) => group.questions.length > 0);
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('name');
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(getInitialAnswerState);
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [showBonus, setShowBonus] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const coreGroups = useMemo(() => groupBySection(coreQuestions), []);
  const bonusGroups = useMemo(() => groupBySection(bonusQuestions), []);

  const answeredCore = coreQuestions.filter((question) => (answers[question.key] ?? '').trim() !== '').length;
  const progress = (answeredCore / coreQuestions.length) * 100;

  const setAnswer = (key: string, value: string) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
  };

  const startQuiz = async () => {
    const trimmed = name.trim();

    if (!trimmed) {
      setError('Parece que ainda faltou o teu nome.');
      return;
    }

    setIsChecking(true);
    setError('');

    try {
      const response = await fetch(`/api/check-name?name=${encodeURIComponent(trimmed)}`);
      const data = await response.json();

      if (!data.available) {
        setError(data.error || 'Este nome já foi usado. Escolhe outro (ou acrescenta o apelido).');
        setIsChecking(false);
        return;
      }
    } catch {
      setError('Não foi possível verificar o nome. Verifica a ligação e tenta outra vez.');
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
    setPhase('quiz');
  };

  const submit = async () => {
    setIsSubmitting(true);
    setError('');

    const payload = Object.fromEntries(
      allQuestions.map((question) => [
        question.key,
        resolveAnswer(answers[question.key] ?? '', otherTexts[question.key] ?? ''),
      ]),
    );

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, answers: payload }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'O palpite não pôde ser guardado.');
        setIsSubmitting(false);
        return;
      }

      window.scrollTo({ top: 0 });
      setPhase('done');
    } catch {
      setError('Não foi possível ligar ao servidor. Verifica a ligação e tenta outra vez.');
    }

    setIsSubmitting(false);
  };

  /** Uma pergunta: etiqueta + campo. Sem transicoes, tudo visivel de uma vez. */
  const renderQuestion = (question: QuestionDefinition) => {
    const value = answers[question.key] ?? '';
    const showOther = question.type === 'select' && isOtherOption(value);
    const fieldId = `q-${question.key}`;

    return (
      <div className={styles.questionBlock} key={question.key}>
        <label className={styles.questionLabel} htmlFor={fieldId}>
          {question.label}
        </label>

        {question.type === 'select' && (
          <select
            id={fieldId}
            className={styles.field}
            value={value}
            onChange={(event) => setAnswer(question.key, event.target.value)}
          >
            <option value="">Escolhe uma opção…</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        )}

        {showOther && (
          <input
            className={styles.field}
            value={otherTexts[question.key] ?? ''}
            onChange={(event) =>
              setOtherTexts((previous) => ({ ...previous, [question.key]: event.target.value }))
            }
            placeholder="Então diz-nos qual…"
            aria-label="Escreve a tua resposta"
          />
        )}

        {(question.type === 'text' ||
          question.type === 'date' ||
          question.type === 'time' ||
          question.type === 'number') && (
          <input
            id={fieldId}
            className={styles.field}
            type={question.type}
            value={value}
            onChange={(event) => setAnswer(question.key, event.target.value)}
            placeholder={
              question.type === 'text' || question.type === 'number' ? question.placeholder : undefined
            }
            min={question.type === 'number' ? question.min : undefined}
            max={question.type === 'number' ? question.max : undefined}
            step={question.type === 'number' ? question.step : undefined}
            inputMode={question.type === 'number' ? 'decimal' : undefined}
          />
        )}

        {question.type === 'textarea' && (
          <textarea
            id={fieldId}
            className={`${styles.field} ${styles.textarea}`}
            value={value}
            onChange={(event) => setAnswer(question.key, event.target.value)}
            placeholder={question.placeholder}
          />
        )}
      </div>
    );
  };

  const renderGroup = (group: { section: QuizSection; questions: QuestionDefinition[] }) => (
    <section className={styles.group} key={group.section.id}>
      <div className={styles.sectionHead}>
        <span className={styles.sectionIcon} style={{ backgroundImage: `url(${group.section.icon})` }} />
        <div className={styles.sectionMeta}>
          <span className={styles.sectionName}>{group.section.title}</span>
          <span className={styles.sectionSubtitle}>{group.section.subtitle}</span>
        </div>
      </div>

      <div className={styles.dotted} />

      {group.questions.map(renderQuestion)}
    </section>
  );

  /* ------------------------------------------------------------------ */
  /* Ecra final                                                          */
  /* ------------------------------------------------------------------ */

  if (phase === 'done') {
    const myAnswers = Object.fromEntries(
      allQuestions.map((question) => [
        question.key,
        resolveAnswer(answers[question.key] ?? '', otherTexts[question.key] ?? ''),
      ]),
    );

    return (
      <div className={styles.pageShell}>
        <div className={styles.successCard}>
          <Clothesline />
          <h1 className={styles.successTitle}>Palpite registado! 🔮</h1>
          <p className={styles.successText}>
            Obrigado por ajudares a prever o Diogo! Agora só falta esperar para descobrir quem é
            realmente o Nostradamus da família e dos amigos. 👶🏻✨
          </p>

          <StatsPanel myAnswers={myAnswers} />
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Ecra inicial (nome)                                                 */
  /* ------------------------------------------------------------------ */

  if (phase === 'name') {
    return (
      <div className={styles.pageShell}>
        <div className={styles.card}>
          <div className={styles.hero}>
            <span className={styles.heroBadge}>Baby Shower</span>
            <h1 className={styles.heroTitle}>Antes de Conhecermos o Diogo…</h1>
            <p className={styles.heroText}>
              Data, peso, parecenças, feitio e muito mais. Deixa o teu palpite e vamos descobrir
              quem conhece melhor o Diogo antes de ele chegar.
            </p>
            <Clothesline />
          </div>

          <div className={styles.questionBlock}>
            <label className={styles.fieldLabel} htmlFor="participant-name">
              Como te chamas?
            </label>
            <input
              id="participant-name"
              className={styles.field}
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void startQuiz();
              }}
              placeholder="O teu nome"
              autoComplete="name"
              enterKeyHint="go"
            />
            <p className={styles.hint}>
              Só podes responder uma vez, por isso escreve o nome pelo qual toda a gente te conhece.
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
            onClick={startQuiz}
            disabled={isChecking}
          >
            {isChecking ? 'A verificar…' : 'Começar a dar palpites'}
          </button>

          <p className={styles.hint}>
            São {coreQuestions.length} perguntas e podes deixar em branco as que quiseres.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Todas as perguntas numa so pagina                                   */
  /* ------------------------------------------------------------------ */

  return (
    <div className={styles.pageShell}>
      <div className={styles.stickyBar}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.progressLabel}>
          {answeredCore}/{coreQuestions.length}
        </span>
      </div>

      <div className={styles.card}>
        <p className={styles.formIntro}>
          Olá, <strong>{name.trim()}</strong>! Responde ao teu ritmo — o que não souberes, deixa em
          branco.
        </p>

        {coreGroups.map(renderGroup)}

        <div className={styles.bonusBox}>
          {showBonus ? (
            <>
              <p className={styles.bonusIntro}>
                Boa! Mais {bonusQuestions.length} para quem está mesmo inspirado. 👇
              </p>
              {bonusGroups.map(renderGroup)}
            </>
          ) : (
            <button
              type="button"
              className={`${styles.btn} ${styles.btnGhost} ${styles.btnWide}`}
              onClick={() => setShowBonus(true)}
            >
              + Quero {bonusQuestions.length} perguntas extra (opcional)
            </button>
          )}
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
          onClick={submit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'A guardar…' : 'Guardar o meu palpite'}
        </button>
      </div>
    </div>
  );
}
