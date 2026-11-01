const benchPostId = process.env.BENCH_POST_ID || "6ae73f0740be00d25ceb676e";

const query = `
query GetHeavyThread($postId: ID!) {
  thread(postId: $postId) {
    id
    title
    score
    commentCount
    comments {
      id
      depth
      body
      score
      upvotes
      downvotes
      author {
        id
        username
      }
      replies {
        id
        depth
        body
        score
        author {
          id
          username
        }
      }
    }
  }
}
`;

async function main() {
  const t0 = Date.now();
  const res = await fetch("http://localhost:5001/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { postId: benchPostId } }),
  });
  const t1 = Date.now();
  console.log("Status:", res.status, "Time:", t1 - t0, "ms");
  const json = await res.json();
  if (json.errors) {
    console.log("Errors:", JSON.stringify(json.errors, null, 2));
  } else {
    console.log("Success! Comments length:", json.data.thread.comments.length);
  }
}

main().catch(console.error);
