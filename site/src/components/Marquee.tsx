'use client';

import { skills } from '@/lib/data';

const tech = [
  ...skills.frontend,
  ...skills.backend,
  ...skills.database,
  ...skills.devops,
].map((s) => s.name);

export function Marquee() {
  const items = [...tech, ...tech];
  return (
    <div className="relative py-12 border-y border-white/5 bg-ink-900/30 overflow-hidden">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-ink-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-ink-950 to-transparent z-10 pointer-events-none" />
      <div className="marquee">
        <div className="marquee__content">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-12 px-6">
              <span className="font-display font-semibold text-2xl lg:text-3xl text-ink-100 whitespace-nowrap">
                {item}
              </span>
              <span className="text-accent text-2xl">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}