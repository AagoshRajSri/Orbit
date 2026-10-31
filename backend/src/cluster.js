/**
 * Orbit Multi-Core Cluster Runner
 *
 * Runs Express + Socket.IO across all available CPU cores using native Node.js clustering
 * with round-robin connection balancing (SCHED_RR) to eliminate OS thread starvation.
 */
import cluster from "node:cluster";
import os from "node:os";

cluster.schedulingPolicy = cluster.SCHED_RR;

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`[Cluster Primary ${process.pid}] Starting ${numCPUs} workers with SCHED_RR Round-Robin...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.warn(`[Cluster] Worker ${worker.process.pid} exited (${signal || code}). Respawning...`);
    cluster.fork();
  });
} else {
  await import("./index.js");
}
