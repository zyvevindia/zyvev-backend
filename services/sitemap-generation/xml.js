/**
 * Sitemap XML serialization — sitemaps.org protocol.
 */

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * @param {{ loc: string, lastmod?: string, changefreq?: string, priority?: number }[]} urls
 */
function buildUrlSetXml(urls) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const url of urls) {
    lines.push("  <url>");
    lines.push(`    <loc>${escapeXml(url.loc)}</loc>`);
    if (url.lastmod) {
      lines.push(`    <lastmod>${escapeXml(url.lastmod)}</lastmod>`);
    }
    if (url.changefreq) {
      lines.push(
        `    <changefreq>${escapeXml(url.changefreq)}</changefreq>`
      );
    }
    if (url.priority != null) {
      lines.push(
        `    <priority>${Number(url.priority).toFixed(1)}</priority>`
      );
    }
    lines.push("  </url>");
  }

  lines.push("</urlset>");
  return lines.join("\n") + "\n";
}

/**
 * @param {{ loc: string, lastmod?: string }[]} sitemaps
 */
function buildSitemapIndexXml(sitemaps) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const sm of sitemaps) {
    lines.push("  <sitemap>");
    lines.push(`    <loc>${escapeXml(sm.loc)}</loc>`);
    if (sm.lastmod) {
      lines.push(`    <lastmod>${escapeXml(sm.lastmod)}</lastmod>`);
    }
    lines.push("  </sitemap>");
  }

  lines.push("</sitemapindex>");
  return lines.join("\n") + "\n";
}

module.exports = {
  buildUrlSetXml,
  buildSitemapIndexXml,
  escapeXml,
};
