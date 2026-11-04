"use client";
import { useEffect, useState } from "react";

const links = [["The Fragrance", "#fragrance"], ["The Craft", "#craft"], ["Discover", "#discover"]];

export function Nav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color] duration-[900ms] ease-lux ${solid ? "border-bone/10 bg-ink/85 backdrop-blur-[2px]" : "border-transparent bg-transparent"}`}>
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-6 md:h-16 md:px-12">
        <a href="#top" className="font-serif text-[13px] md:text-[15px] font-light tracking-[0.34em] md:tracking-[0.42em] text-bone">ZÄFIZZY</a>
        <ul className="flex items-center gap-4 md:gap-10">
          {links.map(([t, h]) => (
            <li key={h}><a href={h} className="label whitespace-nowrap text-[0.5625rem] tracking-[0.2em] transition-colors duration-[900ms] ease-lux hover:text-rose sm:text-[0.625rem] md:text-[0.6875rem] md:tracking-label"><span className="hidden sm:inline">{t.startsWith("The ") ? "The " : ""}</span>{t.replace("The ", "")}</a></li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
