'use client';

import { motion } from 'framer-motion';
import { principles } from '@/lib/data';

export function Principles() {
  return (
    <section id="principles" className="relative py-32 bg-ink-900/30 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs text-accent">04</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Principles
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
              How I work, in four lines.
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-md overflow-hidden">
          {principles.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="bg-ink-950 p-8 lg:p-10 group hover:bg-ink-900 transition-colors relative overflow-hidden"
            >
              <div className="absolute top-6 right-6 text-[10px] font-mono text-ink-600">
                {p.id}
              </div>
              <div className="font-display text-7xl lg:text-8xl font-bold text-outline-accent opacity-30 leading-none mb-4 select-none">
                {p.id}
              </div>
              <h3 className="font-display text-2xl font-semibold text-ink-50 mb-3 group-hover:text-accent transition-colors">
                {p.title}
              </h3>
              <p className="text-ink-300 leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}