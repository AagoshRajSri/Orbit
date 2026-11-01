import DataLoader from "dataloader";
import User from "../models/user.model.js";

/**
 * Batch resolution function for User documents.
 * 
 * Takes an array of User IDs collected across multiple resolver calls in a single tick,
 * executes exactly ONE MongoDB `$in` query, and maps each document back to the exact
 * position and index of the input keys to fulfill the DataLoader contract.
 *
 * @param {Array<string|import("mongoose").Types.ObjectId>} userIds
 * @returns {Promise<Array<Object|null>>}
 */
export async function batchUsers(userIds) {
  if (!userIds || userIds.length === 0) return [];

  // Normalize IDs to string representation for safe Set deduplication & Map lookups
  const stringIds = userIds.map((id) => id?.toString()).filter(Boolean);
  const uniqueIds = [...new Set(stringIds)];

  // Single round-trip MongoDB query fetching only required profile fields
  const users = await User.find({
    _id: { $in: uniqueIds },
  })
    .select("username orbitId orbitTag normalizedHandle profilePic bio isLocked createdAt")
    .lean();

  // Populate hash map for O(1) retrieval
  const userMap = new Map();
  for (const user of users) {
    userMap.set(user._id.toString(), user);
  }

  // Contract: Map back to the exact order of the input keys
  return userIds.map((key) => {
    if (!key) return null;
    const keyStr = key.toString();
    return userMap.get(keyStr) || null;
  });
}

/**
 * Factory function creating a fresh DataLoader context per incoming GraphQL request.
 * 
 * Crucial: Creating a new instance per request prevents cross-request memory leaks
 * and guarantees tenant isolation (no user can read another request's cached context).
 *
 * @returns {{ userLoader: DataLoader<string, Object> }}
 */
export function createLoaders() {
  return {
    userLoader: new DataLoader(batchUsers, {
      cache: true,
      maxBatchSize: 1000,
    }),
  };
}
