# Туториал: персональный сайт-портфолио на Next.js

> **Для кого этот материал:** вы только начинаете знакомство с фронтенд-разработкой. Здесь нет
> предположений, что вы что-то знаете — только базовая логика и много примеров из реального
> проекта. Все ключевые понятия объясняются сразу при первом появлении.

---

## Содержание

1. [Что это за проект и зачем он нужен](#1-что-это-за-проект-и-зачем-он-нужен)
2. [Краткое описание технологий](#2-краткое-описание-технологий)
3. [Общий обзор процесса разработки](#3-общий-обзор-процесса-разработки)
4. [Структура файлов и папок](#4-структура-файлов-и-папок)
5. [Как запустить проект локально](#5-как-запустить-проект-локально)
6. [Подробный разбор кода](#6-подробный-разбор-кода)
   - 6.1. Конфигурационные файлы
   - 6.2. Шрифты и корневая разметка (`layout.tsx`)
   - 6.3. Главная страница (`page.tsx`)
   - 6.4. Глобальные стили и тема (`globals.css`, `tailwind.config.ts`)
   - 6.5. Утилиты (`cn.ts`, `data.ts`)
   - 6.6. Навигация (`Navbar.tsx`)
   - 6.7. Главный экран (`Hero.tsx`)
   - 6.8. Бегущая строка с технологиями (`Marquee.tsx`)
   - 6.9. Секции «О себе», «Опыт», «Стек», «Принципы», «Образование»
   - 6.10. Промо и сам чат «Цифрового двойника»
   - 6.11. Портфолио и контакты
   - 6.12. API-маршрут для чата (`app/api/chat/route.ts`)
7. [Пять предложений по улучшению (на основе самопроверки)](#7-пять-предложений-по-улучшению-на-основе-самопроверки)

---

## 1. Что это за проект и зачем он нужен

Это одностраничный сайт-портфолио разработчика Kamila Mishchenko. Он работает как
«визитная карточка» в интернете:

- рассказывает о себе (опыт, навыки, проекты);
- показывает стек технологий в виде диаграммы;
- даёт несколько способов связи (email, телефон, GitHub, LinkedIn);
- и — самое необычное — содержит **«Цифрового двойника»**: маленький чат в правом нижнем углу,
  в котором живёт ИИ, обученный на резюме. Посетитель может спросить «Какой у тебя основной стек?»
  или «Ты открыта к удалённой работе?» и получить живой ответ.

Главная страница скроллится вертикально: навбар наверху «прилипает» к экрану, ниже идут тематические
секции, а в самом низу — большая контактная «дверь» и футер.

---

## 2. Краткое описание технологий

В проекте используется современный, но не самый свежий стек. Разберём каждую технологию:

### Next.js (версия 14.2.18)
Это **фреймворк** для React. Сам по себе React — это только библиотека для рендеринга UI в браузере,
а Next.js добавляет «обвязку»: роутинг (несколько страниц по URL), серверный рендеринг, оптимизацию картинок,
и возможность писать **API-маршруты** — небольшие серверные функции, которые живут прямо рядом с фронтендом.
В этом проекте Next.js используется в режиме **App Router** (новая система папок, где страница — это файл
`page.tsx` внутри папки `app/`).

### React 18
Библиотека для построения интерфейсов из компонентов. Компонент — это функция, которая возвращает кусочек
HTML (на самом деле JSX — специальный синтаксис, похожий на HTML, но внутри JavaScript'а).

### TypeScript
Расширение JavaScript, в котором у переменных есть **типы** (например: `string`, `number`, массив объектов
с определённой формой). Это помогает ловить ошибки до запуска кода. Файлы TypeScript имеют расширение
`.ts`, а файлы с JSX (HTML-подобным синтаксисом) — `.tsx`.

### Tailwind CSS
Утилитарный CSS-фреймворк. Вместо того чтобы писать «обычный» CSS в отдельных файлах, вы задаёте
классы прямо в JSX. Например, `className="text-lg font-bold text-ink-50"` означает «крупный текст,
жирный, почти-белый». Классы Tailwind автоматически компилируются в CSS при сборке.

### Framer Motion
Библиотека для **анимаций** в React. Позволяет описать начало/конец анимации через `initial`/`animate`
и запускать её, когда элемент появляется в области видимости (`whileInView`).

### OpenRouter (внешний сервис)
Это «агрегатор» разных ИИ-моделей (по аналогии с тем, как агрегатор такси собирает разные компании в одном
приложении). Мы отправляем текст в OpenRouter, а он пересылает его в выбранную модель — например,
`google/gemma-4-26b-a4b-it:free` — и возвращает ответ. В проекте это сделано через API-маршрут
`/api/chat`, чтобы **API-ключ никогда не попадал в браузер**.

### Прочие полезные библиотеки
- **clsx** и **tailwind-merge**: маленькие хелперы, чтобы аккуратно собирать классы Tailwind из кусочков
  и не получать конфликты вроде `p-2 p-4`.
- **react-icons**: пакет иконок. В коде, впрочем, иконки в основном рисуются вручную через SVG.

---

## 3. Общий обзор процесса разработки

Весь проект собран по принципу «один файл — один смысловой блок». Вот логика, которой следовала
разработка:

1. **Зафиксировать данные.** Вся информация о человеке (имя, контакты, опыт, скиллы) вынесена в
   `src/lib/data.ts`. Это «единый источник правды». Если хотите что-то поменять в резюме — идёте туда.
2. **Описать визуальный стиль.** Цветовая палитра (`ink`, `accent`, `coral`), шрифты (Inter +
   Space Grotesk + JetBrains Mono) и набор анимаций (`marquee`, `pulse-glow`, `shimmer`) описаны в
   `tailwind.config.ts`. Глобальные эффекты (стилизованный скроллбар, градиентный текст, «сетка»
   фона) — в `globals.css`.
3. **Собрать корневую разметку.** В `layout.tsx` подключаются шрифты и оборачивается весь сайт.
4. **Собрать главную страницу как ленту секций.** `page.tsx` буквально перечисляет компоненты сверху
   вниз: навбар → герой → бегущая строка → о себе → опыт → стек → принципы → образование →
   промо двойника → портфолио → контакты → сам чат-двойник.
5. **Каждая секция — отдельный компонент.** Это даёт возможность быстро переставить их местами
   или скрыть ненужную.
6. **Добавить анимации появления при скролле.** Используется паттерн `initial`/`whileInView` из
   Framer Motion — элементы плавно «всплывают», когда посетитель доскролливает до них.
7. **Реализовать «Цифрового двойника».** Бэкенд: API-маршрут `/api/chat`, который проксирует запросы
   в OpenRouter с системным промптом в духе «отвечай как Камила». Фронтенд: компонент `DigitalTwin.tsx`
   с плавающей кнопкой, модальной панелью и стримингом ответов по SSE-протоколу.
8. **Защитить API-ключ.** Ключ OpenRouter хранится только в переменных окружения на сервере
   (`.env`), в браузер он не попадает.

---

## 4. Структура файлов и папок

```
site/
├── .env                              ← секретный ключ OpenRouter (НЕ коммитится в git)
├── .gitignore                        ← указывает, какие файлы игнорировать
├── package.json                      ← список зависимостей и npm-скрипты
├── tsconfig.json                     ← настройки TypeScript
├── next.config.js                    ← настройки Next.js
├── tailwind.config.ts                ← настройки Tailwind (цвета, шрифты, анимации)
├── postcss.config.js                 ← настройки PostCSS (сборщик CSS)
└── src/
    ├── app/
    │   ├── layout.tsx                ← корневая HTML-разметка (оборачивает весь сайт)
    │   ├── page.tsx                  ← главная страница
    │   ├── globals.css               ← глобальные стили
    │   └── api/chat/route.ts         ← серверный API-маршрут для чата
    ├── components/
    │   ├── Navbar.tsx                ← верхняя панель навигации
    │   ├── Hero.tsx                  ← большой первый экран
    │   ├── Marquee.tsx               ← бегущая строка с названиями технологий
    │   ├── About.tsx                 ← секция «О себе»
    │   ├── Experience.tsx            ← секция «Опыт работы»
    │   ├── Stack.tsx                 ← секция «Стек» (полоски навыков)
    │   ├── Principles.tsx            ← секция «Принципы работы»
    │   ├── Education.tsx             ← секция «Образование и языки»
    │   ├── DigitalTwinPromo.tsx      ← промо-блок цифрового двойника
    │   ├── Portfolio.tsx             ← секция «Портфолио»
    │   ├── Contact.tsx               ← секция «Контакты» + футер
    │   └── DigitalTwin.tsx           ← сам чат (плавающая кнопка + окно)
    └── lib/
        ├── cn.ts                     ← утилита для склейки CSS-классов
        └── data.ts                   ← все текстовые данные сайта
```

**Главная идея:** папка `app/` — это то, что Next.js «видит» как сайт, `components/` — переиспользуемые
кусочки интерфейса, `lib/` — данные и маленькие функции-хелперы.

---

## 5. Как запустить проект локально

Три шага:

```bash
# 1. Перейти в папку проекта
cd site

# 2. Установить зависимости (один раз, занимает минуту-другую)
npm install

# 3. Запустить в режиме разработки (после этого сайт будет доступен на http://localhost:3000)
npm run dev
```

Чтобы собрать production-версию (для размещения на сервере): `npm run build` и затем `npm run start`.

Для работы чата «Цифрового двойника» в `.env` должен лежать ключ `OPENROUTER_API_KEY`. Без него
API-маршрут вернёт ошибку 500, а всё остальное будет работать нормально.

---

## 6. Подробный разбор кода

Здесь мы идём по файлам сверху вниз. Я намеренно показываю не весь код, а только самые показательные
кусочки — но после каждого фрагмента объясняю, **что делает каждая строка**.

### 6.1. Конфигурационные файлы

#### `package.json`

Это «паспорт» проекта для менеджера пакетов npm. В нём:

```json
{
  "name": "kamila-mishchenko-portfolio",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "14.2.18",
    "react": "^18.3.1",
    "framer-motion": "^11.11.17"
  }
}
```

- **`scripts`** — короткие команды, которые вызываются через `npm run <имя>`.
- **`dependencies`** — библиотеки, без которых сайт не запустится.
- **`devDependencies`** — библиотеки, нужные только при разработке (TypeScript, Tailwind).

Символ `^` перед версией означает «можно обновлять в пределах мажорной версии», то есть npm
подтянет более новую совместимую версию при `npm install`.

#### `tsconfig.json`

Говорит TypeScript, во что компилировать код:

```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "preserve",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

Самая важная строка — `"paths"`. Благодаря ей в любом файле можно написать
`import { personalInfo } from '@/lib/data'` вместо длинного относительного пути
`'../../../lib/data'`. Символ `@` — это просто короткий псевдоним.

#### `next.config.js`

Минимальные настройки Next.js. Здесь разрешено загружать картинки с любых
HTTPS-источников:

```js
module.exports = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }
};
```

`reactStrictMode: true` — режим, в котором React дополнительно проверяет код на возможные проблемы.

#### `tailwind.config.ts`

«Сердце» визуального стиля. Здесь объявлены:

- **Цветовая палитра.** Например, `ink-950` — это очень тёмный сине-серый (фон сайта),
  `accent` — фирменный лаймовый `#d4ff3a`, `coral` — оранжево-красный для акцентов.
- **Шрифты.** `font-sans`, `font-display`, `font-mono` ссылаются на переменные CSS, которые
  устанавливает `layout.tsx`.
- **Анимации и ключевые кадры.** Например, `@keyframes marquee` плавно двигает элементы слева
  направо, `pulse-glow` создаёт эффект «дышащего» свечения.

```ts
animation: {
  'marquee': 'marquee 30s linear infinite',
  'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
}
```

### 6.2. Шрифты и корневая разметка (`layout.tsx`)

Файл `src/app/layout.tsx` — это «рамка», в которой существуют все страницы. Он рендерится
один раз и оборачивает содержимое любой страницы.

```tsx
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-ink-950 text-ink-50 font-sans antialiased">{children}</body>
    </html>
  );
}
```

**Что здесь происходит по шагам:**

1. Импортируем три шрифта из встроенного в Next.js оптимизатора (`next/font/google`).
   Они загружаются оптимальным образом — браузеру не нужно делать лишний запрос, и текст
   не «мигает» неправильным шрифтом при загрузке.
2. У каждого шрифта запрашиваем **переменную CSS** (`variable: '--font-inter'` и т. д.).
   Это специальное имя, через которое Tailwind потом сможет обратиться к шрифту в
   `fontFamily`.
3. `RootLayout` — компонент-обёртка. Он получает пропс `children` — это весь контент,
   который Next.js вставит вместо `{children}`.
4. К `<html>` приклеиваем CSS-переменные шрифтов. К `<body>` приклеиваем классы Tailwind:
   `bg-ink-950` (тёмный фон), `text-ink-50` (светлый текст), `font-sans` (основной шрифт —
   Inter), `antialiased` (сглаживание шрифтов, чтобы буквы выглядели аккуратнее).

> **Для новичка:** понятие «пропс» (`props` — сокращение от *properties*, свойства) — это
> входные параметры компонента, как аргументы функции. Здесь `children` — это особый пропс,
> который React создаёт автоматически: всё, что вы напишете между `<RootLayout>...</RootLayout>`,
> окажется в `children`.

### 6.3. Главная страница (`page.tsx`)

Это самая короткая и самая «обманчиво простая» часть проекта:

```tsx
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
// ... импорты других секций

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Marquee />
      <About />
      <Experience />
      <Stack />
      <Principles />
      <Education />
      <DigitalTwinPromo />
      <Portfolio />
      <Contact />
      <DigitalTwin />
    </main>
  );
}
```

Компонент `Home` — это просто **лента секций**. Порядок имён в JSX = порядок на экране.
`main` — это семантический тег HTML, обозначающий «главное содержимое страницы» (полезно для
скринридеров и SEO).

Имя `default` в `export default function Home()` — обязательное для Next.js: файл `page.tsx`
должен экспортировать по умолчанию именно React-компонент с именем, совпадающим с URL.

### 6.4. Глобальные стили и тема (`globals.css`)

`globals.css` начинается с трёх директив Tailwind:

```css
@tailwind base;     /* базовые сбросы стилей */
@tailwind components; /* маленькие готовые компоненты Tailwind */
@tailwind utilities;  /* все утилитарные классы (text-lg, bg-red-500 и т. д.) */
```

Затем — кастомные классы. Самые интересные:

- **`.text-gradient`** — текст с градиентом акцент → коралл. Используется в заголовках.
- **`.marquee`** — горизонтальная прокрутка с масками по бокам (по краям элементы плавно «исчезают»).
- **`.card-hover`** — плавное поднятие карточки при наведении.
- **`.status-dot`** — пульсирующая точка рядом с надписью «open to opportunities».
- **`.noise-bg`** — слой шума поверх фона (создаёт «бумажную» текстуру).
- **`.border-gradient`** — рамка с градиентом.

**Пример, как работает `.text-gradient`:**

```css
.text-gradient {
  background: linear-gradient(135deg, #d4ff3a 0%, #ff5e3a 100%);
  -webkit-background-clip: text;        /* обрезаем фон по форме букв */
  -webkit-text-fill-color: transparent; /* делаем текст прозрачным */
  background-clip: text;
}
```

Хитрость: `background-clip: text` заставляет фон отображаться только там, где есть сам текст. А
`text-fill-color: transparent` убирает заливку букв, позволяя фону «просвечивать» сквозь них.

### 6.5. Утилиты (`cn.ts`, `data.ts`)

#### `src/lib/cn.ts` — крошечная, но полезная утилита

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`clsx` принимает любое количество аргументов — строки, массивы, объекты с условиями — и
собирает из них одну строку классов. Например:

```ts
clsx('p-2', isActive && 'bg-accent', { 'opacity-50': disabled });
// → "p-2 bg-accent opacity-50" (если оба условия true)
```

`twMerge` поверх неё разрешает конфликты Tailwind: `cn('p-2', 'p-4')` правильно вернёт только
`p-4`. Без него порядок классов был бы неважным и вы могли бы случайно «подавить» важный класс
ранним.

#### `src/lib/data.ts` — единый источник текстов

Здесь собраны: имя, должность, контакты, опыт, навыки, языки, принципы. Хранение текстов в одном
файле даёт два преимущества:

1. **Лёгкость редактирования.** Не нужно лезть в кучу JSX-файлов, чтобы обновить должность.
2. **Возможность переиспользования.** Один и тот же объект используется и в шапке, и в Hero,
   и в футере.

Пример структуры:

```ts
export const personalInfo = {
  name: 'Kamila Mishchenko',
  title: 'Fullstack JS Developer',
  email: 'mis.kamilla@gmail.com',
  // ...
};

export const skills = {
  frontend: [{ name: 'React', level: 92 }, /* ... */],
  backend: [{ name: 'Node.js / NestJS', level: 88 }, /* ... */],
  // ...
};
```

### 6.6. Навигация (`Navbar.tsx`)

Это «прилипающая» верхняя панель с логотипом, ссылками и кнопкой «Contact». Разберём по частям.

#### Состояние компонента (React `useState`)

```tsx
'use client'; // ← «клиентский компонент»: имеет состояние, эффекты, обработчики

import { useState, useEffect } from 'react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false); // прокрутили ли страницу
  const [open, setOpen] = useState(false);         // открыто ли мобильное меню
  const [time, setTime] = useState('');            // текущее время в Софии
  // ...
}
```

`useState` — это хук React. Он возвращает пару: текущее значение и функцию, которая его изменяет.
Когда вы вызываете `setScrolled(true)`, компонент **перерисовывается** с новым значением.

> **Для новичка:** ключевое слово `'use client'` в начале файла нужно, чтобы пометить компонент как
> выполняющийся в браузере. По умолчанию в Next.js App Router все компоненты рендерятся на сервере
> (это быстрее и безопаснее), а те, что работают с состоянием, событиями или браузерными API,
> нужно помечать `'use client'`.

#### Эффект для отслеживания скролла

```tsx
useEffect(() => {
  const onScroll = () => setScrolled(window.scrollY > 20);
  onScroll(); // вызвать сразу, чтобы установить начальное состояние
  window.addEventListener('scroll', onScroll, { passive: true });
  return () => window.removeEventListener('scroll', onScroll);
}, []);
```

`useEffect` — хук для «побочных эффектов». Внутри:

1. Заводим функцию `onScroll`, которая устанавливает флаг, если прокрутка больше 20 пикселей.
2. Подписываемся на событие `scroll` окна. Третий аргумент `{ passive: true }` подсказывает
   браузеру, что внутри обработчика не будет вызовов `preventDefault()` (это даёт более
   плавный скролл).
3. Возвращаем функцию очистки — React вызовет её, когда компонент удалится со страницы.
   Пустой массив зависимостей `[]` означает «эффект нужно запустить один раз при монтировании».

#### Эффект с часами

```tsx
useEffect(() => {
  const update = () => {
    const opts: Intl.DateTimeFormatOptions = {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZone: 'Europe/Sofia',
    };
    setTime(new Intl.DateTimeFormat('en-GB', opts).format(now));
  };
  update();
  const id = setInterval(update, 1000); // обновляем каждую секунду
  return () => clearInterval(id);
}, []);
```

`Europe/Sofia` — часовой пояс Бургаса, Болгария (где сейчас живёт Камила).

#### Анимация появления с Framer Motion

```tsx
<motion.header
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
  className={`fixed top-0 inset-x-0 z-50 ...${scrolled ? 'bg-ink-950/80 backdrop-blur-xl' : ''}`}
>
```

- `initial` — начальное состояние (панель спрятана выше и прозрачна).
- `animate` — конечное состояние.
- `transition` — длительность и **кривая Безье** `[0.22, 1, 0.36, 1]` — это «плавное замедление
  в конце», очень популярный easing в современных UI.
- Класс `fixed top-0 inset-x-0 z-50` закрепляет панель вверху экрана.
- `backdrop-blur-xl` — размытие содержимого под панелью (как у macOS).

#### Мобильное меню через `AnimatePresence`

```tsx
<AnimatePresence>
  {open && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-ink-950/95 backdrop-blur-xl md:hidden"
    >
      {/* ... ссылки ... */}
    </motion.div>
  )}
</AnimatePresence>
```

`AnimatePresence` — обёртка, которая позволяет анимировать **исчезновение** элемента (без неё
React просто мгновенно удалил бы `motion.div` из DOM). Префикс `md:hidden` скрывает блок на
экранах шириной ≥768px.

### 6.7. Главный экран (`Hero.tsx`)

Первый экран — это самая «парадная» часть сайта: заголовок-кредо «I build reliable full-stack
systems — calmly.», краткое описание, две CTA-кнопки и «карточки» в нижней части.

#### Заголовок с покадровым появлением (компонент `Reveal`)

```tsx
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <span className="text-reveal overflow-hidden inline-block">
      <motion.span
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        className="inline-block"
      >
        {children}
      </motion.span>
    </span>
  );
}
```

Трюк: внешний `<span>` имеет `overflow-hidden`, а внутренний стартует на 100% ниже и
«выедет» наверх. Каждая строка заголовка появляется со своей задержкой (`delay={0.2}`,
`{0.35}`, `{0.5}`), создавая эффект «печатной машинки».

#### «Курсор» в стиле терминала

```tsx
<span className="font-mono text-sm text-ink-400 mb-6 flex items-center gap-3">
  <span className="text-accent">$</span>
  <span>cat /etc/profile</span>
  <span className="inline-block w-2 h-4 bg-accent animate-blink" />
</span>
```

Маленький мигающий прямоугольник рядом с командой — классический «курсор» терминала.
Класс `animate-blink` определён в `tailwind.config.ts`.

#### Адаптивная сетка

```tsx
<div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
  <motion.div className="lg:col-span-7 lg:col-start-1">...</motion.div>
  <motion.div className="lg:col-span-4 lg:col-start-9 flex flex-col gap-4">...</motion.div>
</div>
```

Tailwind-псевдонимы `col-span-N` и `col-start-N` соответствуют CSS Grid: «растянись на N колонок»,
«начни с N-ной колонки». Префикс `lg:` означает «применяй только на больших экранах».

### 6.8. Бегущая строка с технологиями (`Marquee.tsx`)

```tsx
import { skills } from '@/lib/data';

const tech = [
  ...skills.frontend,
  ...skills.backend,
  ...skills.database,
  ...skills.devops,
].map((s) => s.name); // собираем плоский список имён

export function Marquee() {
  const items = [...tech, ...tech]; // дублируем, чтобы анимация была бесшовной
  return (
    <div className="relative py-12 border-y border-white/5 bg-ink-900/30 overflow-hidden">
      <div className="marquee">
        <div className="marquee__content">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <span className="font-display font-semibold text-2xl lg:text-3xl">{item}</span>
              <span className="text-accent text-2xl">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Идея бесшовности:** мы дублируем массив (`[...tech, ...tech]`). Анимация `marquee` имеет
ключевой кадр `100%: translateX(-50%)`. Когда первая половина полностью уезжает за левый край,
на её месте уже стоит вторая половина, и глаз не замечает «стыка».

### 6.9. Секции «О себе», «Опыт», «Стек», «Принципы», «Образование»

У них много общего, поэтому покажу главный паттерн.

#### Стандартный паттерн появления при скролле

```tsx
<motion.div
  initial={{ opacity: 0, y: 30 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: '-100px' }}
  transition={{ duration: 0.8 }}
>
  ...
</motion.div>
```

- `initial` — невидим и сдвинут вниз.
- `whileInView` — становится видимым, когда элемент попадает в область просмотра.
- `viewport={{ once: true }}` — анимация срабатывает только один раз, не перезапускается
  при каждом скролле туда-обратно.
- `margin: '-100px'` — анимация начнётся, когда элемент зайдёт в экран на 100 пикселей от края.

#### Полоски навыков (`Stack.tsx`)

В секции «Стек» каждый навык — это горизонтальная полоса, которая «наполняется» до нужного
процента:

```tsx
<motion.div
  initial={{ width: 0 }}
  whileInView={{ width: `${level}%` }}
  transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
  className="h-full bg-gradient-to-r from-accent to-coral rounded-full"
/>
```

Здесь Framer Motion **анимирует CSS-свойство `width`**. Получается красивая «наполняющаяся»
полоска при скролле.

#### Таймлайн опыта (`Experience.tsx`)

Здесь вертикальная линия и точки-маркеры, реализованные абсолютным позиционированием:

```tsx
<div className="absolute left-0 lg:left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-white/10 to-transparent" />
```

`left-1/3` — линия начинается от 33% ширины экрана на больших экранах, `0` — на маленьких.
Класс `w-px` — это `width: 1px` (обозначение тонких линий в Tailwind).

### 6.10. Промо и сам чат «Цифрового двойника»

Это самая интересная техническая часть. На странице два связанных элемента:

- **`DigitalTwinPromo.tsx`** — статичный промо-блок, который показывает «как выглядит чат»,
  чтобы заманить посетителя.
- **`DigitalTwin.tsx`** — сам чат: плавающая кнопка, по нажатию на которую открывается панель.

#### Плавающая кнопка

```tsx
<motion.button
  onClick={() => setOpen((o) => !o)}
  className="fixed bottom-6 right-6 z-40"
  aria-label="Open Digital Twin chat"
>
  {/* SVG иконка чата */}
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z"
          stroke="currentColor" strokeWidth="1.5" />
    <circle cx="9" cy="12" r="1" fill="currentColor" />
    <circle cx="13" cy="12" r="1" fill="currentColor" />
    <circle cx="17" cy="12" r="1" fill="currentColor" />
  </svg>
</motion.button>
```

`bottom-6 right-6` — отступ 24 пикселя от нижнего и правого края (`6 * 4px = 24px` в Tailwind).
SVG здесь описывает иконку облачка-чата с тремя точками.

#### История сообщений и хранение

```tsx
const STORAGE_KEY = 'kamila-twin-messages-v1';

useEffect(() => {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) setMessages(parsed.filter(m => m && m.role));
  }
}, []);

useEffect(() => {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
}, [messages]);
```

Используется `sessionStorage` (а не `localStorage`). Разница:

- **localStorage** — данные переживают закрытие вкладки и даже браузера.
- **sessionStorage** — данные стираются, когда пользователь закрывает вкладку.

Для приватной переписки с ИИ это правильный компромисс: история сохраняется при перезагрузке
страницы, но не «утекает» на следующий день.

#### Отправка сообщения и стриминг ответа

```tsx
const send = useCallback(async (text?: string) => {
  const trimmed = (text ?? input).trim();
  if (!trimmed || status === 'streaming') return;

  const userMsg = { id: uid(), role: 'user', content: trimmed };
  const assistantMsg = { id: uid(), role: 'assistant', content: '' };

  setMessages((m) => [...m, userMsg, assistantMsg]); // сразу добавляем «пузырь» ассистента
  setInput('');
  setStatus('streaming');

  const controller = new AbortController();
  abortRef.current = controller;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [...messages, userMsg] }),
      signal: controller.signal,
    });

    if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

    const reader = res.body.getReader();      // читаем ответ по кусочкам
    const decoder = new TextDecoder();
    let acc = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      const snapshot = acc;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: snapshot } : m))
      );
    }
    setStatus('idle');
  } catch (err) {
    // обработка ошибки — заменяем пустой пузырь на сообщение «не получилось»
  } finally {
    abortRef.current = null;
  }
}, [input, messages, status]);
```

**Что тут важно понять:**

1. Сразу создаём пустой пузырь ассистента — он будет «наполняться» по мере получения токенов.
2. `AbortController` — это способ прервать запрос. Когда пользователь жмёт кнопку «стоп», мы
   вызываем `controller.abort()` и браузер перестаёт читать поток.
3. `res.body.getReader()` возвращает async-итератор, который выдаёт бинарные кусочки `Uint8Array`.
   Мы их декодируем в строку и дописываем в аккумулятор `acc`.
4. После каждого кусочка обновляем **конкретный пузырь** через `prev.map(...)`. Так React
   перерисовывает только одно сообщение, а не весь список.

#### Хранение истории чата в `sessionStorage`

В файлe уже показан пример выше (см. `DigitalTwin.tsx`, блок «История сообщений и хранение»).

### 6.11. Портфолио и контакты

Эти секции проще — они в основном «красивая разметка данных».

#### `Contact.tsx` — формирование списка каналов связи

```tsx
const channels = [
  { label: 'Email', value: personalInfo.email, href: `mailto:${personalInfo.email}`, primary: true },
  { label: 'GitHub', value: '@MissKamilla', href: personalInfo.github },
  { label: 'LinkedIn', value: 'kamila-m', href: personalInfo.linkedin },
  { label: 'Phone', value: personalInfo.phone, href: `tel:${personalInfo.phone.replace(/\s/g, '')}` },
];
```

`mailto:` и `tel:` — это специальные схемы URL. Браузер при клике сам откроет почтовый клиент или
звонилку. Флаг `primary` нужен, чтобы выделить основной канал (Email) более крупным шрифтом.

#### Условные атрибуты ссылок

```tsx
target={c.href.startsWith('http') ? '_blank' : undefined}
rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
```

`target="_blank"` открывает ссылку в новой вкладке. `rel="noreferrer"` — это **мера безопасности**:
не передаём на чужой сайт информацию о том, откуда пришёл пользователь, и не даём новой вкладке
доступ к нашему `window` через `window.opener`. `mailto:` и `tel:` открываем в той же вкладке.

### 6.12. API-маршрут для чата (`app/api/chat/route.ts`)

Это серверная часть чата. В Next.js App Router серверные функции живут в файлах `route.ts`
внутри папок с префиксом `api`. Здесь мы разбираем самую важную часть.

#### Подготовка сообщений

```ts
const sanitized: ChatMessage[] = messages
  .filter((m): m is ChatMessage =>
    !!m &&
    (m.role === 'user' || m.role === 'assistant') &&
    typeof m.content === 'string' &&
    m.content.trim().length > 0 &&
    m.content.length <= 4000
  )
  .map((m) => ({ role: m.role, content: m.content.trim() }));
```

Это **защита от вредоносного клиента**. Даже если кто-то пришлёт напрямую запрос с подозрительными
данными, мы:

- пропустим только сообщения с ролью `user` или `assistant`;
- выбросим пустые строки;
- ограничим длину 4000 символов (защита от огромных промптов, которые могли бы «съесть»
  токены).

#### Защита ключа и проверка наличия

```ts
const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  return NextResponse.json(
    { error: 'OPENROUTER_API_KEY is not configured on the server.' },
    { status: 500 }
  );
}
```

`process.env` доступен только **на сервере**. В браузер этот код не попадёт, и утечь через
бандл ключ не может.

#### Фолбэк моделей при rate-limit

```ts
const FALLBACK_MODELS = [
  'google/gemma-4-26b-a4b-it:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'openai/gpt-oss-20b:free',
];

const modelCooldownUntil = new Map<string, number>();

function isOnCooldown(model) {
  const until = modelCooldownUntil.get(model);
  if (!until) return { on: false, retryInSec: 0 };
  const ms = until - Date.now();
  if (ms <= 0) {
    modelCooldownUntil.delete(model);
    return { on: false, retryInSec: 0 };
  }
  return { on: true, retryInSec: Math.ceil(ms / 1000) };
}
```

**Зачем это нужно:** бесплатные модели на OpenRouter имеют строгие лимиты. Если основная модель
вернёт 429 Too Many Requests, мы «кладём её на паузу» на время, указанное в ответе, и пробуем
следующую из списка. `Map<model, timestamp>` живёт **в памяти сервера** и сбрасывается при
перезапуске процесса — для одного разработчика это нормально.

#### Стриминг ответа клиенту

```ts
const stream = new ReadableStream({
  async start(controller) {
    const reader = upstream.body!.getReader();
    let buffer = '';
    let produced = false;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          // SSE — Server-Sent Events: сообщения разделяются пустой строкой
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          for (const line of chunk.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const data = trimmed.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const token =
                parsed?.choices?.[0]?.delta?.content ??
                parsed?.choices?.[0]?.message?.content ??
                '';
              if (typeof token === 'string' && token.length > 0) {
                produced = true;
                controller.enqueue(encoder.encode(token));
              }
            } catch { /* skip keepalives */ }
          }
        }
      }
      if (!produced) {
        controller.enqueue(encoder.encode("I couldn't get a response from the model just now. Please try again in a moment."));
      }
      controller.close();
    } catch (err) {
      controller.enqueue(encoder.encode('\n\n[stream interrupted]'));
      controller.close();
    }
  },
});
```

**Что здесь происходит:**

- OpenRouter отдаёт ответ в формате **Server-Sent Events (SSE)**: куски данных, разделённые парой
  переводов строки `\n\n`.
- Мы вручную разбираем этот формат, вытаскиваем из каждой порции только полезное — токен
  (часть текста) — и отправляем его в собственный `ReadableStream`.
- Этот стрим попадает в браузер как обычный текст, и фронтенд просто дописывает его в пузырь
  сообщения.

#### GET-обработчик для диагностики

```ts
export async function GET() {
  return NextResponse.json({
    ok: true,
    openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    fallbackChain: chain,
    endpoint: 'POST /api/chat with { messages: [{role, content}, ...] }',
  });
}
```

Откройте в браузере `/api/chat` (методом GET) — увидите JSON-статус: какой ключ доступен,
какая модель по умолчанию, какие фолбэки. Это удобный способ проверить, что сервер сконфигурирован
правильно, не отправляя сам запрос.

---

## 7. Пять предложений по улучшению (на основе самопроверки)

Это не баги, а направления для следующей итерации — то, что сделало бы сайт профессиональнее.

### 1. Удалить неиспользуемую зависимость

В `package.json` указана зависимость `react-icons`, но нигде в коде она не импортируется
(иконки везде вручную нарисованы через SVG). Неиспользуемые зависимости увеличивают размер
`node_modules` и могут вызывать конфликты при обновлении. Решение: удалить строку
`"react-icons": "^5.4.0"` из `dependencies` и запустить `npm install`.

### 2. Уточнить список языков и «A2→B» шкалу

В `src/lib/data.ts` есть запись:

```ts
{ name: 'English', level: 'A2' }
```

Но в `Education.tsx` шкала заполнения кружочков для языка `'A2'` мапится на `fill = 2`
(всего два из пяти заполненных). Если посетитель увидит «English: 2/5», это прочитается как
«почти не знает английского». Лучше:

- либо честно отображать «English: A2 — improving» как в `SYSTEM_PROMPT`;
- либо подтянуть шкалу для A2 до 3/5 (что соответствует общеевропейскому пониманию
  «начального, но достаточного уровня»).

### 3. Добавить SEO-картинку и страницу `loading`

В `layout.tsx` есть `metadata` для поисковиков и соцсетей, но не задан `openGraph.images`.
Без этого при шеринге ссылки, скажем, в Telegram будет показана пустая карточка. Решение:
положить `app/opengraph-image.png` (или задать `metadata.openGraph.images = ['/og.png']`).

Заодно стоит создать `app/loading.tsx` — Next.js покажет его как фолбэк во время загрузки
шрифтов, и пользователь не увидит «белый экран».

### 4. Заменить прямой `fetch` в чате на React Query / SWR

Сейчас история сообщений хранится в `useState` и `sessionStorage`. Если чат когда-нибудь
понадобится расширить (например, дать пользователю выбор модели, показать usage-метрики,
добавить логирование), код станет тяжёлым. Переход на **TanStack Query** (он уже используется
в стеке!) позволит:

- единообразно обрабатывать ошибки и ретраи;
- автоматически очищать кэш;
- добавить мутации с отменой запросов.

### 5. Вынести повторяющиеся структурные блоки в переиспользуемые компоненты

В файлах `About.tsx`, `Stack.tsx`, `Principles.tsx`, `Experience.tsx` и `Contact.tsx` повторяется
один и тот же «заголовочный» блок секции — три строки:

```tsx
<div className="flex items-center gap-3 mb-3">
  <span className="font-mono text-xs text-accent">0X</span>
  <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">{Section name}</span>
</div>
<h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">{big title}</h2>
```

Плюс стандартная анимация появления при скролле. Извлечение компонента `SectionHeader` убрало бы
десятки повторяющихся строк и снизило шанс рассинхрона между секциями (например, если завтра
захочется добавить иконку или изменить анимацию — придётся править 5 мест вместо одного).

---

### Заключение

Этот сайт — хороший учебный пример «современного» React-проекта средней сложности. Здесь
одновременно встречаются:

- **серверные API-маршруты** (`/api/chat`);
- **клиентские интерактивные компоненты** (`'use client'` для всего, где есть состояние);
- **декларативные анимации** (Framer Motion);
- **утилитарный CSS** (Tailwind);
- **интеграция с внешним LLM** (OpenRouter с fallback-цепочкой).

Если вы дочитали до этого места — поздравляю, теперь у вас достаточно контекста, чтобы открыть
любой файл в проекте и понять, зачем он нужен. Дальше остаётся только запустить
`npm run dev` и начать менять детали под себя: цвета, тексты, проекты, шрифты. Это лучший
способ учиться — менять работающее.
