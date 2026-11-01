/**
 * app/feed/page.tsx  — React Server Component
 *
 * This is the SSR entry point for the /feed route.
 *
 * Architectural role:
 *  1. Runs on the Next.js Node.js server (no "use client" directive).
 *  2. Creates a fresh Apollo client via createServerClient() and executes
 *     the GET_FEED GraphQL query synchronously during render.
 *  3. Passes the resolved posts as props to FeedClientUI (Client Component),
 *     which handles Socket.IO subscriptions, optimistic votes, and interactivity.
 *
 * SSR benefit: The initial post cards are in the HTML payload, making FCP and
 * LCP measurably faster because the browser doesn't wait for JS hydration + a
 * network fetch before showing any content.
 *
 * Auth cookie forwarding: The createServerClient() uses no-cache fetching
 * for the public feed. If personalized data (e.g. userVote) is needed in the
 * future, pass the `Cookie` header from the incoming request.
 */

import { Suspense } from "react";
import { createServerClient } from "@/lib/apollo-client";
import { GET_FEED } from "@/lib/queries";
import FeedClientUI from "@/components/feed/FeedClientUI";
import FeedSkeleton from "@/components/feed/FeedSkeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feed — Orbit",
  description:
    "Discover trending posts, real-time discussions, and nested comment threads on Orbit — the next-generation social platform.",
  openGraph: {
    title: "Feed — Orbit",
    description: "Real-time feed powered by GraphQL and Socket.IO",
    type: "website",
  },
};

// Force dynamic SSR at request time (does not block static build)
export const dynamic = "force-dynamic";

import { type Post } from "@/store/useFeedStore";

interface FeedData {
  feed: Post[];
}

async function fetchInitialFeed(): Promise<{ posts: Post[]; nextCursor: string | null; hasMore: boolean }> {
  try {
    const client = createServerClient();
    const { data } = await client.query<FeedData>({
      query: GET_FEED,
      variables: { limit: 20 },
    });
    const rawPosts = data?.feed ?? [];
    const posts = rawPosts.map((p) => ({
      ...p,
      _id: p.id || p._id || "",
    }));
    return {
      posts,
      nextCursor: posts.length > 0 ? posts[posts.length - 1].createdAt || null : null,
      hasMore: posts.length >= 20,
    };
  } catch (err) {
    console.error("[FeedPage RSC] GraphQL fetch failed:", err);
    return { posts: [], nextCursor: null, hasMore: true };
  }
}

export default async function FeedPage() {
  const initialData = await fetchInitialFeed();

  return (
    <main className="flex-1 overflow-hidden flex flex-col">
      <Suspense fallback={<FeedSkeleton />}>
        {/*
          FeedClientUI receives pre-fetched posts as a prop.
          On the client, it:
            1. Seeds the Zustand feed store with initialPosts (avoids a double-fetch)
            2. Subscribes to Socket.IO for real-time vote/comment updates
            3. Handles optimistic mutations and infinite scroll
        */}
        <FeedClientUI
          initialPosts={initialData.posts}
          initialCursor={initialData.nextCursor}
          initialHasMore={initialData.hasMore}
        />
      </Suspense>
    </main>
  );
}
