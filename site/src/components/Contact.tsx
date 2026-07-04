'use client';

import { motion } from 'framer-motion';
import { personalInfo } from '@/lib/data';

const channels = [
  {
    label: 'Email',
    value: personalInfo.email,
    href: `mailto:${personalInfo.email}`,
    primary: true,
  },
  {
    label: 'GitHub',
    value: '@MissKamilla',
    href: personalInfo.github,
  },
  {
    label: 'LinkedIn',
    value: 'kamila-m',
    href: personalInfo.linkedin,
  },
  {
    label: 'Phone',
    value: personalInfo.phone,
    href: `tel:${personalInfo.phone.replace(/\s/g, '')}`,
  },
];

export function Contact() {
  return (
    <section id="contact" className="relative py-32 overflow-hidden">
      {/* Background flair */}
      <div className="absolute inset-0 dot-bg opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-accent/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Big closing statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="font-mono text-xs text-accent">08</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Contact
              </span>
            </div>
            <h2 className="font-display font-bold text-[clamp(2.5rem,8vw,8rem)] leading-[0.95] tracking-tight">
              <span className="block text-ink-50">Let&apos;s build</span>
              <span className="block">
                <span className="text-gradient">something</span>{' '}
                <span className="text-ink-50">real.</span>
              </span>
            </h2>
          </motion.div>
        </div>

        {/* Channels */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 rounded-md overflow-hidden"
        >
          {channels.map((c, i) => (
            <a
              key={c.label}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
              className={`group bg-ink-950 p-6 lg:p-8 hover:bg-ink-900 transition-all relative overflow-hidden ${
                c.primary ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className="absolute top-4 right-4 text-[10px] font-mono text-ink-600">
                0{i + 1}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-4">
                / {c.label}
              </div>
              <div
                className={`font-display font-medium ${
                  c.primary ? 'text-2xl lg:text-3xl text-accent' : 'text-lg text-ink-100'
                } group-hover:text-accent transition-colors break-all`}
              >
                {c.value}
              </div>
              <div className="mt-6 flex items-center gap-2 text-xs text-ink-400 group-hover:text-accent transition-colors">
                <span>{c.primary ? 'Send a brief' : 'Open'}</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path
                    d="M2 6h8m0 0L6 2m4 4l-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              {c.primary && (
                <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-all" />
              )}
            </a>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-32 pt-8 border-t border-white/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-coral flex items-center justify-center">
                  <span className="font-display font-bold text-ink-950 text-xs">K</span>
                </div>
                <span className="font-display font-semibold">{personalInfo.name}</span>
              </div>
              <p className="text-sm text-ink-400">{personalInfo.title}</p>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-2">
                Located
              </div>
              <div className="text-sm text-ink-200">{personalInfo.location}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-ink-500 mb-2">
                Status
              </div>
              <div className="flex items-center gap-2 text-sm text-ink-200">
                <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot text-accent" />
                {personalInfo.status}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-8 border-t border-white/5 text-xs font-mono text-ink-500">
            <span>© 2026 {personalInfo.name}. Built with Next.js.</span>
            <span className="flex items-center gap-4">
              <span>v1.0.0</span>
              <span>·</span>
              <span>Last build 2026.07</span>
              <span>·</span>
              <span className="text-accent">● all systems nominal</span>
            </span>
          </div>
        </motion.footer>
      </div>
    </section>
  );
}