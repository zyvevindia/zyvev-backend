/**
 * Structured data validation — deterministic builders & static SEO JSON.
 */

const fs = require("fs");
const path = require("path");
const { loadTier1Variants } = require("../seo-pages/loadCatalog");
const { buildAllSeoPages } = require("../seo-pages");

const SITE_ORIGIN = process.env.SITE_ORIGIN || "https://evsavari.com";

function validateJsonLdObject(obj, pathLabel) {
  const issues = [];

  if (!obj || typeof obj !== "object") {
    issues.push({ path: pathLabel, reason: "not an object" });
    return issues;
  }

  if (!obj["@context"]?.includes("schema.org")) {
    issues.push({ path: pathLabel, reason: "missing @context schema.org" });
  }

  if (obj["@type"] === "Vehicle" || obj["@type"] === "Product") {
    if (!obj.name) issues.push({ path: pathLabel, reason: "vehicle missing name" });
    if (!obj.url && !obj.offers?.url) {
      issues.push({ path: pathLabel, reason: "vehicle missing url" });
    }
    if (obj.aggregateRating || obj.review) {
      issues.push({
        path: pathLabel,
        reason: "unsupported aggregateRating/review — prohibited",
      });
    }
  }

  if (obj["@type"] === "FAQPage") {
    if (!Array.isArray(obj.mainEntity) || !obj.mainEntity.length) {
      issues.push({ path: pathLabel, reason: "FAQPage empty mainEntity" });
    }
    for (const q of obj.mainEntity || []) {
      if (!q.name || !q.acceptedAnswer?.text) {
        issues.push({
          path: pathLabel,
          reason: "malformed FAQ question/answer",
        });
      }
    }
  }

  if (obj["@type"] === "BreadcrumbList") {
    const items = obj.itemListElement || [];
    if (!items.length) {
      issues.push({ path: pathLabel, reason: "empty breadcrumb list" });
    }
    for (const item of items) {
      if (!item.item?.startsWith("http")) {
        issues.push({
          path: pathLabel,
          reason: "breadcrumb item missing absolute URL",
        });
      }
    }
  }

  return issues;
}

function auditStructuredData(options = {}) {
  const tier1Root =
    options.tier1Root ||
    path.join(
      __dirname,
      "../../docs/architecture/catalog/tier-1"
    );
  const publicDir =
    options.publicDir ||
    path.join(__dirname, "../../../zyvev-frontend/public");

  const invalidJsonLd = [];
  const schemaMismatches = [];
  const missingCanonicalRefs = [];
  const malformedFaq = [];
  const duplicateBlocks = [];

  const { variants } = loadTier1Variants(tier1Root);
  const seoPages = buildAllSeoPages({ tier1Root, siteOrigin: SITE_ORIGIN });

  for (const v of variants) {
    const slug = v.identity?.slug;
    const canonical = `${SITE_ORIGIN}/cars/${slug}`;

    const vehicleSchema = {
      "@context": "https://schema.org",
      "@type": "Vehicle",
      name: `${v.identity?.brandSlug} ${v.identity?.variantName}`,
      url: canonical,
      brand: { "@type": "Brand", name: v.identity?.brandSlug },
    };

    if (v.pricing?.exShowroom) {
      vehicleSchema.offers = {
        "@type": "Offer",
        price: v.pricing.exShowroom,
        url: canonical,
      };
    }

    invalidJsonLd.push(
      ...validateJsonLdObject(vehicleSchema, `vehicle:${slug}`)
    );

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
        {
          "@type": "ListItem",
          position: 2,
          name: "Cars",
          item: `${SITE_ORIGIN}/cars`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: slug,
          item: canonical,
        },
      ],
    };

    invalidJsonLd.push(
      ...validateJsonLdObject(breadcrumb, `breadcrumb:${slug}`)
    );

    const faqItems = v.seo?.faq || [];
    const faqEntities = faqItems
      .map((f) => {
        if (typeof f === "string") {
          return {
            "@type": "Question",
            name: f.slice(0, 120),
            acceptedAnswer: {
              "@type": "Answer",
              text: f,
            },
          };
        }
        if (f?.question && f?.answer) {
          return {
            "@type": "Question",
            name: f.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: f.answer,
            },
          };
        }
        return null;
      })
      .filter(Boolean);

    if (faqEntities.length) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqEntities,
        url: canonical,
      };
      const faqIssues = validateJsonLdObject(
        faqSchema,
        `faq:${slug}`
      );
      invalidJsonLd.push(...faqIssues);
      malformedFaq.push(...faqIssues.filter((i) => i.reason.includes("FAQ")));
    }
  }

  for (const { seoPage } of seoPages) {
    const canonical = seoPage.canonicalUrl;
    if (!canonical?.startsWith(SITE_ORIGIN)) {
      missingCanonicalRefs.push({
        slug: seoPage.slug,
        canonicalUrl: canonical,
      });
    }

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_ORIGIN },
        {
          "@type": "ListItem",
          position: 2,
          name: "EVs",
          item: `${SITE_ORIGIN}/cars`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: seoPage.title,
          item: canonical,
        },
      ],
    };

    invalidJsonLd.push(
      ...validateJsonLdObject(breadcrumb, `seo-breadcrumb:${seoPage.slug}`)
    );

    if (seoPage.faq?.length) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: seoPage.faq.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
        url: canonical,
      };
      const issues = validateJsonLdObject(
        faqSchema,
        `seo-faq:${seoPage.slug}`
      );
      invalidJsonLd.push(...issues);
      malformedFaq.push(...issues);
    }

    const staticPath = path.join(
      publicDir,
      "seo-data",
      `${seoPage.slug}.json`
    );
    if (fs.existsSync(staticPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(staticPath, "utf8"));
        JSON.stringify(raw);
      } catch (e) {
        invalidJsonLd.push({
          path: staticPath,
          reason: `invalid JSON file: ${e.message}`,
        });
      }
    }
  }

  const errors =
    invalidJsonLd.length +
    missingCanonicalRefs.length +
    schemaMismatches.length;

  return {
    vehicleSchemasChecked: variants.length,
    seoPagesChecked: seoPages.length,
    invalidJsonLd,
    schemaMismatches,
    missingCanonicalRefs,
    malformedFaq,
    duplicateBlocks,
    errors,
    warnings: malformedFaq.length,
  };
}

module.exports = {
  auditStructuredData,
  validateJsonLdObject,
};
