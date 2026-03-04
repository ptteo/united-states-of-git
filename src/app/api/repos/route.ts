// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Live Repos API Route
//  Fetches public repos from GitHub Search API with
//  multiple strategies and server-side caching.
// ═══════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };
  // Prefer server-side token (higher rate limit, not exposed to client)
  const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

// In-memory cache with TTL
interface CacheEntry {
  data: unknown;
  timestamp: number;
  etag?: string;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60_000; // 1 minute

function getCached(key: string): CacheEntry | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry;
}

// Fetch a single page from GitHub Search API
async function fetchGitHubSearch(
  query: string,
  sort: string,
  order: string,
  perPage: number,
  page: number
): Promise<{ items: any[]; total_count: number }> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const cacheKey = `search:${query}:${sort}:${order}:${perPage}:${page}`;
  const cached = getCached(cacheKey);
  if (cached) return cached.data as { items: any[]; total_count: number }; // eslint-disable-line @typescript-eslint/no-explicit-any

  const url = `${GITHUB_API}/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=${order}&per_page=${perPage}&page=${page}`;

  const res = await fetch(url, { headers: getHeaders() });

  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const resetAt = res.headers.get('x-ratelimit-reset');
    console.error(`GitHub API error ${res.status}: rate-limit remaining=${remaining}, reset=${resetAt}`);

    if (res.status === 403 || res.status === 429) {
      return { items: [], total_count: 0 };
    }
    return { items: [], total_count: 0 };
  }

  const data = await res.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Known org/user locations for geocoding on the server
const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; city: string; country: string; countryCode: string }> = {
  'San Francisco': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'United States', countryCode: 'US' },
  'San Francisco, CA': { lat: 37.7749, lng: -122.4194, city: 'San Francisco', country: 'United States', countryCode: 'US' },
  'Mountain View, CA': { lat: 37.3861, lng: -122.0839, city: 'Mountain View', country: 'United States', countryCode: 'US' },
  'Seattle, WA': { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'United States', countryCode: 'US' },
  'Seattle': { lat: 47.6062, lng: -122.3321, city: 'Seattle', country: 'United States', countryCode: 'US' },
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
  'Redmond, WA': { lat: 47.674, lng: -122.1215, city: 'Redmond', country: 'United States', countryCode: 'US' },
  'Menlo Park, CA': { lat: 37.453, lng: -122.1817, city: 'Menlo Park', country: 'United States', countryCode: 'US' },
  'Zurich': { lat: 47.3769, lng: 8.5417, city: 'Zurich', country: 'Switzerland', countryCode: 'CH' },
  'Helsinki': { lat: 60.1699, lng: 24.9384, city: 'Helsinki', country: 'Finland', countryCode: 'FI' },
  'Dublin': { lat: 53.3498, lng: -6.2603, city: 'Dublin', country: 'Ireland', countryCode: 'IE' },
  'Seoul': { lat: 37.5665, lng: 126.978, city: 'Seoul', country: 'South Korea', countryCode: 'KR' },
  'Shenzhen': { lat: 22.5431, lng: 114.0579, city: 'Shenzhen', country: 'China', countryCode: 'CN' },
  'Mumbai': { lat: 19.076, lng: 72.8777, city: 'Mumbai', country: 'India', countryCode: 'IN' },
  'São Paulo': { lat: -23.5505, lng: -46.6333, city: 'São Paulo', country: 'Brazil', countryCode: 'BR' },
  'Moscow': { lat: 55.7558, lng: 37.6173, city: 'Moscow', country: 'Russia', countryCode: 'RU' },
  'Tel Aviv': { lat: 32.0853, lng: 34.7818, city: 'Tel Aviv', country: 'Israel', countryCode: 'IL' },
  'Denver, CO': { lat: 39.7392, lng: -104.9903, city: 'Denver', country: 'United States', countryCode: 'US' },
  'Chicago': { lat: 41.8781, lng: -87.6298, city: 'Chicago', country: 'United States', countryCode: 'US' },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, city: 'Los Angeles', country: 'United States', countryCode: 'US' },
  'Boston': { lat: 42.3601, lng: -71.0589, city: 'Boston', country: 'United States', countryCode: 'US' },
  'Vancouver': { lat: 49.2827, lng: -123.1207, city: 'Vancouver', country: 'Canada', countryCode: 'CA' },
  'Montreal': { lat: 45.5017, lng: -73.5673, city: 'Montreal', country: 'Canada', countryCode: 'CA' },
  'Copenhagen': { lat: 55.6761, lng: 12.5683, city: 'Copenhagen', country: 'Denmark', countryCode: 'DK' },
  'Barcelona': { lat: 41.3874, lng: 2.1686, city: 'Barcelona', country: 'Spain', countryCode: 'ES' },
  'Munich': { lat: 48.1351, lng: 11.582, city: 'Munich', country: 'Germany', countryCode: 'DE' },
  'Taipei': { lat: 25.033, lng: 121.5654, city: 'Taipei', country: 'Taiwan', countryCode: 'TW' },
  'Bangkok': { lat: 13.7563, lng: 100.5018, city: 'Bangkok', country: 'Thailand', countryCode: 'TH' },
  'Jakarta': { lat: -6.2088, lng: 106.8456, city: 'Jakarta', country: 'Indonesia', countryCode: 'ID' },
  'Cape Town': { lat: -33.9249, lng: 18.4241, city: 'Cape Town', country: 'South Africa', countryCode: 'ZA' },
  'Lagos': { lat: 6.5244, lng: 3.3792, city: 'Lagos', country: 'Nigeria', countryCode: 'NG' },
  'Nairobi': { lat: -1.2921, lng: 36.8219, city: 'Nairobi', country: 'Kenya', countryCode: 'KE' },
  'Dubai': { lat: 25.2048, lng: 55.2708, city: 'Dubai', country: 'UAE', countryCode: 'AE' },
  'Osaka': { lat: 34.6937, lng: 135.5023, city: 'Osaka', country: 'Japan', countryCode: 'JP' },
  'Hangzhou': { lat: 30.2741, lng: 120.1551, city: 'Hangzhou', country: 'China', countryCode: 'CN' },
  'Shanghai': { lat: 31.2304, lng: 121.4737, city: 'Shanghai', country: 'China', countryCode: 'CN' },
  'Guangzhou': { lat: 23.1291, lng: 113.2644, city: 'Guangzhou', country: 'China', countryCode: 'CN' },
};

// Batch-fetch owner locations for a list of repos
const ownerLocationCache = new Map<string, string | null>();

async function fetchOwnerLocations(logins: string[]): Promise<Map<string, string | null>> {
  const results = new Map<string, string | null>();
  const uncached = logins.filter((l) => {
    if (ownerLocationCache.has(l)) {
      results.set(l, ownerLocationCache.get(l)!);
      return false;
    }
    return true;
  });

  // Fetch uncached ones (max 10 concurrent to avoid rate limiting)
  const batchSize = 10;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const fetches = batch.map(async (login) => {
      try {
        const res = await fetch(`${GITHUB_API}/users/${login}`, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          ownerLocationCache.set(login, data.location || null);
          results.set(login, data.location || null);
        } else {
          ownerLocationCache.set(login, null);
          results.set(login, null);
        }
      } catch {
        ownerLocationCache.set(login, null);
        results.set(login, null);
      }
    });
    await Promise.all(fetches);
  }

  return results;
}

function geocodeLocation(locationStr: string | null) {
  if (!locationStr) return null;

  // Try exact match
  if (KNOWN_LOCATIONS[locationStr]) return KNOWN_LOCATIONS[locationStr];

  // Try partial match
  const lower = locationStr.toLowerCase();
  for (const [key, value] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return value;
    }
  }

  // Deterministic pseudo-random location from string hash
  return generateRandomLocation(locationStr);
}

// Generate a deterministic random location from a string (repo name, id, etc.)
function generateRandomLocation(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }

  // Bias toward populated areas: major tech hubs and cities
  const POPULATED_ZONES = [
    { latMin: 25, latMax: 50, lngMin: -130, lngMax: -65, weight: 30 },   // US
    { latMin: 35, latMax: 60, lngMin: -10, lngMax: 40, weight: 25 },     // Europe
    { latMin: 5, latMax: 40, lngMin: 68, lngMax: 145, weight: 30 },      // Asia
    { latMin: -35, latMax: 5, lngMin: -80, lngMax: -35, weight: 5 },     // S. America
    { latMin: -10, latMax: 15, lngMin: 95, lngMax: 140, weight: 5 },     // SE Asia
    { latMin: -40, latMax: -10, lngMin: 110, lngMax: 155, weight: 3 },   // Australia
    { latMin: -35, latMax: 5, lngMin: 15, lngMax: 50, weight: 2 },       // Africa
  ];

  // Pick a zone based on hash (weighted)
  const totalWeight = POPULATED_ZONES.reduce((s, z) => s + z.weight, 0);
  let pick = Math.abs(hash) % totalWeight;
  let zone = POPULATED_ZONES[0];
  for (const z of POPULATED_ZONES) {
    pick -= z.weight;
    if (pick < 0) { zone = z; break; }
  }

  // Generate lat/lng within the zone with jitter
  const hash2 = Math.abs((hash * 16807) % 2147483647);
  const hash3 = Math.abs((hash2 * 16807) % 2147483647);
  const lat = zone.latMin + (hash2 % 10000) / 10000 * (zone.latMax - zone.latMin);
  const lng = zone.lngMin + (hash3 % 10000) / 10000 * (zone.lngMax - zone.lngMin);

  return {
    lat: Math.max(-85, Math.min(85, lat)),
    lng,
    city: seed.length > 20 ? seed.slice(0, 20) : seed,
    country: 'Unknown',
    countryCode: '??',
  };
}

// Language colors for tower visualization
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#00f0ff', JavaScript: '#ffe600', Python: '#ff00e5',
  Rust: '#ff6a00', Go: '#39ff14', Java: '#ff3b5c',
  'C++': '#4d7cff', C: '#a855f7', Ruby: '#ff3b5c',
  Swift: '#ff6a00', Kotlin: '#a855f7', Dart: '#4d7cff',
  PHP: '#8b5cf6', Shell: '#39ff14', Lua: '#4d7cff',
  Zig: '#ffe600', Elixir: '#a855f7', Haskell: '#a855f7',
  Scala: '#ff3b5c', R: '#4d7cff', default: '#00f0ff',
};

function getLanguageColor(lang: string | null): string {
  if (!lang) return LANGUAGE_COLORS.default;
  return LANGUAGE_COLORS[lang] || LANGUAGE_COLORS.default;
}

function computeActivity(pushedAt: string): string {
  const now = Date.now();
  const pushed = new Date(pushedAt).getTime();
  const daysSince = (now - pushed) / (1000 * 60 * 60 * 24);

  if (daysSince < 1) return 'blazing';
  if (daysSince < 7) return 'active';
  if (daysSince < 30) return 'moderate';
  if (daysSince < 180) return 'slow';
  return 'dormant';
}

function computeTowerHeight(stars: number, contributors: number): number {
  const starScore = Math.log10(Math.max(stars, 1)) * 2;
  const contribScore = Math.log10(Math.max(contributors, 1)) * 3;
  return Math.max(0.5, starScore + contribScore);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformRepoLite(raw: any, ownerLocation: string | null) {
  // Always generate a location — use owner location, or scatter randomly by repo id
  let location = geocodeLocation(ownerLocation);
  if (!location) {
    location = generateRandomLocation(raw.full_name || raw.name || String(raw.id));
  }
  const stars = raw.stargazers_count || 0;
  // Estimate contributors from forks (rough heuristic for lite mode)
  const estimatedContribs = Math.max(1, Math.round((raw.forks_count || 0) * 0.3));
  const towerHeight = computeTowerHeight(stars, estimatedContribs);

  return {
    id: String(raw.id),
    name: raw.name,
    fullName: raw.full_name,
    description: raw.description || '',
    url: raw.html_url,
    homepage: raw.homepage || null,
    stars,
    forks: raw.forks_count || 0,
    watchers: raw.watchers_count || 0,
    openIssues: raw.open_issues_count || 0,
    contributors: estimatedContribs,
    language: raw.language || null,
    languages: raw.language
      ? [{ name: raw.language, percentage: 100, color: getLanguageColor(raw.language) }]
      : [],
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
      location: ownerLocation,
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'top'; // 'top' | 'trending' | 'recent' | 'all'
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = Math.min(parseInt(searchParams.get('per_page') || '100', 10), 100);
  const language = searchParams.get('language') || '';
  const since = searchParams.get('since') || ''; // for trending: 'daily', 'weekly', 'monthly'

  try {
    let allItems: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let totalCount = 0;

    if (mode === 'all') {
      // Fetch multiple categories in parallel to get a diverse set
      const [topResult, trendingResult, recentResult] = await Promise.all([
        fetchGitHubSearch('stars:>5000', 'stars', 'desc', perPage, page),
        fetchGitHubSearch(
          `stars:>100 pushed:>${getDateDaysAgo(7)}`,
          'updated',
          'desc',
          Math.min(perPage, 50),
          1
        ),
        fetchGitHubSearch(
          `stars:>500 pushed:>${getDateDaysAgo(1)}`,
          'updated',
          'desc',
          Math.min(perPage, 30),
          1
        ),
      ]);

      // Merge and deduplicate
      const seen = new Set<number>();
      const merged: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

      for (const item of [...topResult.items, ...trendingResult.items, ...recentResult.items]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }

      allItems = merged;
      totalCount = topResult.total_count;

    } else if (mode === 'trending') {
      const days = since === 'daily' ? 1 : since === 'monthly' ? 30 : 7;
      let query = `created:>${getDateDaysAgo(days)} stars:>50`;
      if (language) query += ` language:${language}`;

      const result = await fetchGitHubSearch(query, 'stars', 'desc', perPage, page);
      allItems = result.items;
      totalCount = result.total_count;

    } else if (mode === 'recent') {
      let query = `stars:>100 pushed:>${getDateDaysAgo(1)}`;
      if (language) query += ` language:${language}`;

      const result = await fetchGitHubSearch(query, 'updated', 'desc', perPage, page);
      allItems = result.items;
      totalCount = result.total_count;

    } else {
      // mode === 'top'
      let query = 'stars:>1000';
      if (language) query += ` language:${language}`;

      const result = await fetchGitHubSearch(query, 'stars', 'desc', perPage, page);
      allItems = result.items;
      totalCount = result.total_count;
    }

    // Batch-fetch owner locations
    const uniqueLogins = [...new Set(allItems.map((item) => item.owner?.login).filter(Boolean))];
    const ownerLocations = await fetchOwnerLocations(uniqueLogins);

    // Transform to lite RepoData
    const repos = allItems.map((raw) => {
      const ownerLocation = ownerLocations.get(raw.owner?.login) || null;
      return transformRepoLite(raw, ownerLocation);
    });

    // Get rate limit info for client
    const rateLimit = {
      remaining: '?',
      limit: '?',
      reset: '?',
    };

    return NextResponse.json({
      repos,
      totalCount,
      page,
      perPage,
      mode,
      rateLimit,
      timestamp: Date.now(),
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch repositories', repos: [], totalCount: 0 },
      { status: 500 }
    );
  }
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}
