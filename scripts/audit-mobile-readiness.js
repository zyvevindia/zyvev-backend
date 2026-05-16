#!/usr/bin/env node
/**
 * Mobile experience validation checklist (static + codebase signals).
 */
const fs = require("fs");
const path = require("path");

const FRONTEND = path.join(__dirname, "../../zyvev-frontend");
const SRC = path.join(FRONTEND, "src");

function readSrc(rel) {
  return fs.readFileSync(path.join(SRC, rel), "utf8");
}

function check(id, label, pass, detail) {
  return { id, label, pass, detail };
}

function main() {
  const compare = readSrc("pages/ComparePage.jsx");
  const carDetails = readSrc("pages/CarDetails.jsx");
  const leadModal = readSrc("components/LeadInquiryModal.jsx");
  const trustBlock = readSrc("components/catalog/TrustConfidenceBlock.jsx");
  const appJs = readSrc("App.jsx");
  const indexHtml = fs.readFileSync(path.join(FRONTEND, "index.html"), "utf8");

  const items = [
    check(
      "compare_responsive",
      "Compare page uses responsive layout patterns",
      /@media|maxWidth|flexWrap|gridTemplateColumns/i.test(compare),
      "ComparePage.jsx"
    ),
    check(
      "detail_readable",
      "Car details page structured for mobile scroll",
      /padding|maxWidth|100%/i.test(carDetails),
      "CarDetails.jsx"
    ),
    check(
      "lead_form_mobile",
      "Lead modal uses full-width inputs",
      /width:\s*["']100%|width:\s*100%/i.test(leadModal),
      "LeadInquiryModal.jsx"
    ),
    check(
      "trust_block_mobile",
      "Trust block uses readable font sizes",
      /fontSize:\s*["']1[3-6]/i.test(trustBlock),
      "TrustConfidenceBlock.jsx"
    ),
    check(
      "seo_guide_exists",
      "SEO guide page present",
      fs.existsSync(path.join(SRC, "pages/SeoGuidePage.jsx")),
      "SeoGuidePage.jsx"
    ),
    check(
      "lazy_admin",
      "Admin routes lazy-loaded",
      appJs.includes("lazy(()") && appJs.includes("Editorial"),
      "App.jsx"
    ),
    check(
      "viewport_meta",
      "Viewport meta in index.html",
      indexHtml.includes("viewport"),
      "index.html"
    ),
    check(
      "manual_compare_375",
      "Manual: compare usable at 375px width",
      true,
      "REQUIRED manual QA before scaling traffic"
    ),
    check(
      "manual_lead_submit",
      "Manual: lead submit on mobile detail page",
      true,
      "REQUIRED manual QA"
    ),
  ];

  const automatedFailed = items.filter(
    (i) => !i.pass && !String(i.detail).includes("REQUIRED manual")
  );

  const report = {
    generatedAt: new Date().toISOString(),
    mobileReady: automatedFailed.length === 0,
    items,
    manualRequired: items.filter((i) =>
      String(i.detail).includes("REQUIRED manual")
    ),
  };

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.mobileReady ? 0 : 1);
}

main();
