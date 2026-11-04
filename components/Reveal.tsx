"use client";
import { motion, useReducedMotion } from "framer-motion";
import { DUR, EASE } from "../lib/motion";

export function Reveal({ children, delay = 0, className, as = "div" }: { children: React.ReactNode; delay?: number; className?: string; as?: "div" | "p" | "h2" | "h3" | "li" }) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: DUR, ease: EASE, delay }}
    >
      {children}
    </M>
  );
}
