'use client';

import { motion } from 'framer-motion';

const placeholders = [
  {
    code: 'P-001',
    title: 'Gallery Management',
    desc: 'Full-stack CRUD app: JWT auth, image upload with progress & concurrency limits, NestJS REST API, Swagger docs.',
    stack: ['React', 'NestJS', 'PostgreSQL', 'TypeORM', 'Docker'],
    status: 'Shipped · Internship',
  },
  {
    code: 'P-002',
    title: 'Admin Panel System',
    desc: 'Multi-tenant admin with auth, role-based authorization, MySQL optimization via indexes and EXPLAIN analysis.',
    stack: ['Laravel', 'PHP', 'MySQL', 'REST API'],
    status: 'Shipped · Production',
  },
  {
    code: 'P-003',
    title: 'Internal Business Suite',
    desc: 'Long-running business system with module refactors, third-party integrations, PHP version upgrades.',
    stack: ['FuelPHP', 'CodeIgniter', 'MySQL', 'Git'],
    status: 'Shipped · Production',
  },
];

export function Portfolio() {
  return (
    <section id="portfolio" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-coral/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-mono text-xs text-accent">07</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                Portfolio
              </span>
            </div>
            <h2 className="font-display text-4xl lg:text-5xl font-bold leading-tight">
              Selected work.
              <br />
              <span className="text-ink-400">More coming soon.</span>
            </h2>
          </div>
          <p className="lg:col-span-4 lg:col-start-9 flex items-end text-ink-300 leading-relaxed">
            A live case-study archive is in progress. For deeper context, the source code
            for each shipped project is available on request.
          </p>
        </div>

        {/* Project grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {placeholders.map((p, i) => (
            <motion.article
              key={p.code}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="group rounded-lg border border-white/10 bg-ink-950 overflow-hidden card-hover flex flex-col"
            >
              {/* Top: project meta */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <span className="font-mono text-xs text-accent">{p.code}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-ink-400">
                  {p.status}
                </span>
              </div>

              {/* Visual placeholder */}
              <div className="relative aspect-[4/3] bg-gradient-to-br from-ink-900 to-ink-950 overflow-hidden">
                <div className="absolute inset-0 grid-bg opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full" />
                    <svg
                      width="80"
                      height="80"
                      viewBox="0 0 80 80"
                      fill="none"
                      className="relative text-accent"
                    >
                      <rect
                        x="8"
                        y="8"
                        width="64"
                        height="64"
                        rx="4"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                      />
                      <path
                        d="M28 40h24M40 28v24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-ink-500">
                  <span>preview</span>
                  <span>soon</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-display text-xl font-semibold text-ink-50 mb-2 group-hover:text-accent transition-colors">
                  {p.title}
                </h3>
                <p className="text-sm text-ink-300 leading-relaxed mb-6 flex-1">
                  {p.desc}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-6">
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 text-[11px] font-mono rounded border border-white/10 bg-white/5 text-ink-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xs font-mono text-ink-500">
                    Case study — soon
                  </span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    className="text-ink-500 group-hover:text-accent group-hover:translate-x-1 transition-all"
                  >
                    <path
                      d="M2 7h10m0 0L8 3m4 4l-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </motion.article>
          ))}

          {/* Coming soon card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="rounded-lg border border-dashed border-white/15 bg-ink-950/30 p-6 flex flex-col items-center justify-center text-center min-h-[400px] group hover:border-accent/40 transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-accent/10 group-hover:border-accent/30 transition-colors">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-ink-300 group-hover:text-accent transition-colors">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="font-display text-lg font-semibold text-ink-100 mb-2">
              Next case study
            </h3>
            <p className="text-sm text-ink-400 max-w-[220px]">
              Currently building — a deep dive into the gallery management app with
              architecture diagrams.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}