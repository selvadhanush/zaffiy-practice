import { Nav } from "../components/Nav";
import { Hero } from "../components/Hero";
import { Specs, OlfactoryBand, Craft, Discover, Footer } from "../components/Sections";

export default function Page() {
  return (
    <>
      <a href="#fragrance" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-bone">Skip to content</a>
      <Nav />
      <main>
        <Hero />
        <Specs />
        <OlfactoryBand />
        <Craft />
        <Discover />
      </main>
      <Footer />
    </>
  );
}
