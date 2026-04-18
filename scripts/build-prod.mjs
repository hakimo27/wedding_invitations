import { execSync } from "node:child_process";
import { rm, mkdir, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distDir = path.join(root, "dist");

function run(cmd, env = {}) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

async function buildProd() {
  console.log("\n=== Production Build ===\n");

  console.log("Cleaning dist/...");
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  console.log("\n[1/3] Building frontend...");
  run("pnpm --filter @workspace/wedding run build", {
    NODE_ENV: "production",
    BASE_PATH: "/",
  });

  console.log("\n[2/3] Building backend...");
  run("pnpm --filter @workspace/api-server run build", {
    NODE_ENV: "production",
  });

  console.log("\n[3/3] Assembling dist/...");
  await cp(
    path.join(root, "artifacts/api-server/dist"),
    path.join(distDir, "server"),
    { recursive: true },
  );
  await cp(
    path.join(root, "artifacts/wedding/dist/public"),
    path.join(distDir, "public"),
    { recursive: true },
  );

  console.log(`
=== Build complete ===

dist/
├── server/   — Node.js server bundle
└── public/   — Frontend static files

To start:
  NODE_ENV=production PORT=3000 DATABASE_URL=... node dist/server/index.mjs

Or with PM2:
  pm2 start ecosystem.config.js --env production
`);
}

buildProd().catch((err) => {
  console.error("\nBuild failed:", err.message);
  process.exit(1);
});
