/**
 * apollo-client.ts
 *
 * Two separate Apollo Client instances:
 *  1. `createServerClient()` — new instance per RSC render, points to internal URL,
 *     no cache sharing across requests (Next.js RSC renders are per-request).
 *  2. `getClientSideClient()` — singleton on the browser, standard cache.
 *
 * We intentionally do NOT use @apollo/experimental-nextjs-app-support here because
 * it only supports Next.js ≤ 15. Instead we implement the correct RSC boundary
 * pattern manually.
 */

import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
} from "@apollo/client";

// ── Server-side client (RSC only) ─────────────────────────────────────────────
// Called inside async Server Components to pre-fetch feed data for SSR.
// Each call creates a fresh, isolated client — intentional; we never want
// server-side request state to leak between users.
export function createServerClient() {
  return new ApolloClient({
    ssrMode: true,
    link: new HttpLink({
      uri: process.env.GRAPHQL_INTERNAL_URL ?? "http://localhost:5001/graphql",
      // No credentials needed for SSR initial load (public feed data).
      // Personalized queries (userProfile, me) require the cookie to be
      // forwarded explicitly — handled in page.tsx when needed.
      fetchOptions: { cache: "no-store" },
    }),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: { fetchPolicy: "no-cache" },
    },
  });
}

// ── Client-side singleton (Client Components) ─────────────────────────────────
let browserClient: ApolloClient | null = null;

export function getClientSideClient(): ApolloClient {
  if (typeof window === "undefined") {
    // During Next.js SSR phase for Client Components, create a safe server client
    return createServerClient();
  }

  if (!browserClient) {
    browserClient = new ApolloClient({
      link: new HttpLink({
        uri: process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5001/graphql",
        credentials: "include", // Send httpOnly JWT cookie
      }),
      cache: new InMemoryCache({
        typePolicies: {
          Post: { keyFields: ["id"] },
          Comment: { keyFields: ["id"] },
          User: { keyFields: ["id"] },
        },
      }),
      defaultOptions: {
        watchQuery: { fetchPolicy: "cache-and-network" },
      },
    });
  }

  return browserClient;
}
