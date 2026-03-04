'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Search Bar
// ═══════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Star, Users } from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { getLanguageColor } from '@/lib/types';
import { formatNumber } from '@/lib/three-utils';

export default function SearchBar() {
  const showSearch = useUSGStore((s) => s.showSearch);
  const setShowSearch = useUSGStore((s) => s.setShowSearch);
  const updateFilter = useUSGStore((s) => s.updateFilter);
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const selectRepo = useUSGStore((s) => s.selectRepo);
  const filters = useUSGStore((s) => s.filters);

  const [query, setQuery] = useState(filters.searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter('searchQuery', query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, updateFilter]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(!showSearch);
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showSearch, setShowSearch]);

  return (
    <AnimatePresence>
      {showSearch && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearch(false)}
            className="fixed inset-0 z-50"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          />

          {/* Search panel */}
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-[560px] max-w-[90vw] z-50 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(3,8,20,0.96)',
              border: '1px solid rgba(0,240,255,0.25)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(0,240,255,0.08)',
            }}
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(0,240,255,0.1)' }}>
              <Search size={16} style={{ color: '#00f0ff', filter: 'drop-shadow(0 0 4px rgba(0,240,255,0.5))' }} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search repositories..."
                className="flex-1 bg-transparent text-sm font-mono text-tron-text outline-none placeholder:text-tron-text-dim"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 text-tron-text-dim hover:text-tron-cyan">
                  <X size={14} />
                </button>
              )}
              <kbd
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(0,240,255,0.08)',
                  border: '1px solid rgba(0,240,255,0.15)',
                  color: '#5a7a9a',
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query && filteredRepos.length === 0 && (
                <div className="p-8 text-center text-sm font-mono text-tron-text-dim">
                  No repositories found
                </div>
              )}
              {filteredRepos.slice(0, 20).map((repo) => {
                const langColor = getLanguageColor(repo.language);
                return (
                  <button
                    key={repo.id}
                    onClick={() => {
                      selectRepo(repo);
                      setShowSearch(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                    style={{ borderBottom: '1px solid rgba(0,240,255,0.05)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,240,255,0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <img
                      src={repo.owner.avatarUrl}
                      alt=""
                      className="w-8 h-8 rounded-lg"
                      style={{ border: `1px solid ${langColor}30` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: langColor }} />
                        <span className="text-xs font-mono font-bold" style={{ color: langColor }}>
                          {repo.fullName}
                        </span>
                      </div>
                      <p className="text-[10px] text-tron-text-dim truncate mt-0.5">
                        {repo.description?.slice(0, 80)}
                      </p>
                    </div>
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
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div
              className="px-4 py-2 flex items-center justify-between text-[10px] font-mono text-tron-text-dim"
              style={{ borderTop: '1px solid rgba(0,240,255,0.1)' }}
            >
              <span>{filteredRepos.length} results</span>
              <span>
                <kbd className="px-1 py-0.5 rounded" style={{ background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.15)' }}>⌘K</kbd>
                {' '}to toggle
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
