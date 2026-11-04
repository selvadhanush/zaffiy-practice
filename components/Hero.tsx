"use client";
import { useEffect, useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { FRAME_COUNT, frameSrc } from "../lib/content";
import { EASE } from "../lib/motion";

/* ───────────── Scroll-scrubbed canvas ─────────────
   Scroll writes a target (no React state). A single rAF loop eases the playhead toward it,
   and cross-fades the two neighbouring frames so there is no frame snapping. */

function useSequence(canvasRef: React.RefObject<HTMLCanvasElement | null>, sectionRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const canvas = canvasRef.current, section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    let alive = true;

    const mobileMq = window.matchMedia("(max-width: 767px), (max-aspect-ratio: 9/10)");
    let set: "d" | "m" = mobileMq.matches ? "m" : "d";
    let bitmaps: (ImageBitmap | null)[] = new Array(FRAME_COUNT).fill(null);
    const inflight = new Set<number>();
    let vw = 0, vh = 0, dpr = 1;
    let target = 0, current = 0, lastDrawn = -1, dirty = true;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, set === "m" ? 2 : 1.75);
      vw = canvas.clientWidth; vh = canvas.clientHeight;
      canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
      dirty = true;
    };
    const readScroll = () => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      target = Math.min(1, Math.max(0, -rect.top / total));
    };

    // Loading order: frame 0 → coarse stride (first, last, every 8th) → nearest to the playhead.
    const COARSE = 8;
    const pick = (): number => {
      const head = Math.round(current * (FRAME_COUNT - 1));
      let best = -1, bestD = Infinity;
      for (let pass = 0; pass < 2 && best < 0; pass++) {
        for (let i = 0; i < FRAME_COUNT; i++) {
          if (bitmaps[i] || inflight.has(i)) continue;
          if (pass === 0 && !(i === 0 || i === FRAME_COUNT - 1 || i % COARSE === 0)) continue;
          const d = Math.abs(i - head);
          if (d < bestD) { bestD = d; best = i; }
        }
      }
      return best;
    };
    const loadOne = async (i: number, mySet: "d" | "m") => {
      inflight.add(i);
      try {
        const res = await fetch(frameSrc(mySet, i));
        const bmp = await createImageBitmap(await res.blob()); // decoded off the main thread
        if (!alive || mySet !== set) { bmp.close(); return; }
        bitmaps[i] = bmp; dirty = true;
      } catch { /* missing frame: nearest loaded one is used */ }
      finally { inflight.delete(i); }
    };
    const worker = async (mySet: "d" | "m") => {
      while (alive && mySet === set) {
        const i = pick();
        if (i < 0) return;
        await loadOne(i, mySet);
      }
    };
    const startLoading = () => {
      const mySet = set, n = mySet === "m" ? 4 : 6;
      loadOne(0, mySet).then(() => { for (let k = 0; k < n; k++) worker(mySet); });
    };

    const nearest = (i: number) => {
      if (bitmaps[i]) return bitmaps[i];
      for (let d = 1; d < FRAME_COUNT; d++) {
        if (i - d >= 0 && bitmaps[i - d]) return bitmaps[i - d];
        if (i + d < FRAME_COUNT && bitmaps[i + d]) return bitmaps[i + d];
      }
      return null;
    };

    const fit = (bw: number, bh: number) => {
      if (set === "m") {
        // Vertical exploded axis: fit by width, keep the bottle in the upper part so copy sits below centre.
        let w = vw, h = (bh / bw) * w;
        const maxH = vh * 0.74;
        if (h > maxH) { h = maxH; w = (bw / bh) * h; }
        return { x: (vw - w) / 2, y: vh * 0.06, w, h };
      }
      const s = Math.max(vw / bw, vh / bh) * (vw / vh < 1.5 ? 0.9 : 1);
      const w = bw * s, h = bh * s;
      return { x: (vw - w) / 2, y: (vh - h) / 2, w, h };
    };

    const draw = () => {
      const f = current * (FRAME_COUNT - 1);
      if (!dirty && Math.abs(f - lastDrawn) < 0.0005) return;
      const a = Math.floor(f), frac = f - a;
      const A = nearest(a);
      if (!A) return;
      lastDrawn = f; dirty = false;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#060606"; ctx.fillRect(0, 0, vw, vh);
      const r = fit(A.width, A.height);
      ctx.drawImage(A, r.x, r.y, r.w, r.h);
      const B = frac > 0.002 && a + 1 < FRAME_COUNT ? nearest(a + 1) : null;
      if (B && B !== A) { ctx.globalAlpha = frac; ctx.drawImage(B, r.x, r.y, r.w, r.h); ctx.globalAlpha = 1; }
    };

    let raf = 0, prev = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000); prev = now;
      const diff = target - current;
      current = Math.abs(diff) < 0.00002 ? target : current + diff * (1 - Math.exp(-dt * 9));
      draw();
      raf = requestAnimationFrame(tick);
    };

    const onResize = () => { resize(); readScroll(); };
    const onSet = () => {
      const next = mobileMq.matches ? "m" : "d";
      if (next === set) return;
      bitmaps.forEach((b) => b?.close());
      bitmaps = new Array(FRAME_COUNT).fill(null); inflight.clear();
      set = next; resize(); startLoading();
    };

    resize(); readScroll(); current = target;
    startLoading();
    window.addEventListener("scroll", readScroll, { passive: true });
    window.addEventListener("resize", onResize);
    mobileMq.addEventListener("change", onSet);
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false; cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readScroll);
      window.removeEventListener("resize", onResize);
      mobileMq.removeEventListener("change", onSet);
      bitmaps.forEach((b) => b?.close());
    };
  }, [canvasRef, sectionRef]);
}

/* ───────────── Overlays ───────────── */

type Side = "center" | "left" | "right";

function Overlay({ p, range, side, children, hold = false }: { p: MotionValue<number>; range: readonly [number, number]; side: Side; children: React.ReactNode; hold?: boolean }) {
  const [a, b] = range;
  const f = 0.05;
  const first = a === 0;
  const opacity = useTransform(p, hold ? [a, a + f, 1] : first ? [0, b - f, b] : [a, a + f, b - f, b], hold ? [0, 1, 1] : first ? [1, 1, 0] : [0, 1, 1, 0]);
  const y = useTransform(p, hold ? [a, a + f] : first ? [0, b - f, b] : [a, a + f, b - f, b], hold ? [28, 0] : first ? [0, 0, -28] : [28, 0, 0, -28]);
  const pos =
    side === "center" ? "items-end justify-center text-center md:items-end md:pb-[15vh]"
    : side === "left" ? "items-end justify-start md:items-center md:pb-0"
    : "items-end justify-start md:items-center md:justify-end md:pb-0";
  return (
    <motion.div style={{ opacity, y }} className={`pointer-events-none absolute inset-0 z-20 flex px-6 pb-[7vh] md:px-[7vw] ${pos}`}>
      <div className={`pointer-events-auto w-full ${side === "center" ? "max-w-3xl" : "max-w-[30rem] md:w-[28vw]"}`}>{children}</div>
    </motion.div>
  );
}

const Num = ({ n, t }: { n: string; t: string }) => (
  <p className="label mb-5 flex items-center gap-4"><span className="tabular-nums text-rose">{n}</span><span className="h-px w-8 bg-rose/60" />{t}</p>
);
const H = ({ children }: { children: React.ReactNode }) => <h2 className="display text-[clamp(1.75rem,3.2vw,3.1rem)]">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="mt-5 text-[0.9375rem] leading-[1.75] text-bone/60">{children}</p>;

const COPY = {
  vessel: "A sculptural crystal bottle, its glass drawn into slow, flowing ribbons. A precision atomizer, a fine mist, a rose-gold crown — the artistry of presentation, in service of the fragrance within.",
  layers: "Each note is chosen, weighed and balanced by the perfumer until no single ingredient competes. Top, heart and base unfold in sequence, one layer answering the next.",
};

/* ───────────── Hero ───────────── */

export function Hero() {
  const reduce = useReducedMotion();
  return reduce ? <StaticHero /> : <ScrubHero />;
}

function ScrubHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useSequence(canvasRef, sectionRef);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 1 }); // overdamped: no overshoot
  const cueOpacity = useTransform(p, [0, 0.05], [1, 0]);
  const titleOpacity = useTransform(p, [0, 0.14, 0.2], [1, 1, 0]);

  return (
    <section ref={sectionRef} id="top" aria-label="ZÄFIZZY — the fragrance, disassembled" className="relative h-[450vh]">
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-ink">
        {/* The wordmark sits behind the bottle: the canvas uses "lighten", so its #060606 ground is transparent to the text. */}
        <motion.div style={{ opacity: titleOpacity }} className="absolute inset-0 z-0 flex items-end justify-center pb-[26vh] md:items-center md:pb-0" aria-hidden>
          <span className="display select-none text-[clamp(2.75rem,13vw,13rem)] tracking-[0.18em] md:pl-[0.18em]" style={{ color: "rgb(237 232 224 / 0.92)" }}>ZÄFIZZY</span>
        </motion.div>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="A crystal perfume bottle with a rose-gold cap rotating and separating into its components as you scroll"
          className="absolute inset-0 z-10 h-full w-full"
          style={{ mixBlendMode: "lighten" }}
        />

        <Overlay p={p} range={[0, 0.2]} side="center">
          <h1 className="sr-only">ZÄFIZZY</h1>
          <p className="display text-[clamp(1.05rem,2vw,1.6rem)] italic text-bone/75">An invisible signature. An unforgettable presence.</p>
        </Overlay>
        <motion.div style={{ opacity: cueOpacity }} className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex" aria-hidden>
          <span className="label">Scroll</span><span className="h-8 w-px bg-rose/70" />
        </motion.div>

        <Overlay p={p} range={[0.2, 0.45]} side="left">
          <Num n="01" t="The Vessel" />
          <H>Every detail reveals a deeper essence.</H>
          <P>{COPY.vessel}</P>
        </Overlay>
        <Overlay p={p} range={[0.45, 0.75]} side="right">
          <Num n="02" t="The Fragrance" />
          <H>An art composed in layers.</H>
          <P>{COPY.layers}</P>
        </Overlay>
        <Overlay p={p} range={[0.75, 1]} side="left" hold>
          <Num n="03" t="The Signature" />
          <H>Crafted to leave a lasting impression.</H>
          <a href="#discover" className="mt-8 inline-flex items-center gap-4 border-b border-rose/50 pb-2 text-[0.6875rem] uppercase tracking-label text-rose transition-[border-color,gap] duration-[900ms] ease-lux hover:gap-6 hover:border-rose">
            Discover the fragrance <span aria-hidden>→</span>
          </a>
        </Overlay>
      </div>
    </section>
  );
}

/* Reduced motion: one static exploded image, simple fades. */
function StaticHero() {
  const fade = { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true, margin: "-10% 0px" }, transition: { duration: 1, ease: EASE } };
  const items: [string, string, string, string][] = [
    ["01", "The Vessel", "Every detail reveals a deeper essence.", COPY.vessel],
    ["02", "The Fragrance", "An art composed in layers.", COPY.layers],
    ["03", "The Signature", "Crafted to leave a lasting impression.", ""],
  ];
  return (
    <section id="top" aria-label="ZÄFIZZY" className="relative">
      <div className="relative flex min-h-screen items-end justify-center overflow-hidden bg-ink pb-[8vh]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/hero-exploded.webp" alt="The ZÄFIZZY crystal perfume bottle separated into its components: rose-gold cap, collar, atomizer, glass shell, amber reservoir and crystal base" className="absolute inset-0 h-full w-full object-contain object-top" />
        <motion.div {...fade} className="relative z-10 px-6 text-center">
          <h1 className="display text-[clamp(2.25rem,8vw,6rem)] tracking-[0.18em]">ZÄFIZZY</h1>
          <p className="display mt-3 italic text-bone/75">An invisible signature. An unforgettable presence.</p>
        </motion.div>
      </div>
      {items.map(([n, t, h, c]) => (
        <motion.div key={n} {...fade} className="mx-auto max-w-xl px-6 py-24 md:py-32">
          <Num n={n} t={t} /><H>{h}</H>{c && <P>{c}</P>}
          {n === "03" && <a href="#discover" className="mt-8 inline-block border-b border-rose/50 pb-2 text-[0.6875rem] uppercase tracking-label text-rose">Discover the fragrance →</a>}
        </motion.div>
      ))}
    </section>
  );
}
