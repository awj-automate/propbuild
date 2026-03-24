"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
} from "framer-motion";

/* ─── Floating blob component ─── */
function FloatingBlob({
  size,
  color,
  x,
  y,
  delay,
  duration,
}: {
  size: number;
  color: string;
  x: string;
  y: string;
  delay: number;
  duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: color,
        left: x,
        top: y,
        filter: "blur(60px)",
      }}
      animate={{
        x: [0, 30, -20, 10, 0],
        y: [0, -25, 15, -10, 0],
        scale: [1, 1.1, 0.95, 1.05, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

/* ─── Floating document mockup ─── */
function DocumentMockup({
  delay,
  rotateX,
  rotateY,
  y,
  scale,
  className,
}: {
  delay: number;
  rotateX: number;
  rotateY: number;
  y: number;
  scale: number;
  className?: string;
}) {
  return (
    <motion.div
      className={`absolute ${className || ""}`}
      style={{ perspective: 1000 }}
      initial={{ opacity: 0, y: 60, rotateX: 0, rotateY: 0 }}
      animate={{
        opacity: 1,
        y: [y, y - 12, y + 8, y],
        rotateX,
        rotateY,
        scale,
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: {
          duration: 6,
          delay: delay + 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotateX: { duration: 0.8, delay },
        rotateY: { duration: 0.8, delay },
        scale: { duration: 0.8, delay },
      }}
    >
      <div className="w-[180px] h-[230px] md:w-[220px] md:h-[280px] bg-white rounded-lg shadow-2xl border border-gray-100 overflow-hidden">
        {/* Document header bar */}
        <div className="h-8 bg-gradient-to-r from-[#4A7C6F] to-[#5B8A72] flex items-center px-3 gap-1.5">
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
          <div className="w-2 h-2 rounded-full bg-white/40" />
        </div>
        {/* Document body lines */}
        <div className="p-4 space-y-3">
          <div className="h-3 bg-gray-200 rounded w-3/4" />
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-5/6" />
          <div className="h-2 bg-gray-100 rounded w-4/6" />
          <div className="mt-4 h-16 bg-gradient-to-br from-[#4A7C6F]/5 to-[#5B8A72]/10 rounded" />
          <div className="h-2 bg-gray-100 rounded w-full" />
          <div className="h-2 bg-gray-100 rounded w-3/4" />
          <div className="h-2 bg-gray-100 rounded w-5/6" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Animated step icons ─── */
function UploadIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16">
      <motion.rect
        x="12"
        y="8"
        width="40"
        height="48"
        rx="4"
        fill="none"
        stroke="#4A7C6F"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.path
        d="M32 42V22M24 30l8-8 8 8"
        fill="none"
        stroke="#4A7C6F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16">
      <motion.circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke="#4A7C6F"
        strokeWidth="2.5"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      {/* Neural network dots */}
      {(
        [
          [22, 22],
          [42, 22],
          [32, 32],
          [22, 42],
          [42, 42],
        ] as const
      ).map(([cx, cy], i) => (
        <motion.circle
          key={i}
          cx={cx}
          cy={cy}
          r="3"
          fill="#4A7C6F"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{
            delay: 0.3 + i * 0.1,
            type: "spring",
            stiffness: 200,
          }}
        />
      ))}
      {/* Connection lines */}
      {[
        "M22 22L32 32",
        "M42 22L32 32",
        "M32 32L22 42",
        "M32 32L42 42",
        "M22 22L42 22",
        "M22 42L42 42",
      ].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          fill="none"
          stroke="#4A7C6F"
          strokeWidth="1.5"
          opacity={0.4}
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
        />
      ))}
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16">
      <motion.rect
        x="16"
        y="8"
        width="32"
        height="44"
        rx="3"
        fill="none"
        stroke="#4A7C6F"
        strokeWidth="2.5"
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, type: "spring", stiffness: 120 }}
      />
      <motion.path
        d="M24 56l8-8 8 8"
        fill="none"
        stroke="#4A7C6F"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.4 }}
      />
      {/* Check mark */}
      <motion.path
        d="M26 28l4 4 8-8"
        fill="none"
        stroke="#5B8A72"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        whileInView={{ pathLength: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8, duration: 0.5 }}
      />
    </svg>
  );
}

/* ─── Feature card icons ─── */
const featureIcons: Record<string, React.ReactNode> = {
  templates: (
    <svg
      viewBox="0 0 32 32"
      className="w-8 h-8"
      fill="none"
      stroke="#4A7C6F"
      strokeWidth="1.8"
    >
      <rect x="4" y="4" width="24" height="24" rx="3" />
      <line x1="4" y1="12" x2="28" y2="12" />
      <line x1="16" y1="12" x2="16" y2="28" />
    </svg>
  ),
  oneclick: (
    <svg
      viewBox="0 0 32 32"
      className="w-8 h-8"
      fill="none"
      stroke="#4A7C6F"
      strokeWidth="1.8"
    >
      <circle cx="16" cy="16" r="12" />
      <path
        d="M16 10v6l4 4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  export: (
    <svg
      viewBox="0 0 32 32"
      className="w-8 h-8"
      fill="none"
      stroke="#4A7C6F"
      strokeWidth="1.8"
    >
      <path
        d="M8 20v6h16v-6M16 4v14M10 12l6 6 6-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  brand: (
    <svg
      viewBox="0 0 32 32"
      className="w-8 h-8"
      fill="none"
      stroke="#4A7C6F"
      strokeWidth="1.8"
    >
      <rect x="6" y="6" width="20" height="20" rx="4" />
      <circle cx="16" cy="16" r="5" />
      <circle cx="16" cy="16" r="1.5" fill="#4A7C6F" />
    </svg>
  ),
  fast: (
    <svg
      viewBox="0 0 32 32"
      className="w-8 h-8"
      fill="none"
      stroke="#4A7C6F"
      strokeWidth="1.8"
    >
      <path d="M18 4L8 18h8l-2 10 10-14h-8l2-10z" strokeLinejoin="round" />
    </svg>
  ),
  secure: (
    <svg
      viewBox="0 0 32 32"
      className="w-8 h-8"
      fill="none"
      stroke="#4A7C6F"
      strokeWidth="1.8"
    >
      <rect x="8" y="14" width="16" height="14" rx="2" />
      <path d="M12 14v-4a4 4 0 018 0v4" strokeLinecap="round" />
      <circle cx="16" cy="21" r="2" fill="#4A7C6F" />
    </svg>
  ),
};

/* ─── Feature data ─── */
const features = [
  {
    icon: "templates",
    title: "Smart Templates",
    desc: "Learns your formatting, tone, and structure.",
  },
  {
    icon: "oneclick",
    title: "One-Click Generation",
    desc: "Describe scope in plain English. Get a polished proposal.",
  },
  {
    icon: "export",
    title: "Multi-Format Export",
    desc: "Word, PDF, Google Docs. Whatever you need.",
  },
  {
    icon: "brand",
    title: "Brand Consistent",
    desc: "Your logo, your style, every time.",
  },
  {
    icon: "fast",
    title: "Lightning Fast",
    desc: "From brief to proposal in under 60 seconds.",
  },
  {
    icon: "secure",
    title: "Secure",
    desc: "Your data and API keys never leave your account.",
  },
];

/* ─── Animation variants ─── */
const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const fadeInLeft: any = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const fadeInRight: any = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

/* ═══════════════════════════════════════════════════
   STAT CARD SUB-COMPONENT
   ═══════════════════════════════════════════════════ */
function StatCard({
  value,
  suffix,
  label,
  decimals = 0,
}: {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [displayed, setDisplayed] = useState("0");

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(0, value, {
      duration: 2.5,
      ease: "easeOut",
      onUpdate: (v) => {
        setDisplayed(
          decimals > 0
            ? v.toFixed(decimals)
            : Math.round(v).toLocaleString()
        );
      },
    });
    return () => controls.stop();
  }, [isInView, value, decimals]);

  return (
    <motion.div
      ref={ref}
      className="text-center p-8 rounded-2xl glass"
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
      whileHover={{ y: -4 }}
    >
      <div className="text-5xl sm:text-6xl font-bold text-[#4A7C6F] tabular-nums">
        {displayed}
        <span className="text-3xl">{suffix}</span>
      </div>
      <p className="mt-3 text-[#636E72] font-medium">{label}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════ */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);

  return (
    <main className="relative overflow-hidden bg-[#FAFBFC]">
      {/* ──────────── NAVBAR ──────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 glass-strong"
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4A7C6F] to-[#5B8A72] flex items-center justify-center">
              <svg viewBox="0 0 20 20" className="w-4 h-4" fill="white">
                <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 3v2h10V6H5zm0 4v2h7v-2H5zm0 4v1h5v-1H5z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[#2D3436] tracking-tight">
              PropBuild
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/signin"
              className="text-sm font-medium text-[#636E72] hover:text-[#2D3436] transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-[#4A7C6F] text-white hover:bg-[#3D6B5E] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ──────────── HERO ──────────── */}
      <section className="relative min-h-screen flex items-center mesh-gradient pt-16">
        {/* Floating blobs */}
        <FloatingBlob
          size={400}
          color="rgba(74,124,111,0.07)"
          x="5%"
          y="10%"
          delay={0}
          duration={20}
        />
        <FloatingBlob
          size={300}
          color="rgba(91,138,114,0.06)"
          x="65%"
          y="5%"
          delay={2}
          duration={18}
        />
        <FloatingBlob
          size={250}
          color="rgba(74,124,111,0.05)"
          x="30%"
          y="60%"
          delay={4}
          duration={22}
        />
        <FloatingBlob
          size={350}
          color="rgba(91,138,114,0.04)"
          x="75%"
          y="55%"
          delay={1}
          duration={25}
        />
        <FloatingBlob
          size={200}
          color="rgba(74,124,111,0.06)"
          x="-5%"
          y="70%"
          delay={3}
          duration={19}
        />

        <motion.div
          className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center relative z-10"
          style={{ y: heroY, opacity: heroOpacity }}
        >
          {/* Left: Copy */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#4A7C6F]/10 text-[#4A7C6F] border border-[#4A7C6F]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C6F] animate-pulse" />
                Now in beta
              </span>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#2D3436] leading-[1.05] tracking-tight"
            >
              Proposals that close deals.{" "}
              <span className="text-gradient">Built in minutes.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg sm:text-xl text-[#636E72] max-w-lg leading-relaxed"
            >
              Upload your best proposals. Let AI learn your style. Generate
              perfect client-ready documents every time.
            </motion.p>
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap gap-4"
            >
              <Link
                href="/auth/signup"
                className="group relative px-7 py-3.5 rounded-xl bg-[#4A7C6F] text-white font-semibold text-base shadow-lg shadow-[#4A7C6F]/20 hover:shadow-xl hover:shadow-[#4A7C6F]/30 hover:bg-[#3D6B5E] transition-all duration-300 overflow-hidden"
              >
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="px-7 py-3.5 rounded-xl border-2 border-[#4A7C6F]/30 text-[#4A7C6F] font-semibold text-base hover:border-[#4A7C6F] hover:bg-[#4A7C6F]/5 transition-all duration-300"
              >
                See How It Works
              </a>
            </motion.div>
          </motion.div>

          {/* Right: Floating documents */}
          <div
            className="relative h-[400px] md:h-[500px] hidden lg:block"
            style={{ perspective: 1200 }}
          >
            <DocumentMockup
              delay={0.3}
              rotateX={8}
              rotateY={-12}
              y={20}
              scale={1}
              className="right-0 top-0"
            />
            <DocumentMockup
              delay={0.5}
              rotateX={-5}
              rotateY={8}
              y={60}
              scale={0.9}
              className="right-40 top-16"
            />
            <DocumentMockup
              delay={0.7}
              rotateX={4}
              rotateY={-6}
              y={40}
              scale={0.8}
              className="right-20 top-36"
            />

            {/* Floating accent shapes */}
            <motion.div
              className="absolute right-8 bottom-20 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4A7C6F]/20 to-[#5B8A72]/10 border border-[#4A7C6F]/10"
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute left-4 top-10 w-12 h-12 rounded-full bg-gradient-to-br from-[#5B8A72]/15 to-transparent border border-[#4A7C6F]/10"
              animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
            <motion.div
              className="absolute right-32 bottom-8 w-10 h-10 rounded-lg rotate-45 bg-gradient-to-br from-[#4A7C6F]/10 to-transparent border border-[#4A7C6F]/10"
              animate={{ y: [0, -10, 0], rotate: [45, 50, 45] }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2,
              }}
            />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-[#4A7C6F]/30 flex items-start justify-center p-1.5"
            animate={{ y: [0, 6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="w-1.5 h-3 rounded-full bg-[#4A7C6F]/40"
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section id="how-it-works" className="relative py-32 bg-white">
        {/* Background accents */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 top-20 w-[500px] h-[500px] rounded-full bg-[#4A7C6F]/[0.03] blur-3xl" />
          <div className="absolute -left-32 bottom-10 w-[400px] h-[400px] rounded-full bg-[#5B8A72]/[0.03] blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold tracking-wider uppercase text-[#4A7C6F]">
              How It Works
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-[#2D3436] tracking-tight">
              Three steps. That&apos;s it.
            </h2>
          </motion.div>

          <div className="space-y-24 lg:space-y-32">
            {/* Step 1 */}
            <motion.div
              className="grid lg:grid-cols-2 gap-12 items-center"
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#4A7C6F]/10 text-[#4A7C6F] font-bold text-xl">
                    1
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2D3436]">
                    Upload your past proposals
                  </h3>
                </div>
                <p className="text-lg text-[#636E72] leading-relaxed max-w-md">
                  Drop in your best work. Word docs, PDFs, whatever you have.
                  The more you upload, the smarter it gets.
                </p>
              </div>
              <div className="flex justify-center">
                <motion.div
                  className="relative w-64 h-64 flex items-center justify-center"
                  whileInView={{ scale: [0.8, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[#4A7C6F]/5 border border-[#4A7C6F]/10" />
                  <UploadIcon />
                  {/* Animated papers flying in */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-12 h-16 bg-white rounded shadow-lg border border-gray-100"
                      initial={{
                        x: (i - 1) * 100,
                        y: -80,
                        opacity: 0,
                        rotate: (i - 1) * 15,
                      }}
                      whileInView={{
                        x: 0,
                        y: 0,
                        opacity: [0, 1, 0],
                        rotate: 0,
                      }}
                      viewport={{ once: true }}
                      transition={{
                        delay: 0.8 + i * 0.3,
                        duration: 1.2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 3,
                      }}
                    >
                      <div className="m-2 space-y-1">
                        <div className="h-1 bg-gray-200 rounded w-full" />
                        <div className="h-1 bg-gray-100 rounded w-3/4" />
                        <div className="h-1 bg-gray-100 rounded w-1/2" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            {/* Step 2 */}
            <motion.div
              className="grid lg:grid-cols-2 gap-12 items-center"
              variants={fadeInRight}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="order-2 lg:order-1 flex justify-center">
                <motion.div
                  className="relative w-64 h-64 flex items-center justify-center"
                  whileInView={{ scale: [0.8, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[#4A7C6F]/5 border border-[#4A7C6F]/10" />
                  <BrainIcon />
                  {/* Pulsing rings */}
                  <motion.div
                    className="absolute inset-4 rounded-full border-2 border-[#4A7C6F]/20"
                    animate={{
                      scale: [1, 1.3, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <motion.div
                    className="absolute inset-8 rounded-full border-2 border-[#5B8A72]/15"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.4, 0, 0.4],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.5,
                    }}
                  />
                </motion.div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#4A7C6F]/10 text-[#4A7C6F] font-bold text-xl">
                    2
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2D3436]">
                    AI learns your style
                  </h3>
                </div>
                <p className="text-lg text-[#636E72] leading-relaxed max-w-md">
                  Our engine analyzes your tone, structure, and formatting. It
                  understands how you win deals.
                </p>
              </div>
            </motion.div>

            {/* Step 3 */}
            <motion.div
              className="grid lg:grid-cols-2 gap-12 items-center"
              variants={fadeInLeft}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-[#4A7C6F]/10 text-[#4A7C6F] font-bold text-xl">
                    3
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#2D3436]">
                    Generate in one click
                  </h3>
                </div>
                <p className="text-lg text-[#636E72] leading-relaxed max-w-md">
                  Describe the project. Click generate. Get a polished,
                  client-ready proposal instantly.
                </p>
              </div>
              <div className="flex justify-center">
                <motion.div
                  className="relative w-64 h-64 flex items-center justify-center"
                  whileInView={{ scale: [0.8, 1] }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <div className="absolute inset-0 rounded-3xl bg-[#4A7C6F]/5 border border-[#4A7C6F]/10" />
                  <GenerateIcon />
                  {/* Sparkle effects */}
                  {[
                    { x: "20%", y: "20%", delay: 0 },
                    { x: "75%", y: "25%", delay: 0.4 },
                    { x: "60%", y: "70%", delay: 0.8 },
                    { x: "15%", y: "65%", delay: 1.2 },
                  ].map((s, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-[#4A7C6F]"
                      style={{ left: s.x, top: s.y }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: 1 + s.delay,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section className="relative py-32 mesh-gradient">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold tracking-wider uppercase text-[#4A7C6F]">
              Features
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-[#2D3436] tracking-tight">
              Everything you need. Nothing you don&apos;t.
            </h2>
          </motion.div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((f) => (
              <motion.div
                key={f.icon}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                }}
                className="glass rounded-2xl p-8 cursor-default group hover:shadow-xl hover:shadow-[#4A7C6F]/5 transition-shadow duration-500"
              >
                <motion.div
                  className="mb-5 w-14 h-14 rounded-xl bg-[#4A7C6F]/10 flex items-center justify-center group-hover:bg-[#4A7C6F]/15 transition-colors duration-300"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {featureIcons[f.icon]}
                </motion.div>
                <h3 className="text-xl font-bold text-[#2D3436] mb-2">
                  {f.title}
                </h3>
                <p className="text-[#636E72] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ──────────── STATS / SOCIAL PROOF ──────────── */}
      <section className="relative py-32 bg-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-[#4A7C6F]/[0.02] blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-20"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-semibold tracking-wider uppercase text-[#4A7C6F]">
              By the numbers
            </span>
            <h2 className="mt-4 text-4xl sm:text-5xl font-bold text-[#2D3436] tracking-tight">
              Results that speak for themselves.
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8">
            <StatCard
              value={10000}
              suffix="+"
              label="Proposals generated"
            />
            <StatCard
              value={4.2}
              suffix=" hrs"
              label="Saved per proposal"
              decimals={1}
            />
            <StatCard
              value={94}
              suffix="%"
              label="Close rate increase"
            />
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="relative py-32 mesh-gradient overflow-hidden">
        {/* Floating background elements */}
        <FloatingBlob
          size={300}
          color="rgba(74,124,111,0.06)"
          x="10%"
          y="20%"
          delay={0}
          duration={15}
        />
        <FloatingBlob
          size={250}
          color="rgba(91,138,114,0.05)"
          x="70%"
          y="40%"
          delay={2}
          duration={18}
        />
        <motion.div
          className="absolute right-[15%] top-[20%] w-20 h-20 rounded-2xl border border-[#4A7C6F]/10 bg-[#4A7C6F]/[0.03]"
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute left-[20%] bottom-[25%] w-14 h-14 rounded-full border border-[#5B8A72]/10 bg-[#5B8A72]/[0.03]"
          animate={{ y: [0, 15, 0], rotate: [0, -12, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        <motion.div
          className="max-w-3xl mx-auto px-6 text-center relative z-10"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#2D3436] tracking-tight leading-tight">
            Stop writing proposals from scratch.
          </h2>
          <p className="mt-6 text-lg text-[#636E72] max-w-xl mx-auto">
            Join thousands of professionals who close more deals in less time.
          </p>
          <motion.div
            className="mt-10"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-[#4A7C6F] text-white font-bold text-lg shadow-xl shadow-[#4A7C6F]/25 hover:bg-[#3D6B5E] transition-colors duration-300"
            >
              Get Started Free
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </motion.div>
          <p className="mt-4 text-sm text-[#636E72]/70">
            No credit card required.
          </p>
        </motion.div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#4A7C6F] to-[#5B8A72] flex items-center justify-center">
              <svg viewBox="0 0 20 20" className="w-3.5 h-3.5" fill="white">
                <path d="M4 3h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1zm1 3v2h10V6H5zm0 4v2h7v-2H5zm0 4v1h5v-1H5z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#2D3436]">
              PropBuild
            </span>
            <span className="text-sm text-[#636E72]/60 ml-2">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-sm text-[#636E72] hover:text-[#2D3436] transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
