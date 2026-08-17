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

type QuizSection = {
  id: string;
  title: string;
  subtitle: string;
  questions: QuestionDefinition[];
};

export const quizSections: QuizSection[] = [
  {
    id: 'about',
    title: 'Sobre ti',
    subtitle: 'Diz-nos quem estás a tentar surpreender.',
    questions: [
      {
        key: 'relationship',
        section: 'about',
        label: 'Quem és para o Diogo?',
        type: 'select',
        options: ['Família', 'Amigo/a da mãe', 'Amigo/a do pai', 'Colega', 'Outro'],
      },
    ],
  },
  {
    id: 'birth',
    title: 'Nascimento',
    subtitle: 'Os palpites sobre a chegada do Diogo.',
    questions: [
      { key: 'birthDate', section: 'birth', label: 'Em que dia vai nascer o Diogo?', type: 'date' },
      { key: 'birthTime', section: 'birth', label: 'A que horas vai nascer?', type: 'time' },
      { key: 'weightKg', section: 'birth', label: 'Qual vai ser o peso do Diogo?', type: 'number', placeholder: 'Ex.: 3.40', min: 2, max: 5.5, step: 0.1 },
      { key: 'lengthCm', section: 'birth', label: 'Qual vai ser o comprimento do Diogo?', type: 'number', placeholder: 'Ex.: 50', min: 30, max: 60, step: 1 },
      { key: 'beforeAfter', section: 'birth', label: 'Vai nascer antes ou depois da data prevista?', type: 'select', options: ['Antes da data prevista', 'Na data prevista', 'Depois da data prevista'] },
      { key: 'daysDifference', section: 'birth', label: 'Quantos dias antes/depois da data prevista vai nascer?', type: 'number', placeholder: 'Ex.: -3 ou +4', step: 1 },
      { key: 'birthPeriod', section: 'birth', label: 'Em que período do dia vai nascer?', type: 'select', options: ['Madrugada', 'Manhã', 'Tarde', 'Noite'] },
      { key: 'zodiacSign', section: 'birth', label: 'Qual vai ser o signo do Diogo?', type: 'select', options: ['Capricórnio', 'Aquário', 'Peixes', 'Carneiro', 'Touro', 'Gémeos', 'Caranguejo', 'Leão', 'Virgem', 'Libra', 'Escorpião', 'Sagitário'] },
      { key: 'firstAction', section: 'birth', label: 'Qual vai ser a primeira coisa que o Diogo vai fazer quando nascer?', type: 'select', options: ['Chorar', 'Dormir', 'Fazer xixi', 'Fazer cocó', 'Ficar muito tranquilo a observar tudo', 'Outra'] },
      { key: 'whoCriesFirst', section: 'birth', label: 'Quem vai chorar primeiro?', type: 'select', options: ['O Diogo', 'A mãe', 'O pai', 'Todos ao mesmo tempo', 'Ninguém (impossível 😂)'] },
    ],
  },
  {
    id: 'looks',
    title: 'A quem é que ele vai sair?',
    subtitle: 'Pareceços, cabelo e traços.',
    questions: [
      { key: 'eyesFrom', section: 'looks', label: 'Vai ter os olhos de quem?', type: 'select', options: ['Mãe', 'Pai', '50/50', 'Não faço ideia'] },
      { key: 'noseFrom', section: 'looks', label: 'Vai ter o nariz de quem?', type: 'select', options: ['Mãe', 'Pai', '50/50', 'Não faço ideia'] },
      { key: 'mouthFrom', section: 'looks', label: 'Vai ter a boca de quem?', type: 'select', options: ['Mãe', 'Pai', '50/50', 'Não faço ideia'] },
      { key: 'hairFrom', section: 'looks', label: 'Vai ter o cabelo de quem?', type: 'select', options: ['Mãe', 'Pai', '50/50', 'Não faço ideia'] },
      { key: 'hairColor', section: 'looks', label: 'De que cor será o cabelo?', type: 'select', options: ['Loiro', 'Castanho claro', 'Castanho escuro', 'Preto', 'Ruivo', 'Outra'] },
      { key: 'hairAmount', section: 'looks', label: 'O Diogo vai nascer com muito ou pouco cabelo?', type: 'select', options: ['Carequinha', 'Pouco cabelo', 'Quantidade normal', 'Muito cabelo', 'Cabelo digno de anúncio de champô'] },
      { key: 'looksLikeWho', section: 'looks', label: 'De quem será mais parecido fisicamente?', type: 'select', options: ['Mãe', 'Pai', 'Uma mistura perfeita dos dois', 'Vai parecer-se com alguém da família', 'Ainda ninguém vai perceber 😂'] },
    ],
  },
  {
    id: 'personality',
    title: 'Personalidade',
    subtitle: 'Como será o Diogo no dia a dia?',
    questions: [
      { key: 'calmOrElectric', section: 'personality', label: 'Vai ser um bebé calmo ou elétrico?', type: 'select', options: ['Muito calmo', 'Relativamente calmo', 'Meio-termo', 'Elétrico', 'Um pequeno furacão'] },
      { key: 'sleepPattern', section: 'personality', label: 'Vai ser dorminhoco ou madrugador?', type: 'select', options: ['Dorminhoco', 'Madrugador', 'Vai dormir quando lhe apetecer'] },
      { key: 'eatingStyle', section: 'personality', label: 'Vai ser comilão ou esquisitinho?', type: 'select', options: ['Comilão', 'Bom garfo', 'Esquisitinho', 'Só vai comer o que lhe apetecer'] },
      { key: 'smileStyle', section: 'personality', label: 'Vai ser sorridente ou sério?', type: 'select', options: ['Vai estar sempre a sorrir', 'Maioritariamente sorridente', 'Meio-termo', 'Muito sério', 'Vai julgar toda a gente em silêncio 😂'] },
      { key: 'talker', section: 'personality', label: 'Vai ser falador ou observador?', type: 'select', options: ['Muito falador', 'Falador', 'Observador', 'Muito observador', 'Só vai falar quando lhe interessar'] },
      { key: 'adventurous', section: 'personality', label: 'Vai ser aventureiro ou caseiro?', type: 'select', options: ['Aventureiro', 'Gosta de sair, mas também gosta de casa', 'Caseiro', 'Não vai querer sair do colo'] },
      { key: 'humorWho', section: 'personality', label: 'Vai ter o sentido de humor de quem?', type: 'select', options: ['Mãe', 'Pai', 'Dos dois', 'De ninguém 😅'] },
      { key: 'stubbornness', section: 'personality', label: 'E a teimosia?', type: 'select', options: ['Claramente da mãe', 'Claramente do pai', '50/50', 'Vai superar os dois'] },
    ],
  },
  {
    id: 'future',
    title: 'Futuro Diogo',
    subtitle: 'Previsões para o future star.',
    questions: [
      { key: 'firstWord', section: 'future', label: 'Qual vai ser a primeira palavra do Diogo?', type: 'text', placeholder: 'Ex.: “mãmã”' },
      { key: 'favoriteToy', section: 'future', label: 'Qual vai ser o primeiro brinquedo favorito?', type: 'text', placeholder: 'Ex.: ursinho' },
      { key: 'favoriteCharacter', section: 'future', label: 'Qual vai ser o desenho animado/personagem favorito?', type: 'text', placeholder: 'Ex.: Toy Story' },
      { key: 'favoriteFood', section: 'future', label: 'Qual vai ser a primeira comida que vai adorar?', type: 'text', placeholder: 'Ex.: massa' },
      { key: 'hatedFood', section: 'future', label: 'Qual vai ser a comida que vai detestar?', type: 'text', placeholder: 'Ex.: espinafres' },
      { key: 'beachOrMountain', section: 'future', label: 'Vai gostar mais de praia ou montanha?', type: 'select', options: ['Praia', 'Montanha', 'Os dois', 'Vai preferir ficar em casa'] },
      { key: 'firstSport', section: 'future', label: 'Qual vai ser o primeiro desporto que vai praticar?', type: 'text', placeholder: 'Ex.: futebol' },
      { key: 'futureJob', section: 'future', label: 'Qual vai ser a profissão do Diogo quando crescer?', type: 'text', placeholder: 'Ex.: astronauta' },
      { key: 'age18Wish', section: 'future', label: 'Aos 18 anos, qual vai ser a primeira coisa que vai pedir aos pais?', type: 'text', placeholder: 'Ex.: viatura' },
    ],
  },
  {
    id: 'chaos',
    title: 'O caos 😂',
    subtitle: 'Previsões para a vida real.',
    questions: [
      { key: 'diapersFirstMonth', section: 'chaos', label: 'Quantas fraldas vai gastar no primeiro mês?', type: 'number', placeholder: 'Ex.: 250', step: 1 },
      { key: 'whoChangesMost', section: 'chaos', label: 'Quem vai mudar mais fraldas?', type: 'select', options: ['Mãe', 'Pai', '50/50', 'Quem estiver mais perto 😂'] },
      { key: 'whoWakesMore', section: 'chaos', label: 'Quem vai acordar mais vezes durante a noite?', type: 'select', options: ['Mãe', 'Pai', 'Os dois', 'O Diogo vai tratar de garantir que ninguém dorme'] },
      { key: 'whoGetsFirstPee', section: 'chaos', label: 'Quem vai levar o primeiro jato de xixi?', type: 'select', options: ['Mãe', 'Pai', 'Avós', 'Outro familiar', 'Ninguém, porque os pais vão ser rápidos demais'] },
      { key: 'whoGoogleSearches', section: 'chaos', label: 'Qual dos pais vai pesquisar mais vezes no Google: “É normal o bebé fazer isto?”', type: 'select', options: ['Mãe', 'Pai', 'Os dois', 'Vão deixar de pesquisar no Google e entrar em pânico diretamente 😂'] },
      { key: 'whoIsMorePermissive', section: 'chaos', label: 'Quem vai ser mais permissivo?', type: 'select', options: ['Mãe', 'Pai', 'Os dois', 'Os avós vão estragar tudo'] },
      { key: 'whoSaysNoMore', section: 'chaos', label: 'Quem vai dizer mais vezes: “Não podes fazer isso!”', type: 'select', options: ['Mãe', 'Pai', 'Os dois'] },
      { key: 'whoBuysMostUselessThings', section: 'chaos', label: 'Quem vai comprar mais coisas para o Diogo que ele nunca vai usar?', type: 'select', options: ['Mãe', 'Pai', 'Avós', 'Toda a gente'] },
      { key: 'phonePhotosMonth', section: 'chaos', label: 'Quantas fotografias do Diogo vão existir no telemóvel dos pais ao fim do primeiro mês?', type: 'number', placeholder: 'Ex.: 350', step: 1 },
      { key: 'faceChapedTime', section: 'chaos', label: 'Quanto tempo vai demorar até alguém dizer: “É a cara chapada de…”', type: 'select', options: ['Menos de 1 hora', 'No primeiro dia', 'Na primeira semana', 'Nunca vamos chegar a um consenso'] },
    ],
  },
  {
    id: 'family',
    title: 'Família',
    subtitle: 'Quem vai ser o primeiro a mimar?',
    questions: [
      { key: 'firstToHold', section: 'family', label: 'Quem vai ser o primeiro familiar a pegar no Diogo?', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'firstToSpoil', section: 'family', label: 'Quem vai ser o primeiro a mimá-lo demasiado?', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'firstBadLesson', section: 'family', label: 'Quem vai ser o primeiro a ensinar-lhe uma asneira?', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'firstToSayNaMinhaAltura', section: 'family', label: 'Quem vai ser o primeiro a dizer: “Na minha altura…”', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'firstSweetSecrets', section: 'family', label: 'Quem vai ser o primeiro a dar-lhe um doce às escondidas?', type: 'text', placeholder: 'Nome da pessoa' },
      { key: 'whoCalmsHimSooner', section: 'family', label: 'Quem vai conseguir fazê-lo parar de chorar mais depressa?', type: 'text', placeholder: 'Nome da pessoa' },
    ],
  },
  {
    id: 'message',
    title: 'Mensagem para o Diogo',
    subtitle: 'Uma cápsula do tempo.',
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

export const getInitialAnswerState = () =>
  Object.fromEntries(allQuestions.map((question) => [question.key, '']));

export function normalizeParticipantName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export function isNameAllowed(name: string, takenNames: Set<string>) {
  return !takenNames.has(normalizeParticipantName(name));
}
