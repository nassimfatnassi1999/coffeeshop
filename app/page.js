import SmoothScroll from '@/components/SmoothScroll';
import Loader from '@/components/Loader';
import Cursor from '@/components/Cursor';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import ScrollSequence from '@/components/ScrollSequence';
import Marquee from '@/components/Marquee';
import Menu from '@/components/Menu';
import Origins from '@/components/Origins';
import Process from '@/components/Process';
import Stats from '@/components/Stats';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <SmoothScroll />
      <Loader />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <ScrollSequence />
        <Marquee />
        <Menu />
        <Origins />
        <Process />
        <Stats />
      </main>
      <Footer />
    </>
  );
}
