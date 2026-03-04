'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Leaderboard Panel
// ═══════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Users, X } from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { getLanguageColor } from '@/lib/types';
import { formatNumber } from '@/lib/three-utils';

export default function LeaderboardPanel() {
  const showLeaderboard = useUSGStore((s) => s.showLeaderboard);
  const setShowLeaderboard = useUSGStore((s) => s.setShowLeaderboard);
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const selectRepo = useUSGStore((s) => s.selectRepo);

  // Top 15 by combined score
  const leaderboard = [...filteredRepos]
    .sort((a, b) => {
      const scoreA = a.stars + a.contributors * 10;
      const scoreB = b.stars + b.contributors * 10;
      return scoreB - scoreA;
    })
    .slice(0, 15);

  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-14 bottom-0 w-[340px] z-40 overflow-hidden flex flex-col"
          style={{
            background: 'linear-gradient(180deg, rgba(3,8,20,0.96) 0%, rgba(10,22,40,0.96) 100%)',
            borderRight: '1px solid rgba(0,240,255,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '20px 0 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4"
            style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Trophy
                size={16}
                style={{ color: '#ffe600', filter: 'drop-shadow(0 0 6px rgba(255,230,0,0.6))' }}
              />
              <h2 className="text-sm font-bold font-mono tracking-wider glow-text-cyan" style={{ color: '#00f0ff' }}>
                LEADERBOARD
              </h2>
            </div>
            <button
              onClick={() => setShowLeaderboard(false)}
              className="p-1.5 rounded-lg transition-all hover:scale-110"
              style={{
                background: 'rgba(0,240,255,0.08)',
                border: '1px solid rgba(0,240,255,0.2)',
                color: '#5a7a9a',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2">
            {leaderboard.map((repo, index) => {
              const langColor = getLanguageColor(repo.language);
              const rankColors = ['#ffe600', '#c0c0c0', '#cd7f32'];
              const rankColor = index < 3 ? rankColors[index] : '#5a7a9a';

              return (
                <motion.button
                  key={repo.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    selectRepo(repo);
                    setShowLeaderboard(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg mb-1 text-left transition-all group"
                  style={{
                    background: 'rgba(0,240,255,0.02)',
                    border: '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,240,255,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(0,240,255,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,240,255,0.02)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  {/* Rank */}
                  <div
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold font-mono shrink-0"
                    style={{
                      background: `${rankColor}15`,
                      border: `1px solid ${rankColor}40`,
                      color: rankColor,
                      textShadow: index < 3 ? `0 0 6px ${rankColor}80` : 'none',
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: langColor, boxShadow: `0 0 4px ${langColor}` }}
                      />
                      <p className="text-xs font-mono font-bold truncate" style={{ color: langColor }}>
                        {repo.fullName}
                      </p>
                    </div>
                    <p className="text-[10px] text-tron-text-dim truncate mt-0.5 font-mono">
                      {repo.description?.slice(0, 60)}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: '#ffe600' }}>
                      <Star size={10} />
                      {formatNumber(repo.stars)}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: '#00f0ff' }}>
                      <Users size={10} />
                      {formatNumber(repo.contributors)}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Footer glow line */}
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(0,240,255,0.3), transparent)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
