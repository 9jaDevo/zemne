// Hosting-only P3 diagnostics. This is not application/API/database business logic.
// The placeholder still starts after a failed probe; deployment is not DB readiness.
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";

const result = spawnSync(
  process.execPath,
  [resolve("scripts/infra/probe-mongodb.mjs")],
  { env: process.env, encoding: "utf8", timeout: 15_000 },
);

// Never forward raw stderr or arbitrary child output to hosting logs.
try {
  const probe = JSON.parse(result.stdout.trim());
  const allowed = new Set([
    "ok",
    "not_configured",
    "invalid_or_unsafe_configuration",
    "driver_unavailable",
    "role_review_required",
    "authentication_failed",
    "connection_failed",
  ]);
  console.log(
    JSON.stringify({
      probe: "mongodb",
      status: allowed.has(probe.status) ? probe.status : "probe_failed",
      expected_role_only: probe.expected_role_only === true,
      scope: "Render runtime network",
      deployment_is_database_readiness: false,
    }),
  );
} catch {
  console.log(
    JSON.stringify({
      probe: "mongodb",
      status: "probe_failed",
      scope: "Render runtime network",
    }),
  );
}

const server = spawn(
  process.execPath,
  [
    resolve("node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "0.0.0.0",
    "--port",
    process.env.PORT || "10000",
  ],
  { stdio: "inherit", env: process.env },
);

process.on("SIGTERM", () => server.kill("SIGTERM"));
process.on("SIGINT", () => server.kill("SIGINT"));
server.on("error", () => {
  console.error("Web process could not start.");
  process.exitCode = 1;
});
server.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
