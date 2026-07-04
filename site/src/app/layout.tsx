import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kamila Mishchenko — Fullstack JS Developer',
  description:
    'Junior Full-Stack JavaScript Developer with 5 years of commercial backend experience. Building enterprise-grade applications with React and Node.js.',
  keywords: [
    'Kamila Mishchenko',
    'Fullstack Developer',
    'React Developer',
    'Node.js',
    'NestJS',
    'TypeScript',
    'JavaScript',
  ],
  authors: [{ name: 'Kamila Mishchenko' }],
  openGraph: {
    title: 'Kamila Mishchenko — Fullstack JS Developer',
    description: 'Building enterprise-grade applications with React and Node.js.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-ink-950 text-ink-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}