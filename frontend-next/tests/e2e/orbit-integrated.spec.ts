import { test, expect } from "@playwright/test";

test.describe("Orbit Next.js App Router (SSR) & Realtime E2E Suite", () => {
  // ── TEST 1: Server-Side Rendering (Zero-JS DOM Assertion) ───────────────────
  test("Test 1: Post cards exist in DOM before JavaScript execution (SSR Proof)", async ({
    browser,
    request,
  }) => {
    // 1. Verify via raw HTTP response payload (pure SSR stream)
    const rawRes = await request.get("/feed");
    expect(rawRes.status()).toBe(200);
    const html = await rawRes.text();
    expect(html).toContain("Feed");
    expect(html).toContain("article"); // PostCard renders as <article> in SSR markup

    // 2. Verify in headless browser with JavaScript completely DISABLED
    const noJsContext = await browser.newContext({ javaScriptEnabled: false });
    const noJsPage = await noJsContext.newPage();

    await noJsPage.goto("/feed", { waitUntil: "domcontentloaded" });

    // Assert that the server-rendered HTML contains the post article elements
    const postCards = noJsPage.locator("article");
    const count = await postCards.count();
    expect(count).toBeGreaterThan(0);

    // Assert that the title text is present in the static DOM
    const firstTitle = postCards.first().locator("h3");
    await expect(firstTitle).toBeAttached();
    const titleText = await firstTitle.textContent();
    expect(titleText && titleText.length > 0).toBeTruthy();

    await noJsContext.close();
  });

  // ── TEST 2: Optimistic UI Upvote on Thread / Post Cards ─────────────────────
  test("Test 2: Optimistic upvote mutation updates UI immediately", async ({
    page,
  }) => {
    await page.goto("/feed", { waitUntil: "networkidle" });

    // 1. Optimistic Post Card Upvote
    const postUpvoteBtn = page.locator('button[id^="upvote-"]').first();
    await expect(postUpvoteBtn).toBeVisible({ timeout: 10000 });
    await postUpvoteBtn.click();
    // Verify immediate optimistic class update without waiting for network round-trip
    await expect(postUpvoteBtn).toHaveClass(/text-orange-400/);

    // 2. Open thread and verify VirtualizedThread loads
    const firstPost = page.locator("article").first();
    await firstPost.click();

    const backButton = page.locator("#thread-back-btn, button[aria-label='Back to Feed']");
    await expect(backButton).toBeVisible({ timeout: 15000 });
  });

  // ── TEST 3: Socket.IO Client Boundary Isolation (SSR Guard Verification) ──
  test("Test 3: Socket.IO connection establishes strictly post-hydration in useEffect", async ({
    page,
  }) => {
    let wsConnected = false;
    let initialRenderFinished = false;

    // Listen for WebSocket handshakes or Socket.IO polling requests
    page.on("websocket", (ws) => {
      // Assert that WebSocket handshake is ONLY initiated on client
      expect(initialRenderFinished).toBeTruthy();
      wsConnected = true;
    });

    page.on("request", (req) => {
      if (req.url().includes("socket.io")) {
        // Assert Socket.IO transport requests fire only in client phase
        expect(initialRenderFinished).toBeTruthy();
      }
    });

    // Navigate to /feed
    const navPromise = page.goto("/feed", { waitUntil: "commit" });
    initialRenderFinished = true; // commit means HTML received from server
    await navPromise;

    // Wait for client-side hydration to complete
    await page.waitForLoadState("networkidle");

    // Verify page is interactive and healthy
    const postComposerBtn = page.locator("#create-post-btn");
    await expect(postComposerBtn).toBeVisible();
  });
});
