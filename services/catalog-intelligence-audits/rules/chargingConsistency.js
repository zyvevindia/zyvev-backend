/**
 * Charging + range consistency rules.
 */

function auditCharging(variant) {
  const warnings = [];
  const errors = [];

  const c = variant.charging || {};
  const battery = variant.battery || {};
  const range = variant.range || {};
  const kwh = battery.usableKwh || battery.capacityKwh;
  const claimed = range.claimedKm;
  const real = range.realWorldKm;

  if (c.dcTime10to80Minutes != null && kwh) {
    const minPerKwh = c.dcTime10to80Minutes / (kwh * 0.7);
    if (minPerKwh < 0.8) {
      warnings.push({
        code: "DC_TIME_AGGRESSIVE",
        message: `DC 10–80% time unusually fast for ${kwh} kWh pack`,
      });
    }
    if (minPerKwh > 8) {
      warnings.push({
        code: "DC_TIME_SLOW",
        message: `DC 10–80% time unusually slow for ${kwh} kWh pack`,
      });
    }
  }

  if (c.dcKw && !c.dcTime10to80Minutes) {
    warnings.push({
      code: "DC_KW_NO_TIME",
      message: "DC kW declared without 10–80% time",
    });
  }

  if (!c.standards?.length) {
    warnings.push({
      code: "CHARGING_STANDARDS_MISSING",
      message: "No charging standards (e.g. CCS2) listed",
    });
  } else if (
    !c.standards.some((s) =>
      String(s).toUpperCase().includes("CCS")
    )
  ) {
    warnings.push({
      code: "CCS2_NOT_LISTED",
      message: "India market: CCS2 not listed in charging.standards",
    });
  }

  if (real && claimed) {
    if (real.max > claimed * 1.05) {
      errors.push({
        code: "REAL_RANGE_EXCEEDS_CLAIMED",
        message: `realWorldKm.max (${real.max}) exceeds claimedKm (${claimed})`,
      });
    }
    if (real.min > real.max) {
      errors.push({
        code: "REAL_RANGE_INVERTED",
        message: "realWorldKm.min greater than max",
      });
    }
  }

  const curve = variant.chargingEcosystem?.fastChargeCurve;
  if (curve?.peakKw && c.dcKw && curve.peakKw > c.dcKw * 1.2) {
    warnings.push({
      code: "CURVE_PEAK_MISMATCH",
      message: "fastChargeCurve.peakKw exceeds charging.dcKw",
    });
  }

  return { warnings, errors };
}

module.exports = { auditCharging };
