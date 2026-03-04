'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — TopNav HUD Bar
// ═══════════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { Search, Filter, Trophy, Info, RotateCw, BarChart3, Grid3X3, List, GitBranch } from 'lucide-react';
import { useUSGStore } from '@/lib/store';

export default function TopNav() {
  const showSearch = useUSGStore((s) => s.showSearch);
  const showFilters = useUSGStore((s) => s.showFilters);
  const showLeaderboard = useUSGStore((s) => s.showLeaderboard);
  const showAbout = useUSGStore((s) => s.showAbout);
  const globeAutoRotate = useUSGStore((s) => s.globeAutoRotate);
  const viewMode = useUSGStore((s) => s.viewMode);
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const repos = useUSGStore((s) => s.repos);

  const setShowSearch = useUSGStore((s) => s.setShowSearch);
  const setShowFilters = useUSGStore((s) => s.setShowFilters);
  const setShowLeaderboard = useUSGStore((s) => s.setShowLeaderboard);
  const setShowAbout = useUSGStore((s) => s.setShowAbout);
  const setGlobeAutoRotate = useUSGStore((s) => s.setGlobeAutoRotate);
  const setViewMode = useUSGStore((s) => s.setViewMode);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4"
      style={{
        background: 'linear-gradient(180deg, rgba(3,8,20,0.95) 0%, rgba(3,8,20,0.7) 100%)',
        borderBottom: '1px solid rgba(0,240,255,0.15)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative">
            <GitBranch
              size={24}
              className="text-tron-cyan"
              style={{ filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.6))' }}
            />
          </div>
          <div>
            <h1
              className="text-sm font-bold tracking-wider glow-text-cyan"
              style={{ fontFamily: 'monospace', color: '#00f0ff' }}
            >
              UNITED STATES OF GIT
            </h1>
            <p className="text-[9px] tracking-[0.3em] text-tron-text-dim" style={{ fontFamily: 'monospace' }}>
              BY PRABHAT TEOTIA
            </p>
          </div>
        </motion.div>

        {/* Status indicators */}
        <div className="hidden md:flex items-center gap-3 ml-6 text-[10px] font-mono text-tron-text-dim">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tron-green animate-pulse-glow" />
            LIVE
          </span>
          <span>{filteredRepos.length}/{repos.length} REPOS</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* View Mode Switcher */}
        <div className="hidden sm:flex items-center neon-border rounded-lg mr-2 overflow-hidden">
          {[
            { mode: '3d' as const, icon: Grid3X3, label: '3D' },
            { mode: 'map' as const, icon: BarChart3, label: 'MAP' },
            { mode: 'list' as const, icon: List, label: 'LIST' },
          ].map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-2.5 py-1.5 text-[10px] font-mono flex items-center gap-1 transition-all"
              style={{
                background: viewMode === mode ? 'rgba(0,240,255,0.15)' : 'transparent',
                color: viewMode === mode ? '#00f0ff' : '#5a7a9a',
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <HUDButton icon={Search} active={showSearch} onClick={() => setShowSearch(!showSearch)} tooltip="Search" />
        <HUDButton icon={Filter} active={showFilters} onClick={() => setShowFilters(!showFilters)} tooltip="Filters" />
        <HUDButton icon={Trophy} active={showLeaderboard} onClick={() => setShowLeaderboard(!showLeaderboard)} tooltip="Leaderboard" />
        <HUDButton
          icon={RotateCw}
          active={globeAutoRotate}
          onClick={() => setGlobeAutoRotate(!globeAutoRotate)}
          tooltip="Auto Rotate"
        />
        <HUDButton icon={Info} active={showAbout} onClick={() => setShowAbout(!showAbout)} tooltip="About" />
      </div>
    </motion.header>
  );
}

function HUDButton({
  icon: Icon,
  active,
  onClick,
  tooltip,
}: {
  icon: React.ComponentType<{ size?: number }>;
  active: boolean;
  onClick: () => void;
  tooltip: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative p-2 rounded-lg transition-all group"
      title={tooltip}
      style={{
        background: active ? 'rgba(0,240,255,0.12)' : 'transparent',
        border: `1px solid ${active ? 'rgba(0,240,255,0.4)' : 'transparent'}`,
        color: active ? '#00f0ff' : '#5a7a9a',
      }}
    >
      <Icon size={16} />
      {active && (
        <span
          className="absolute inset-0 rounded-lg"
          style={{
            boxShadow: '0 0 12px rgba(0,240,255,0.2)',
            pointerEvents: 'none',
          }}
        />
      )}
    </motion.button>
  );
}
