'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Main Page
//  The primary view with globe, HUD, and all panels
// ═══════════════════════════════════════════════════════

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence } from 'framer-motion';
import { useUSGStore } from '@/lib/store';
import { useLiveRepos } from '@/lib/use-live-repos';
import TopNav from '@/components/ui/TopNav';
import BottomHUD from '@/components/ui/BottomHUD';
import RepoDetailPanel from '@/components/ui/RepoDetailPanel';
import LeaderboardPanel from '@/components/ui/LeaderboardPanel';
import SearchBar from '@/components/ui/SearchBar';
import FilterPanel from '@/components/ui/FilterPanel';
import AboutModal from '@/components/ui/AboutModal';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MapView from '@/components/ui/MapView';
import ListView from '@/components/ui/ListView';

// Dynamically import the 3D scene (no SSR for Three.js)
const GlobeScene = dynamic(() => import('@/components/3d/GlobeScene'), {
  ssr: false,
  loading: () => null,
});

export default function HomePage() {
  const [isBooting, setIsBooting] = useState(true);
  const viewMode = useUSGStore((s) => s.viewMode);

  // Live data hook — fetches from GitHub API, polls for updates, SSE for real-time
  const {
    isInitialLoad,
    lastUpdated,
    repoCount: liveRepoCount,
    pagesLoaded,
    sseConnected,
    eventCount,
    isFetching,
    error,
    refresh,
    loadMore,
  } = useLiveRepos({
    pollInterval: 60_000,       // Poll every 60 seconds
    initialMode: 'all',         // Fetch top + trending + recent
    initialPages: 3,            // Load 3 pages initially (~300 repos)
    enableSSE: true,            // Enable real-time event stream
    enablePolling: true,        // Enable periodic polling
  });

  useEffect(() => {
    // Boot sequence: show loading screen for 2.8s or until first data arrives
    const bootTimer = setTimeout(() => {
      setIsBooting(false);
    }, 2800);

    return () => clearTimeout(bootTimer);
  }, []);

  // End boot early if data loaded before timeout
  useEffect(() => {
    if (!isInitialLoad && liveRepoCount > 0) {
      // Give a small delay so the boot animation looks intentional
      const timer = setTimeout(() => setIsBooting(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad, liveRepoCount]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Tron grid background */}
      <div className="tron-grid-bg" />

      {/* Loading / Boot sequence */}
      <LoadingScreen isLoading={isBooting} />

      {/* 3D Globe — always mounted, hidden via CSS to prevent Canvas remount */}
      <div
        className="absolute inset-0"
        style={{
          visibility: viewMode === '3d' ? 'visible' : 'hidden',
          pointerEvents: viewMode === '3d' ? 'auto' : 'none',
        }}
      >
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-xs font-mono text-tron-cyan animate-pulse-glow">
              INITIALIZING 3D ENGINE...
            </div>
          </div>
        }>
          <GlobeScene />
        </Suspense>
      </div>

      {/* Alternative views: Map / List — these mount/unmount normally */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' && <MapView key="map" />}
        {viewMode === 'list' && <ListView key="list" />}
      </AnimatePresence>

      {/* Scanline overlay for CRT effect */}
      <div className="scanline-overlay" />

      {/* Top Navigation HUD */}
      <TopNav />

      {/* Bottom Statistics Bar */}
      <BottomHUD />

      {/* Side Panels */}
      <RepoDetailPanel />
      <LeaderboardPanel />
      <FilterPanel />

      {/* Overlays */}
      <SearchBar />
      <AboutModal />

      {/* Live Status Indicator */}
      <LiveStatusBadge
        sseConnected={sseConnected}
        eventCount={eventCount}
        repoCount={liveRepoCount}
        pagesLoaded={pagesLoaded}
        lastUpdated={lastUpdated}
        isFetching={isFetching}
        error={error}
        onRefresh={refresh}
        onLoadMore={loadMore}
      />

      {/* Corner decorations */}
      <CornerDecor position="top-left" />
      <CornerDecor position="top-right" />
      <CornerDecor position="bottom-left" />
      <CornerDecor position="bottom-right" />
    </main>
  );
}

function LiveStatusBadge({
  sseConnected,
  eventCount,
  repoCount,
  pagesLoaded,
  lastUpdated,
  isFetching,
  error,
  onRefresh,
  onLoadMore,
}: {
  sseConnected: boolean;
  eventCount: number;
  repoCount: number;
  pagesLoaded: number;
  lastUpdated: number | null;
  isFetching: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onLoadMore: () => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  const timeSinceUpdate = lastUpdated
    ? Math.round((Date.now() - lastUpdated) / 1000)
    : null;

  // Auto-update the "last updated" display
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed top-16 right-4 z-40">
      {/* Compact badge */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 hover:scale-105"
        style={{
          background: 'rgba(0,0,0,0.7)',
          borderColor: error
            ? 'rgba(255,59,92,0.5)'
            : sseConnected
            ? 'rgba(57,255,20,0.5)'
            : 'rgba(0,240,255,0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Status dot */}
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: error
              ? '#ff3b5c'
              : sseConnected
              ? '#39ff14'
              : isFetching
              ? '#ffe600'
              : '#00f0ff',
            boxShadow: `0 0 6px ${error ? '#ff3b5c' : sseConnected ? '#39ff14' : '#00f0ff'}`,
            animation: isFetching ? 'pulse-glow 1s infinite' : undefined,
          }}
        />

        <span
          className="text-xs font-mono"
          style={{ color: error ? '#ff3b5c' : '#00f0ff' }}
        >
          {error ? 'ERROR' : isFetching ? 'SYNCING' : 'LIVE'}
        </span>

        <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {repoCount.toLocaleString()} repos
        </span>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div
          className="mt-2 p-4 rounded-lg border"
          style={{
            background: 'rgba(0,5,15,0.9)',
            borderColor: 'rgba(0,240,255,0.2)',
            backdropFilter: 'blur(20px)',
            minWidth: '260px',
          }}
        >
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span>REPOS LOADED</span>
              <span style={{ color: '#00f0ff' }}>{repoCount.toLocaleString()}</span>
            </div>

            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span>PAGES FETCHED</span>
              <span style={{ color: '#00f0ff' }}>{pagesLoaded}</span>
            </div>

            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span>SSE STREAM</span>
              <span style={{ color: sseConnected ? '#39ff14' : '#ff3b5c' }}>
                {sseConnected ? 'CONNECTED' : 'DISCONNECTED'}
              </span>
            </div>

            <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span>EVENTS RX</span>
              <span style={{ color: '#ffe600' }}>{eventCount}</span>
            </div>

            {timeSinceUpdate !== null && (
              <div className="flex justify-between" style={{ color: 'rgba(255,255,255,0.7)' }}>
                <span>LAST UPDATE</span>
                <span style={{ color: '#00f0ff' }}>
                  {timeSinceUpdate < 60
                    ? `${timeSinceUpdate}s ago`
                    : `${Math.round(timeSinceUpdate / 60)}m ago`}
                </span>
              </div>
            )}

            {error && (
              <div className="mt-1 p-2 rounded text-xs" style={{ background: 'rgba(255,59,92,0.1)', color: '#ff3b5c' }}>
                {error}
              </div>
            )}

            <div className="flex gap-2 mt-3">
              <button
                onClick={onRefresh}
                disabled={isFetching}
                className="flex-1 py-1.5 rounded text-xs font-bold transition-all duration-200 disabled:opacity-40"
                style={{
                  background: 'rgba(0,240,255,0.1)',
                  color: '#00f0ff',
                  border: '1px solid rgba(0,240,255,0.3)',
                }}
              >
                {isFetching ? 'SYNCING...' : 'REFRESH'}
              </button>

              <button
                onClick={onLoadMore}
                disabled={isFetching}
                className="flex-1 py-1.5 rounded text-xs font-bold transition-all duration-200 disabled:opacity-40"
                style={{
                  background: 'rgba(255,0,229,0.1)',
                  color: '#ff00e5',
                  border: '1px solid rgba(255,0,229,0.3)',
                }}
              >
                LOAD MORE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CornerDecor({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const posMap = {
    'top-left': 'top-14 left-0',
    'top-right': 'top-14 right-0',
    'bottom-left': 'bottom-12 left-0',
    'bottom-right': 'bottom-12 right-0',
  };

  const borderMap = {
    'top-left': 'border-t-2 border-l-2',
    'top-right': 'border-t-2 border-r-2',
    'bottom-left': 'border-b-2 border-l-2',
    'bottom-right': 'border-b-2 border-r-2',
  };

  return (
    <div
      className={`fixed ${posMap[position]} w-6 h-6 ${borderMap[position]} pointer-events-none z-20`}
      style={{ borderColor: 'rgba(0,240,255,0.2)' }}
    />
  );
}
