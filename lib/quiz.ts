export type OptionType = { value: string; label: string };

type BaseQuestion = {
  key: string;
  section: string;
  label: string;
};

type TextQuestion = BaseQuestion & {
  type: 'text';
  placeholder?: string;
};

type TextareaQuestion = BaseQuestion & {
  type: 'textarea';
  placeholder?: string;
};

type DateQuestion = BaseQuestion & {
  type: 'date';
};

type TimeQuestion = BaseQuestion & {
  type: 'time';
};

type NumberQuestion = BaseQuestion & {
  type: 'number';
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
};

type SelectQuestion = BaseQuestion & {
  type: 'select';
  options: string[];
};

export type QuestionDefinition =
  | TextQuestion
  | TextareaQuestion
  | DateQuestion
  | TimeQuestion
  | NumberQuestion
  | SelectQuestion;

export type QuizSection = {
  id: string;
  title: string;
  subtitle: string;
  /** Boneco recortado do icons.png, em /public/icons. */
  icon: string;
  questions: QuestionDefinition[];
};

export const quizSections: QuizSection[] = [
  {
    id: 'birth',
    title: 'Nascimento',
    subtitle: 'Os palpites sobre a chegada do Diogo.',
    icon: '/icons/body.png',
    questions: [
      { key: 'birthDate', section: 'birth', label: 'Em que dia vai nascer o Diogo?', type: 'date' },
      { key: 'birthTime', section: 'birth', label: 'A que horas vai nascer?', type: 'time' },
      { key: 'weightKg', section: 'birth', label: 'Qual vai ser o peso do Diogo?', type: 'number', placeholder: 'Ex.: 3.40', min: 2, max: 5.5, step: 0.1 },
      { key: 'lengthCm', section: 'birth', label: 'Qual vai ser o comprimento do Diogo?', type: 'number', placeholder: 'Ex.: 50', min: 30, max: 60, step: 1 },
      { key: 'beforeAfter', section: 'birth', label: 'Vai nascer antes ou depois da data prevista?', type: 'select', options: ['Antes da data prevista', 'Na data prevista', 'Depois da data prevista'] },
      { key: 'birthPeriod', section: 'birth', label: 'Em que período do dia vai nascer?', type: 'select', options: ['Madrugada', 'Manhã', 'Tarde', 'Noite'] },
      { key: 'firstAction', section: 'birth', label: 'Qual vai ser a primeira coisa que o Diogo vai fazer quando nascer?', type: 'select', options: ['Chorar', 'Dormir', 'Fazer xixi', 'Fazer cocó', 'Ficar muito tranquilo a observar tudo', 'Outra'] },
      { key: 'whoCriesFirst', section: 'birth', label: 'Quem vai chorar primeiro?', type: 'select', options: ['O Diogo', 'A mãe', 'O pai', 'Todos ao mesmo tempo', 'Ninguém (impossível 😂)'] },
    ],
  },
  {
    id: 'looks',
    title: 'A quem é que ele vai sair?',
    subtitle: 'Parecenças, cabelo e traços.',
    icon: '/icons/coelho.png',
    questions: [
      { key: 'hairColor', section: 'looks', label: 'De que cor será o cabelo?', type: 'select', options: ['Loiro', 'Castanho claro', 'Castanho escuro', 'Preto', 'Ruivo', 'Outra'] },
      { key: 'hairAmount', section: 'looks', label: 'O Diogo vai nascer com muito ou pouco cabelo?', type: 'select', options: ['Carequinha', 'Pouco cabelo', 'Quantidade normal', 'Muito cabelo', 'Cabelo digno de anúncio de champô'] },
      { key: 'looksLikeWho', section: 'looks', label: 'De quem será mais parecido fisicamente?', type: 'select', options: ['Mãe', 'Pai', 'Uma mistura perfeita dos dois', 'Vai parecer-se com alguém da família', 'Ainda ninguém vai perceber 😂'] },
    ],
  },
  {
    id: 'personality',
    title: 'Personalidade',
    subtitle: 'Como será o Diogo no dia a dia?',
    icon: '/icons/bone.png',
    questions: [
      { key: 'calmOrElectric', section: 'personality', label: 'Vai ser um bebé calmo ou elétrico?', type: 'select', options: ['Muito calmo', 'Relativamente calmo', 'Meio-termo', 'Elétrico', 'Um pequeno furacão'] },
      { key: 'sleepPattern', section: 'personality', label: 'Vai ser dorminhoco ou madrugador?', type: 'select', options: ['Dorminhoco', 'Madrugador', 'Vai dormir quando lhe apetecer'] },
      { key: 'humorWho', section: 'personality', label: 'Vai ter o sentido de humor de quem?', type: 'select', options: ['Mãe', 'Pai', 'Dos dois', 'De ninguém 😅'] },
      { key: 'stubbornness', section: 'personality', label: 'E a teimosia?', type: 'select', options: ['Claramente da mãe', 'Claramente do pai', '50/50', 'Vai superar os dois'] },
    ],
  },
  {
    id: 'future',
    title: 'Futuro Diogo',
    subtitle: 'Previsões para o future star.',
    icon: '/icons/sapatilhas.png',
    questions: [
      { key: 'firstWord', section: 'future', label: 'Qual vai ser a primeira palavra do Diogo?', type: 'text', placeholder: 'Ex.: “mãmã”' },
      { key: 'favoriteToy', section: 'future', label: 'Qual vai ser o primeiro brinquedo favorito?', type: 'text', placeholder: 'Ex.: ursinho' },
      { key: 'favoriteCharacter', section: 'future', label: 'Qual vai ser o desenho animado/personagem favorito?', type: 'text', placeholder: 'Ex.: Toy Story' },
      { key: 'futureJob', section: 'future', label: 'Qual vai ser a profissão do Diogo quando crescer?', type: 'text', placeholder: 'Ex.: astronauta' },
    ],
  },
  {
    id: 'chaos',
    title: 'O caos 😂',
    subtitle: 'Previsões para a vida real.',
    icon: '/icons/laco.png',
    questions: [
      { key: 'diapersFirstMonth', section: 'chaos', label: 'Quantas fraldas vai gastar no primeiro mês?', type: 'number', placeholder: 'Ex.: 250', step: 1 },
      { key: 'whoChangesMost', section: 'chaos', label: 'Quem vai mudar mais fraldas?', type: 'select', options: ['Mãe', 'Pai', '50/50', 'Quem estiver mais perto 😂'] },
      { key: 'whoWakesMore', section: 'chaos', label: 'Quem vai acordar mais vezes durante a noite?', type: 'select', options: ['Mãe', 'Pai', 'Os dois', 'O Diogo vai tratar de garantir que ninguém dorme'] },
      { key: 'faceChapedTime', section: 'chaos', label: 'Quanto tempo vai demorar até alguém dizer: “É a cara chapada de…”', type: 'select', options: ['Menos de 1 hora', 'No primeiro dia', 'Na primeira semana', 'Nunca vamos chegar a um consenso'] },
    ],
  },
  {
    id: 'family',
    title: 'Família',
    subtitle: 'Quem vai ser o primeiro a mimar?',
    icon: '/icons/body.png',
    questions: [
      { key: 'firstToHold', section: 'family', label: 'Quem vai ser o primeiro familiar a pegar no Diogo?', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'firstToSpoil', section: 'family', label: 'Quem vai ser o primeiro a mimá-lo demasiado?', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'firstBadLesson', section: 'family', label: 'Quem vai ser o primeiro a ensinar-lhe uma asneira?', type: 'text', placeholder: 'Nome da pessoa' },
    ],
  },
  {
    id: 'message',
    title: 'Mensagem para o Diogo',
    subtitle: 'Uma cápsula do tempo.',
    icon: '/icons/coelho.png',
    questions: [
      {
        key: 'futureMessage',
        section: 'message',
        label: 'O que gostarias de dizer ao Diogo quando ele tiver idade suficiente para ler estas respostas?',
        type: 'textarea',
        placeholder: 'Escreve uma mensagem cheia de amor, humor e futuro...',
      },
    ],
  },
];

export const allQuestions: QuestionDefinition[] = quizSections.flatMap((section) => section.questions);

const sectionsById = new Map(quizSections.map((section) => [section.id, section]));

export const getSection = (id: string) => sectionsById.get(id);

export const getInitialAnswerState = () =>
  Object.fromEntries(allQuestions.map((question) => [question.key, '']));

/**
 * Opções que abrem um campo de texto livre ("Outra" / "Outro").
 */
export function isOtherOption(option: string) {
  return /^outr[ao]$/i.test(option.trim());
}

export function questionHasOtherOption(question: QuestionDefinition) {
  return question.type === 'select' && question.options.some(isOtherOption);
}

/**
 * Valor que fica guardado na base de dados. Quando alguém escolhe "Outra" e
 * escreve algo, guardamos o texto escrito em vez da palavra "Outra" — é isso
 * que interessa ver no admin. Sem texto, fica a própria opção.
 */
export function resolveAnswer(selected: string, otherText: string) {
  if (!isOtherOption(selected)) return selected;
  return otherText.trim() || selected;
}

export function normalizeParticipantName(value: string) {
  return value
    .trim()
    .toLowerCase()
    // NFD separa "ã" em "a" + acento; a classe abaixo e o intervalo dos
    // sinais diacriticos combinantes (U+0300 a U+036F), que aparecem no
    // codigo como caracteres literais. Assim "Joao" e "João" colidem.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

export function isNameAllowed(name: string, takenNames: Set<string>) {
  return !takenNames.has(normalizeParticipantName(name));
}
