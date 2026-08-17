"use client";

import { useState } from 'react';
import styles from './page.module.css';
import StatsPanel from './StatsPanel';
import {
  allQuestions,
  getInitialAnswerState,
  getSection,
  isOtherOption,
  resolveAnswer,
  type QuestionDefinition,
} from '@/lib/quiz';

type Phase = 'name' | 'quiz' | 'done';

/**
 * Fila de bonecos do cabecalho. O `ratio` e a proporcao real de cada PNG
 * (largura/altura): o CSS fixa uma altura fluida e deriva a largura daqui,
 * por isso nenhum aparece esticado nem cortado, em qualquer ecra.
 */
const BONECOS = [
  { src: '/icons/sapatilhas.png', ratio: 357 / 360, alt: 'Sapatilhas de bebé' },
  { src: '/icons/bone.png', ratio: 360 / 284, alt: 'Boné de ganga' },
  { src: '/icons/body.png', ratio: 326 / 360, alt: 'Body com uma estrela' },
  { src: '/icons/laco.png', ratio: 360 / 197, alt: 'Laço azul' },
  { src: '/icons/coelho.png', ratio: 273 / 360, alt: 'Coelho de peluche' },
];

function Bonecos() {
  return (
    <div className={styles.clothesline}>
      {BONECOS.map((item) => (
        <span
          key={item.src}
          role="img"
          aria-label={item.alt}
          className={styles.clotheslineItem}
          style={{ backgroundImage: `url(${item.src})`, ['--ratio' as string]: item.ratio }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [phase, setPhase] = useState<Phase>('name');
  const [index, setIndex] = useState(0);
  const [name, setName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>(getInitialAnswerState);
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = allQuestions.length;

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
    setIndex(0);
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

  /** Avanca para a pergunta seguinte, ou submete se esta for a ultima. */
  const avancar = () => {
    setError('');

    if (index + 1 < total) {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
      return;
    }

    void submit();
  };

  const recuar = () => {
    setError('');

    if (index > 0) {
      setIndex(index - 1);
      window.scrollTo({ top: 0 });
      return;
    }

    setPhase('name');
  };

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
          <Bonecos />
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
            <Bonecos />
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
            São {total} perguntas, uma de cada vez. Podes saltar as que não souberes.
          </p>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Uma pergunta de cada vez, da primeira a ultima                      */
  /* ------------------------------------------------------------------ */

  const question: QuestionDefinition = allQuestions[index];
  const section = getSection(question.section);
  const value = answers[question.key] ?? '';
  const showOther = question.type === 'select' && isOtherOption(value);
  const hasAnswer = value.trim() !== '';
  const isLast = index === total - 1;
  const fieldId = `q-${question.key}`;

  /**
   * Escolher uma opcao apenas responde. O avanco e sempre explicito, pelo
   * botao Continuar, para que ninguem passe a pergunta seguinte por engano
   * e possa mudar de ideias antes de seguir.
   */
  const escolher = (option: string) => {
    setError('');
    setAnswer(question.key, option);
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.stickyBar}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} style={{ width: `${((index + 1) / total) * 100}%` }} />
        </div>
        <span className={styles.progressLabel}>
          {index + 1}/{total}
        </span>
      </div>

      <div className={styles.card}>
        {section && (
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon} style={{ backgroundImage: `url(${section.icon})` }} />
            <div className={styles.sectionMeta}>
              <span className={styles.sectionName}>{section.title}</span>
              <span className={styles.sectionSubtitle}>{section.subtitle}</span>
            </div>
          </div>
        )}

        <div className={styles.dotted} />

        <h1 className={styles.questionTitle} id={`${fieldId}-label`}>
          {question.label}
        </h1>

        {question.type === 'select' && (
          <div className={styles.options} role="group" aria-labelledby={`${fieldId}-label`}>
            {question.options.map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.option} ${value === option ? styles.optionSelected : ''}`}
                aria-pressed={value === option}
                onClick={() => escolher(option)}
              >
                <span className={styles.bullet} />
                <span>{option}</span>
              </button>
            ))}
          </div>
        )}

        {showOther && (
          <div className={styles.otherBox}>
            <span className={styles.otherHint}>Boa — então diz-nos qual 👇</span>
            <input
              className={styles.field}
              value={otherTexts[question.key] ?? ''}
              onChange={(event) =>
                setOtherTexts((previous) => ({ ...previous, [question.key]: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') avancar();
              }}
              placeholder="Escreve aqui"
              aria-label="Escreve a tua resposta"
              autoFocus
              enterKeyHint={isLast ? 'done' : 'next'}
            />
          </div>
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
            onKeyDown={(event) => {
              if (event.key === 'Enter') avancar();
            }}
            placeholder={
              question.type === 'text' || question.type === 'number' ? question.placeholder : undefined
            }
            min={question.type === 'number' ? question.min : undefined}
            max={question.type === 'number' ? question.max : undefined}
            step={question.type === 'number' ? question.step : undefined}
            inputMode={question.type === 'number' ? 'decimal' : undefined}
            enterKeyHint={isLast ? 'done' : 'next'}
            autoFocus
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

        {error && <p className={styles.error}>{error}</p>}

{/* Accao principal a toda a largura e sempre no mesmo sitio: e o unico
            caminho para a frente, e nao muda de lugar ao responder. */}
        <div className={styles.nav}>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnWide}`}
            onClick={avancar}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'A guardar…' : isLast ? 'Terminar' : 'Continuar'}
          </button>

          <div className={styles.navSecondary}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={recuar}>
              ← Voltar
            </button>

            {!hasAnswer && (
              <span className={styles.hint}>Podes deixar em branco.</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
