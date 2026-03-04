'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Loading Screen
//  Tron-style boot sequence animation
// ═══════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch } from 'lucide-react';

interface LoadingScreenProps {
  isLoading: boolean;
}

const BOOT_LINES = [
  'INITIALIZING NEURAL GRID...',
  'CONNECTING TO GIT MATRIX...',
  'LOADING REPOSITORY TOWERS...',
  'RENDERING TRON SKYLINE...',
  'CALIBRATING GLOBE COORDINATES...',
  'ACTIVATING NEON PULSE ARRAY...',
  'SYSTEM ONLINE.',
];

export default function LoadingScreen({ isLoading }: LoadingScreenProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) return;

    const lineTimer = setInterval(() => {
      setVisibleLines((prev) => Math.min(prev + 1, BOOT_LINES.length));
    }, 300);

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 100));
    }, 40);

    return () => {
      clearInterval(lineTimer);
      clearInterval(progressTimer);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, #0a1628 0%, #030814 100%)',
          }}
        >
          {/* Grid background */}
          <div className="tron-grid-bg" />

          {/* Central logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-8"
          >
            <div className="relative">
              <GitBranch
                size={48}
                className="animate-pulse-glow"
                style={{
                  color: '#00f0ff',
                  filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.8))',
                }}
              />
              {/* Rotating ring */}
              <div
                className="absolute inset-[-16px] rounded-full animate-rotate-slow"
                style={{
                  border: '1px solid rgba(0,240,255,0.2)',
                  borderTopColor: '#00f0ff',
                }}
              />
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-2xl font-bold font-mono tracking-[0.4em] mb-1 glow-text-cyan"
            style={{ color: '#00f0ff' }}
          >
            USG
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[10px] font-mono tracking-[0.5em] text-tron-text-dim mb-8"
          >
            UNITED STATES OF GIT
          </motion.p>

          {/* Boot sequence */}
          <div className="w-[400px] max-w-[80vw] space-y-1 mb-6">
            {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
              <motion.div
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="flex items-center gap-2 text-[10px] font-mono"
                style={{
                  color: i === visibleLines - 1 ? '#00f0ff' : '#2a4a6a',
                }}
              >
                <span style={{ color: '#39ff14' }}>▸</span>
                {line}
                {i === visibleLines - 1 && (
                  <span className="animate-pulse-glow ml-1">▌</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="w-[400px] max-w-[80vw]">
            <div
              className="h-[2px] rounded-full overflow-hidden"
              style={{ background: 'rgba(0,240,255,0.1)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #00f0ff, #ff00e5)',
                  boxShadow: '0 0 10px #00f0ff, 0 0 20px rgba(0,240,255,0.5)',
                }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-tron-text-dim">{progress}%</span>
              <span className="text-[9px] font-mono text-tron-text-dim">LOADING</span>
            </div>
          </div>

          {/* Creator credit */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-8 text-[9px] font-mono tracking-[0.3em]"
            style={{ color: 'rgba(0,240,255,0.3)' }}
          >
            CREATED BY PRABHAT TEOTIA
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
