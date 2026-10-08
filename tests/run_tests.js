#!/usr/bin/env node
/* Compares engine.js against the independent Python oracle (expected.json),
   plus property and anchor checks. */
const R = require('../engine.js');
const exp = require('./expected.json');
let pass = 0, fail = 0;
const T = (name, cond) => { if (cond) pass++; else { fail++; console.error('FAIL', name); } };
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-9) * Math.max(1, Math.abs(b));

for (const c of exp.cases) {
  const o = c.opts;
  const b = R.build({ lengthFt: o.L, widthFt: o.W, minDepthIn: o.depth, slopeIn: o.slope,
                      boardHeightIn: o.boardh, boardLenFt: o.boardlen, dailyAvgF: o.temps,
                      targetIn: o.target || 2.5, floodIn: o.flood || 0.125 });
  T(`maxDepth ${o.L}x${o.W}`, near(b.depths.maxDepth, c.expected.maxDepth, 1e-12));
  T('avgDepth', near(b.depths.avgDepth, c.expected.avgDepth, 1e-12));
  T('gallons', near(b.gallons, c.expected.gallons, 1e-12));
  T('liner dims', near(b.liner.length, c.expected.linerL, 1e-12) && near(b.liner.width, c.expected.linerW, 1e-12));
  T('liner area', near(b.liner.area, c.expected.linerArea, 1e-12));
  T('perimeter', near(b.perimeter, c.expected.perimeter, 1e-12));
  T('boards', b.boards.count === c.expected.boards);
  T('stakes', b.boards.stakes === c.expected.stakes);
  T('freeze perDay', b.freeze.perDay.length === c.expected.perDay.length && b.freeze.perDay.every((v, i) => near(v, c.expected.perDay[i], 1e-12)));
  T('freeze total', near(b.freeze.totalInches, c.expected.totalInches, 1e-12));
  T('daysToTarget', b.freeze.daysToTarget === c.expected.daysToTarget);
  T('flood', near(b.floodGallons, c.expected.floodGallons, 1e-12));
  T('fillHours', near(b.fillHours, c.expected.fillHours, 1e-12));
  T('capacity', b.capacity === c.expected.capacity);
  T('cost', near(b.cost.linerUsd, c.expected.linerUsd, 1e-12) && near(b.cost.waterUsd, c.expected.waterUsd, 1e-12));
}

// --- anchors ---
T('anchor: 1 cuft = 7.48052 gal', R.GAL_PER_CUFT === 7.48052);
T('anchor: 20x40x5in avg = 2493.51 gal', near(R.waterGallons(40, 20, 5), 2493.5067, 1e-4));
T('anchor: 20F day = 0.8 in', near(R.freeze([20], 2.5).totalInches, 0.8, 1e-12));
T('anchor: 3 days 20F = 2.4 in', near(R.freeze([20, 20, 20], 2.5).totalInches, 2.4, 1e-12));
T('anchor: above freezing grows nothing', R.freeze([40, 45], 2.5).totalInches === 0);
T('anchor: liner 20x40 12in boards = 25x45', (() => { const l = R.liner(40, 20, 12); return near(l.length, 45) && near(l.width, 25); })());
T('anchor: 120ft perimeter / 12ft boards = 10', R.boards(120, 12).count === 10);
T('anchor: 800 sqft = 16 skaters', R.capacity(40, 20) === 16);

// --- properties ---
const rng = (() => { let s = 99; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();
for (let i = 0; i < 60; i++) {
  const L = 8 + rng() * 60, W = 8 + rng() * 30, d = 1 + rng() * 8, s = rng() * 10;
  const temps = Array.from({ length: 7 }, () => -10 + rng() * 50);
  const b = R.build({ lengthFt: L, widthFt: W, minDepthIn: d, slopeIn: s, boardHeightIn: 12, dailyAvgF: temps });
  T('prop: maxDepth = depth + slope', near(b.depths.maxDepth, d + s, 1e-12));
  T('prop: avg between min and max', b.depths.avgDepth >= d && b.depths.avgDepth <= b.depths.maxDepth);
  T('prop: gallons scale with area', near(R.waterGallons(2 * L, 2 * W, b.depths.avgDepth), 4 * b.gallons, 1e-9));
  T('prop: slope adds water', R.waterGallons(L, W, d) <= b.gallons + 1e-9);
  T('prop: liner exceeds rink', b.liner.length > L && b.liner.width > W);
  T('prop: boards cover perimeter', b.boards.count * 12 >= b.perimeter);
  T('prop: freeze monotone', b.freeze.perDay.every((v, j) => j === 0 || v >= b.freeze.perDay[j - 1]));
  T('prop: capacity = floor area/50', b.capacity === Math.floor(L * W / 50));
}
T('prop: daysToTarget null when never reaches', R.freeze([32, 33, 34], 2.5).daysToTarget === null);
T('prop: fillHours inverse to hose', near(R.fillHours(1000, 10), R.fillHours(1000, 5) / 2, 1e-12));

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
