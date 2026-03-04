'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Bottom Stats HUD
//  Shows live statistics at the bottom of the screen
// ═══════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Activity, Star, Users, GitFork, Globe, Zap } from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { formatNumber } from '@/lib/three-utils';

export default function BottomHUD() {
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const hoveredRepo = useUSGStore((s) => s.hoveredRepo);

  const totalStars = filteredRepos.reduce((sum, r) => sum + r.stars, 0);
  const totalForks = filteredRepos.reduce((sum, r) => sum + r.forks, 0);
  const totalContributors = filteredRepos.reduce((sum, r) => sum + r.contributors, 0);
  const uniqueLanguages = new Set(filteredRepos.map((r) => r.language).filter(Boolean)).size;
  const blazingCount = filteredRepos.filter((r) => r.recentActivity === 'blazing').length;

  const stats = [
    { icon: Star, label: 'TOTAL STARS', value: formatNumber(totalStars), color: '#ffe600' },
    { icon: GitFork, label: 'TOTAL FORKS', value: formatNumber(totalForks), color: '#a855f7' },
    { icon: Users, label: 'CONTRIBUTORS', value: formatNumber(totalContributors), color: '#00f0ff' },
    { icon: Globe, label: 'LANGUAGES', value: uniqueLanguages.toString(), color: '#39ff14' },
    { icon: Zap, label: 'BLAZING', value: blazingCount.toString(), color: '#ff6a00' },
  ];

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4"
      style={{
        background: 'linear-gradient(0deg, rgba(3,8,20,0.95) 0%, rgba(3,8,20,0.7) 100%)',
        borderTop: '1px solid rgba(0,240,255,0.1)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Stats */}
      <div className="flex items-center gap-4">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon size={12} style={{ color, filter: `drop-shadow(0 0 4px ${color}60)` }} />
            <div className="hidden lg:block">
              <p className="text-[8px] font-mono text-tron-text-dim tracking-wider">{label}</p>
            </div>
            <p className="text-xs font-mono font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Hovered repo indicator */}
      <div className="flex items-center gap-2">
        {hoveredRepo ? (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1 rounded-lg"
            style={{
              background: 'rgba(0,240,255,0.06)',
              border: '1px solid rgba(0,240,255,0.15)',
            }}
          >
            <Activity size={10} className="text-tron-cyan animate-pulse-glow" />
            <span className="text-[10px] font-mono text-tron-cyan">{hoveredRepo.fullName}</span>
            <span className="text-[10px] font-mono text-tron-text-dim">★ {formatNumber(hoveredRepo.stars)}</span>
          </motion.div>
        ) : (
          <span className="text-[10px] font-mono text-tron-text-dim">
            CREATED BY PRABHAT TEOTIA
          </span>
        )}
      </div>
    </motion.div>
  );
}
