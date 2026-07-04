'use client';

import { motion } from 'framer-motion';
import { personalInfo } from '@/lib/data';

export function Hero() {
  return (
    <section id="top" className="relative min-h-screen pt-32 pb-24 overflow-hidden noise-bg">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-50" />
      {/* Radial spotlight */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-coral/5 blur-3xl pointer-events-none" />

      {/* Big background text */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
        <div className="font-display font-bold text-[18vw] leading-none text-outline opacity-30 whitespace-nowrap">
          DEVELOPER
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Top meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-12 pb-6 border-b border-white/5"
        >
          <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest text-ink-400">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot text-accent" />
              <span className="text-accent">Available</span>
            </span>
            <span className="text-ink-600">/</span>
            <span>Remote / Hybrid</span>
            <span className="text-ink-600">/</span>
            <span>Full-time</span>
          </div>
          <div className="font-mono text-xs text-ink-400 uppercase tracking-widest">
            portfolio.build &nbsp;//&nbsp; 2026
          </div>
        </motion.div>

        {/* Headline */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-sm text-ink-400 mb-6 flex items-center gap-3"
          >
            <span className="text-accent">$</span>
            <span>cat /etc/profile</span>
            <span className="inline-block w-2 h-4 bg-accent animate-blink" />
          </motion.div>

          <h1 className="font-display font-bold text-[clamp(2.5rem,7vw,7.5rem)] leading-[0.95] tracking-tight">
            <Reveal delay={0.2}>
              <span className="block text-ink-50">I build</span>
            </Reveal>
            <Reveal delay={0.35}>
              <span className="block">
                <span className="text-gradient">reliable</span>{' '}
                <span className="text-ink-50">full-stack</span>
              </span>
            </Reveal>
            <Reveal delay={0.5}>
              <span className="block text-ink-50">systems — calmly.</span>
            </Reveal>
          </h1>
        </div>

        {/* Subhead + CTA */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="lg:col-span-7 lg:col-start-1"
          >
            <p className="text-lg lg:text-xl text-ink-200 leading-relaxed max-w-2xl">
              <span className="text-ink-50 font-medium">{personalInfo.name}</span> —{' '}
              {personalInfo.profile}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="lg:col-span-4 lg:col-start-9 flex flex-col gap-4"
          >
            <a
              href="#work"
              className="group relative overflow-hidden flex items-center justify-between px-6 py-4 bg-accent text-ink-950 rounded-md font-medium transition-all hover:bg-accent-200"
            >
              <span>View case studies</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="transition-transform group-hover:translate-x-1"
              >
                <path
                  d="M3 8h10m0 0L9 4m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:translate-x-full transition-transform duration-700" />
            </a>
            <a
              href={`mailto:${personalInfo.email}`}
              className="group flex items-center justify-between px-6 py-4 border border-white/15 hover:border-accent/50 rounded-md transition-colors"
            >
              <span className="font-mono text-sm">{personalInfo.email}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-ink-400 group-hover:text-accent transition-colors"
              >
                <path
                  d="M3 8h10m0 0L9 4m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Bottom row: corner labels */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-20 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          <Corner label="Stack" value="React · Node · TS" />
          <Corner label="Location" value="Burgas, BG" />
          <Corner label="Languages" value="UA · RU · EN" />
          <Corner label="Experience" value="5+ years" />
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
          scroll
        </span>
        <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent" />
      </motion.div>
    </section>
  );
}

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

function Corner({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-1">
        {label}
      </div>
      <div className="font-display text-base text-ink-100">{value}</div>
    </div>
  );
}