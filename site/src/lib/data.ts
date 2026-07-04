export const personalInfo = {
  name: 'Kamila Mishchenko',
  title: 'Fullstack JS Developer',
  email: 'mis.kamilla@gmail.com',
  phone: '+380972225011',
  location: 'Burgas, Bulgaria',
  birth: '2000-12-03',
  linkedin: 'https://linkedin.com/in/kamila-m-65bb63236/',
  github: 'https://github.com/MissKamilla',
  profile:
    'Junior Full-Stack JavaScript Developer with 5 years of commercial PHP backend experience. Currently focused on building full-stack applications with React and Node.js. Strong background in REST API development, database design, debugging, and maintaining business systems.',
  status: 'open to opportunities',
};

export const stats = [
  { label: 'Years experience', value: '5+' },
  { label: 'Projects shipped', value: '12+' },
  { label: 'Tech stack', value: '15+' },
  { label: 'Coffee per day', value: '∞' },
];

export const skills = {
  frontend: [
    { name: 'React', level: 92 },
    { name: 'TypeScript / JavaScript', level: 90 },
    { name: 'TanStack Query', level: 85 },
    { name: 'React Router', level: 88 },
    { name: 'Tailwind CSS', level: 90 },
    { name: 'Formik / Axios', level: 82 },
  ],
  backend: [
    { name: 'Node.js / NestJS', level: 88 },
    { name: 'REST API / JWT', level: 92 },
    { name: 'Swagger', level: 85 },
    { name: 'TypeORM', level: 80 },
    { name: 'PHP / Laravel', level: 90 },
    { name: 'FuelPHP / CodeIgniter', level: 80 },
  ],
  database: [
    { name: 'PostgreSQL', level: 88 },
    { name: 'MySQL', level: 92 },
    { name: 'Query optimization', level: 85 },
    { name: 'Schema design', level: 87 },
  ],
  devops: [
    { name: 'Docker', level: 80 },
    { name: 'Git / GitHub / GitLab', level: 90 },
    { name: 'CI/CD', level: 75 },
    { name: 'Testing (Vitest / RTL)', level: 82 },
  ],
};

export const experience = [
  {
    period: '2025',
    role: 'Full-Stack JS Internship Project',
    company: 'Independent / Bootcamp',
    type: 'project',
    location: 'Remote',
    stack: [
      'React',
      'TypeScript',
      'TanStack Query',
      'React Router',
      'Tailwind CSS',
      'Formik',
      'Axios',
      'NestJS',
      'PostgreSQL',
      'TypeORM',
      'Docker',
      'Swagger',
    ],
    highlights: [
      'Built a full-stack gallery management application with JWT authentication, protected routes, galleries, and image management.',
      'Implemented NestJS REST APIs with DTO validation, TypeORM entities, PostgreSQL relations, filtering, sorting, and pagination.',
      'Added image upload with validation, metadata editing, progress tracking, chunked uploads, and concurrency limits.',
      'Built responsive interfaces based on Figma designs and extracted reusable UI components.',
      'Added Swagger documentation and automated frontend and backend tests.',
    ],
  },
  {
    period: '01/2021 – 12/2025',
    role: 'Backend Developer',
    company: 'Commercial',
    type: 'work',
    location: 'Zaporizhzhya',
    stack: ['PHP', 'Laravel', 'FuelPHP', 'CodeIgniter', 'MySQL'],
    highlights: [
      'Built and maintained admin panels and internal business systems using PHP frameworks and MySQL.',
      'Designed REST APIs with validation, authentication, authorization, pagination, filtering, and consistent error handling.',
      'Optimized MySQL queries and database schemas using indexes, EXPLAIN analysis, and query refactoring.',
      'Supported PHP version upgrades, third-party integrations, and refactoring of legacy modules.',
      'Collaborated with frontend developers, backend engineers, and a team lead in an Agile environment.',
    ],
  },
];

export const education = {
  degree: 'Bachelor in Software Engineering',
  school: 'Zaporizhzhia Institute of Economics and Information Technologies',
  period: '2018 – 2023',
  location: 'Zaporizhzhia',
};

export const languages = [
  { name: 'Ukrainian', level: 'native' },
  { name: 'Russian', level: 'bilingual' },
  { name: 'English', level: 'A2' },
];

export const principles = [
  {
    id: '01',
    title: 'Ship, then refine.',
    body: 'Working software beats perfect plans. I deliver in tight loops, gather feedback, and iterate without theatrics.',
  },
  {
    id: '02',
    title: 'Read the codebase.',
    body: 'Before I write a line, I read the surrounding code. Patterns matter more than personal taste.',
  },
  {
    id: '03',
    title: 'Defensive by default.',
    body: 'Validation, error paths, and tests are not optional. Reliability is a feature, not an afterthought.',
  },
  {
    id: '04',
    title: 'Calm communication.',
    body: 'No jargon for jargons sake. Async-first, clear docs, predictable updates, honest estimates.',
  },
];