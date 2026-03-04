'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — List View
//  A sortable, scrollable table of repos with Tron styling.
//  Created by Prabhat Teotia
// ═══════════════════════════════════════════════════════

import { useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, GitFork, Users, Clock, ArrowUpDown,
  ArrowUp, ArrowDown, ExternalLink, Zap, MapPin,
} from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { getLanguageColor, type SortOption } from '@/lib/types';
import { formatNumber } from '@/lib/three-utils';

type ColSort = { key: SortOption; dir: 'asc' | 'desc' };

export default function ListView() {
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const selectRepo = useUSGStore((s) => s.selectRepo);
  const selectedRepo = useUSGStore((s) => s.selectedRepo);

  const [sort, setSort] = useState<ColSort>({ key: 'stars', dir: 'desc' });

  const toggleSort = useCallback((key: SortOption) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { key, dir: 'desc' }
    );
  }, []);

  const sorted = useMemo(() => {
    const list = [...filteredRepos];
    list.sort((a, b) => {
      let va: number | string = 0;
      let vb: number | string = 0;
      switch (sort.key) {
        case 'stars': va = a.stars; vb = b.stars; break;
        case 'forks': va = a.forks; vb = b.forks; break;
        case 'contributors': va = a.contributors; vb = b.contributors; break;
        case 'recent': va = new Date(a.pushedAt).getTime(); vb = new Date(b.pushedAt).getTime(); break;
        case 'name': va = a.fullName.toLowerCase(); vb = b.fullName.toLowerCase(); break;
      }
      if (typeof va === 'string' && typeof vb === 'string') {
        return sort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      return sort.dir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
    });
    return list;
  }, [filteredRepos, sort]);

  const SortIcon = ({ col }: { col: SortOption }) => {
    if (sort.key !== col) return <ArrowUpDown size={11} className="opacity-30" />;
    return sort.dir === 'desc'
      ? <ArrowDown size={11} className="text-cyan-400" />
      : <ArrowUp size={11} className="text-cyan-400" />;
  };

  const activityBadge = (level: string) => {
    const colors: Record<string, string> = {
      blazing: '#ff00e5',
      active: '#39ff14',
      moderate: '#ffe600',
      slow: '#4d7cff',
      dormant: '#555',
    };
    const c = colors[level] || '#555';
    return (
      <span
        className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest"
        style={{ background: `${c}15`, color: c, border: `1px solid ${c}30` }}
      >
        {level}
      </span>
    );
  };

  const timeAgo = (d: string) => {
    const ms = Date.now() - new Date(d).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d`;
    return `${Math.floor(days / 30)}mo`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 overflow-hidden"
      style={{ paddingTop: '56px', paddingBottom: '48px' }}
    >
      <div className="h-full overflow-auto px-2 sm:px-6 py-3 custom-scrollbar">
        {/* Header Stats */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500 tracking-widest uppercase">
              {sorted.length} repositories
            </span>
          </div>
          <span className="text-[9px] font-mono text-gray-600 tracking-widest">
            USG • LIST MODE • BY PRABHAT TEOTIA
          </span>
        </div>

        {/* Table */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            border: '1px solid rgba(0,240,255,0.1)',
            background: 'rgba(3,8,20,0.7)',
          }}
        >
          {/* Table head — responsive: hide some columns on small screens */}
          <div
            className="hidden md:grid items-center px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-500"
            style={{
              gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px 90px',
              borderBottom: '1px solid rgba(0,240,255,0.08)',
              background: 'rgba(0,240,255,0.03)',
            }}
          >
            <button className="flex items-center gap-1 text-left hover:text-cyan-400 transition-colors" onClick={() => toggleSort('name')}>
              Repository <SortIcon col="name" />
            </button>
            <span>Language</span>
            <button className="flex items-center gap-1 justify-end hover:text-cyan-400 transition-colors" onClick={() => toggleSort('stars')}>
              <Star size={10} /> Stars <SortIcon col="stars" />
            </button>
            <button className="flex items-center gap-1 justify-end hover:text-cyan-400 transition-colors" onClick={() => toggleSort('forks')}>
              <GitFork size={10} /> Forks <SortIcon col="forks" />
            </button>
            <button className="flex items-center gap-1 justify-end hover:text-cyan-400 transition-colors" onClick={() => toggleSort('contributors')}>
              <Users size={10} /> Contribs <SortIcon col="contributors" />
            </button>
            <button className="flex items-center gap-1 justify-end hover:text-cyan-400 transition-colors" onClick={() => toggleSort('recent')}>
              <Clock size={10} /> Updated <SortIcon col="recent" />
            </button>
            <span className="text-center">Activity</span>
          </div>

          {/* Mobile header */}
          <div
            className="flex md:hidden items-center justify-between px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-gray-500"
            style={{
              borderBottom: '1px solid rgba(0,240,255,0.08)',
              background: 'rgba(0,240,255,0.03)',
            }}
          >
            <button className="flex items-center gap-1 hover:text-cyan-400" onClick={() => toggleSort('name')}>REPO <SortIcon col="name" /></button>
            <button className="flex items-center gap-1 hover:text-cyan-400" onClick={() => toggleSort('stars')}><Star size={10} /> <SortIcon col="stars" /></button>
            <span>Activity</span>
          </div>

          {/* Table body */}
          <AnimatePresence>
            {sorted.map((repo, i) => {
              const langColor = getLanguageColor(repo.language);
              const isSelected = selectedRepo?.id === repo.id;
              return (
                <div key={repo.id}>
                  {/* Desktop row */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 0.5) }}
                    className="hidden md:grid items-center px-3 py-2 cursor-pointer transition-all duration-150 group"
                    style={{
                      gridTemplateColumns: '2fr 1fr 80px 80px 80px 80px 90px',
                      borderBottom: '1px solid rgba(0,240,255,0.04)',
                      background: isSelected
                        ? 'rgba(0,240,255,0.06)'
                        : 'transparent',
                    }}
                    onClick={() => selectRepo(isSelected ? null : repo)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        isSelected ? 'rgba(0,240,255,0.08)' : 'rgba(0,240,255,0.03)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        isSelected ? 'rgba(0,240,255,0.06)' : 'transparent';
                    }}
                  >
                  {/* Repo name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      src={repo.owner.avatarUrl}
                      alt={repo.owner.login}
                      width={22}
                      height={22}
                      className="rounded-full ring-1 ring-cyan-900/30 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-gray-300 truncate group-hover:text-cyan-400 transition-colors">
                          {repo.fullName}
                        </span>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-60 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={10} className="text-gray-500" />
                        </a>
                      </div>
                      {repo.description && (
                        <p className="text-[10px] text-gray-600 truncate max-w-xs mt-0.5">
                          {repo.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Language */}
                  <div className="flex items-center gap-1.5">
                    {repo.language && (
                      <>
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{
                            background: langColor,
                            boxShadow: `0 0 6px ${langColor}40`,
                          }}
                        />
                        <span className="text-[11px] font-mono" style={{ color: langColor }}>
                          {repo.language}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Stars */}
                  <span className="text-xs font-mono text-yellow-400/80 text-right">
                    {formatNumber(repo.stars)}
                  </span>

                  {/* Forks */}
                  <span className="text-xs font-mono text-purple-400/80 text-right">
                    {formatNumber(repo.forks)}
                  </span>

                  {/* Contributors */}
                  <span className="text-xs font-mono text-cyan-400/80 text-right">
                    {formatNumber(repo.contributors)}
                  </span>

                  {/* Updated */}
                  <span className="text-[11px] font-mono text-gray-500 text-right">
                    {timeAgo(repo.pushedAt)}
                  </span>

                  {/* Activity */}
                  <div className="text-center">
                    {activityBadge(repo.recentActivity)}
                  </div>
                  </motion.div>

                  {/* Mobile card row */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.01, 0.5) }}
                    className="flex md:hidden items-center justify-between px-3 py-2.5 cursor-pointer"
                    style={{
                      borderBottom: '1px solid rgba(0,240,255,0.04)',
                      background: isSelected ? 'rgba(0,240,255,0.06)' : 'transparent',
                    }}
                    onClick={() => selectRepo(isSelected ? null : repo)}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Image src={repo.owner.avatarUrl} alt={repo.owner.login} width={20} height={20} className="rounded-full ring-1 ring-cyan-900/30 flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[11px] font-mono text-gray-300 truncate block">{repo.fullName}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {repo.language && (
                            <span className="text-[9px] font-mono" style={{ color: langColor }}>● {repo.language}</span>
                          )}
                          <span className="text-[9px] font-mono text-yellow-400/80">★ {formatNumber(repo.stars)}</span>
                          <span className="text-[9px] font-mono text-purple-400/80">◆ {formatNumber(repo.forks)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">{activityBadge(repo.recentActivity)}</div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>

          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-600 font-mono text-xs">
              No repos match your filters.
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,240,255,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,240,255,0.15);
          border-radius: 2px;
        }
      `}</style>
    </motion.div>
  );
}
