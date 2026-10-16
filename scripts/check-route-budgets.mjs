import { readFileSync } from "node:fs";
import path from "node:path";
import { gzipSync } from "node:zlib";

const buildDir = path.resolve(".next");
const manifestPath = path.join(buildDir, "app-build-manifest.json");
const budgets = JSON.parse(readFileSync("bundle-budgets.json", "utf8"));
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const entries = Object.entries(manifest.pages ?? {});
let failed = false;

for (const [route, budget] of Object.entries(budgets.routes)) {
  const match = budget.manifestMatch.toLowerCase();
  const entry = entries.find(([key]) => key.toLowerCase().includes(match));
  if (!entry) {
    console.error(`Route budget could not find ${route} in ${manifestPath} (match: ${budget.manifestMatch}).`);
    failed = true;
    continue;
  }

  const files = [...new Set(entry[1].filter((file) => file.endsWith(".js")))];
  const gzipBytes = files.reduce((total, file) => {
    const asset = path.resolve(buildDir, file.replace(/^[/\\]+/, ""));
    if (!asset.startsWith(`${buildDir}${path.sep}`)) throw new Error(`Invalid build asset path: ${file}`);
    return total + gzipSync(readFileSync(asset)).byteLength;
  }, 0);

  const exception = budgets.exceptions?.[route];
  if (exception && (typeof exception.reason !== "string" || !exception.reason.trim())) {
    console.error(`Budget exception for ${route} must include a non-empty reason.`);
    failed = true;
    continue;
  }
  const limit = exception?.maxGzipBytes ?? budget.maxGzipBytes;
  console.log(`${route}: ${gzipBytes} gzip bytes / ${limit} budget`);
  if (gzipBytes > limit) {
    console.error(`${route} exceeds its JavaScript gzip budget by ${gzipBytes - limit} bytes.`);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
