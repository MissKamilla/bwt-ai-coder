'use client';

import { motion } from 'framer-motion';
import { experience } from '@/lib/data';

export function Experience() {
  return (
    <section id="work" className="relative py-32 bg-ink-900/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs text-accent">02</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Career path
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
              Five years of production code, condensed.
            </h2>
          </div>
          <p className="lg:col-span-6 lg:col-start-7 text-ink-300 text-lg leading-relaxed">
            Backend-heavy, full-stack current. Each role layered new constraints — scale,
            legacy, integrations — that shaped how I design today.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 lg:left-1/3 top-0 bottom-0 w-px bg-gradient-to-b from-accent via-white/10 to-transparent" />

          <div className="space-y-12">
            {experience.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7 }}
                className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 pl-8 lg:pl-0"
              >
                {/* Marker */}
                <div className="absolute left-0 lg:left-1/3 top-2 -translate-x-1/2 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-accent glow-accent" />
                  <div className="absolute w-6 h-6 rounded-full border border-accent/40 animate-ping" />
                </div>

                {/* Date column */}
                <div className="lg:col-span-3 lg:pr-12">
                  <div className="font-mono text-xs text-ink-500 uppercase tracking-widest mb-2">
                    {item.type === 'work' ? 'Commercial' : 'Project'}
                  </div>
                  <div className="font-display text-2xl lg:text-3xl font-bold text-ink-50 mb-1">
                    {item.period}
                  </div>
                  <div className="text-sm text-ink-400 font-mono">{item.location}</div>
                </div>

                {/* Content */}
                <div className="lg:col-span-9 lg:pl-12 border-l border-white/5 lg:border-l-0">
                  <div className="rounded-lg border border-white/10 bg-ink-950/60 p-6 lg:p-8 card-hover">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="font-display text-2xl lg:text-3xl font-bold text-ink-50 mb-1">
                          {item.role}
                        </h3>
                        <div className="text-sm text-ink-400">{item.company}</div>
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-accent px-3 py-1 rounded-full border border-accent/30 bg-accent/5">
                        {item.type === 'work' ? 'Production' : 'Capstone'}
                      </div>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {item.highlights.map((h, i) => (
                        <li key={i} className="flex gap-3 text-ink-200 leading-relaxed">
                          <span className="font-mono text-xs text-accent mt-2 shrink-0">
                            ▸
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-6 border-t border-white/5">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-3">
                        Stack
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.stack.map((s) => (
                          <span
                            key={s}
                            className="px-3 py-1 text-xs font-mono rounded-full border border-white/10 bg-white/5 text-ink-200 hover:border-accent/40 hover:text-accent transition-colors"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}