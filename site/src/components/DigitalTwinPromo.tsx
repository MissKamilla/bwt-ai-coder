'use client';

import { motion } from 'framer-motion';

export function DigitalTwinPromo() {
  return (
    <section
      id="twin"
      className="relative py-20 overflow-hidden border-y border-white/5"
    >
      <div className="absolute inset-0 dot-bg opacity-30" />
      <div className="absolute -top-20 left-1/3 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
        >
          {/* Left: copy */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs text-accent">/interactive</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                New
              </span>
            </div>
            <h2 className="font-display text-3xl lg:text-5xl font-bold leading-tight mb-4">
              Ask my{' '}
              <span className="text-gradient">Digital Twin</span>.
            </h2>
            <p className="text-ink-300 text-lg leading-relaxed max-w-2xl mb-6">
              A small AI trained on this CV, wired through OpenRouter, that answers
              questions about my stack, projects, and availability in real time.
              Click the bubble in the corner — or try one of these to get started.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'What is your strongest stack?',
                'Tell me about the gallery app',
                'Open to remote roles?',
                'Languages you speak',
              ].map((q) => (
                <span
                  key={q}
                  className="text-xs font-mono px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-ink-200"
                >
                  {q}
                </span>
              ))}
            </div>
          </div>

          {/* Right: visual */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-coral/20 blur-2xl rounded-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-ink-950 p-5 shadow-2xl shadow-black/40">
                {/* Mock chat header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-gradient-to-br from-accent to-coral flex items-center justify-center font-display font-bold text-ink-950 text-xs">
                      K
                    </div>
                    <div>
                      <div className="font-display text-sm font-semibold">
                        Kamila Twin
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-accent">
                        ● Online
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-ink-500">demo</div>
                </div>
                {/* Mock bubbles */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-end">
                    <div className="rounded-2xl rounded-br-md bg-accent text-ink-950 px-3 py-2 max-w-[80%]">
                      What's your strongest stack right now?
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="shrink-0 w-6 h-6 rounded-md bg-gradient-to-br from-accent to-coral flex items-center justify-center font-display font-bold text-ink-950 text-[10px]">
                      K
                    </div>
                    <div className="rounded-2xl rounded-bl-md bg-white/[0.04] border border-white/10 px-3 py-2 max-w-[85%] text-ink-100 leading-relaxed">
                      React for the front, NestJS + TypeORM for the back, and
                      PostgreSQL to glue it together. Most of my muscle memory
                      sits in that combo — and I&apos;m deepening testing &
                      deployment every week.
                    </div>
                  </div>
                </div>
                {/* Pulsing input */}
                <div className="mt-4 rounded-lg border border-white/10 bg-ink-900/60 px-3 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-ink-500">Click the bubble to chat…</span>
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}