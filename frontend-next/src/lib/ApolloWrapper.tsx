"use client";

/**
 * ApolloWrapper.tsx
 *
 * Client Component that provides Apollo context to the Client-Component subtree.
 * This is the standard Next.js App Router pattern: wrap the tree here so that
 * useQuery / useMutation hooks work inside any Client Component below.
 *
 * RSC (Server Components) do NOT use this wrapper — they call createServerClient()
 * directly inside their own async bodies.
 */

import { ApolloProvider } from "@apollo/client/react";
import { getClientSideClient } from "@/lib/apollo-client";
import { ReactNode } from "react";

export function ApolloWrapper({ children }: { children: ReactNode }) {
  // getClientSideClient() is safe here because "use client" ensures we're
  // always running in the browser.
  const client = getClientSideClient();

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
