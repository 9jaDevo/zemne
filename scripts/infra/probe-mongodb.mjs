// Standalone P3 infrastructure probe. No HTTP route, application models or writes.
// Never print the URI, credentials, server addresses or raw driver errors.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function report(status, exitCode, details = {}) {
  console.log(JSON.stringify({ probe: "mongodb", status, ...details }));
  process.exitCode = exitCode;
}

const uri = process.env.MONGODB_URI;
let config;
if (!uri) {
  report("not_configured", 2);
} else {
  try {
    config = new URL(uri);
    if (!["mongodb:", "mongodb+srv:"].includes(config.protocol)) {
      throw new Error("unsupported_protocol");
    }
    // Restrict this infrastructure probe to ZEMNE, never a neighboring project.
    if (decodeURIComponent(config.pathname) !== "/zemne") {
      throw new Error("wrong_database");
    }
    for (const [name, value] of config.searchParams) {
      const key = name.toLowerCase();
      const setting = value.toLowerCase();
      if (
        (["tls", "ssl"].includes(key) && setting !== "true") ||
        ([
          "tlsinsecure",
          "tlsallowinvalidcertificates",
          "tlsallowinvalidhostnames",
        ].includes(key) &&
          setting !== "false")
      ) {
        throw new Error("unsafe_tls");
      }
    }
  } catch {
    config = null;
    report("invalid_or_unsafe_configuration", 2);
  }

  if (config) {
    let MongoClient;
    try {
      // Prefer the application's driver once Claude installs it in P4.
      ({ MongoClient } = await import("mongodb"));
    } catch {
      try {
        // Optional isolated tools directory; never changes application deps.
        const requireTool = createRequire(
          pathToFileURL(resolve(".infra-tools/package.json")),
        );
        ({ MongoClient } = requireTool("mongodb"));
      } catch {
        report("driver_unavailable", 2);
      }
    }

    if (MongoClient) {
      let client;
      try {
        client = new MongoClient(uri, {
          tls: true,
          tlsAllowInvalidCertificates: false,
          tlsAllowInvalidHostnames: false,
          serverSelectionTimeoutMS: 10_000,
          connectTimeoutMS: 10_000,
          maxPoolSize: 1,
          minPoolSize: 0,
          appName: "zemne-p3-infrastructure-probe",
        });
        await client.connect();
        const db = client.db("zemne");
        await db.command({ ping: 1 });
        const status = await db.command({
          connectionStatus: 1,
          showPrivileges: false,
        });
        const roles = status.authInfo?.authenticatedUserRoles ?? [];
        const expectedRoleOnly =
          roles.length > 0 &&
          roles.every(
            (role) => role.role === "readWrite" && role.db === "zemne",
          );
        report(
          expectedRoleOnly ? "ok" : "role_review_required",
          expectedRoleOnly ? 0 : 3,
          {
            database: "zemne",
            tls: "required_certificate_validation_enabled",
            ping: "ok",
            expected_role_only: expectedRoleOnly,
            writes_performed: false,
          },
        );
      } catch (error) {
        report(
          error?.code === 18 ? "authentication_failed" : "connection_failed",
          1,
        );
      } finally {
        await client?.close().catch(() => undefined);
      }
    }
  }
}
