/**
 * MongoDB / Mongoose bootstrap — Atlas-safe defaults + local diagnostics.
 * Minimal surface: connectDatabase() only; call once from server.js.
 */

const dns = require("dns");
const mongoose = require("mongoose");

const DIAGNOSE =
  process.env.MONGO_DIAGNOSE === "true" ||
  process.env.NODE_ENV !== "production";

/* =========================================================
   IPv4-first DNS (Windows + Node 18+ / 24 local Atlas issues)
   Must run before any MongoDB connection attempt.
   ========================================================= */

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
  if (DIAGNOSE) {
    console.log('[mongo] dns.setDefaultResultOrder("ipv4first") applied');
  }
} else if (DIAGNOSE) {
  console.warn(
    "[mongo] dns.setDefaultResultOrder unavailable on this Node build"
  );
}

/* =========================================================
   URI diagnostics (never log credentials)
   ========================================================= */

function maskMongoUri(uri = "") {
  if (!uri) return "(empty)";
  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/i,
    "$1$2:***@"
  );
}

function parseMongoUriDiagnostics(uri = "") {
  const out = {
    scheme: null,
    hostCount: 0,
    hosts: [],
    hasCredentials: false,
    replicaSet: null,
    tls: false,
    authSource: null,
    dbInPath: null,
    issues: [],
  };

  if (!uri) {
    out.issues.push("MONGO_URI is empty");
    return out;
  }

  const schemeMatch = uri.match(/^(mongodb(?:\+srv)?):\/\//i);
  out.scheme = schemeMatch ? schemeMatch[1] : "unknown";

  if (out.scheme === "unknown") {
    out.issues.push("URI must start with mongodb:// or mongodb+srv://");
  }

  out.hasCredentials = /^mongodb(?:\+srv)?:\/\/[^@/]+@/i.test(uri);

  const query = uri.includes("?") ? uri.split("?")[1] : "";
  const params = new URLSearchParams(query);

  out.replicaSet = params.get("replicaSet");
  out.tls =
    params.get("tls") === "true" ||
    params.get("ssl") === "true";
  out.authSource = params.get("authSource");

  if (out.scheme === "mongodb") {
    const afterAt = uri.split("@")[1] || "";
    const hostPart = afterAt.split("?")[0].split("/")[0];
    out.hosts = hostPart
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    out.hostCount = out.hosts.length;

    if (!out.tls) {
      out.issues.push(
        "Atlas requires tls/ssl on mongodb:// seed lists (add ?tls=true or ssl=true)"
      );
    }
    if (!out.replicaSet) {
      out.issues.push(
        "multi-host mongodb:// URI should include replicaSet=... for Atlas"
      );
    }
  }

  if (out.scheme === "mongodb+srv" && out.hostCount === 0) {
    const srvHost = uri.replace(/^mongodb\+srv:\/\//i, "").split("/")[0].split("?")[0];
    out.hosts = [srvHost];
    out.hostCount = 1;
  }

  const pathMatch = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  if (pathMatch && pathMatch[1]) {
    out.dbInPath = pathMatch[1];
  }

  if (!out.hasCredentials) {
    out.issues.push("URI appears to be missing username:password@");
  }

  return out;
}

function logMongoUriDiagnostics(uri) {
  const parsed = parseMongoUriDiagnostics(uri);
  console.log("[mongo] URI (masked):", maskMongoUri(uri));
  console.log("[mongo] parsed:", {
    scheme: parsed.scheme,
    hostCount: parsed.hostCount,
    hosts: parsed.hosts.map((h) => h.replace(/:27017$/, ":27017")),
    tls: parsed.tls,
    replicaSet: parsed.replicaSet || "(none)",
    authSource: parsed.authSource || "(default)",
    dbInPath: parsed.dbInPath || "(driver default)",
    node: process.version,
    platform: process.platform,
  });
  if (parsed.issues.length) {
    console.warn("[mongo] URI checks:", parsed.issues);
  }
  return parsed;
}

/* =========================================================
   Connection / topology event logging
   ========================================================= */

let diagnosticsAttached = false;

function attachMongooseDiagnostics() {
  if (diagnosticsAttached) return;
  diagnosticsAttached = true;

  const conn = mongoose.connection;

  conn.on("connecting", () => {
    console.log("[mongo] event: connecting");
  });

  conn.on("connected", () => {
    console.log("[mongo] event: connected", {
      host: conn.host,
      port: conn.port,
      name: conn.name,
    });
  });

  conn.on("open", () => {
    console.log("[mongo] event: open (ready for operations)");
  });

  conn.on("disconnected", () => {
    console.log("[mongo] event: disconnected");
  });

  conn.on("reconnected", () => {
    console.log("[mongo] event: reconnected");
  });

  conn.on("error", (err) => {
    console.error("[mongo] event: connection error", {
      name: err?.name,
      message: err?.message,
      code: err?.code,
      reason: err?.reason?.type || err?.reason?.message,
    });
  });

  conn.on("close", () => {
    console.log("[mongo] event: close");
  });

  const wireClientEvents = () => {
    const client =
      typeof conn.getClient === "function"
        ? conn.getClient()
        : conn.client;

    if (!client || typeof client.on !== "function") return;

    client.on("serverDescriptionChanged", (event) => {
      if (!DIAGNOSE) return;
      console.log("[mongo] serverDescriptionChanged", {
        address: event?.address,
        type: event?.newDescription?.type,
        error: event?.newDescription?.error?.message,
      });
    });

    client.on("topologyDescriptionChanged", (event) => {
      if (!DIAGNOSE) return;
      const desc = event?.newDescription;
      console.log("[mongo] topologyDescriptionChanged", {
        type: desc?.type,
        servers: desc?.servers
          ? [...desc.servers.entries()].map(([addr, s]) => ({
              address: addr,
              type: s.type,
              error: s.error?.message,
            }))
          : [],
      });
    });

    client.on("serverHeartbeatFailed", (event) => {
      console.warn("[mongo] serverHeartbeatFailed", {
        connectionId: event?.connectionId,
        failure: event?.failure?.message,
      });
    });
  };

  conn.once("connected", wireClientEvents);
}

function getConnectOptions() {
  const options = {
    dbName: process.env.MONGO_DB_NAME || "zyvevDB",
    serverSelectionTimeoutMS: Number(
      process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000
    ),
    /**
     * Force IPv4 — fixes many Windows local ReplicaSetNoPrimary /
     * commonWireVersion: 0 cases when IPv6 routes are broken.
     * Safe on Render/Linux production.
     */
    family: 4,
  };

  /**
   * Local Windows dev only — TLS "unable to verify the first certificate"
   * (corporate proxy / outdated CA store). Never enable in production.
   */
  if (
    process.env.MONGO_TLS_INSECURE_LOCAL === "true" &&
    process.env.NODE_ENV !== "production"
  ) {
    options.tlsAllowInvalidCertificates = true;
    console.warn(
      "[mongo] MONGO_TLS_INSECURE_LOCAL=true — TLS certificate verification disabled (dev only)"
    );
  }

  if (DIAGNOSE) {
    console.log("[mongo] driver options:", {
      ...options,
      tlsAllowInvalidCertificates: options.tlsAllowInvalidCertificates ?? false,
    });
  }

  return options;
}

async function connectDatabase() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not set");
  }

  if (DIAGNOSE) {
    logMongoUriDiagnostics(uri);
    attachMongooseDiagnostics();
  }

  try {
    await mongoose.connect(uri, getConnectOptions());
    console.log("MongoDB Connected ✅");
    return mongoose.connection;
  } catch (err) {
    console.error("DB Error:", err?.message || err);

    if (DIAGNOSE && err?.reason) {
      console.error("[mongo] server selection reason:", {
        type: err.reason?.type,
        servers: err.reason?.servers
          ? [...err.reason.servers.entries()].map(([addr, s]) => ({
              address: addr,
              type: s?.type,
              error: s?.error?.message,
            }))
          : undefined,
      });
    }

    const certError = /unable to verify the first certificate|UNABLE_TO_VERIFY_LEAF_SIGNATURE/i.test(
      String(err?.message || "") +
        (err?.reason?.servers
          ? [...err.reason.servers.values()]
              .map((s) => s?.error?.message || "")
              .join(" ")
          : "")
    );
    if (certError) {
      console.error(
        "[mongo] TLS certificate verification failed on this machine (not an Atlas IP whitelist issue).",
        "Fix: update Windows/Node CA trust, disable SSL-inspecting VPN/proxy, or set MONGO_TLS_INSECURE_LOCAL=true in .env for local dev only."
      );
    }

    throw err;
  }
}

module.exports = {
  connectDatabase,
  attachMongooseDiagnostics,
  logMongoUriDiagnostics,
  maskMongoUri,
  parseMongoUriDiagnostics,
};
