// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Zustand Store
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import { RepoData, FilterState, ComparisonData, SortOption, ActivityLevel } from './types';

interface USGStore {
  // ─── Data ──────────────────────────────────────────
  repos: RepoData[];
  filteredRepos: RepoData[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  totalRepoCount: number;

  // ─── Selection ─────────────────────────────────────
  selectedRepo: RepoData | null;
  hoveredRepo: RepoData | null;
  comparison: ComparisonData;
  isComparing: boolean;

  // ─── Filters ───────────────────────────────────────
  filters: FilterState;

  // ─── UI State ──────────────────────────────────────
  showLeaderboard: boolean;
  showFilters: boolean;
  showSearch: boolean;
  showAbout: boolean;
  globeAutoRotate: boolean;
  viewMode: '3d' | 'map' | 'list';

  // ─── Actions ───────────────────────────────────────
  setRepos: (repos: RepoData[]) => void;
  mergeRepos: (newRepos: RepoData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectRepo: (repo: RepoData | null) => void;
  hoverRepo: (repo: RepoData | null) => void;
  toggleCompare: (repo: RepoData) => void;
  setComparing: (comparing: boolean) => void;
  updateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  setShowLeaderboard: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  setShowSearch: (show: boolean) => void;
  setShowAbout: (show: boolean) => void;
  setGlobeAutoRotate: (rotate: boolean) => void;
  setViewMode: (mode: '3d' | 'map' | 'list') => void;
  applyFilters: () => void;
}

const defaultFilters: FilterState = {
  languages: [],
  minStars: 0,
  maxStars: Infinity,
  minContributors: 0,
  topics: [],
  activityLevel: [],
  searchQuery: '',
  sortBy: 'stars',
  sortOrder: 'desc',
};

function filterAndSort(repos: RepoData[], filters: FilterState): RepoData[] {
  let result = repos.filter((repo) => {
    // Language filter
    if (filters.languages.length > 0 && repo.language && !filters.languages.includes(repo.language)) {
      return false;
    }

    // Star range
    if (repo.stars < filters.minStars) return false;
    if (filters.maxStars !== Infinity && repo.stars > filters.maxStars) return false;

    // Min contributors
    if (repo.contributors < filters.minContributors) return false;

    // Topics
    if (filters.topics.length > 0) {
      const hasMatchingTopic = filters.topics.some((t) => repo.topics.includes(t));
      if (!hasMatchingTopic) return false;
    }

    // Activity level
    if (filters.activityLevel.length > 0 && !filters.activityLevel.includes(repo.recentActivity)) {
      return false;
    }

    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const match =
        repo.name.toLowerCase().includes(q) ||
        repo.fullName.toLowerCase().includes(q) ||
        repo.description.toLowerCase().includes(q) ||
        repo.owner.login.toLowerCase().includes(q) ||
        repo.topics.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // Sort
  const sortFns: Record<SortOption, (a: RepoData, b: RepoData) => number> = {
    stars: (a, b) => b.stars - a.stars,
    forks: (a, b) => b.forks - a.forks,
    contributors: (a, b) => b.contributors - a.contributors,
    recent: (a, b) => new Date(b.pushedAt).getTime() - new Date(a.pushedAt).getTime(),
    name: (a, b) => a.name.localeCompare(b.name),
  };

  result.sort(sortFns[filters.sortBy]);
  if (filters.sortOrder === 'asc') result.reverse();

  return result;
}

export const useUSGStore = create<USGStore>((set, get) => ({
  // Data
  repos: [],
  filteredRepos: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
  totalRepoCount: 0,

  // Selection
  selectedRepo: null,
  hoveredRepo: null,
  comparison: { repoA: null, repoB: null },
  isComparing: false,

  // Filters
  filters: { ...defaultFilters },

  // UI
  showLeaderboard: false,
  showFilters: false,
  showSearch: false,
  showAbout: false,
  globeAutoRotate: true,
  viewMode: '3d',

  // Actions
  setRepos: (repos) => {
    const { filters } = get();
    const filteredRepos = filterAndSort(repos, filters);
    set({ repos, filteredRepos, totalRepoCount: repos.length, lastUpdated: Date.now() });
  },
  mergeRepos: (newRepos) => {
    const { repos, filters } = get();
    const map = new Map(repos.map((r) => [r.id, r]));
    let changed = false;
    for (const repo of newRepos) {
      const existing = map.get(repo.id);
      if (!existing) {
        map.set(repo.id, repo);
        changed = true;
      } else if (
        existing.stars !== repo.stars ||
        existing.forks !== repo.forks ||
        existing.pushedAt !== repo.pushedAt
      ) {
        map.set(repo.id, {
          ...repo,
          contributors: Math.max(existing.contributors, repo.contributors),
          languages: existing.languages.length > repo.languages.length ? existing.languages : repo.languages,
        });
        changed = true;
      }
    }
    if (changed) {
      const merged = Array.from(map.values());
      const filteredRepos = filterAndSort(merged, filters);
      // Single atomic set() call — prevents intermediate re-renders
      set({ repos: merged, filteredRepos, totalRepoCount: merged.length, lastUpdated: Date.now() });
    }
  },
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  selectRepo: (repo) => set({ selectedRepo: repo, globeAutoRotate: !repo }),
  hoverRepo: (repo) => set({ hoveredRepo: repo }),

  toggleCompare: (repo) => {
    const { comparison } = get();
    if (comparison.repoA?.id === repo.id) {
      set({ comparison: { repoA: null, repoB: comparison.repoB } });
    } else if (comparison.repoB?.id === repo.id) {
      set({ comparison: { repoA: comparison.repoA, repoB: null } });
    } else if (!comparison.repoA) {
      set({ comparison: { repoA: repo, repoB: comparison.repoB } });
    } else {
      set({ comparison: { repoA: comparison.repoA, repoB: repo } });
    }
  },
  setComparing: (isComparing) => set({ isComparing, comparison: isComparing ? get().comparison : { repoA: null, repoB: null } }),

  updateFilter: (key, value) => {
    set({ filters: { ...get().filters, [key]: value } });
    get().applyFilters();
  },
  resetFilters: () => {
    set({ filters: { ...defaultFilters } });
    get().applyFilters();
  },

  setShowLeaderboard: (showLeaderboard) => set({ showLeaderboard }),
  setShowFilters: (showFilters) => set({ showFilters }),
  setShowSearch: (showSearch) => set({ showSearch }),
  setShowAbout: (showAbout) => set({ showAbout }),
  setGlobeAutoRotate: (globeAutoRotate) => set({ globeAutoRotate }),
  setViewMode: (viewMode) => set({ viewMode }),

  applyFilters: () => {
    const { repos, filters } = get();
    const filteredRepos = filterAndSort(repos, filters);
    set({ filteredRepos });
  },
}));
