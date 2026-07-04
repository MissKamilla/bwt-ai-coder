'use client';

import { motion } from 'framer-motion';
import { education, languages } from '@/lib/data';

export function Education() {
  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Education */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-accent">05</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Education
              </span>
            </div>
            <div className="rounded-lg border border-white/10 bg-gradient-to-br from-ink-900/50 to-ink-950 p-8 lg:p-10">
              <div className="flex items-start gap-6">
                <div className="hidden md:flex shrink-0 w-14 h-14 rounded-md bg-accent/10 border border-accent/20 items-center justify-center text-accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3L2 9l10 6 10-6-10-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M6 11v5c0 1 3 3 6 3s6-2 6-3v-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-mono text-xs text-ink-400 mb-2">
                    {education.period} · {education.location}
                  </div>
                  <h3 className="font-display text-2xl lg:text-3xl font-bold text-ink-50 mb-2">
                    {education.degree}
                  </h3>
                  <p className="text-ink-300">{education.school}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Languages */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-accent">06</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Languages
              </span>
            </div>
            <div className="space-y-3">
              {languages.map((l, i) => (
                <div
                  key={l.name}
                  className="rounded-lg border border-white/10 bg-ink-950 p-6 flex items-center justify-between card-hover"
                >
                  <div>
                    <div className="font-display text-xl font-semibold">{l.name}</div>
                    <div className="text-sm text-ink-400 font-mono mt-1 uppercase tracking-wider">
                      {l.level}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, j) => {
                      const fill =
                        l.level === 'native' ? 5 : l.level === 'bilingual' ? 4 : l.level === 'A2' ? 2 : 3;
                      return (
                        <div
                          key={j}
                          className={`w-1.5 h-6 rounded-sm ${
                            j < fill ? 'bg-accent' : 'bg-white/10'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}