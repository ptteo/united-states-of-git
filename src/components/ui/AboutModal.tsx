'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — About / Info Modal
// ═══════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, Heart, Zap, Globe, Code2, Shield } from 'lucide-react';
import { useUSGStore } from '@/lib/store';

export default function AboutModal() {
  const showAbout = useUSGStore((s) => s.showAbout);
  const setShowAbout = useUSGStore((s) => s.setShowAbout);

  return (
    <AnimatePresence>
      {showAbout && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAbout(false)}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-[90vw] z-50 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(3,8,20,0.97)',
              border: '1px solid rgba(0,240,255,0.2)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 80px rgba(0,0,0,0.7), 0 0 40px rgba(0,240,255,0.08)',
            }}
          >
            <div className="p-6">
              {/* Close */}
              <button
                onClick={() => setShowAbout(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:scale-110 transition-all"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#5a7a9a' }}
              >
                <X size={14} />
              </button>

              {/* Title */}
              <div className="text-center mb-6">
                <h2
                  className="text-2xl font-bold font-mono tracking-wider mb-1 glow-text-cyan"
                  style={{ color: '#00f0ff' }}
                >
                  UNITED STATES OF GIT
                </h2>
                <p className="text-xs font-mono text-tron-text-dim tracking-widest">
                  GLOBAL REPOSITORY SKYLINE VISUALIZER
                </p>
                <div className="flex justify-center mt-3">
                  <span
                    className="text-[10px] font-mono px-3 py-1 rounded-full"
                    style={{ background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.3)', color: '#39ff14' }}
                  >
                    v1.0.0 • OPEN SOURCE
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-tron-text leading-relaxed mb-6">
                A stunning 3D visualization of the world&apos;s most impactful open-source repositories.
                Each tower on the globe represents a GitHub repo — height is determined by stars + contributors,
                color by primary language, and pulse intensity by recent activity.
              </p>

              {/* Features */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { icon: Globe, label: '3D Globe', desc: 'Interactive Tron-themed globe', color: '#00f0ff' },
                  { icon: Zap, label: 'Live Pulse', desc: 'Activity-based animations', color: '#39ff14' },
                  { icon: Code2, label: 'Language Colors', desc: 'Visual language mapping', color: '#ff00e5' },
                  { icon: Shield, label: 'Open Source', desc: 'MIT Licensed', color: '#ffe600' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div
                    key={label}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: `${color}08`,
                      border: `1px solid ${color}15`,
                    }}
                  >
                    <Icon size={14} className="shrink-0 mt-0.5" style={{ color }} />
                    <div>
                      <p className="text-xs font-mono font-bold" style={{ color }}>{label}</p>
                      <p className="text-[10px] text-tron-text-dim">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Links */}
              <div className="flex gap-3">
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(0,240,255,0.1)',
                    border: '1px solid rgba(0,240,255,0.4)',
                    color: '#00f0ff',
                    boxShadow: '0 0 20px rgba(0,240,255,0.1)',
                  }}
                >
                  <Github size={14} />
                  STAR ON GITHUB
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono transition-all hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,0,229,0.08)',
                    border: '1px solid rgba(255,0,229,0.3)',
                    color: '#ff00e5',
                  }}
                >
                  <Heart size={14} />
                  SPONSOR
                </a>
              </div>

              {/* Footer */}
              <p className="text-center text-[10px] font-mono text-tron-text-dim mt-4">
                Made by Prabhat Teotia
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
