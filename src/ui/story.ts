export type Speaker = 'voice' | 'hero';

export interface Line {
  readonly speaker: Speaker;
  readonly text: string;
}

export interface Chapter {
  readonly name: string;
  readonly lines: readonly Line[];
}

export const speakerNames: Readonly<Record<Speaker, string>> = {
  voice: 'Голос',
  hero: 'Ти',
};

const voice = (text: string): Line => ({ speaker: 'voice', text });
const hero = (text: string): Line => ({ speaker: 'hero', text });

/**
 * One chapter per floor (index = depth - 1). The arc: the inner voice mocks,
 * then they argue, on floor 7 it admits it is scared too, and from there they
 * go down together. Lines avoid gendered verb forms, so the hero is whoever plays.
 */
export const chapters: readonly Chapter[] = [
  {
    name: 'Безсоння',
    lines: [
      voice('Третя ніч без сну. Ти ж розумієш, що це ненормально?'),
      hero('Розумію. Тому й іду вниз.'),
      voice('У підвал. О третій ночі. Блискучий план.'),
    ],
  },
  {
    name: 'Пил',
    lines: [
      voice('Тут пахне старими листами. Тими, на які ти так і не відповідаєш.'),
      hero('Я не за цим сюди йду.'),
      voice('А за чим тоді?'),
    ],
  },
  {
    name: 'Докір',
    lines: [
      voice('Хочеш, перелічу всі твої помилки? У мене є список.'),
      hero('Хто б сумнівався.'),
      voice('Він упорядкований за датою. І за соромом.'),
    ],
  },
  {
    name: 'Лічба',
    lines: [
      hero('Сорок сім, сорок вісім... Знову збиваюся.'),
      voice('Бо ти рахуєш не сходинки. Ти рахуєш, скільки ще лишилося.'),
    ],
  },
  {
    name: 'Спогади',
    lines: [
      voice('Пам’ятаєш той вечір? Ну, той самий.'),
      hero('Не треба.'),
      voice('Я просто не хочу, щоб так було знову.'),
    ],
  },
  {
    name: 'Половина',
    lines: [
      hero('Чого ти від мене хочеш?'),
      voice('Повернись нагору. Там безпечно.'),
      hero('Там я третю ніч не сплю.'),
    ],
  },
  {
    name: 'Дихання',
    lines: [
      voice('...Мені страшно.'),
      hero('Тобі?'),
      voice('Я завжди боюся першим. Це моя робота.'),
      hero('Вдих на чотири, видих на шість. Давай разом.'),
    ],
  },
  {
    name: 'Тягар',
    lines: [
      voice('Щось важке йде за нами.'),
      hero('Я знаю, що це. Я ношу його роками.'),
      voice('Тоді понесімо по черзі.'),
    ],
  },
  {
    name: 'Тремтіння',
    lines: [hero('Ноги тремтять.'), voice('Це просто ноги. Я теж тремчу. Ходімо.')],
  },
  {
    name: 'Тиша',
    lines: [voice('Останній поверх. Чуєш?'), hero('Нічого не чую.'), voice('Отож.')],
  },
];

export const ending: readonly Line[] = [
  hero('Ти тепер зникнеш?'),
  voice('Ні. Але я можу йти поруч, а не попереду.'),
  hero('Кажуть, від дна можна відштовхнутися.'),
  voice('Тоді відштовхуймося.'),
];
