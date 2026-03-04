// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Live Repos Hook
//  Fetches repos from our API route with auto-polling,
//  SSE real-time events, progressive loading, and
//  intelligent data merging.
// ═══════════════════════════════════════════════════════

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useUSGStore } from './store';
import { RepoData } from './types';

interface UseLiveReposOptions {
  /** Polling interval in ms (default: 60000 = 1 min) */
  pollInterval?: number;
  /** Initial fetch mode */
  initialMode?: 'top' | 'trending' | 'all';
  /** Number of pages to fetch initially */
  initialPages?: number;
  /** Enable SSE real-time events */
  enableSSE?: boolean;
  /** Enable periodic polling */
  enablePolling?: boolean;
}

interface LiveReposState {
  /** Whether initial data is loading */
  isInitialLoad: boolean;
  /** Last successful fetch timestamp */
  lastUpdated: number | null;
  /** Number of repos loaded so far */
  repoCount: number;
  /** Number of pages loaded */
  pagesLoaded: number;
  /** Whether SSE is connected */
  sseConnected: boolean;
  /** Real-time event count since mount */
  eventCount: number;
  /** Any error message */
  error: string | null;
  /** Rate limit remaining */
  rateLimitRemaining: string | null;
  /** Whether currently fetching */
  isFetching: boolean;
  /** Force refresh function */
  refresh: () => Promise<void>;
  /** Load more pages */
  loadMore: () => Promise<void>;
}

export function useLiveRepos(options: UseLiveReposOptions = {}): LiveReposState {
  const {
    pollInterval = 60_000,
    initialMode = 'all',
    initialPages = 3,
    enableSSE = true,
    enablePolling = true,
  } = options;

  const storeMergeRepos = useUSGStore((s) => s.mergeRepos);
  const setLoading = useUSGStore((s) => s.setLoading);
  const setError = useUSGStore((s) => s.setError);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [repoCount, setRepoCount] = useState(0);
  const [pagesLoaded, setPagesLoaded] = useState(0);
  const [sseConnected, setSseConnected] = useState(false);
  const [eventCount, setEventCount] = useState(0);
  const [error, setLocalError] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sseRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  // Fetch repos from our API route
  const fetchRepos = useCallback(
    async (mode: string, page: number, perPage: number = 100): Promise<RepoData[]> => {
      try {
        const url = `/api/repos?mode=${mode}&page=${page}&per_page=${perPage}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();

        if (data.rateLimit?.remaining) {
          setRateLimitRemaining(data.rateLimit.remaining);
        }

        return data.repos || [];
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch repos';
        console.error('fetchRepos error:', msg);
        throw err;
      }
    },
    []
  );

  // Merge new repos into store (delegated to store's mergeRepos for single atomic update)
  const mergeRepos = useCallback(
    (newRepos: RepoData[]) => {
      if (newRepos.length === 0) return;
      storeMergeRepos(newRepos);
      // Update local tracking state
      const currentCount = useUSGStore.getState().repos.length;
      setRepoCount(currentCount);
      setLastUpdated(Date.now());
    },
    [storeMergeRepos]
  );

  // Initial multi-page fetch
  const initialFetch = useCallback(async () => {
    setLoading(true);
    setIsFetching(true);
    setLocalError(null);

    try {
      // Fetch first page immediately for quick display
      const firstPage = await fetchRepos(initialMode, 1, 100);
      mergeRepos(firstPage);
      setPagesLoaded(1);
      setIsInitialLoad(false); // Show data after first page

      // Then progressively load more pages
      for (let page = 2; page <= initialPages; page++) {
        if (!mountedRef.current) break;

        try {
          const pageData = await fetchRepos('top', page, 100);
          if (pageData.length === 0) break;
          mergeRepos(pageData);
          setPagesLoaded(page);
        } catch {
          // Don't fail the whole load for subsequent pages
          console.warn(`Failed to load page ${page}, continuing...`);
          break;
        }
      }

      // Also fetch trending repos for live activity
      if (mountedRef.current) {
        try {
          const trending = await fetchRepos('trending', 1, 50);
          mergeRepos(trending);
        } catch {
          // Non-critical
        }
      }

      // Fetch recently pushed repos
      if (mountedRef.current) {
        try {
          const recent = await fetchRepos('recent', 1, 50);
          mergeRepos(recent);
        } catch {
          // Non-critical
        }
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load repos';
      setLocalError(msg);
      setError(msg);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [fetchRepos, initialMode, initialPages, mergeRepos, setError, setLoading]);

  // Periodic polling for updates
  const poll = useCallback(async () => {
    if (!mountedRef.current || isFetching) return;

    setIsFetching(true);
    try {
      // Fetch recently active repos to catch changes
      const recent = await fetchRepos('recent', 1, 50);
      mergeRepos(recent);

      // Also refresh top repos to catch star count changes
      const top = await fetchRepos('top', 1, 100);
      mergeRepos(top);
    } catch (err) {
      console.warn('Poll error:', err);
    } finally {
      setIsFetching(false);
    }
  }, [fetchRepos, isFetching, mergeRepos]);

  // Manual refresh
  const refresh = useCallback(async () => {
    await poll();
  }, [poll]);

  // Load more pages
  const loadMore = useCallback(async () => {
    if (isFetching) return;

    setIsFetching(true);
    try {
      const nextPage = pagesLoaded + 1;
      const data = await fetchRepos('top', nextPage, 100);
      if (data.length > 0) {
        mergeRepos(data);
        setPagesLoaded(nextPage);
      }
    } catch (err) {
      console.warn('Load more error:', err);
    } finally {
      setIsFetching(false);
    }
  }, [fetchRepos, isFetching, mergeRepos, pagesLoaded]);

  // Setup SSE for real-time events
  useEffect(() => {
    if (!enableSSE) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!mountedRef.current) return;

      try {
        eventSource = new EventSource('/api/events');
        sseRef.current = eventSource;

        eventSource.addEventListener('connected', () => {
          setSseConnected(true);
        });

        eventSource.addEventListener('repo-activity', (event) => {
          try {
            const data = JSON.parse(event.data);
            setEventCount((c) => c + 1);

            // When we detect activity on a repo, refresh to get updated data
            // We batch refreshes to avoid hammering the API
            if (data.repo) {
              // Queue a refresh (debounced via polling)
              console.log(`[USG] Real-time activity on ${data.repo}:`, data.events?.map((e: any) => e.type).join(', ')); // eslint-disable-line @typescript-eslint/no-explicit-any
            }
          } catch {
            // Skip malformed event
          }
        });

        eventSource.addEventListener('heartbeat', () => {
          // Connection alive
        });

        eventSource.addEventListener('error', () => {
          setSseConnected(false);

          // Reconnect after delay
          eventSource?.close();
          reconnectTimer = setTimeout(connect, 30_000);
        });

        eventSource.onerror = () => {
          setSseConnected(false);
          eventSource?.close();
          reconnectTimer = setTimeout(connect, 30_000);
        };
      } catch {
        // SSE not supported or failed
        setSseConnected(false);
      }
    };

    connect();

    return () => {
      eventSource?.close();
      sseRef.current = null;
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [enableSSE]);

  // Initial fetch on mount
  useEffect(() => {
    mountedRef.current = true;
    initialFetch();

    return () => {
      mountedRef.current = false;
    };
  }, [initialFetch]);

  // Setup polling timer
  useEffect(() => {
    if (!enablePolling || pollInterval <= 0) return;

    // Start polling after initial load completes
    const startPolling = () => {
      pollTimerRef.current = setInterval(() => {
        if (mountedRef.current && !isFetching) {
          poll();
        }
      }, pollInterval);
    };

    // Delay first poll to not overlap with initial fetch
    const delayTimer = setTimeout(startPolling, pollInterval);

    return () => {
      clearTimeout(delayTimer);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [enablePolling, pollInterval, isFetching, poll]);

  return {
    isInitialLoad,
    lastUpdated,
    repoCount,
    pagesLoaded,
    sseConnected,
    eventCount,
    error,
    rateLimitRemaining,
    isFetching,
    refresh,
    loadMore,
  };
}
