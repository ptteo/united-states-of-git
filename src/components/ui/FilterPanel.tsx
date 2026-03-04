'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Filter Panel
// ═══════════════════════════════════════════════════════

import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, RotateCcw } from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { LANGUAGE_COLORS, type ActivityLevel, type SortOption } from '@/lib/types';

const LANGUAGES = Object.keys(LANGUAGE_COLORS).filter((l) => l !== 'default');
const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; color: string }[] = [
  { value: 'blazing', label: 'Blazing', color: '#39ff14' },
  { value: 'active', label: 'Active', color: '#00f0ff' },
  { value: 'moderate', label: 'Moderate', color: '#ffe600' },
  { value: 'slow', label: 'Slow', color: '#ff6a00' },
  { value: 'dormant', label: 'Dormant', color: '#ff3b5c' },
];
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'stars', label: 'Stars' },
  { value: 'forks', label: 'Forks' },
  { value: 'contributors', label: 'Contributors' },
  { value: 'recent', label: 'Recent Activity' },
  { value: 'name', label: 'Name' },
];

export default function FilterPanel() {
  const showFilters = useUSGStore((s) => s.showFilters);
  const setShowFilters = useUSGStore((s) => s.setShowFilters);
  const filters = useUSGStore((s) => s.filters);
  const updateFilter = useUSGStore((s) => s.updateFilter);
  const resetFilters = useUSGStore((s) => s.resetFilters);

  const toggleLanguage = (lang: string) => {
    const current = filters.languages;
    if (current.includes(lang)) {
      updateFilter('languages', current.filter((l) => l !== lang));
    } else {
      updateFilter('languages', [...current, lang]);
    }
  };

  const toggleActivity = (level: ActivityLevel) => {
    const current = filters.activityLevel;
    if (current.includes(level)) {
      updateFilter('activityLevel', current.filter((l) => l !== level));
    } else {
      updateFilter('activityLevel', [...current, level]);
    }
  };

  return (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ x: -380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -380, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-14 bottom-0 w-[320px] z-40 overflow-y-auto flex flex-col"
          style={{
            background: 'linear-gradient(180deg, rgba(3,8,20,0.96) 0%, rgba(10,22,40,0.96) 100%)',
            borderRight: '1px solid rgba(0,240,255,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '20px 0 60px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
            <div className="flex items-center gap-2">
              <Filter size={16} style={{ color: '#00f0ff', filter: 'drop-shadow(0 0 6px rgba(0,240,255,0.6))' }} />
              <h2 className="text-sm font-bold font-mono tracking-wider" style={{ color: '#00f0ff' }}>FILTERS</h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={resetFilters}
                className="p-1.5 rounded-lg transition-all hover:scale-110"
                style={{ background: 'rgba(255,106,0,0.08)', border: '1px solid rgba(255,106,0,0.2)', color: '#ff6a00' }}
                title="Reset Filters"
              >
                <RotateCcw size={12} />
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1.5 rounded-lg transition-all hover:scale-110"
                style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)', color: '#5a7a9a' }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Sort */}
            <section>
              <label className="text-[10px] font-mono text-tron-text-dim tracking-wider block mb-2">SORT BY</label>
              <div className="grid grid-cols-2 gap-1.5">
                {SORT_OPTIONS.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateFilter('sortBy', value)}
                    className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all"
                    style={{
                      background: filters.sortBy === value ? 'rgba(0,240,255,0.12)' : 'rgba(0,240,255,0.03)',
                      border: `1px solid ${filters.sortBy === value ? 'rgba(0,240,255,0.4)' : 'rgba(0,240,255,0.08)'}`,
                      color: filters.sortBy === value ? '#00f0ff' : '#5a7a9a',
                    }}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => updateFilter('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all"
                  style={{
                    background: 'rgba(255,0,229,0.06)',
                    border: '1px solid rgba(255,0,229,0.2)',
                    color: '#ff00e5',
                  }}
                >
                  {filters.sortOrder === 'desc' ? '↓ DESC' : '↑ ASC'}
                </button>
              </div>
            </section>

            {/* Languages */}
            <section>
              <label className="text-[10px] font-mono text-tron-text-dim tracking-wider block mb-2">
                LANGUAGES {filters.languages.length > 0 && `(${filters.languages.length})`}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => {
                  const color = LANGUAGE_COLORS[lang];
                  const active = filters.languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      onClick={() => toggleLanguage(lang)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono transition-all"
                      style={{
                        background: active ? `${color}18` : 'rgba(0,240,255,0.03)',
                        border: `1px solid ${active ? `${color}50` : 'rgba(0,240,255,0.08)'}`,
                        color: active ? color : '#5a7a9a',
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      {lang}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Min Stars */}
            <section>
              <label className="text-[10px] font-mono text-tron-text-dim tracking-wider block mb-2">
                MIN STARS: {filters.minStars.toLocaleString()}
              </label>
              <input
                type="range"
                min={0}
                max={200000}
                step={1000}
                value={filters.minStars}
                onChange={(e) => updateFilter('minStars', parseInt(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, #00f0ff ${(filters.minStars / 200000) * 100}%, rgba(0,240,255,0.1) 0%)`,
                  accentColor: '#00f0ff',
                }}
              />
            </section>

            {/* Min Contributors */}
            <section>
              <label className="text-[10px] font-mono text-tron-text-dim tracking-wider block mb-2">
                MIN CONTRIBUTORS: {filters.minContributors.toLocaleString()}
              </label>
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={filters.minContributors}
                onChange={(e) => updateFilter('minContributors', parseInt(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(90deg, #ff00e5 ${(filters.minContributors / 5000) * 100}%, rgba(0,240,255,0.1) 0%)`,
                  accentColor: '#ff00e5',
                }}
              />
            </section>

            {/* Activity Level */}
            <section>
              <label className="text-[10px] font-mono text-tron-text-dim tracking-wider block mb-2">
                ACTIVITY LEVEL
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVITY_LEVELS.map(({ value, label, color }) => {
                  const active = filters.activityLevel.includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleActivity(value)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all"
                      style={{
                        background: active ? `${color}15` : 'rgba(0,240,255,0.03)',
                        border: `1px solid ${active ? `${color}50` : 'rgba(0,240,255,0.08)'}`,
                        color: active ? color : '#5a7a9a',
                      }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: color,
                          boxShadow: active ? `0 0 4px ${color}` : 'none',
                        }}
                      />
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
