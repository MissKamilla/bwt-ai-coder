'use client';

import { motion } from 'framer-motion';
import { skills } from '@/lib/data';

const groups = [
  { key: 'frontend', label: 'Frontend', code: '01' },
  { key: 'backend', label: 'Backend', code: '02' },
  { key: 'database', label: 'Database', code: '03' },
  { key: 'devops', label: 'DevOps & Testing', code: '04' },
] as const;

export function Stack() {
  return (
    <section id="stack" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 dot-bg opacity-30" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs text-accent">03</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Stack
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
              Tools I reach for.
              <br />
              <span className="text-ink-400">Daily drivers & supporting cast.</span>
            </h2>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 flex items-end">
            <p className="text-ink-300 leading-relaxed">
              No sacred cows — I pick tools that match the problem. Below is what I use
              most often, plus a rough sense of where my comfort ends.
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((g, gi) => (
            <motion.div
              key={g.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: gi * 0.1 }}
              className="rounded-lg border border-white/10 bg-gradient-to-br from-ink-900/50 to-ink-950 p-6 lg:p-8 card-hover"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-accent">{g.code}</span>
                  <h3 className="font-display text-xl font-semibold">{g.label}</h3>
                </div>
                <span className="text-[10px] font-mono text-ink-500 uppercase tracking-widest">
                  {skills[g.key].length} tools
                </span>
              </div>

              <div className="space-y-4">
                {skills[g.key].map((s, i) => (
                  <SkillBar key={s.name} name={s.name} level={s.level} delay={gi * 0.1 + i * 0.05} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom strip — code snippet vibe */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12 rounded-lg border border-white/10 bg-ink-950 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-coral/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-accent/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
            </div>
            <span className="font-mono text-[10px] text-ink-500 uppercase tracking-widest">
              ~/projects/init.sh
            </span>
          </div>
          <pre className="p-6 text-sm font-mono leading-relaxed overflow-x-auto">
            <code>
              <span className="text-ink-500"># </span>
              <span className="text-ink-300">how I scaffold a new full-stack feature</span>
              {'\n'}
              <span className="text-coral">const</span>{' '}
              <span className="text-ink-100">feature</span>{' '}
              <span className="text-ink-500">=</span>{' '}
              <span className="text-ink-100">await</span>{' '}
              <span className="text-accent">build</span>
              <span className="text-ink-300">(&#123;</span>
              {'\n  '}
              <span className="text-ink-200">schema</span>
              <span className="text-ink-300">:</span>{' '}
              <span className="text-coral">"typeorm + postgres"</span>
              <span className="text-ink-300">,</span>
              {'\n  '}
              <span className="text-ink-200">api</span>
              <span className="text-ink-300">:</span>{' '}
              <span className="text-coral">"nestjs · jwt · swagger"</span>
              <span className="text-ink-300">,</span>
              {'\n  '}
              <span className="text-ink-200">ui</span>
              <span className="text-ink-300">:</span>{' '}
              <span className="text-coral">"react + tanstack-query · tailwind"</span>
              <span className="text-ink-300">,</span>
              {'\n  '}
              <span className="text-ink-200">tests</span>
              <span className="text-ink-300">:</span>{' '}
              <span className="text-coral">"vitest · react-testing-library"</span>
              <span className="text-ink-300">,</span>
              {'\n  '}
              <span className="text-ink-200">delivery</span>
              <span className="text-ink-300">:</span>{' '}
              <span className="text-coral">"docker · git workflow"</span>
              <span className="text-ink-300">,</span>
              {'\n'}
              <span className="text-ink-300">&#125;);</span>
              {'\n\n'}
              <span className="text-coral">await</span>{' '}
              <span className="text-ink-100">feature</span>
              <span className="text-ink-300">.</span>
              <span className="text-accent">ship</span>
              <span className="text-ink-300">();</span>{' '}
              <span className="text-ink-500">// ◂ calmly, in small commits</span>
            </code>
          </pre>
        </motion.div>
      </div>
    </section>
  );
}

function SkillBar({ name, level, delay }: { name: string; level: number; delay: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-ink-100 font-medium">{name}</span>
        <span className="font-mono text-xs text-ink-400 tabular-nums">{level}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-gradient-to-r from-accent to-coral rounded-full relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </motion.div>
      </div>
    </div>
  );
}