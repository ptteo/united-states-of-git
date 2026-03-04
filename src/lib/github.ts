// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — GitHub API Layer
// ═══════════════════════════════════════════════════════

import { RepoData, GeoLocation, ActivityLevel, LanguageBreakdown, getLanguageColor } from './types';

const GITHUB_API = 'https://api.github.com';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// ─── Location Geocoding Cache ────────────────────────────
const locationCache = new Map<string, GeoLocation | null>();

// Known locations for popular repo owners / orgs
const KNOWN_LOCATIONS: Record<string, GeoLocation> = {
  'San Francisco': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'United States', countryCode: 'US' },
  'San Francisco, CA': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'United States', countryCode: 'US' },
  'Mountain View, CA': { lat: 37.3861, lng: -122.0839, city: 'Mountain View', country: 'United States', countryCode: 'US' },
  'Seattle, WA': { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'United States', countryCode: 'US' },
  'New York': { lat: 40.7128, lng: -74.006, city: 'New York', country: 'United States', countryCode: 'US' },
  'London': { lat: 51.5074, lng: -0.1278, city: 'London', country: 'United Kingdom', countryCode: 'GB' },
  'Berlin': { lat: 52.52, lng: 13.405, city: 'Berlin', country: 'Germany', countryCode: 'DE' },
  'Tokyo': { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
  'Beijing': { lat: 39.9042, lng: 116.4074, city: 'Beijing', country: 'China', countryCode: 'CN' },
  'Bangalore': { lat: 12.9716, lng: 77.5946, city: 'Bangalore', country: 'India', countryCode: 'IN' },
  'Paris': { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France', countryCode: 'FR' },
  'Toronto': { lat: 43.6532, lng: -79.3832, city: 'Toronto', country: 'Canada', countryCode: 'CA' },
  'Sydney': { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia', countryCode: 'AU' },
  'Amsterdam': { lat: 52.3676, lng: 4.9041, city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL' },
  'Stockholm': { lat: 59.3293, lng: 18.0686, city: 'Stockholm', country: 'Sweden', countryCode: 'SE' },
  'Singapore': { lat: 1.3521, lng: 103.8198, city: 'Singapore', country: 'Singapore', countryCode: 'SG' },
  'Austin, TX': { lat: 30.2672, lng: -97.7431, city: 'Austin', country: 'United States', countryCode: 'US' },
  'Portland, OR': { lat: 45.5152, lng: -122.6784, city: 'Portland', country: 'United States', countryCode: 'US' },
  'Redmond, WA': { lat: 47.6740, lng: -122.1215, city: 'Redmond', country: 'United States', countryCode: 'US' },
  'Menlo Park, CA': { lat: 37.4530, lng: -122.1817, city: 'Menlo Park', country: 'United States', countryCode: 'US' },
  'Zurich': { lat: 47.3769, lng: 8.5417, city: 'Zurich', country: 'Switzerland', countryCode: 'CH' },
  'Helsinki': { lat: 60.1699, lng: 24.9384, city: 'Helsinki', country: 'Finland', countryCode: 'FI' },
  'Dublin': { lat: 53.3498, lng: -6.2603, city: 'Dublin', country: 'Ireland', countryCode: 'IE' },
  'Seoul': { lat: 37.5665, lng: 126.978, city: 'Seoul', country: 'South Korea', countryCode: 'KR' },
  'Shenzhen': { lat: 22.5431, lng: 114.0579, city: 'Shenzhen', country: 'China', countryCode: 'CN' },
  'Mumbai': { lat: 19.076, lng: 72.8777, city: 'Mumbai', country: 'India', countryCode: 'IN' },
  'São Paulo': { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil', countryCode: 'BR' },
  'Moscow': { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia', countryCode: 'RU' },
  'Tel Aviv': { lat: 32.0853, lng: 34.7818, city: 'Tel Aviv', country: 'Israel', countryCode: 'IL' },
};

export function geocodeLocation(locationStr: string | null): GeoLocation | null {
  if (!locationStr) return null;

  if (locationCache.has(locationStr)) {
    return locationCache.get(locationStr)!;
  }

  // Try exact match
  if (KNOWN_LOCATIONS[locationStr]) {
    locationCache.set(locationStr, KNOWN_LOCATIONS[locationStr]);
    return KNOWN_LOCATIONS[locationStr];
  }

  // Try partial match
  const lower = locationStr.toLowerCase();
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      locationCache.set(locationStr, value);
      return value;
    }
  }

  // Generate a pseudo-random but deterministic location based on the string
  // This ensures repos without known locations still appear on the map
  let hash = 0;
  for (let i = 0; i < locationStr.length; i++) {
    hash = ((hash << 5) - hash) + locationStr.charCodeAt(i);
    hash |= 0;
  }
  const lat = ((hash % 1600) / 10) - 80; // -80 to 80
  const lng = (((hash >> 8) % 3600) / 10) - 180; // -180 to 180

  const fallback: GeoLocation = {
    lat: Math.max(-85, Math.min(85, lat)),
    lng,
    city: locationStr,
    country: 'Unknown',
    countryCode: '??',
  };
  locationCache.set(locationStr, fallback);
  return fallback;
}

// ─── Compute activity level ──────────────────────────────
function computeActivity(pushedAt: string): ActivityLevel {
  const now = Date.now();
  const pushed = new Date(pushedAt).getTime();
  const daysSince = (now - pushed) / (1000 * 60 * 60 * 24);

  if (daysSince < 1) return 'blazing';
  if (daysSince < 7) return 'active';
  if (daysSince < 30) return 'moderate';
  if (daysSince < 180) return 'slow';
  return 'dormant';
}

// ─── Compute tower height from stars + contributors ──────
function computeTowerHeight(stars: number, contributors: number): number {
  // Log scale so massive repos don't dominate too much
  const starScore = Math.log10(Math.max(stars, 1)) * 2;
  const contribScore = Math.log10(Math.max(contributors, 1)) * 3;
  return Math.max(0.5, starScore + contribScore);
}

// ─── Fetch contributor count ─────────────────────────────
async function fetchContributorCount(fullName: string): Promise<number> {
  try {
    // Use per_page=1 and parse the Link header to get total count
    const res = await fetch(`${GITHUB_API}/repos/${fullName}/contributors?per_page=1&anon=false`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return 0;

    const link = res.headers.get('link');
    if (link) {
      const match = link.match(/page=(\d+)>; rel="last"/);
      if (match) return parseInt(match[1], 10);
    }

    const data = await res.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

// ─── Fetch languages ─────────────────────────────────────
async function fetchLanguages(fullName: string): Promise<LanguageBreakdown[]> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${fullName}/languages`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data: Record<string, number> = await res.json();
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(data).map(([name, bytes]) => ({
      name,
      percentage: Math.round((bytes / total) * 1000) / 10,
      color: getLanguageColor(name),
    }));
  } catch {
    return [];
  }
}

// ─── Transform raw GitHub data to RepoData ───────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
function transformRepo(raw: any, contributors: number, languages: LanguageBreakdown[]): RepoData {
  const location = geocodeLocation(raw.owner?.location || null);
  const towerHeight = computeTowerHeight(raw.stargazers_count || 0, contributors);

  return {
    id: String(raw.id),
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description || '',
    url: raw.html_url,
    homepage: raw.homepage || null,
    stars: raw.stargazers_count || 0,
    forks: raw.forks_count || 0,
    watchers: raw.watchers_count || 0,
    openIssues: raw.open_issues_count || 0,
    contributors,
    language: raw.language || null,
    languages,
    topics: raw.topics || [],
    license: raw.license?.spdx_id || null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    pushedAt: raw.pushed_at,
    owner: {
      login: raw.owner?.login || '',
      avatarUrl: raw.owner?.avatar_url || '',
      type: raw.owner?.type === 'Organization' ? 'Organization' : 'User',
      url: raw.owner?.html_url || '',
      location: raw.owner?.location || null,
    },
    location,
    isArchived: raw.archived || false,
    isFork: raw.fork || false,
    defaultBranch: raw.default_branch || 'main',
    size: raw.size || 0,
    towerHeight,
    glowIntensity: Math.min(1, towerHeight / 15),
    recentActivity: computeActivity(raw.pushed_at || raw.updated_at),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ═══════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════

export async function fetchTrendingRepos(params?: {
  language?: string;
  since?: 'daily' | 'weekly' | 'monthly';
  perPage?: number;
}): Promise<RepoData[]> {
  const { language, since = 'weekly', perPage = 50 } = params || {};

  const dateMap = { daily: 1, weekly: 7, monthly: 30 };
  const days = dateMap[since];
  const date = new Date();
  date.setDate(date.getDate() - days);
  const dateStr = date.toISOString().split('T')[0];

  let query = `created:>${dateStr} stars:>50`;
  if (language) query += ` language:${language}`;

  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 600 },
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const items = data.items || [];

  // Fetch contributor counts and languages in parallel (batched for rate limiting)
  const repos: RepoData[] = await Promise.all(
    items.map(async (raw: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const [contributors, languages] = await Promise.all([
        fetchContributorCount(raw.full_name),
        fetchLanguages(raw.full_name),
      ]);
      return transformRepo(raw, contributors, languages);
    })
  );

  return repos;
}

export async function fetchTopRepos(perPage = 100): Promise<RepoData[]> {
  const url = `${GITHUB_API}/search/repositories?q=stars:>10000&sort=stars&order=desc&per_page=${perPage}`;

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 1800 },
  });

  if (!res.ok) {
    console.error('GitHub API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  const items = data.items || [];

  const repos: RepoData[] = await Promise.all(
    items.map(async (raw: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const [contributors, languages] = await Promise.all([
        fetchContributorCount(raw.full_name),
        fetchLanguages(raw.full_name),
      ]);
      return transformRepo(raw, contributors, languages);
    })
  );

  return repos;
}

export async function fetchRepoDetails(fullName: string): Promise<RepoData | null> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${fullName}`, {
      headers: getHeaders(),
      next: { revalidate: 300 },
    });

    if (!res.ok) return null;

    // Also fetch owner details for location
    const raw = await res.json();

    const ownerRes = await fetch(`${GITHUB_API}/users/${raw.owner.login}`, {
      headers: getHeaders(),
      next: { revalidate: 3600 },
    });

    if (ownerRes.ok) {
      const ownerData = await ownerRes.json();
      raw.owner.location = ownerData.location;
    }

    const [contributors, languages] = await Promise.all([
      fetchContributorCount(fullName),
      fetchLanguages(fullName),
    ]);

    return transformRepo(raw, contributors, languages);
  } catch {
    return null;
  }
}

export async function searchRepos(query: string, perPage = 30): Promise<RepoData[]> {
  if (!query.trim()) return [];

  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=${perPage}`;

  const res = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  const items = data.items || [];

  const repos: RepoData[] = await Promise.all(
    items.map(async (raw: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const [contributors, languages] = await Promise.all([
        fetchContributorCount(raw.full_name),
        fetchLanguages(raw.full_name),
      ]);
      return transformRepo(raw, contributors, languages);
    })
  );

  return repos;
}
