import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type SignalMode = "hero" | "feature" | "risk" | "simulation";

export function FinancialSignalOrb({
  heroRef,
  featureRef,
  riskRef,
  simulationRef,
}: {
  heroRef: React.RefObject<HTMLElement | null>;
  featureRef: React.RefObject<HTMLElement | null>;
  riskRef: React.RefObject<HTMLElement | null>;
  simulationRef: React.RefObject<HTMLElement | null>;
}) {
  const prefersReducedMotion = useReducedMotion();

  const hero = useScroll({ target: heroRef as any, offset: ["start start", "end start"] }).scrollYProgress;
  const feature = useScroll({ target: featureRef as any, offset: ["start center", "end center"] }).scrollYProgress;
  const risk = useScroll({ target: riskRef as any, offset: ["start center", "end center"] }).scrollYProgress;
  const simulation = useScroll({ target: simulationRef as any, offset: ["start center", "end center"] }).scrollYProgress;

  const [mode, setMode] = useState<SignalMode>("hero");
  const [intensity, setIntensity] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      setMode("hero");
      setIntensity(0);
      return;
    }

    let raf = 0;
    const tick = () => {
      const h = clamp01(hero.get());
      const f = clamp01(feature.get());
      const r = clamp01(risk.get());
      const s = clamp01(simulation.get());

      const hi = Math.max(h, f, r, s);
      const nextMode: SignalMode = hi === s ? "simulation" : hi === r ? "risk" : hi === f ? "feature" : "hero";

      setMode(nextMode);
      setIntensity(hi);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [feature, hero, prefersReducedMotion, risk, simulation]);

  const intensitySpring = useSpring(intensity, { stiffness: 140, damping: 26, mass: 0.9 });

  const heroY = useTransform(hero, [0, 1], [0, -80]);
  const baseY = useSpring(heroY, { stiffness: 120, damping: 30, mass: 1.1 });
  const baseX = useTransform(intensitySpring, [0, 1], [0, 18]);

  const scale = useTransform(intensitySpring, [0, 1], [1, 1.06]);
  const opacity = useTransform(intensitySpring, [0, 1], [0.95, 0.75]);

  const rotation = useMemo(() => {
    if (prefersReducedMotion) return 0;
    if (mode === "feature") return 14;
    if (mode === "risk") return 18;
    if (mode === "simulation") return 24;
    return 0;
  }, [mode, prefersReducedMotion]);

  const hue = useMemo(() => {
    if (mode === "risk") return 36;
    if (mode === "simulation") return 200;
    return 190;
  }, [mode]);

  const split = useMemo(() => {
    if (prefersReducedMotion) return 0;
    return mode === "simulation" ? 1 : 0;
  }, [mode, prefersReducedMotion]);

  const layerOffset = useSpring(split, { stiffness: 160, damping: 28, mass: 0.9 });
  const layerA = useTransform(layerOffset, [0, 1], [0, -24]);
  const layerB = useTransform(layerOffset, [0, 1], [0, 18]);
  const layerC = useTransform(layerOffset, [0, 1], [0, 32]);

  const filter = useMemo(() => {
    const sat = mode === "risk" ? 1.05 : 1;
    const b = mode === "risk" ? 1.02 : 1;
    return `hue-rotate(${hue}deg) saturate(${sat}) brightness(${b})`;
  }, [hue, mode]);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      style={{
        opacity,
      }}
    >
      <motion.div
        className="relative"
        style={{
          x: baseX,
          y: baseY,
          scale,
          rotate: rotation,
          filter,
        }}
      >
        <div className="absolute inset-0 -z-10 rounded-full blur-3xl bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.22),transparent_58%),radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.22),transparent_58%)]" />

        <motion.div
          className="relative h-[360px] w-[360px] sm:h-[420px] sm:w-[420px] rounded-full"
          style={{
            translateZ: 0,
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              y: layerA,
              background:
                "radial-gradient(circle at 35% 30%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(circle at 70% 70%, rgba(59,130,246,0.14), transparent 58%), radial-gradient(circle at 50% 50%, rgba(15,23,42,0.0), rgba(15,23,42,0.55))",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 72px rgba(56,189,248,0.10)",
            }}
          />

          <motion.div
            className="absolute inset-8 rounded-full"
            style={{
              y: layerB,
              background:
                "conic-gradient(from 210deg, rgba(56,189,248,0.0), rgba(56,189,248,0.16), rgba(59,130,246,0.0), rgba(56,189,248,0.12), rgba(56,189,248,0.0))",
              maskImage:
                "radial-gradient(circle at 50% 50%, transparent 62%, black 64%, black 78%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 50%, transparent 62%, black 64%, black 78%, transparent 80%)",
              boxShadow: "0 0 48px rgba(56,189,248,0.14)",
              opacity: 0.95,
            }}
          />

          <motion.div
            className="absolute inset-16 rounded-full"
            style={{
              y: layerC,
              background:
                "conic-gradient(from 30deg, rgba(59,130,246,0.0), rgba(34,211,238,0.14), rgba(59,130,246,0.0), rgba(34,211,238,0.10), rgba(59,130,246,0.0))",
              maskImage:
                "radial-gradient(circle at 50% 50%, transparent 52%, black 55%, black 60%, transparent 64%)",
              WebkitMaskImage:
                "radial-gradient(circle at 50% 50%, transparent 52%, black 55%, black 60%, transparent 64%)",
              opacity: 0.9,
            }}
          />

          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_55%,rgba(59,130,246,0.14),transparent_55%)] blur-xl" />

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.08), transparent 28%), radial-gradient(circle at 68% 70%, rgba(255,255,255,0.05), transparent 34%)",
              opacity: prefersReducedMotion ? 0.35 : 0.55,
            }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
