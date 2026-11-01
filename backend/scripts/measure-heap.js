import v8 from "node:v8";

const heap = v8.getHeapStatistics();
const mem = process.memoryUsage();

console.log("=== NODE V8 HEAP TELEMETRY ===");
console.log(`Heap Used:            ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap Total:           ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB`);
console.log(`Resident Set (RSS):   ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`Heap Size Limit:      ${(heap.heap_size_limit / 1024 / 1024).toFixed(2)} MB`);
console.log(`SLA Benchmark Limit:  195.00 MB per core`);
console.log(`SLA Status:           ${mem.heapUsed / 1024 / 1024 < 195 ? "PASSED (< 195MB per core)" : "FAILED"}`);
