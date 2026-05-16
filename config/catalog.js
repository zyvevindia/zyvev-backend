/* =========================================================
   ================= EV MASTER CATALOG FLAGS ===============
   ========================================================= */

/**
 * When true, public catalog routes merge published master variants
 * with legacy Car records (master wins on slug collision).
 */
const USE_EV_MASTER =
  process.env.USE_EV_MASTER === "true";

/**
 * When true (with valid admin JWT), catalog APIs may return
 * draft/review variants via ?preview=true.
 */
const EV_MASTER_ADMIN_PREVIEW =
  process.env.EV_MASTER_ADMIN_PREVIEW !== "false";

/**
 * When true, API catalogMeta includes full intelligence blocks
 * (safety, decision, persona fit, compare picks). Default off in production.
 */
const CATALOG_INTELLIGENCE_ENABLED =
  process.env.CATALOG_INTELLIGENCE_ENABLED === "true";

module.exports = {
  USE_EV_MASTER,
  EV_MASTER_ADMIN_PREVIEW,
  CATALOG_INTELLIGENCE_ENABLED,
};
