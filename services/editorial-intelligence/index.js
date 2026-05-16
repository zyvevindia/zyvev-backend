/**
 * Editorial intelligence — template narratives with tone governance.
 */

const toneRules = require("./toneRules");
const generators = require("./generators");

module.exports = {
  ...toneRules,
  ...generators,
};
