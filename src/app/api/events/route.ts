// ═══════════════════════════════════════════════════════
//  UNITED STATES OF GIT — Real-time Events SSE Stream
//  Polls GitHub Public Events API and streams relevant
//  events (stars, forks, pushes) to connected clients.
// ═══════════════════════════════════════════════════════

import { NextResponse } from 'next/server';

const GITHUB_API = 'https://api.github.com';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
  const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Types of events we care about
const RELEVANT_EVENTS = new Set([
  'WatchEvent',      // Star events
  'ForkEvent',       // Fork events
  'PushEvent',       // Code pushes
  'CreateEvent',     // Repo/branch/tag creation
  'ReleaseEvent',    // New releases
  'PublicEvent',     // Repo made public
]);

let lastETag: string | null = null;
let lastEventId: string | null = null;

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`));

      let isActive = true;

      const pollEvents = async () => {
        while (isActive) {
          try {
            const headers: Record<string, string> = {
              ...getHeaders() as Record<string, string>,
            };
            if (lastETag) {
              headers['If-None-Match'] = lastETag;
            }

            const res = await fetch(`${GITHUB_API}/events?per_page=30`, {
              headers,
            });

            // Respect polling interval from GitHub
            const pollInterval = parseInt(res.headers.get('x-poll-interval') || '60', 10) * 1000;

            if (res.status === 304) {
              // No new events
              controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`));
              await sleep(pollInterval);
              continue;
            }

            if (!res.ok) {
              controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: `GitHub API ${res.status}`, timestamp: Date.now() })}\n\n`));
              await sleep(pollInterval);
              continue;
            }

            lastETag = res.headers.get('etag');
            const events = await res.json();

            // Filter relevant events and ones we haven't seen
            const relevantEvents = events.filter((e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              if (!RELEVANT_EVENTS.has(e.type)) return false;
              // Only repos with some significance (has stars)
              if (e.repo && e.type === 'WatchEvent') return true;
              if (e.repo && e.type === 'ForkEvent') return true;
              if (e.repo && e.type === 'PushEvent') return true;
              if (e.repo && e.type === 'CreateEvent' && e.payload?.ref_type === 'repository') return true;
              if (e.repo && e.type === 'ReleaseEvent') return true;
              if (e.repo && e.type === 'PublicEvent') return true;
              return false;
            });

            if (relevantEvents.length > 0 && relevantEvents[0].id !== lastEventId) {
              lastEventId = relevantEvents[0].id;

              // Group events by repo for efficiency
              const repoEvents = new Map<string, any[]>(); // eslint-disable-line @typescript-eslint/no-explicit-any
              for (const event of relevantEvents) {
                const repoName = event.repo?.name;
                if (repoName) {
                  if (!repoEvents.has(repoName)) repoEvents.set(repoName, []);
                  repoEvents.get(repoName)!.push({
                    type: event.type,
                    actor: event.actor?.login,
                    createdAt: event.created_at,
                  });
                }
              }

              // Stream each repo's events
              for (const [repoName, events] of repoEvents) {
                const eventData = {
                  repo: repoName,
                  events,
                  timestamp: Date.now(),
                };

                controller.enqueue(
                  encoder.encode(`event: repo-activity\ndata: ${JSON.stringify(eventData)}\n\n`)
                );
              }
            } else {
              controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: Date.now() })}\n\n`));
            }

            await sleep(pollInterval);
          } catch (error) {
            console.error('SSE poll error:', error);
            controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ error: 'Poll failed', timestamp: Date.now() })}\n\n`));
            await sleep(60_000);
          }
        }
      };

      // Start polling (don't await — it runs indefinitely)
      pollEvents().catch(() => {
        isActive = false;
      });

      // Clean up when client disconnects
      // Note: The stream will be closed by the client disconnecting
    },

    cancel() {
      // Client disconnected
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
