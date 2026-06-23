/**
 * Soft-launch protection smoke checks (no Turnstile token — expects 400 when enforced).
 * Usage: API_URL=http://localhost:5000 node scripts/soft-launch-smoke.mjs
 */

const API =
  (process.env.API_URL || "http://localhost:5000").replace(
    /\/$/,
    ""
  );

const results = [];

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false, error: err.message });
    console.error(`✗ ${name}: ${err.message}`);
  }
}

async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

await check("health GET /", async () => {
  const res = await fetch(`${API}/`);
  if (!res.ok) throw new Error(`status ${res.status}`);
});

await check("POST /leads accepts buyer lead (no captcha)", async () => {
  const { res, data } = await post("/leads", {
    name: "Smoke Test",
    phone: "9876543210",
    email: "smoke@example.com",
    city: "Mumbai",
    vehicleName: "Tata Nexon EV",
    familySlug: "tata-nexon-ev",
    message: "Soft launch smoke test",
    leadSource: "form",
  });

  if (res.status !== 201 && res.status !== 400) {
    throw new Error(
      `unexpected ${res.status}: ${data.message || ""}`
    );
  }
});

await check(
  "POST /api/feedback rejects missing Turnstile when secret set",
  async () => {
    const { res } = await post("/api/feedback", {
      category: "other",
      description: "Smoke test feedback description",
      route: "/",
    });

    if (res.status === 201) {
      console.log(
        "  (Turnstile not enforced — dev mode OK)"
      );
      return;
    }

    if (res.status !== 400) {
      throw new Error(`expected 400, got ${res.status}`);
    }
  }
);

await check("POST /api/contact validation", async () => {
  const { res } = await post("/api/contact", {
    name: "A",
    email: "bad",
    message: "short",
  });

  if (res.status !== 400) {
    throw new Error(`expected 400, got ${res.status}`);
  }
});

const failed = results.filter((r) => !r.ok);

if (failed.length) {
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
