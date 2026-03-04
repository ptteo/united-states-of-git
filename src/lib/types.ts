// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Core Types
// ═══════════════════════════════════════════════════════

export interface RepoData {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  homepage: string | null;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  contributors: number;
  language: string | null;
  languages: LanguageBreakdown[];
  topics: string[];
  license: string | null;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  owner: RepoOwner;
  location: GeoLocation | null;
  isArchived: boolean;
  isFork: boolean;
  defaultBranch: string;
  size: number;
  // Computed
  towerHeight: number;
  glowIntensity: number;
  recentActivity: ActivityLevel;
}

export interface RepoOwner {
  login: string;
  avatarUrl: string;
  type: 'User' | 'Organization';
  url: string;
  location: string | null;
}

export interface LanguageBreakdown {
  name: string;
  percentage: number;
  color: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  countryCode: string;
}

export type ActivityLevel = 'blazing' | 'active' | 'moderate' | 'slow' | 'dormant';

export interface TowerData {
  repo: RepoData;
  position: [number, number, number]; // x, y, z on globe
  height: number;
  color: string;
  pulseSpeed: number;
}

export interface FilterState {
  languages: string[];
  minStars: number;
  maxStars: number;
  minContributors: number;
  topics: string[];
  activityLevel: ActivityLevel[];
  searchQuery: string;
  sortBy: SortOption;
  sortOrder: 'asc' | 'desc';
}

export type SortOption = 'stars' | 'forks' | 'contributors' | 'recent' | 'name';

export interface LeaderboardEntry {
  rank: number;
  repo: RepoData;
  score: number;
}

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
}

export interface ComparisonData {
  repoA: RepoData | null;
  repoB: RepoData | null;
}

// Language color mapping for tower colors
export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#00f0ff',
  JavaScript: '#ffe600',
  Python: '#ff00e5',
  Rust: '#ff6a00',
  Go: '#39ff14',
  Java: '#ff3b5c',
  'C++': '#4d7cff',
  C: '#a855f7',
  Ruby: '#ff3b5c',
  Swift: '#ff6a00',
  Kotlin: '#a855f7',
  Dart: '#4d7cff',
  PHP: '#8b5cf6',
  Shell: '#39ff14',
  Lua: '#4d7cff',
  Zig: '#ffe600',
  Elixir: '#a855f7',
  Haskell: '#a855f7',
  Scala: '#ff3b5c',
  R: '#4d7cff',
  default: '#00f0ff',
};

export function getLanguageColor(language: string | null): string {
  if (!language) return LANGUAGE_COLORS.default;
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.default;
}
