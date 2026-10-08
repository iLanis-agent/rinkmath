/* rinkmath engine - backyard ice rink truth-teller.
   Pure functions, shared by browser and node test runner.
   Published/rule-of-thumb anchors, all labeled in the UI:
   - 7.48052 US gallons per cubic foot (exact definition).
   - Ice growth ~1 inch per 15 freezing degree-days (FDD below 32 F) - widely cited rule of thumb, labeled.
   - Garden hose flow ~5 gpm typical (labeled typical).
   - Lumber/stakes spacing 4 ft (rule of thumb), liner overlap 1.5 ft past board height each side (guidance).
   - ~50 sq ft per skater (rink-design rule of thumb), municipal water ~$5-15 per 1000 gal (typical range). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Rink = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  const GAL_PER_CUFT = 7.48052; // exact
  const FDD_PER_INCH = 15;      // freezing degree-days per inch of ice, rule of thumb
  const LITER_PER_GAL = 3.78541;

  function depths(lengthFt, widthFt, minDepthIn, slopeIn) {
    // slopeIn: total height difference across the rink's length. Water finds level:
    // the deep end gains the full slope on top of the shallow end.
    const maxDepth = minDepthIn + slopeIn;
    const avgDepth = (minDepthIn + maxDepth) / 2;
    return { minDepth: minDepthIn, maxDepth, avgDepth };
  }

  function waterGallons(lengthFt, widthFt, avgDepthIn) {
    return lengthFt * widthFt * (avgDepthIn / 12) * GAL_PER_CUFT;
  }

  function liner(lengthFt, widthFt, boardHeightIn, overlapIn) {
    const ov = (overlapIn == null ? 18 : overlapIn);
    const add = 2 * (boardHeightIn + ov) / 12;
    return { length: lengthFt + add, width: widthFt + add, area: (lengthFt + add) * (widthFt + add) };
  }

  function boards(perimeterFt, boardLenFt, stakeSpacingFt) {
    const len = boardLenFt || 12, spacing = stakeSpacingFt || 4;
    return { count: Math.ceil(perimeterFt / len), stakes: Math.ceil(perimeterFt / spacing) + 1 };
  }

  function freeze(dailyAvgF, targetIn) {
    // dailyAvgF: array of forecast daily average temps in F. Ice grows FDD/15 inches per day.
    let inches = 0; const perDay = [];
    for (const t of dailyAvgF) {
      const fdd = Math.max(0, 32 - t);
      inches += fdd / FDD_PER_INCH;
      perDay.push(inches);
    }
    let daysToTarget = null;
    perDay.forEach((cum, i) => { if (daysToTarget === null && cum >= targetIn) daysToTarget = i + 1; });
    return { perDay, totalInches: inches, daysToTarget };
  }

  function floodGallons(lengthFt, widthFt, floodIn) {
    return waterGallons(lengthFt, widthFt, floodIn);
  }

  function fillHours(gallons, hoseGpm) { return gallons / (hoseGpm || 5) / 60; }

  const capacity = (lengthFt, widthFt) => Math.floor(lengthFt * widthFt / 50);

  function build(opts) {
    const { lengthFt, widthFt, minDepthIn, slopeIn } = opts;
    const d = depths(lengthFt, widthFt, minDepthIn, slopeIn);
    const gallons = waterGallons(lengthFt, widthFt, d.avgDepth);
    const lin = liner(lengthFt, widthFt, opts.boardHeightIn || 12, opts.overlapIn);
    const perim = 2 * (lengthFt + widthFt);
    const bd = boards(perim, opts.boardLenFt, opts.stakeSpacingFt);
    const fz = freeze(opts.dailyAvgF || [], opts.targetIn || 2.5);
    const flood = floodGallons(lengthFt, widthFt, opts.floodIn || 0.125);
    const cost = {
      linerUsd: lin.area * (opts.linerUsdPerSqft == null ? 0.25 : opts.linerUsdPerSqft),
      waterUsd: gallons / 1000 * (opts.waterUsdPer1000 == null ? 10 : opts.waterUsdPer1000)
    };
    return { depths: d, gallons, liters: gallons * LITER_PER_GAL, liner: lin, perimeter: perim,
             boards: bd, freeze: fz, floodGallons: flood,
             fillHours: fillHours(gallons, opts.hoseGpm), capacity: capacity(lengthFt, widthFt), cost };
  }

  const fmt = (x, dp) => x.toFixed(dp == null ? 1 : dp);
  return { GAL_PER_CUFT, FDD_PER_INCH, depths, waterGallons, liner, boards, freeze, floodGallons, fillHours, capacity, build, fmt };
});
