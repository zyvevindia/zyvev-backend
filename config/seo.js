/**
 * SEO Authority Infrastructure feature flags.
 */

const SEO_PAGES_ENABLED =
  process.env.SEO_PAGES_ENABLED === "true";

/**
 * When true, generated SEO pages include full intelligence scoring metadata.
 */
const SEO_INTELLIGENCE_PUBLIC =
  process.env.SEO_INTELLIGENCE_PUBLIC === "true";

module.exports = {
  SEO_PAGES_ENABLED,
  SEO_INTELLIGENCE_PUBLIC,
};
