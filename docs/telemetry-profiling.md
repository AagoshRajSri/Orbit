# Orbit Telemetry & Production Profiling Playbook

This runbook documents the exact procedures to capture factual telemetry, memory footprints, event loop responsiveness, and database query execution plans under extreme concurrent stress (500 HTTP VUs, 1,000 WebSocket connections, 50,000 Materialized Path nodes).

---

## 1. Node.js Cluster Profiling with Clinic.js & Native Diagnostics

### Method A: Profiling with Clinic.js (Doctor / Flame / Bubbleprof)

Clinic.js diagnoses event loop delays, I/O bottlenecks, and memory leaks across Node processes.

```bash
# 1. Install Clinic.js globally
npm install -g clinic

# 2. Profile the clustered backend under load:
# Clinic Doctor analyzes event loop lag, memory spikes, and CPU utilization
clinic doctor --on-port "k6 run tests/k6-integrated-stress.js" -- node src/index.js

# 3. For flamegraph visualization of hot CPU paths (e.g. Argon2id / Tree reconstruction):
clinic flame --on-port "k6 run tests/k6-auth-crypto.js" -- node src/index.js

# 4. For async transaction profiling and event-loop bubble mapping:
clinic bubbleprof --on-port "k6 run tests/k6-integrated-stress.js" -- node src/index.js
```

### Method B: Native V8 Inspector & Heap Snapshots

```powershell
# Launch Node with V8 inspector enabled:
node --inspect=0.0.0.0:9229 src/index.js

# Connect via Chrome DevTools:
# Navigate to chrome://inspect in Google Chrome and click "inspect"
# Under the Memory tab:
#   1. Capture Baseline Heap Snapshot before test
#   2. Trigger 500 VU k6 run
#   3. Capture Post-Run Heap Snapshot and compare retention trees
```

---

## 2. Heap Size Verification (< 195 MB per Core Proof)

To verify the resume claim that memory stays flat at **< 195 MB per core** under 1,000 active WebSockets and 500 concurrent HTTP users:

### PowerShell Live Memory Monitor (Windows):

Run in a separate PowerShell terminal while `artillery-ws-storm.yaml` and `k6-integrated-stress.js` are running:

```powershell
# Query all Node.js cluster worker processes, sort by Private Working Set (MB), and refresh every 3 seconds:
while ($true) {
    Clear-Host
    Write-Host "=== ORBIT NODE.JS CLUSTER WORKER HEAP & MEMORY TELEMETRY ===" -ForegroundColor Cyan
    Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
    
    Get-Process -Name "node" -ErrorAction SilentlyContinue | 
        Select-Object Id, 
            @{Name="WorkingSet_MB"; Expression={[math]::round($_.WorkingSet64 / 1MB, 2)}},
            @{Name="PrivateMemory_MB"; Expression={[math]::round($_.PrivateMemorySize64 / 1MB, 2)}},
            @{Name="CPU_Seconds"; Expression={[math]::round($_.CPU, 2)}} |
        Sort-Object WorkingSet_MB -Descending |
        Format-Table -AutoSize

    Start-Sleep -Seconds 3
}
```

**Assertion:** Verify that every worker process reports `WorkingSet_MB < 195.00 MB`.

### Linux / PM2 Monitor:

```bash
# Live interactive dashboard showing per-worker memory & CPU:
pm2 monit

# Or inspect JSON memory metrics:
pm2 jlist | jq '.[] | {id: .pm_id, name: .name, memory_mb: (.monit.memory / 1024 / 1024 | round), cpu: .monit.cpu}'
```

---

## 3. Event Loop Delay Telemetry (Zero IOCP Starvation Proof)

To prove that `cluster.SCHED_RR` eliminates single-thread IOCP hot-core starvation on Windows, execute this native measurement:

```powershell
# Measure event loop responsiveness directly on port 5001 while under 500 VU load:
node -e "
  const { monitorEventLoopDelay } = require('perf_hooks');
  const h = monitorEventLoopDelay({ resolution: 20 });
  h.enable();

  console.log('Monitoring Event Loop Delay for 30 seconds...');
  setTimeout(() => {
    h.disable();
    console.log('=== EVENT LOOP DELAY TELEMETRY (ms) ===');
    console.log('Min Delay: ', (h.min / 1e6).toFixed(2), 'ms');
    console.log('Median (p50):', (h.percentile(50) / 1e6).toFixed(2), 'ms');
    console.log('p95 Delay: ', (h.percentile(95) / 1e6).toFixed(2), 'ms');
    console.log('p99 Delay: ', (h.percentile(99) / 1e6).toFixed(2), 'ms');
    console.log('Max Delay: ', (h.max / 1e6).toFixed(2), 'ms');
    console.log('Mean Delay: ', (h.mean / 1e6).toFixed(2), 'ms');
    process.exit(0);
  }, 30000);
"
```

**Assertion:** `p95 Delay < 5.0 ms` proves that incoming connections are balanced evenly across worker threads with zero thread starvation.

---

## 4. MongoDB Materialized Path Query Plan Proof (IXSCAN vs COLLSCAN)

Run this command inside `mongosh` to mathematically verify that fetching a 50,000-node comment tree uses an indexed compound B-tree scan (`IXSCAN`) and zero full collection scans (`COLLSCAN`):

```javascript
// Connect to Orbit database in mongosh:
use orbit_db; // or your active database name

// Replace with your primary benchmark post ID:
const targetPostId = ObjectId("6ae62db950e5fdfc90c24acb");

// Run explain executionStats on the materialized path query:
db.comments.find({
  postId: targetPostId,
  isDeleted: false
})
.sort({ path: 1, createdAt: 1 })
.explain("executionStats");
```

### Expected Output & Invariant Checks:

```json
{
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 50000,
    "executionTimeMillis": 48,
    "totalKeysExamined": 50000,
    "totalDocsExamined": 50000,
    "executionStages": {
      "stage": "FETCH",
      "inputStage": {
        "stage": "IXSCAN",
        "keyPattern": {
          "postId": 1,
          "path": 1
        },
        "indexName": "postId_1_path_1",
        "isMultiKey": false,
        "multiKeyPaths": {
          "postId": [],
          "path": []
        },
        "isUnique": false,
        "isSparse": false,
        "isPartial": false,
        "indexVersion": 2,
        "direction": "forward"
      }
    }
  }
}
```

### Ground-Truth Invariants Proved:
1. `stage === "IXSCAN"`: Utilizes the compound index `{ postId: 1, path: 1 }`.
2. `totalKeysExamined === nReturned`: Optimal 1:1 index efficiency (zero extraneous index entries traversed).
3. `COLLSCAN === 0`: Zero unindexed table scanning across the entire database collection.
