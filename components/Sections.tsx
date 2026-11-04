"use client";
import { useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Reveal } from "./Reveal";
import { SPECS } from "../lib/content";

const Rule = () => <div className="h-px w-full bg-bone/15" />;

/* ── 1. Fragrance specifications ── */
export function Specs() {
  return (
    <section id="fragrance" aria-labelledby="specs-h" className="mx-auto max-w-[1200px] px-6 py-32 md:px-12 md:py-48">
      <Reveal><p className="label mb-6 flex items-center gap-4"><span className="text-rose">I</span><span className="h-px w-8 bg-rose/60" />Specifications</p></Reveal>
      <div className="grid gap-16 md:grid-cols-[1fr_1.7fr] md:gap-24">
        <Reveal><h2 id="specs-h" className="display text-[clamp(2rem,4vw,3.5rem)]">The fragrance, set down plainly.</h2></Reveal>
        <Reveal delay={0.15}>
          <dl>
            <Rule />
            {SPECS.map(([k, v]) => (
              <div key={k}>
                <div className="grid grid-cols-[1fr_1.4fr] items-baseline gap-6 py-5 md:py-6">
                  <dt className="label">{k}</dt>
                  <dd className={`font-serif text-lg font-light md:text-xl ${v.startsWith("[") ? "text-bone/45" : "text-bone"}`}>{v}</dd>
                </div>
                <Rule />
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs leading-relaxed text-bone/45">Details to be supplied by the maison.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 2. Olfactory story: full-bleed macro with parallax ── */
export function OlfactoryBand() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  return (
    <section ref={ref} aria-label="Olfactory story" className="relative h-[70vh] min-h-[420px] w-full overflow-hidden bg-ink md:h-[78vh]">
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[12%] h-[124%]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/macro-amber.webp" alt="Macro detail of amber fragrance within ribbons of translucent crystal glass" loading="lazy" className="h-full w-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-ink/35" />
      <div className="absolute inset-0 flex items-end px-6 pb-[9vh] md:px-[7vw]">
        <Reveal className="max-w-xl">
          <p className="label mb-5 flex items-center gap-4"><span className="text-rose">II</span><span className="h-px w-8 bg-rose/60" />Olfactory story</p>
          <h2 className="display text-[clamp(2rem,4.2vw,3.75rem)]">Amber, held in glass.</h2>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 3. The art of perfumery ── */
export function Craft() {
  return (
    <section id="craft" aria-labelledby="craft-h" className="mx-auto grid max-w-[1400px] items-center gap-16 px-6 py-32 md:grid-cols-2 md:gap-24 md:px-12 md:py-48">
      <div>
        <Reveal><p className="label mb-6 flex items-center gap-4"><span className="text-rose">III</span><span className="h-px w-8 bg-rose/60" />The art of perfumery</p></Reveal>
        <Reveal delay={0.1}><h2 id="craft-h" className="display text-[clamp(2.25rem,5vw,4.5rem)]">A scent is a memory you have not yet made.</h2></Reveal>
        <div className="mt-10 max-w-md space-y-6 text-[0.9375rem] leading-[1.85] text-bone/60">
          <Reveal as="p" delay={0.2}>It begins in silence — a blank page, a single accord. The perfumer listens before composing, and adds only what the fragrance asks for.</Reveal>
          <Reveal as="p" delay={0.3}>Weeks pass between adjustments. A drop too much and the harmony tilts; a drop too little and it never quite arrives. Patience is the true ingredient.</Reveal>
          <Reveal as="p" delay={0.4}>What is left on skin, hours later, is not a formula. It is a presence.</Reveal>
        </div>
      </div>
      <Reveal delay={0.2}>
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/macro-cap.webp" alt="Macro detail of the sculptural rose-gold cap and engraved collar" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <p className="label mt-4 text-[0.625rem]">Fig. 1 — The rose-gold cap and engraved collar</p>
      </Reveal>
    </section>
  );
}

/* ── 4. Private discovery ── */
type Errors = Partial<Record<"name" | "email" | "date", string>>;

export function Discover() {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const validate = (f: FormData): Errors => {
    const e: Errors = {};
    if (!String(f.get("name") || "").trim()) e.name = "Please tell us your name.";
    if (!/^\S+@\S+\.\S+$/.test(String(f.get("email") || ""))) e.email = "Please enter a valid email address.";
    const d = String(f.get("date") || "");
    if (!d) e.date = "Please choose a preferred date.";
    else if (d < today) e.date = "Please choose a date in the future.";
    return e;
  };
  const submit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const f = new FormData(ev.currentTarget);
    const e = validate(f);
    setErrors(e);
    if (Object.keys(e).length) { (ev.currentTarget.querySelector("[aria-invalid='true']") as HTMLElement | null)?.focus(); return; }
    // No backend is wired: replace with a POST to your appointment endpoint.
    setDone(String(f.get("name")).trim().split(" ")[0]);
  };
  const blurCheck = (ev: React.FocusEvent<HTMLFormElement>) => {
    const t = ev.target as unknown as HTMLInputElement;
    if (!t.name || !(t.name in { name: 1, email: 1, date: 1 })) return;
    const e = validate(new FormData(ev.currentTarget));
    setErrors((p) => ({ ...p, [t.name]: e[t.name as keyof Errors] }));
  };

  const field = "w-full border-0 border-b border-bone/25 bg-transparent py-3 font-serif text-xl font-light text-bone placeholder:text-bone/30 transition-colors duration-[900ms] ease-lux focus:border-rose focus:outline-none [color-scheme:dark]";
  const Err = ({ id, m }: { id: string; m?: string }) => <p id={id} role="alert" className="mt-2 min-h-[1.25rem] text-xs text-[#d9a38f]">{m}</p>;

  return (
    <section id="discover" aria-labelledby="discover-h" className="flex min-h-screen items-center border-t border-bone/10 px-6 py-32 md:px-12">
      <div className="mx-auto grid w-full max-w-[1200px] gap-16 md:grid-cols-2 md:gap-24">
        <div>
          <Reveal><p className="label mb-6 flex items-center gap-4"><span className="text-rose">IV</span><span className="h-px w-8 bg-rose/60" />Private discovery</p></Reveal>
          <Reveal delay={0.1}><h2 id="discover-h" className="display text-[clamp(2.25rem,5vw,4.5rem)]">Discover ZÄFIZZY, in private.</h2></Reveal>
          <Reveal delay={0.2} as="p" className="mt-8 max-w-md text-[0.9375rem] leading-[1.85] text-bone/60">Arrange an unhurried consultation. Leave your details and a preferred date, and the maison will be in touch to confirm.</Reveal>
        </div>
        <Reveal delay={0.2}>
          <div aria-live="polite">
            {done ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }} className="border-t border-rose/50 pt-8">
                <h3 className="display text-3xl">Thank you, {done}.</h3>
                <p className="mt-4 max-w-sm text-[0.9375rem] leading-[1.8] text-bone/60">Your request has been received. We will write to you shortly to confirm your private appointment.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} onBlur={blurCheck} noValidate className="space-y-6">
                <div>
                  <label htmlFor="name" className="label">Name</label>
                  <input id="name" name="name" autoComplete="name" required aria-invalid={!!errors.name} aria-describedby="name-e" className={field} />
                  <Err id="name-e" m={errors.name} />
                </div>
                <div>
                  <label htmlFor="email" className="label">Email</label>
                  <input id="email" name="email" type="email" autoComplete="email" required aria-invalid={!!errors.email} aria-describedby="email-e" className={field} />
                  <Err id="email-e" m={errors.email} />
                </div>
                <div>
                  <label htmlFor="date" className="label">Preferred appointment date</label>
                  <input id="date" name="date" type="date" min={today} required aria-invalid={!!errors.date} aria-describedby="date-e" className={field} />
                  <Err id="date-e" m={errors.date} />
                </div>
                <div>
                  <label htmlFor="message" className="label">Message <span className="normal-case tracking-normal text-bone/40">(optional)</span></label>
                  <textarea id="message" name="message" rows={3} className={`${field} resize-none`} />
                </div>
                <button type="submit" className="group mt-4 inline-flex items-center gap-4 border-b border-rose/50 pb-2 text-[0.6875rem] uppercase tracking-label text-rose transition-[border-color,gap] duration-[900ms] ease-lux hover:gap-6 hover:border-rose">
                  Request an appointment <span aria-hidden>→</span>
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-bone/10 px-6 py-10 md:px-12">
      <div className="mx-auto flex max-w-[1600px] flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <span className="font-serif text-sm font-light tracking-[0.42em] text-bone">ZÄFIZZY</span>
        <span className="label text-[0.625rem]">Haute Parfumerie · © {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
