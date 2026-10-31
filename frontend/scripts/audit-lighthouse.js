/**
 * Orbit Lighthouse Performance Audit Runner
 *
 * Runs Google Chrome Lighthouse against the local Vite production preview server
 * and parses First Contentful Paint (FCP) and Time to Interactive (TTI).
 *
 * Usage:
 *   1. Build frontend: npm run build
 *   2. Start preview: npm run preview (in separate terminal)
 *   3. Run audit: node scripts/audit-lighthouse.js [http://localhost:4173]
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const targetUrl = process.argv[2] || "http://localhost:4173/";
const reportPath = path.resolve("./lighthouse-report.json");

console.log(`[Lighthouse Audit] Target URL: ${targetUrl}`);
console.log(`[Lighthouse Audit] Starting Chrome headless audit...`);

try {
  // Execute Lighthouse via npx
  const cmd = `npx -y lighthouse ${targetUrl} --output=json --output-path="${reportPath}" --chrome-flags="--headless --no-sandbox --disable-gpu" --only-categories=performance --quiet`;
  execSync(cmd, { stdio: "inherit" });

  if (!fs.existsSync(reportPath)) {
    throw new Error(`Report not generated at ${reportPath}`);
  }

  const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  const audits = reportData.audits;
  const categories = reportData.categories;

  const fcp = audits["first-contentful-paint"];
  const tti = audits["interactive"];
  const lcp = audits["largest-contentful-paint"];
  const tbt = audits["total-blocking-time"];
  const cls = audits["cumulative-layout-shift"];
  const score = Math.round((categories.performance?.score || 0) * 100);

  console.log("\n=======================================================");
  console.log("       ✦ ORBIT FRONTEND PERFORMANCE AUDIT ✦           ");
  console.log("=======================================================");
  console.log(`Overall Performance Score: ${score}/100`);
  console.log("-------------------------------------------------------");
  console.log(`First Contentful Paint (FCP):  ${fcp?.displayValue || "N/A"}`);
  console.log(`Time to Interactive (TTI):     ${tti?.displayValue || "N/A"}`);
  console.log(`Largest Contentful Paint (LCP): ${lcp?.displayValue || "N/A"}`);
  console.log(`Total Blocking Time (TBT):     ${tbt?.displayValue || "N/A"}`);
  console.log(`Cumulative Layout Shift (CLS): ${cls?.displayValue || "N/A"}`);
  console.log("=======================================================\n");

} catch (err) {
  console.error("[Lighthouse Audit Failed]", err.message);
  console.log("\nAlternative Direct CLI Command:");
  console.log(`npx lighthouse ${targetUrl} --view --preset=desktop\n`);
  process.exit(1);
}
