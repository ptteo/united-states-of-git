'use client';

// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — 2D Map View
//  An interactive flat world map showing repos as dots.
//  Created by Prabhat Teotia
// ═══════════════════════════════════════════════════════

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, GitFork, Users, Zap } from 'lucide-react';
import { useUSGStore } from '@/lib/store';
import { RepoData, getLanguageColor } from '@/lib/types';
import { formatNumber } from '@/lib/three-utils';

// Simplified continent outlines for the 2D map (SVG paths)
const MAP_CONTINENTS_SVG = `
M 85 38 L 82 40 L 78 40 L 74 40 L 70 39 L 67 38 L 64 37
L 62 36 L 60 35 L 57 34 L 55 33 L 53 32 L 52 30 L 51 29
L 50 28 L 48 27 L 46 26 L 43 25 L 40 26 L 38 27 L 36 28
L 37 30 L 36 31 L 35 33 L 33 34 L 31 35 L 32 37 L 35 38
L 37 38 L 39 37 L 40 36 L 42 35 L 43 34 L 45 34 L 47 33
L 48 32 L 50 32 L 53 33 L 56 34 L 59 35 L 62 36 L 65 37
L 68 38 L 72 39 L 75 40 L 78 41 L 80 40 L 82 39 L 85 38
Z
M 57 52 L 55 53 L 54 54 L 52 55 L 50 57 L 49 59 L 47 61
L 46 63 L 45 65 L 44 68 L 43 70 L 42 73 L 41 75 L 42 78
L 43 80 L 44 82 L 46 83 L 49 82 L 51 80 L 53 77 L 54 75
L 55 73 L 56 70 L 56 68 L 57 65 L 58 62 L 58 60 L 58 57
L 57 55 L 57 52 Z
M 93 32 L 95 30 L 97 28 L 100 26 L 103 25 L 105 24 L 108 23
L 110 23 L 113 24 L 116 25 L 118 27 L 120 29 L 122 30
L 123 32 L 124 34 L 125 36 L 125 38 L 124 40 L 122 42
L 120 43 L 118 44 L 116 45 L 113 46 L 110 46 L 108 45
L 105 44 L 103 43 L 101 42 L 99 40 L 97 38 L 95 36
L 93 34 L 93 32 Z
M 90 35 L 88 38 L 85 42 L 82 46 L 80 50 L 78 54
L 76 58 L 74 62 L 73 65 L 72 68 L 72 72 L 73 76
L 75 78 L 78 80 L 80 79 L 82 77 L 84 74 L 85 70
L 86 66 L 87 62 L 88 58 L 89 54 L 90 50 L 91 46
L 92 42 L 92 38 L 90 35 Z
M 130 22 L 128 24 L 126 27 L 125 30 L 124 34 L 123 38
L 122 42 L 120 46 L 118 48 L 116 50 L 114 52 L 112 54
L 110 55 L 108 54 L 106 52 L 110 50 L 112 48 L 115 44
L 118 40 L 120 36 L 122 32 L 125 28 L 128 24 L 130 22 Z
M 148 60 L 146 62 L 144 65 L 142 68 L 140 72 L 139 75
L 140 78 L 142 80 L 145 81 L 148 80 L 150 78 L 152 75
L 153 72 L 153 68 L 152 65 L 150 62 L 148 60 Z
`;

function latLngToMapXY(
  lat: number,
  lng: number,
  width: number,
  height: number
): { x: number; y: number } {
  const x = ((lng + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

interface RepoTooltip {
  repo: RepoData;
  x: number;
  y: number;
}

export default function MapView() {
  const filteredRepos = useUSGStore((s) => s.filteredRepos);
  const selectRepo = useUSGStore((s) => s.selectRepo);
  const selectedRepo = useUSGStore((s) => s.selectedRepo);
  const [tooltip, setTooltip] = useState<RepoTooltip | null>(null);
  const [mapSize] = useState({ width: 960, height: 500 });

  const repoDots = useMemo(() => {
    // Deterministic hash for repos without location
    function hashStr(s: string) {
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
      }
      return h;
    }

    return filteredRepos.map((repo) => {
      let lat: number, lng: number;
      if (repo.location) {
        lat = repo.location.lat;
        lng = repo.location.lng;
      } else {
        // Scatter randomly on the map using deterministic hash
        const h = hashStr(repo.id);
        const h2 = Math.abs((h * 16807) % 2147483647);
        const h3 = Math.abs((h2 * 16807) % 2147483647);
        lat = -60 + (h2 % 12000) / 100;
        lng = -180 + (h3 % 36000) / 100;
      }
      const { x, y } = latLngToMapXY(lat, lng, mapSize.width, mapSize.height);
      const color = getLanguageColor(repo.language);
      const size = Math.max(3, Math.min(12, Math.log10(Math.max(repo.stars, 1)) * 2));
      return { repo, x, y, color, size };
    });
  }, [filteredRepos, mapSize]);

  const handleDotHover = useCallback(
    (repo: RepoData, x: number, y: number) => {
      setTooltip({ repo, x, y });
    },
    []
  );

  const handleDotLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  const handleDotClick = useCallback(
    (repo: RepoData) => {
      selectRepo(selectedRepo?.id === repo.id ? null : repo);
    },
    [selectRepo, selectedRepo]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{ paddingTop: '56px', paddingBottom: '48px' }}
    >
      <div
        className="relative w-full max-w-[960px] mx-auto"
        style={{ aspectRatio: '960/500' }}
      >
        <svg
          viewBox={`0 0 ${mapSize.width} ${mapSize.height}`}
          className="w-full h-full"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,240,255,0.1))' }}
        >
          {/* Background */}
          <rect width={mapSize.width} height={mapSize.height} fill="#030814" rx="8" />

          {/* Grid lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const x = (i + 1) * (mapSize.width / 12);
            return (
              <line
                key={`vg-${i}`}
                x1={x} y1={0} x2={x} y2={mapSize.height}
                stroke="#00f0ff" strokeOpacity={0.05} strokeWidth={0.5}
              />
            );
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const y = (i + 1) * (mapSize.height / 6);
            return (
              <line
                key={`hg-${i}`}
                x1={0} y1={y} x2={mapSize.width} y2={y}
                stroke="#00f0ff" strokeOpacity={0.05} strokeWidth={0.5}
              />
            );
          })}

          {/* Equator */}
          <line
            x1={0} y1={mapSize.height / 2}
            x2={mapSize.width} y2={mapSize.height / 2}
            stroke="#00f0ff" strokeOpacity={0.12} strokeWidth={0.8}
            strokeDasharray="4 4"
          />
          {/* Prime Meridian */}
          <line
            x1={mapSize.width / 2} y1={0}
            x2={mapSize.width / 2} y2={mapSize.height}
            stroke="#00f0ff" strokeOpacity={0.08} strokeWidth={0.5}
            strokeDasharray="4 4"
          />

          {/* Simplified continent outlines drawn as point-based shapes */}
          {renderContinentOutlines(mapSize.width, mapSize.height)}

          {/* Repo dots */}
          {repoDots.map(({ repo, x, y, color, size }) => (
            <g key={repo.id}>
              {/* Glow ring */}
              <circle
                cx={x} cy={y} r={size * 1.8}
                fill={color}
                fillOpacity={0.06}
              />
              {/* Pulse ring for active repos */}
              {(repo.recentActivity === 'blazing' || repo.recentActivity === 'active') && (
                <circle
                  cx={x} cy={y} r={size * 2.5}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.2}
                  strokeWidth={0.5}
                >
                  <animate
                    attributeName="r"
                    from={String(size)}
                    to={String(size * 3)}
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="stroke-opacity"
                    from="0.3"
                    to="0"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Main dot */}
              <circle
                cx={x} cy={y} r={size}
                fill={color}
                fillOpacity={selectedRepo?.id === repo.id ? 1 : 0.7}
                stroke={selectedRepo?.id === repo.id ? '#fff' : color}
                strokeWidth={selectedRepo?.id === repo.id ? 1.5 : 0.5}
                strokeOpacity={0.6}
                className="cursor-pointer transition-all duration-200"
                style={{ filter: `drop-shadow(0 0 ${size}px ${color}60)` }}
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGElement).closest('svg')!.getBoundingClientRect();
                  handleDotHover(
                    repo,
                    (x / mapSize.width) * rect.width + rect.left,
                    (y / mapSize.height) * rect.height + rect.top
                  );
                }}
                onMouseLeave={handleDotLeave}
                onClick={() => handleDotClick(repo)}
              />
            </g>
          ))}

          {/* Map labels */}
          <text x={mapSize.width - 10} y={mapSize.height - 8} textAnchor="end"
            fill="#00f0ff" fillOpacity={0.15} fontSize={9} fontFamily="monospace">
            UNITED STATES OF GIT • MAP MODE • BY PRABHAT TEOTIA
          </text>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed z-50 pointer-events-none"
              style={{
                left: tooltip.x + 12,
                top: tooltip.y - 10,
                transform: 'translateY(-100%)',
              }}
            >
              <div
                className="px-3 py-2 rounded-lg"
                style={{
                  background: 'rgba(3,8,20,0.95)',
                  border: `1px solid ${getLanguageColor(tooltip.repo.language)}40`,
                  backdropFilter: 'blur(12px)',
                  boxShadow: `0 4px 20px rgba(0,0,0,0.5), 0 0 15px ${getLanguageColor(tooltip.repo.language)}15`,
                }}
              >
                <p className="text-xs font-mono font-bold mb-1" style={{ color: getLanguageColor(tooltip.repo.language) }}>
                  {tooltip.repo.fullName}
                </p>
                <div className="flex gap-3 text-[10px] font-mono text-gray-400">
                  <span className="flex items-center gap-1"><Star size={9} className="text-yellow-400" />{formatNumber(tooltip.repo.stars)}</span>
                  <span className="flex items-center gap-1"><GitFork size={9} className="text-purple-400" />{formatNumber(tooltip.repo.forks)}</span>
                  <span className="flex items-center gap-1"><Users size={9} className="text-cyan-400" />{formatNumber(tooltip.repo.contributors)}</span>
                </div>
                {tooltip.repo.language && (
                  <p className="text-[9px] font-mono mt-1" style={{ color: getLanguageColor(tooltip.repo.language) }}>
                    ● {tooltip.repo.language}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// Render simplified continent outlines using known boundary points
function renderContinentOutlines(width: number, height: number) {
  // Simplified continent boundary polylines: [lat, lng][]
  const continents: { name: string; points: [number,number][]; }[] = [
    { name: 'NA', points: [
      [49,-125],[45,-124],[39,-123],[33,-117],[25,-110],[20,-105],[17,-101],[16,-89],[21,-87],[25,-90],[30,-84],[25,-80],[30,-81],[37,-76],[41,-72],[44,-67],[47,-68],[52,-56],[58,-60],[63,-69],[70,-55],[76,-68],[83,-72],[68,-96],[60,-95],[52,-95],[50,-85],[55,-82],[58,-70],[62,-67],[60,-64],
    ]},
    { name: 'SA', points: [
      [12,-72],[8,-77],[2,-80],[-5,-81],[-10,-76],[-16,-75],[-22,-70],[-27,-71],[-33,-72],[-41,-74],[-50,-75],[-55,-66],[-52,-68],[-44,-65],[-36,-57],[-29,-49],[-23,-44],[-18,-39],[-10,-36],[-5,-35],[-2,-42],[0,-50],[5,-52],[8,-63],[12,-72],
    ]},
    { name: 'EU', points: [
      [36,-9],[38,0],[43,5],[46,10],[49,2],[52,5],[56,8],[59,11],[65,12],[70,20],[71,28],[67,41],[60,28],[56,21],[53,14],[50,20],[47,15],[44,12],[41,17],[39,20],[36,28],[42,36],[40,44],
    ]},
    { name: 'AF', points: [
      [37,10],[34,-2],[30,-10],[24,-17],[15,-17],[8,-14],[4,-1],[4,9],[0,10],[-3,12],[-11,17],[-22,26],[-30,28],[-34,26],[-33,18],[-24,14],[-15,12],[-6,12],[0,10],[4,9],[12,-16],[24,-17],[28,-13],[32,-1],[37,10],
    ]},
    { name: 'AF2', points: [
      [37,10],[34,11],[31,25],[27,34],[18,42],[12,44],[8,48],[2,41],[-4,40],[-15,37],[-26,33],[-34,26],
    ]},
    { name: 'AS', points: [
      [53,87],[47,83],[40,74],[35,73],[29,81],[26,89],[22,97],[20,100],[22,108],[25,110],[30,121],[37,122],[43,131],[48,135],[54,130],[60,131],[62,120],[55,97],[53,87],
    ]},
    { name: 'IN', points: [
      [35,73],[30,68],[24,72],[20,73],[13,75],[8,77],[10,80],[16,82],[21,87],[26,89],[29,81],[33,74],[35,73],
    ]},
    { name: 'AU', points: [
      [-12,132],[-16,138],[-19,147],[-27,153],[-35,151],[-39,147],[-36,137],[-33,134],[-34,116],[-27,114],[-20,119],[-15,130],[-12,132],
    ]},
    { name: 'JP', points: [
      [31,131],[35,134],[38,140],[44,145],[45,142],[40,140],[35,135],[31,131],
    ]},
  ];

  return continents.map((c) => {
    const pathPoints = c.points.map(([lat, lng]) => {
      const { x, y } = latLngToMapXYInternal(lat, lng, width, height);
      return `${x},${y}`;
    });
    return (
      <g key={c.name}>
        <polyline
          points={pathPoints.join(' ')}
          fill="none"
          stroke="#00f0ff"
          strokeOpacity={0.2}
          strokeWidth={0.8}
        />
        <polyline
          points={pathPoints.join(' ')}
          fill="#0a1e3a"
          fillOpacity={0.3}
          stroke="none"
        />
      </g>
    );
  });
}

function latLngToMapXYInternal(lat: number, lng: number, w: number, h: number) {
  return {
    x: ((lng + 180) / 360) * w,
    y: ((90 - lat) / 180) * h,
  };
}
