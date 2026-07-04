'use client';

import { motion } from 'framer-motion';
import { personalInfo, stats } from '@/lib/data';

export function About() {
  return (
    <section id="about" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-3"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs text-accent">01</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                About
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              Engineer first, syntax second.
            </h2>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="lg:col-span-8 lg:col-start-5"
          >
            <p className="text-xl lg:text-2xl text-ink-100 leading-relaxed mb-8">
              I came to JavaScript from five years of shipping PHP backends — admin panels,
              business systems, internal tooling. That experience rewired how I think about
              full-stack work: <span className="text-accent">validation, error handling, and
              data integrity aren&apos;t afterthoughts, they&apos;re the spine.</span>
            </p>
            <p className="text-base lg:text-lg text-ink-300 leading-relaxed">
              Today I work primarily with React and Node.js — building type-safe APIs with
              NestJS, modelling data with TypeORM, designing UIs that stay out of the
              user&apos;s way. I prefer to read the codebase before I write the line, and to
              ship small, defensible improvements over big-bang rewrites.
            </p>
          </motion.div>
        </div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-md overflow-hidden"
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-ink-950 p-8 lg:p-10 group hover:bg-ink-900 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-4 right-4 text-[10px] font-mono text-ink-600">
                0{i + 1}
              </div>
              <div className="font-display font-bold text-5xl lg:text-7xl text-gradient tabular-nums leading-none mb-3">
                {s.value}
              </div>
              <div className="text-sm text-ink-300 uppercase tracking-wider font-mono">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Identity card grid */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-px bg-white/10 border border-white/10 rounded-md overflow-hidden">
          <Card title="Where I am">
            <div className="font-display text-xl">{personalInfo.location}</div>
            <div className="text-sm text-ink-400 mt-1">Open to remote · EU timezones</div>
          </Card>
          <Card title="How to reach me">
            <a
              href={`mailto:${personalInfo.email}`}
              className="font-mono text-sm text-accent hover:text-accent-200 link-underline"
            >
              {personalInfo.email}
            </a>
            <div className="text-sm text-ink-400 mt-1 font-mono">{personalInfo.phone}</div>
          </Card>
          <Card title="Find me online">
            <div className="flex flex-col gap-2">
              <a
                href={personalInfo.github}
                target="_blank"
                rel="noreferrer"
                className="text-sm link-underline text-ink-200 hover:text-white"
              >
                github.com/MissKamilla ↗
              </a>
              <a
                href={personalInfo.linkedin}
                target="_blank"
                rel="noreferrer"
                className="text-sm link-underline text-ink-200 hover:text-white"
              >
                linkedin.com/in/kamila-m ↗
              </a>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-ink-950 p-8 hover:bg-ink-900 transition-colors">
      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-4">
        / {title}
      </div>
      {children}
    </div>
  );
}