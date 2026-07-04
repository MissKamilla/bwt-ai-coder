import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Marquee } from '@/components/Marquee';
import { About } from '@/components/About';
import { Experience } from '@/components/Experience';
import { Stack } from '@/components/Stack';
import { Principles } from '@/components/Principles';
import { Education } from '@/components/Education';
import { DigitalTwinPromo } from '@/components/DigitalTwinPromo';
import { Portfolio } from '@/components/Portfolio';
import { Contact } from '@/components/Contact';
import { DigitalTwin } from '@/components/DigitalTwin';

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
      <Marquee />
      <About />
      <Experience />
      <Stack />
      <Principles />
      <Education />
      <DigitalTwinPromo />
      <Portfolio />
      <Contact />
      <DigitalTwin />
    </main>
  );
}