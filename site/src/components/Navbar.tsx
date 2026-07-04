'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { personalInfo } from '@/lib/data';

const links = [
  { href: '#about', label: 'About' },
  { href: '#work', label: 'Work' },
  { href: '#stack', label: 'Stack' },
  { href: '#principles', label: 'Principles' },
  { href: '#contact', label: 'Contact' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const opts: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Europe/Sofia',
      };
      setTime(new Intl.DateTimeFormat('en-GB', opts).format(now));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-ink-950/80 backdrop-blur-xl border-b border-white/5'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="#top" className="group flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-md overflow-hidden flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-accent to-coral" />
              <span className="relative font-display font-bold text-ink-950 text-sm">K</span>
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-display font-semibold text-sm tracking-tight">
                kamila.dev
              </span>
              <span className="text-[10px] text-ink-400 font-mono uppercase tracking-widest">
                v1.0
              </span>
            </div>
          </a>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative px-4 py-2 text-sm text-ink-300 hover:text-white transition-colors"
              >
                <span className="font-mono text-[10px] text-ink-500 absolute left-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  0{i + 1}
                </span>
                {l.label}
              </a>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-accent status-dot text-accent" />
              <span className="text-[11px] font-mono text-ink-300 uppercase tracking-wider">
                {personalInfo.status}
              </span>
            </div>
            <a
              href={`mailto:${personalInfo.email}`}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-ink-950 text-sm font-medium hover:bg-accent-200 transition-colors"
            >
              <span>Contact</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6h8m0 0L6 2m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
            <button
              onClick={() => setOpen(true)}
              className="md:hidden w-10 h-10 rounded-md flex items-center justify-center hover:bg-white/5"
              aria-label="Open menu"
            >
              <div className="flex flex-col gap-1">
                <span className="w-5 h-0.5 bg-white" />
                <span className="w-5 h-0.5 bg-white" />
                <span className="w-5 h-0.5 bg-white" />
              </div>
            </button>
          </div>
        </div>
        {/* Ticker */}
        <div className="hidden lg:block border-t border-white/5 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-7 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-ink-400">
            <div className="flex items-center gap-6">
              <span>● Burgas, BG</span>
              <span>{time} EET</span>
              <span className="text-accent">● {personalInfo.status}</span>
            </div>
            <div className="flex items-center gap-6">
              <span>LATEST: full-stack gallery mgmt app shipped</span>
              <span>BUILD #4271</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-ink-950/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-white/10">
              <span className="font-display font-semibold">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="w-10 h-10 rounded-md flex items-center justify-center hover:bg-white/5"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M4 4l12 12M16 4L4 16"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
            </div>
            <nav className="p-6 flex flex-col gap-2">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 py-4 border-b border-white/5 font-display text-3xl font-medium hover:text-accent transition-colors"
                >
                  <span className="font-mono text-sm text-ink-500">0{i + 1}</span>
                  {l.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}