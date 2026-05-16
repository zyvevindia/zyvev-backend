const Dealer = require("../../models/Dealer");

const BRAND_PREFIX_MAP = {
  tata: "Tata",
  mg: "MG",
  mahindra: "Mahindra",
  hyundai: "Hyundai",
  byd: "BYD",
  kia: "Kia",
  citroen: "Citroën",
  mercedes: "Mercedes-Benz",
  bmw: "BMW",
  volvo: "Volvo",
};

function normalizeCity(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/ncr$/, "")
    .replace(/-+$/, "");
}

function inferBrand({ brand, familySlug, vehicleName }) {
  if (brand) return String(brand).trim();

  const slug = String(familySlug || "").toLowerCase();
  if (slug) {
    const prefix = slug.split("-")[0];
    if (BRAND_PREFIX_MAP[prefix]) return BRAND_PREFIX_MAP[prefix];
  }

  const name = String(vehicleName || "");
  for (const b of Object.values(BRAND_PREFIX_MAP)) {
    if (name.toLowerCase().includes(b.toLowerCase())) return b;
  }

  return "";
}

function cityMatches(dealerCities, leadCity) {
  const target = normalizeCity(leadCity);
  if (!target) return false;

  return (dealerCities || []).some((c) => {
    const d = normalizeCity(c);
    return d === target || d.includes(target) || target.includes(d);
  });
}

function brandMatches(dealerBrands, leadBrand) {
  const target = String(leadBrand || "").trim().toLowerCase();
  if (!target) return false;

  return (dealerBrands || []).some((b) => {
    const d = String(b).trim().toLowerCase();
    return d === target || target.includes(d) || d.includes(target);
  });
}

/**
 * Find first active dealer matching city + brand (MVP rules).
 */
async function findMatchingDealer({ city, brand, familySlug, vehicleName }) {
  const resolvedBrand = inferBrand({ brand, familySlug, vehicleName });
  if (!city || !resolvedBrand) {
    return { dealer: null, brand: resolvedBrand, reason: "missing_city_or_brand" };
  }

  const dealers = await Dealer.find({ isActive: true })
    .select("name email cities brands")
    .lean();

  const match = dealers.find(
    (d) =>
      cityMatches(d.cities, city) && brandMatches(d.brands, resolvedBrand)
  );

  return {
    dealer: match || null,
    brand: resolvedBrand,
    reason: match ? "matched" : "no_dealer_match",
  };
}

module.exports = {
  findMatchingDealer,
  inferBrand,
  normalizeCity,
};
