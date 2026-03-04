'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Repository Detail Panel
//  Slides in when a tower is clicked
// ═══════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Star, GitFork, Eye, Users, Clock, Scale, ExternalLink,
  AlertCircle, Code2, Globe, Calendar, HardDrive, Tag,
} from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { getLanguageColor, type RepoData } from '@/lib/types';
import { formatNumber } from '@/lib/three-utils';

function StatCard({ icon: Icon, label, value, color = '#00f0ff' }: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        background: 'rgba(0,240,255,0.04)',
        border: '1px solid rgba(0,240,255,0.1)',
      }}
    >
      <span className="shrink-0" style={{ color }}>
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-mono text-tron-text-dim uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold font-mono" style={{ color }}>{value}</p>
      </div>
    </div>
  );
}

function ActivityIndicator({ level }: { level: string }) {
  const config: Record<string, { color: string; label: string; bars: number }> = {
    blazing: { color: '#39ff14', label: 'BLAZING', bars: 5 },
    active: { color: '#00f0ff', label: 'ACTIVE', bars: 4 },
    moderate: { color: '#ffe600', label: 'MODERATE', bars: 3 },
    slow: { color: '#ff6a00', label: 'SLOW', bars: 2 },
    dormant: { color: '#ff3b5c', label: 'DORMANT', bars: 1 },
  };

  const { color, label, bars } = config[level] || config.moderate;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-full transition-all"
            style={{
              height: 6 + i * 3,
              background: i < bars ? color : 'rgba(255,255,255,0.1)',
              boxShadow: i < bars ? `0 0 4px ${color}` : 'none',
            }}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono" style={{ color }}>{label}</span>
    </div>
  );
}

export default function RepoDetailPanel() {
  const selectedRepo = useUSGStore((s) => s.selectedRepo);
  const selectRepo = useUSGStore((s) => s.selectRepo);

  return (
    <AnimatePresence>
      {selectedRepo && (
        <RepoDetail repo={selectedRepo} onClose={() => selectRepo(null)} />
      )}
    </AnimatePresence>
  );
}

function RepoDetail({ repo, onClose }: { repo: RepoData; onClose: () => void }) {
  const langColor = getLanguageColor(repo.language);

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 420, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed right-0 top-14 bottom-0 w-[380px] z-40 overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, rgba(3,8,20,0.96) 0%, rgba(10,22,40,0.96) 100%)',
        borderLeft: '1px solid rgba(0,240,255,0.15)',
        backdropFilter: 'blur(20px)',
        boxShadow: '-20px 0 60px rgba(0,0,0,0.5), -2px 0 20px rgba(0,240,255,0.05)',
      }}
    >
      {/* Header */}
      <div
        className="p-4 relative"
        style={{
          background: `linear-gradient(135deg, ${langColor}10 0%, transparent 60%)`,
          borderBottom: `1px solid ${langColor}30`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg transition-all hover:scale-110"
          style={{
            background: 'rgba(0,240,255,0.08)',
            border: '1px solid rgba(0,240,255,0.2)',
            color: '#5a7a9a',
          }}
        >
          <X size={14} />
        </button>

        {/* Owner info */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={repo.owner.avatarUrl}
            alt={repo.owner.login}
            className="w-10 h-10 rounded-lg"
            style={{
              border: `1px solid ${langColor}40`,
              boxShadow: `0 0 12px ${langColor}20`,
            }}
          />
          <div>
            <a
              href={repo.owner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono hover:underline"
              style={{ color: '#5a7a9a' }}
            >
              {repo.owner.login}
            </a>
            <h2
              className="text-lg font-bold font-mono leading-tight"
              style={{ color: langColor, textShadow: `0 0 12px ${langColor}60` }}
            >
              {repo.name}
            </h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-tron-text leading-relaxed">{repo.description}</p>

        {/* Topics */}
        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {repo.topics.slice(0, 8).map((topic) => (
              <span
                key={topic}
                className="text-[9px] font-mono px-2 py-0.5 rounded-full"
                style={{
                  background: 'rgba(0,240,255,0.08)',
                  border: '1px solid rgba(0,240,255,0.2)',
                  color: '#00f0ff',
                }}
              >
                {topic}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard icon={Star} label="Stars" value={formatNumber(repo.stars)} color="#ffe600" />
          <StatCard icon={GitFork} label="Forks" value={formatNumber(repo.forks)} color="#a855f7" />
          <StatCard icon={Users} label="Contributors" value={formatNumber(repo.contributors)} color="#00f0ff" />
          <StatCard icon={Eye} label="Watchers" value={formatNumber(repo.watchers)} color="#39ff14" />
          <StatCard icon={AlertCircle} label="Issues" value={formatNumber(repo.openIssues)} color="#ff6a00" />
          <StatCard icon={HardDrive} label="Size" value={`${(repo.size / 1024).toFixed(0)} MB`} color="#4d7cff" />
        </div>

        {/* Activity */}
        <div
          className="flex items-center justify-between p-3 rounded-lg mb-4"
          style={{
            background: 'rgba(0,240,255,0.04)',
            border: '1px solid rgba(0,240,255,0.1)',
          }}
        >
          <div className="flex items-center gap-2 text-xs font-mono text-tron-text-dim">
            <Clock size={12} />
            ACTIVITY
          </div>
          <ActivityIndicator level={repo.recentActivity} />
        </div>

        {/* Languages */}
        {repo.languages.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-tron-text-dim mb-2">
              <Code2 size={12} />
              LANGUAGES
            </div>
            {/* Language bar */}
            <div className="flex rounded-full overflow-hidden h-2 mb-2"
              style={{ border: '1px solid rgba(0,240,255,0.15)' }}
            >
              {repo.languages.map((lang) => (
                <div
                  key={lang.name}
                  style={{
                    width: `${lang.percentage}%`,
                    background: lang.color,
                    boxShadow: `0 0 6px ${lang.color}80`,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {repo.languages.map((lang) => (
                <span key={lang.name} className="flex items-center gap-1 text-[10px] font-mono">
                  <span className="w-2 h-2 rounded-full" style={{ background: lang.color }} />
                  <span style={{ color: lang.color }}>{lang.name}</span>
                  <span className="text-tron-text-dim">{lang.percentage}%</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className="space-y-2 mb-4">
          {repo.license && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <Scale size={12} className="text-tron-text-dim" />
              <span className="text-tron-text-dim">License:</span>
              <span className="text-tron-cyan">{repo.license}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Calendar size={12} className="text-tron-text-dim" />
            <span className="text-tron-text-dim">Created:</span>
            <span className="text-tron-text">{new Date(repo.createdAt).toLocaleDateString()}</span>
          </div>
          {repo.location && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <Globe size={12} className="text-tron-text-dim" />
              <span className="text-tron-text-dim">Location:</span>
              <span className="text-tron-text">{repo.location.city}, {repo.location.country}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs font-mono">
            <Tag size={12} className="text-tron-text-dim" />
            <span className="text-tron-text-dim">Branch:</span>
            <span className="text-tron-text">{repo.defaultBranch}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <a
            href={repo.url}
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
            <ExternalLink size={14} />
            VIEW ON GITHUB
          </a>
          {repo.homepage && (
            <a
              href={repo.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono transition-all hover:scale-[1.02]"
              style={{
                background: 'rgba(255,0,229,0.08)',
                border: '1px solid rgba(255,0,229,0.3)',
                color: '#ff00e5',
              }}
            >
              <Globe size={14} />
              SITE
            </a>
          )}
        </div>

        {/* Tower stats */}
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(0,240,255,0.05) 0%, rgba(255,0,229,0.05) 100%)',
            border: '1px solid rgba(0,240,255,0.08)',
          }}
        >
          <p className="text-[9px] font-mono text-tron-text-dim tracking-wider mb-2">TOWER METRICS</p>
          <div className="flex justify-between text-xs font-mono">
            <div>
              <p className="text-tron-text-dim">Height</p>
              <p className="text-tron-cyan font-bold">{repo.towerHeight.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-tron-text-dim">Glow</p>
              <p className="text-tron-magenta font-bold">{(repo.glowIntensity * 100).toFixed(0)}%</p>
            </div>
            <div>
              <p className="text-tron-text-dim">Color</p>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm" style={{ background: langColor, boxShadow: `0 0 6px ${langColor}` }} />
                <span style={{ color: langColor }}>{repo.language || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
