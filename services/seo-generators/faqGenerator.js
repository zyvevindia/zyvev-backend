/**
 * Template-generated FAQs — intelligence-backed, governance-safe tone.
 */

const { sanitizeEditorialText } = require("../editorial-intelligence/toneRules");
const { formatLakh } = require("./templates");

const FAQ_TEMPLATES = {
  budget_under_10: [
    {
      q: "Which EV is practical under ₹10 lakh ex-showroom?",
      a: "Our list filters Tier-1 catalog variants at or below ₹10 lakh ex-showroom, then orders by ownership-value composite scores — not paid placements.",
    },
    {
      q: "Should I rely only on ex-showroom price?",
      a: "No. On-road price varies by city (registration, insurance). Use ex-showroom as a comparison anchor and confirm on-road quotes locally.",
    },
  ],
  budget_under_20: [
    {
      q: "What EVs are well suited under ₹20 lakh?",
      a: "Variants at or below ₹20 lakh ex-showroom ranked by budget ownership and value alignment from catalog intelligence.",
    },
    {
      q: "Do subsidies change these picks?",
      a: "State subsidies and FAME policies change effective price. Re-verify eligibility when you shortlist.",
    },
  ],
  city_driving: [
    {
      q: "Which EV is well suited for city driving?",
      a: "City picks weigh maneuverability, commuter persona fit, and urban range practicality from catalog scores.",
    },
    {
      q: "Is ARAI range enough for city use?",
      a: "Use real-world range bands in our catalog where available — city traffic often differs from lab cycles.",
    },
  ],
  family: [
    {
      q: "Which electric car is better aligned for families?",
      a: "Family recommendations use boot practicality, rear comfort, and family suitability scores — with tradeoffs called out per variant.",
    },
  ],
  office_commute: [
    {
      q: "Which EV is practical for office commute?",
      a: "Commute picks balance city usability, indicative running cost, and conservative range for daily distances.",
    },
  ],
  low_maintenance: [
    {
      q: "Which EV has lower indicative running cost?",
      a: "We use catalog service-cost-per-km and resale confidence signals — verify with your nearest authorized service center.",
    },
  ],
  first_time_buyer: [
    {
      q: "Which EV is easier for first-time buyers?",
      a: "First-time buyer alignment uses first-EV persona scores, anxiety reduction, and charging practicality — not generic marketing claims.",
    },
  ],
  apartment_living: [
    {
      q: "Which EV works for apartment living?",
      a: "Apartment picks prioritize home AC charging support and lower charging friction; society permissions and parking still matter.",
    },
  ],
  home_charging: [
    {
      q: "Which EV is well suited for home charging?",
      a: "Home charging picks use AC kW, wallbox readiness, and ecosystem compatibility from Tier-1 charging blocks.",
    },
  ],
  daily_commute: [
    {
      q: "Which EV is practical for daily commute?",
      a: "Daily commute rankings combine commuter scores with conservative real-world range estimates.",
    },
  ],
  head_to_head: [
    {
      q: "Which EV is better in this comparison?",
      a: "Neither variant is declared a universal winner. Each section explains where a variant is better aligned and what to trade off.",
    },
    {
      q: "Should I test drive both?",
      a: "Yes — seat comfort, visibility, and charging access at your home/work matter beyond spec sheets.",
    },
  ],
};

function generateFaqs(registryEntry, rankedVehicles) {
  const key = registryEntry.introTemplateKey;
  const base = (FAQ_TEMPLATES[key] || FAQ_TEMPLATES.city_driving).map(
    (item) => ({
      question: sanitizeEditorialText(item.q),
      answer: sanitizeEditorialText(item.a),
    })
  );

  if (rankedVehicles.length > 0) {
    const top = rankedVehicles[0];
    base.push({
      question: sanitizeEditorialText(
        `What is the top pick on this page?`
      ),
      answer: sanitizeEditorialText(
        `${top.displayName} is currently highest on our ${registryEntry.pageTypeId.replace(/_/g, " ")} composite (score ${top.compositeScore}, ${top.confidence} confidence). This is not a universal "best EV" claim — review tradeoffs below.`
      ),
    });

    if (top.exShowroom) {
      base.push({
        question: sanitizeEditorialText(
          `What is the ex-showroom price of ${top.displayName}?`
        ),
        answer: sanitizeEditorialText(
          `Indicative ex-showroom from catalog: ${formatLakh(top.exShowroom)}. Confirm on-road price with a dealer in your city.`
        ),
      });
    }
  }

  return base.slice(0, 6);
}

module.exports = {
  generateFaqs,
  FAQ_TEMPLATES,
};
