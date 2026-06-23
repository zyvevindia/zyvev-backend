/**
 * Standalone Atlas connection diagnostic (local troubleshooting).
 * Usage: node scripts/diagnose-mongo-connection.js
 */

require("dotenv").config();

const dns = require("dns");
const { promisify } = require("util");
const mongoose = require("mongoose");
const {
  logMongoUriDiagnostics,
  maskMongoUri,
} = require("../config/database");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
  console.log('Applied dns.setDefaultResultOrder("ipv4first")');
}

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);

function parseHosts(uri) {
  const m = uri.match(/@([^?]+)/);
  if (!m) return [];
  return m[1]
    .split("/")[0]
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not set in .env");
    process.exit(1);
  }

  console.log("\n=== Mongo connection diagnostic ===\n");
  console.log("Node:", process.version, process.platform);
  logMongoUriDiagnostics(uri);

  const hosts = parseHosts(uri);
  console.log("\n--- DNS ---\n");
  for (const entry of hosts) {
    const [host] = entry.split(":");
    try {
      const a4 = await resolve4(host);
      console.log(`${host} A:`, a4.join(", "));
    } catch (e) {
      console.log(`${host} A: FAILED`, e.code, e.message);
    }
    try {
      const a6 = await resolve6(host);
      console.log(`${host} AAAA:`, a6.length ? a6.join(", ") : "(none)");
    } catch {
      console.log(`${host} AAAA: (none or failed)`);
    }
  }

  console.log("\n--- Mongoose connect (family: 4) ---\n");

  try {
    await mongoose.connect(uri, {
      dbName: process.env.MONGO_DB_NAME || "zyvevDB",
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log("SUCCESS — connected to", mongoose.connection.host);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("FAILED:", err.message);
    if (err.reason?.servers) {
      for (const [addr, s] of err.reason.servers) {
        console.error(" ", addr, s.type, s.error?.message || "");
      }
    }
    process.exit(1);
  }
}

main();
